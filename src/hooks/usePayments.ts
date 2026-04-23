import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export const usePayments = () => {
  const { user } = useAuth();

  const payments = useQuery({
    queryKey: ["payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .or(`client_id.eq.${user!.id},provider_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createCheckout = async (serviceRequestId: string, amount: number, title: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago", {
        body: {
          service_request_id: serviceRequestId,
          amount,
          title,
          payer_email: user?.email,
        },
      });
      if (error) throw error;
      
      // Redirect to MercadoPago
      if (data?.init_point) {
        window.location.href = data.init_point;
      }
      return data;
    } catch (err) {
      toast.error("Error al crear el pago: " + (err.message || "Intente de nuevo"));
      throw err;
    }
  };

  return { payments, createCheckout };
};

export const useProviderBankDetails = (serviceRequestId: string | null) => {
  return useQuery({
    queryKey: ["provider-bank-details", serviceRequestId],
    queryFn: async () => {
      if (!serviceRequestId) return null;
      
      const { data, error } = await supabase
        .rpc("get_provider_bank_details", { p_service_request_id: serviceRequestId });
      
      if (!error && data) {
        return (data as never)?.[0] || data || null;
      }

      logger.warn("get_provider_bank_details RPC failed, using fallback:", error?.message);
      
      const { data: service } = await supabase
        .from("service_requests")
        .select("provider_id")
        .eq("id", serviceRequestId)
        .single();
        
      if (!service?.provider_id) return null;
      
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("full_name, bank_alias, bank_cvu")
        .eq("id", service.provider_id)
        .single();
        
      if (profileErr) throw profileErr;
      return profile;
    },
    enabled: !!serviceRequestId,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      service_request_id,
      amount,
      client_id,
      provider_id,
      payment_method,
      status = "pendiente",
    }: {
      service_request_id: string;
      amount: number;
      client_id: string;
      provider_id: string;
      payment_method: string;
      status?: "pendiente" | "completado";
    }) => {
      // Usar función wrapper de concurrencia
      const { data, error } = await supabase.rpc("create_payment_with_status_update" as never, {
        p_service_request_id: service_request_id,
        p_amount: amount,
        p_client_id: client_id,
        p_provider_id: provider_id,
        p_payment_method: payment_method,
        p_status: status
      });

      if (error) {
        // Fallback a insert manual
        const { error: insErr } = await supabase.from("payments").insert({
          id: crypto.randomUUID(),
          service_request_id,
          amount,
          client_id,
          provider_id,
          payment_method,
          status: status as never,
        });
        if (insErr) throw insErr;
        
        if (status === "completado") {
           await supabase
             .from("service_requests")
             .update({ status: "completado" as never })
             .eq("id", service_request_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useProviderEarningsSummary = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["provider-earnings-summary", userId],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("provider_amount, platform_fee, amount, status, created_at")
        .eq("provider_id", userId!);
      if (error) return { total: 0, thisMonth: 0, count: 0, hasPayments: false };

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
};

export const useProviderPaymentsList = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["provider-payments", userId],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, service_requests(title)")
        .eq("provider_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useProviderMonthlyRevenue = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["provider-monthly-revenue", userId],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("provider_amount, platform_fee, created_at, status")
        .eq("provider_id", userId!)
        .eq("status", "completed");
      if (error) throw error;

      const months: Record<string, { revenue: number; commission: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("es", { month: "short" });
        months[key] = { revenue: 0, commission: 0 };
      }
      data?.forEach((p) => {
        const key = new Date(p.created_at).toLocaleDateString("es", { month: "short" });
        if (months[key]) {
          months[key].revenue += Number(p.provider_amount);
          months[key].commission += Number(p.platform_fee);
        }
      });
      return Object.entries(months).map(([month, v]) => ({ month, ...v }));
    },
    enabled: !!userId,
  });
};
