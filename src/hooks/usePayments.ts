import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
    } catch (err: any) {
      toast.error("Error al crear el pago: " + (err.message || "Intente de nuevo"));
      throw err;
    }
  };

  return { payments, createCheckout };
};
