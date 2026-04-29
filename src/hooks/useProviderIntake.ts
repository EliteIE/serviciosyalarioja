import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ===== Tipos =====

export type ProviderIntakeStep1 = {
  full_name: string;
  phone: string;
  email: string;
  category: string;
  source: "redes_sociales" | "referido" | "ministerio" | "otro";
};

export type ProviderIntakeStep2 = {
  years_experience?: "<1" | "1-3" | "3-5" | "5-10" | "10+";
  description?: string;
  secondary_categories?: string[];
  team_type?: "solo" | "2-3" | "equipo_formal";
  available_days?: ("lunes_viernes" | "sabado" | "domingo")[];
  weekly_capacity?: "1-3" | "4-7" | "8-15" | "15+";
  vehicle?: "si" | "no" | "moto";
  coverage_areas?: string[];
  missing_tools?: string;
  reference_1?: { name?: string; phone?: string; relation?: string };
  reference_2?: { name?: string; phone?: string; relation?: string };
  has_cuit?: "si" | "no" | "no_se";
  extra_notes?: string;
};

export type ProviderIntakePayload = {
  step1: ProviderIntakeStep1;
  step2?: ProviderIntakeStep2;
};

export type ProviderLead = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  category: string;
  source: ProviderIntakeStep1["source"];
  step2_completed: boolean;
  step2_payload: ProviderIntakeStep2 | null;
  status:
    | "nuevo"
    | "contactado"
    | "aprobado"
    | "rechazado"
    | "onboarding"
    | "activo";
  contact_notes: string | null;
  contacted_at: string | null;
  contacted_by: string | null;
  created_at: string;
  updated_at: string;
};

// ===== Submit (público) =====

export const useSubmitProviderIntake = () => {
  return useMutation({
    mutationFn: async (payload: ProviderIntakePayload) => {
      const { data, error } = await supabase.functions.invoke<{
        ok: boolean;
        id: string;
        step2_completed: boolean;
      }>("submit-provider-intake", { body: payload });
      if (error) throw error;
      if (!data?.ok) throw new Error("Respuesta inesperada del servidor");
      return data;
    },
  });
};

// ===== Admin: listagem =====

export const useProviderLeads = (filters?: {
  status?: ProviderLead["status"] | "all";
  category?: string | "all";
  source?: ProviderLead["source"] | "all";
}) => {
  return useQuery({
    queryKey: ["admin-provider-leads", filters],
    staleTime: 15_000,
    queryFn: async () => {
      let q = supabase
        .from("provider_intake_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        q = q.eq("status", filters.status);
      }
      if (filters?.category && filters.category !== "all") {
        q = q.eq("category", filters.category);
      }
      if (filters?.source && filters.source !== "all") {
        q = q.eq("source", filters.source);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as ProviderLead[];
    },
  });
};

// ===== Admin: atualização =====

export const useUpdateProviderLeadStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: ProviderLead["status"];
    }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "contactado") {
        patch.contacted_at = new Date().toISOString();
      }
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("provider_intake_leads" as any)
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-provider-leads"] });
      toast.success("Estado del lead actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateProviderLeadNotes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contact_notes,
    }: {
      id: string;
      contact_notes: string;
    }) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("provider_intake_leads" as any)
        .update({ contact_notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-provider-leads"] });
      toast.success("Notas guardadas");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
