import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate both potential query keys where profile might be used
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useProviderProfile = (providerId?: string) => {
  return useQuery({
    queryKey: ["provider-profile", providerId],
    queryFn: async () => {
      if (!providerId) return null;
      const { data, error } = await supabase
        .from("profiles_public")
        .select("*")
        .eq("id", providerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });
};

export const useFullProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["provider-full-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useProviderPortfolio = (providerId?: string) => {
  return useQuery({
    queryKey: ["portfolio-public", providerId],
    queryFn: async () => {
      if (!providerId) return null;
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("user_id", providerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });
};

export const useAddPortfolioItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { title: string; description?: string | null; before_url: string; after_url: string }) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase.from("portfolio_items").insert({
        user_id: user.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-public"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
};

export const useDeletePortfolioItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["portfolio-public"] });
       queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
};


export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("No autenticado");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      const { data: existingFiles } = await supabase.storage.from("avatars").list(user.id);
      if (existingFiles && existingFiles.length > 0) {
        const toDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(toDelete);
      }

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      if (updateError) throw updateError;
      
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["provider-full-profile"] });
    },
  });
};

export const useRemoveAvatar = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No autenticado");
      const { data: existingFiles } = await supabase.storage.from("avatars").list(user.id);
      if (existingFiles && existingFiles.length > 0) {
        const toDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(toDelete);
      }
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["provider-full-profile"] });
    },
  });
};
export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("delete_my_account" as never);
      if (error) throw error;
    },
  });
};

