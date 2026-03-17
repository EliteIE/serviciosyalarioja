import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCommissionBalance } from "@/hooks/useCommissionBalance";
import { CreditCard, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommissionPaymentDialog({ open, onOpenChange }: Props) {
  const { totalOwed, entries } = useCommissionBalance();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<"mercadopago" | "transferencia" | null>(null);
  const [transferSent, setTransferSent] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleMercadoPago = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      const { data: commPayment, error: insertErr } = await supabase
        .from("commission_payments")
        .insert({
          provider_id: user.id,
          amount: totalOwed,
          payment_method: "mercadopago",
          status: "pending",
        } as any)
        .select()
        .single();
      if (insertErr) throw insertErr;

      const { data, error } = await supabase.functions.invoke("mercadopago", {
        body: {
          action: "create_commission_checkout",
          commission_payment_id: (commPayment as any).id,
          amount: totalOwed,
          payer_email: user.email,
        },
      });
      if (error) throw error;
      if (data?.init_point) {
        window.open(data.init_point, "_blank");
        toast.success("Redirigido a MercadoPago para pagar comisiones");
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error("Error al crear checkout: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleTransferConfirm = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      await supabase
        .from("commission_payments")
        .insert({
          provider_id: user.id,
          amount: totalOwed,
          payment_method: "transferencia",
          status: "pending",
        } as any);
      setTransferSent(true);
      toast.success("Transferencia registrada. El admin la confirmara pronto.");
      queryClient.invalidateQueries({ queryKey: ["commission-balance"] });
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setMethod(null);
      setTransferSent(false);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold tracking-tight">
            Pagar Comisiones Pendientes
          </DialogTitle>
        </DialogHeader>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-4">
          <p className="text-sm text-muted-foreground">Total adeudado</p>
          <p className="text-3xl font-extrabold text-orange-600">${totalOwed.toLocaleString("es-AR")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {(entries || []).filter((e: any) => e.status === "pending").length} servicio(s) pendiente(s)
          </p>
        </div>

        {transferSent ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold">Transferencia registrada</p>
            <p className="text-sm text-muted-foreground mt-1">El equipo de ServiciosYa confirmara tu pago en las proximas horas.</p>
          </div>
        ) : !method ? (
          <div className="space-y-3">
            <button
              onClick={handleMercadoPago}
              disabled={processing}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 dark:border-blue-800 dark:hover:bg-blue-950/30 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">MercadoPago</p>
                <p className="text-xs text-muted-foreground">Pago instantaneo — se desbloquea automaticamente</p>
              </div>
              {processing && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
            </button>

            <button
              onClick={() => setMethod("transferencia")}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-emerald-800 dark:hover:bg-emerald-950/30 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Transferencia Bancaria</p>
                <p className="text-xs text-muted-foreground">Confirmacion manual por el equipo (24-48hs)</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4">
              <p className="font-semibold text-sm mb-2">Datos para transferir:</p>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Alias:</span> <span className="font-mono font-bold">serviciosya.comisiones</span></p>
                <p><span className="text-muted-foreground">Monto:</span> <span className="font-bold">${totalOwed.toLocaleString("es-AR")}</span></p>
              </div>
            </div>
            <button
              onClick={handleTransferConfirm}
              disabled={processing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Ya realice la transferencia"}
            </button>
            <button onClick={() => setMethod(null)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              Volver
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
