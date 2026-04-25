import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DisputeStatus = "abierta" | "en_revision" | "resuelta";

export interface ClientDispute {
  id: string;
  service_request_id: string;
  opened_by: string;
  reason: string;
  status: DisputeStatus;
  amount: number | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  service_title?: string;
  service_status?: string;
  provider_name?: string;
}

export const useClientDisputes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["disputes", "client", user?.id],
    queryFn: async (): Promise<ClientDispute[]> => {
      if (!user) return [];

      const { data: disputes, error } = await supabase
        .from("disputes")
        .select("*")
        .eq("opened_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!disputes || disputes.length === 0) return [];

      const srIds = Array.from(new Set(disputes.map((d) => d.service_request_id)));
      const { data: srs } = await supabase
        .from("service_requests")
        .select("id, title, status, provider_id")
        .in("id", srIds);

      const providerIds = Array.from(
        new Set((srs || []).map((s) => s.provider_id).filter((x): x is string => !!x))
      );
      const { data: providers } = providerIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", providerIds)
        : { data: [] };

      const srMap = new Map((srs || []).map((s) => [s.id, s]));
      const providerMap = new Map((providers || []).map((p) => [p.id, p.full_name]));

      return disputes.map((d) => {
        const sr = srMap.get(d.service_request_id);
        return {
          ...d,
          service_title: sr?.title,
          service_status: sr?.status,
          provider_name: sr?.provider_id ? providerMap.get(sr.provider_id) || undefined : undefined,
        };
      });
    },
    enabled: !!user,
  });
};

export const useCreateDispute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      service_request_id: string;
      reason: string;
      amount?: number | null;
    }) => {
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("disputes")
        .insert({
          service_request_id: input.service_request_id,
          opened_by: user.id,
          reason: input.reason,
          amount: input.amount ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["active-disputes"] });
      toast.success("Disputa abierta. Te avisaremos cuando haya novedades.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudo abrir la disputa");
    },
  });
};

export const useActiveDisputeIds = (serviceIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-disputes", user?.id, serviceIds.sort().join(",")],
    queryFn: async (): Promise<Set<string>> => {
      if (!user || serviceIds.length === 0) return new Set();
      const { data, error } = await supabase
        .from("disputes")
        .select("service_request_id, status")
        .eq("opened_by", user.id)
        .in("service_request_id", serviceIds)
        .in("status", ["abierta", "en_revision"]);
      if (error) throw error;
      return new Set((data || []).map((d) => d.service_request_id));
    },
    enabled: !!user && serviceIds.length > 0,
  });
};
