import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useCommissionBalance = () => {
  const { user } = useAuth();

  const { data: balance, isLoading } = useQuery({
    queryKey: ["commission-balance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_balance")
        .select("*")
        .eq("provider_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: entries } = useQuery({
    queryKey: ["commission-entries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_entries")
        .select("*")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: payments } = useQuery({
    queryKey: ["commission-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_payments")
        .select("*")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isBlocked = balance?.is_blocked ?? false;
  const totalOwed = balance?.total_owed ?? 0;
  const unpaidCount = balance?.unpaid_services_count ?? 0;

  return {
    balance,
    entries,
    payments,
    isLoading,
    isBlocked,
    totalOwed,
    unpaidCount,
  };
};

export const usePayCommission = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, paymentMethod }: { amount: number; paymentMethod: string }) => {
      if (!user) throw new Error("No autenticado");
      const { data, error } = await supabase
        .from("commission_payments")
        .insert({
          provider_id: user.id,
          amount,
          payment_method: paymentMethod,
          status: "pending",
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-balance"] });
      queryClient.invalidateQueries({ queryKey: ["commission-entries"] });
      queryClient.invalidateQueries({ queryKey: ["commission-payments"] });
    },
    onError: (error: any) => {
      toast.error("Error al procesar pago: " + error.message);
    },
  });
};
