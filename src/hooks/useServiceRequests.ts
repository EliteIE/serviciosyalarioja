import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { CATEGORIES } from "@/constants/categories";

type ServiceStatus = Database["public"]["Enums"]["service_status"];

export interface ServiceRequest {
  id: string;
  client_id: string;
  provider_id: string | null;
  category: string;
  title: string;
  description: string;
  address: string;
  urgency: "baja" | "media" | "alta";
  budget: number | null;
  budget_amount: number | null;
  budget_message: string | null;
  photos: string[] | null;
  status: "nuevo" | "presupuestado" | "aceptado" | "en_progreso" | "finalizado_prestador" | "completado" | "cancelado";
  verification_code?: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_avatar?: string;
  provider_name?: string;
  provider_avatar?: string;
}

async function enrichWithProfiles(requests: any[]): Promise<ServiceRequest[]> {
  const userIds = new Set<string>();
  requests.forEach((r) => {
    if (r.client_id) userIds.add(r.client_id);
    if (r.provider_id) userIds.add(r.provider_id);
  });

  if (userIds.size === 0) return requests;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", Array.from(userIds));

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return requests.map((r) => ({
    ...r,
    client_name: profileMap.get(r.client_id)?.full_name || "",
    client_avatar: profileMap.get(r.client_id)?.avatar_url || "",
    provider_name: r.provider_id ? profileMap.get(r.provider_id)?.full_name || "" : "",
    provider_avatar: r.provider_id ? profileMap.get(r.provider_id)?.avatar_url || "" : "",
  }));
}

export const useClientRequests = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["service-requests", "client", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return enrichWithProfiles(data);
    },
    enabled: !!user,
  });
};

export const useProviderRequests = () => {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: ["service-requests", "provider", user?.id],
    queryFn: async () => {
      // Validate category against known slugs to prevent filter injection
      const validSlugs = CATEGORIES.map((c) => c.slug);
      const category = profile?.provider_category || "";
      if (category && !validSlugs.includes(category)) {
        throw new Error("Invalid provider category");
      }

      // Build query with separate filters instead of string interpolation
      const userId = user!.id;
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .or(`provider_id.eq.${userId},and(status.eq.nuevo,category.eq.${category}),and(status.eq.presupuestado,provider_id.eq.${userId})`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return enrichWithProfiles(data);
    },
    enabled: !!user && !!profile,
  });
};

export const useCreateServiceRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (req: {
      category: string;
      title: string;
      description: string;
      address: string;
      urgency: "baja" | "media" | "alta";
      budget?: number;
      photos?: string[];
    }) => {
      const { data, error } = await supabase
        .from("service_requests")
        .insert({
          client_id: user!.id,
          ...req,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success("¡Solicitud enviada!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateServiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, provider_id }: { id: string; status: ServiceStatus; provider_id?: string }) => {
      const update: { status: ServiceStatus; provider_id?: string } = { status };
      if (provider_id) update.provider_id = provider_id;

      const { error } = await supabase
        .from("service_requests")
        .update(update)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success("Estado actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUploadFile = () => {
  const { user } = useAuth();

  const ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  return async (file: File, folder: string = "photos") => {
    // Validate MIME type (don't trust file extension)
    if (!ALLOWED_TYPES[file.type]) {
      throw new Error("Solo se permiten imágenes (JPG, PNG, WebP, GIF)");
    }
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("El archivo no puede superar los 5 MB");
    }

    const safeExt = ALLOWED_TYPES[file.type];
    const path = `${user!.id}/${folder}/${Date.now()}_${crypto.randomUUID()}.${safeExt}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      contentType: file.type,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("Failed to generate public URL");
    return data.publicUrl;
  };
};
