import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ExtraCharge = Database["public"]["Tables"]["extra_charges"]["Row"];

export const useServiceExtraCharges = (serviceIds: string[]) => {
  return useQuery({
    queryKey: ["extra-charges", serviceIds],
    queryFn: async () => {
      if (!serviceIds || serviceIds.length === 0) return [];
      const { data, error } = await supabase
        .from("extra_charges")
        .select("*")
        .in("service_request_id", serviceIds)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ExtraCharge[];
    },
    enabled: !!serviceIds && serviceIds.length > 0,
  });
};

export const useUpdateExtraCharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "aprobado" | "rechazado" | "pendiente" }) => {
      const { error } = await supabase
        .from("extra_charges")
        .update({ status: status as never })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-charges"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCreateExtraCharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ service_request_id, description, amount }: { service_request_id: string; description: string; amount: number }) => {
      const { error } = await supabase
        .from("extra_charges")
        .insert({
          service_request_id,
          description,
          amount,
          status: "pendiente",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-charges"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
