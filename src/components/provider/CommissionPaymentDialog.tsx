import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCommissionBalance, usePayCommission, useCreateMercadoPagoCheckout } from "@/hooks/useCommissionBalance";
import { CreditCard, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommissionPaymentDialog({ open, onOpenChange }: Props) {
  const { totalOwed, entries } = useCommissionBalance();
  const { mutateAsync: payCommission, isPending: isPaying } = usePayCommission();
  const { mutateAsync: createCheckout, isPending: isCreatingCheckout } = useCreateMercadoPagoCheckout();
  
  const [method, setMethod] = useState<"mercadopago" | "transferencia" | null>(null);
  const [transferSent, setTransferSent] = useState(false);

  const processing = isPaying || isCreatingCheckout;

  const handleMercadoPago = async () => {
    try {
      const initPoint = await createCheckout({ amount: totalOwed });
      window.open(initPoint, "_blank");
      toast.success("Redirigido a MercadoPago para pagar comisiones");
      onOpenChange(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleTransferConfirm = async () => {
    try {
      await payCommission({ amount: totalOwed, paymentMethod: "transferencia" });
      setTransferSent(true);
      toast.success("Transferencia registrada. El admin la confirmara pronto.");
    } catch (err) {
      // Error is handled by the hook
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
      <DialogContent className="rounded-[24px] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold tracking-tight">
            Pagar Comisiones Pendientes
          </DialogTitle>
        </DialogHeader>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[24px] p-4 mb-4">
          <p className="text-sm text-muted-foreground">Total adeudado</p>
          <p className="text-3xl font-extrabold text-orange-600">${totalOwed.toLocaleString("es-AR")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {(entries || []).filter((e) => e.status === "pending").length} servicio(s) pendiente(s)
          </p>
        </div>

        {transferSent ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold">Transferencia registrada</p>
            <p className="text-sm text-muted-foreground mt-1">El equipo de Servicios 360 confirmará tu pago en las próximas horas.</p>
          </div>
        ) : !method ? (
          <div className="space-y-3">
            <button
              onClick={handleMercadoPago}
              disabled={processing}
              className="w-full flex items-center gap-3 p-4 rounded-[24px] border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 dark:border-blue-800 dark:hover:bg-blue-950/30 transition-all"
            >
              <div className="h-10 w-10 rounded-[16px] bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
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
              className="w-full flex items-center gap-3 p-4 rounded-[24px] border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-emerald-800 dark:hover:bg-emerald-950/30 transition-all"
            >
              <div className="h-10 w-10 rounded-[16px] bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
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
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-[24px] p-4">
              <p className="font-semibold text-sm mb-2">Datos para transferir:</p>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Alias:</span> <span className="font-mono font-bold">servicios360.comisiones</span></p>
                <p><span className="text-muted-foreground">Monto:</span> <span className="font-bold">${totalOwed.toLocaleString("es-AR")}</span></p>
              </div>
            </div>
            <button
              onClick={handleTransferConfirm}
              disabled={processing}
              className="w-full py-3 rounded-[16px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-primary-foreground font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50"
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
