import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMyBankDetails = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-bank-details", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("my_bank_details" as never)
        .select("bank_alias, bank_cvu")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as { bank_alias: string | null; bank_cvu: string | null } | null;
    },
    enabled: !!user,
  });
};

export const useMpAccount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["provider-mp-account", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_mp_accounts" as never)
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as Record<string, unknown>;
    },
    enabled: !!user,
  });
};

export const useConnectMp = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("mercadopago-oauth", { method: "POST", body: {} });
      if (error) throw error;
      return data;
    },
  });
};

export const useDisconnectMp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("mercadopago-oauth", { method: "DELETE", body: {} });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-mp-account"] });
    },
  });
};

export const useUploadProviderDocs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ files, docPaths }: { files: File[]; docPaths: string[] }) => {
      if (!user) throw new Error("No autenticado");
      const newPaths: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("provider-docs").upload(path, file);
        if (error) throw error;
        newPaths.push(path);
      }
      
      const allPaths = [...docPaths, ...newPaths];
      const { error: updateErr } = await supabase.from("profiles").update({ 
        provider_doc_urls: allPaths, 
        provider_verification_status: "pending" 
      }).eq("id", user.id);
      if (updateErr) throw updateErr;
      return newPaths;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
      queryClient.invalidateQueries({ queryKey: ["provider-docs-signed"] });
    },
  });
};

export const useRemoveProviderDoc = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ pathToRemove, docPaths }: { pathToRemove: string; docPaths: string[] }) => {
      if (!user) throw new Error("No autenticado");
      await supabase.storage.from("provider-docs").remove([pathToRemove]);
      const newPaths = docPaths.filter((p) => p !== pathToRemove);
      await supabase.from("profiles").update({ 
        provider_doc_urls: newPaths.length > 0 ? newPaths : null, 
        provider_verification_status: "pending" 
      }).eq("id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
      queryClient.invalidateQueries({ queryKey: ["provider-docs-signed"] });
    },
  });
};

export const useUploadCriminalRecord = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("No autenticado");
      const ext = file.name.split(".").pop();
      const path = `${user.id}/criminal-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("provider-docs").upload(path, file);
      if (uploadErr) throw uploadErr;
      
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ criminal_record_url: path, criminal_record_status: "pending" } as never)
        .eq("id", user.id);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
    },
  });
};

export const useSignedDocs = (user: any, docPaths: string[]) => {
  return useQuery({
    queryKey: ["provider-docs-signed", user?.id, docPaths.length],
    queryFn: async () => {
      const results = await Promise.all(
        docPaths.map(async (path) => {
          const { data } = await supabase.storage.from("provider-docs").createSignedUrl(path, 3600);
          if (data?.signedUrl) {
            const name = path.split("/").pop() || "Documento";
            return { path, url: data.signedUrl, name };
          }
          return null;
        })
      );
      return results.filter((r): r is { path: string; url: string; name: string } => r !== null);
    },
    enabled: !!user && docPaths.length > 0,
  });
};

export const useSignedCriminalUrl = (user: any, criminalRecordUrl: string | null) => {
  return useQuery({
    queryKey: ["criminal-record-signed", user?.id, criminalRecordUrl],
    queryFn: async () => {
      if (!criminalRecordUrl) return null;
      const { data } = await supabase.storage.from("provider-docs").createSignedUrl(criminalRecordUrl, 3600);
      return data?.signedUrl || null;
    },
    enabled: !!user && !!criminalRecordUrl,
  });
};
