import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export function useProviderEarnings(userId: string | undefined) {
  return useQuery({
    queryKey: ["provider-earnings-summary", userId],
    staleTime: 30_000,
    queryFn: async () => {
      if (!userId) return { total: 0, thisMonth: 0, count: 0, hasPayments: false };

      const { data, error } = await supabase
        .from("payments")
        .select("provider_amount, platform_fee, amount, status, created_at")
        .eq("provider_id", userId);

      if (error) {
        logger.error("Error fetching earnings:", error);
        return { total: 0, thisMonth: 0, count: 0, hasPayments: false };
      }

      const completed = data?.filter(p => p.status === "completed") || [];
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const thisMonth = completed.filter(p => p.created_at >= monthStart);

      return {
        total: completed.reduce((s, p) => s + Number(p.provider_amount), 0),
        thisMonth: thisMonth.reduce((s, p) => s + Number(p.provider_amount), 0),
        count: completed.length,
        hasPayments: completed.length > 0,
      };
    },
    enabled: !!userId,
  });
}

export function useToggleAvailability(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isAvailable: boolean) => {
      if (!userId) throw new Error("No user ID");
      const { error } = await supabase
        .from("profiles")
        .update({ provider_available: isAvailable })
        .eq("id", userId);

      if (error) throw error;
      return isAvailable;
    },
    onSuccess: () => {
      // Opcional: invocar recargas se houver queries dependentes do profile
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
    }
  });
}
