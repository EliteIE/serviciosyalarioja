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

async function enrichWithProfiles(requests: (Record<string, unknown> & { client_id: string; provider_id: string | null })[]): Promise<ServiceRequest[]> {
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

      // If category is empty/null, only show requests already assigned to this provider
      const filterStr = category
        ? `provider_id.eq.${userId},and(status.eq.nuevo,category.eq.${category}),and(status.eq.presupuestado,provider_id.eq.${userId})`
        : `provider_id.eq.${userId}`;

      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .or(filterStr)
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status, provider_id }: { id: string; status: ServiceStatus; provider_id?: string }) => {
      if (!user) throw new Error("No autenticado");

      const update: { status: ServiceStatus; provider_id?: string } = { status };
      if (provider_id) update.provider_id = provider_id;

      const { error } = await supabase
        .from("service_requests")
        .update(update)
        .eq("id", id)
        .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success("Estado actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateServiceRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("service_requests")
        .update(data)
        .eq("id", id)
        .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
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

export const useApprovedExtraCharges = (serviceIds: string[]) => {
  return useQuery({
    queryKey: ["extra-charges", "provider", serviceIds],
    queryFn: async () => {
      if (serviceIds.length === 0) return [];
      const { data, error } = await supabase
        .from("extra_charges")
        .select("*")
        .in("service_request_id", serviceIds)
        .eq("status", "aprobado");
      if (error) throw error;
      return data;
    },
    enabled: serviceIds.length > 0,
  });
};

export const useVerifyAndStartService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requestId, code }: { requestId: string; code: string }) => {
      const { data, error } = await supabase.rpc("verify_and_start_service", {
        p_request_id: requestId,
        p_code: code,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || "Error al verificar código");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
};

export const useRequestExtraCharge = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (req: { serviceRequestId: string; description: string; amount: number }) => {
      const { error } = await supabase.from("extra_charges").insert({
        service_request_id: req.serviceRequestId,
        description: req.description,
        amount: req.amount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-charges"] });
    },
  });
};

export const useClaimServiceRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requestId, providerId, budgetAmount, budgetMessage }: { 
      requestId: string; 
      providerId: string; 
      budgetAmount: number; 
      budgetMessage: string | null 
    }) => {
      const { data, error } = await supabase.rpc("claim_service_request", {
        p_request_id: requestId,
        p_provider_id: providerId,
        p_budget_amount: budgetAmount,
        p_budget_message: budgetMessage,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || "No se pudo enviar el presupuesto");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
};

export const useCancelServiceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_requests")
        .update({ status: "cancelado" as never })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
};

export const useActiveServiceRequestIds = (variant: "admin" | "provider" | "client") => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["active-service-requests-ids", variant, user?.id],
    queryFn: async () => {
      if (!user || variant === "admin") return [];
      const col = variant === "provider" ? "provider_id" : "client_id";
      const { data, error } = await supabase
        .from("service_requests")
        .select("id")
        .eq(col, user.id)
        .not("status", "in", '("cancelado","completado")');
      
      if (error) throw error;
      return (data || []).map((d) => d.id);
    },
    enabled: !!user && variant !== "admin",
  });
};
