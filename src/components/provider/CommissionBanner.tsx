import { AlertTriangle, Ban, DollarSign } from "lucide-react";
import { useCommissionBalance } from "@/hooks/useCommissionBalance";
import { useState } from "react";
import CommissionPaymentDialog from "./CommissionPaymentDialog";

export default function CommissionBanner() {
  const { isBlocked, totalOwed, unpaidCount, isLoading } = useCommissionBalance();
  const [showPayDialog, setShowPayDialog] = useState(false);

  if (isLoading || totalOwed <= 0) return null;

  return (
    <>
      <div className={`rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 ${
        isBlocked
          ? "bg-red-50 border-2 border-red-300 dark:bg-red-950/30 dark:border-red-800"
          : "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
      }`}>
        <div className="flex items-center gap-3">
          {isBlocked ? (
            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          )}
          <div>
            <p className={`font-semibold text-sm ${isBlocked ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}`}>
              {isBlocked
                ? "Cuenta suspendida — Comisiones pendientes"
                : "Comisiones pendientes"}
            </p>
            <p className={`text-xs ${isBlocked ? "text-red-600 dark:text-red-300" : "text-amber-600 dark:text-amber-300"}`}>
              Debes <span className="font-bold">${totalOwed.toLocaleString("es-AR")}</span> en comisiones ({unpaidCount} servicio{unpaidCount !== 1 ? "s" : ""}).
              {isBlocked && " No puedes aceptar servicios ni enviar presupuestos hasta pagar."}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPayDialog(true)}
          className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-primary-foreground text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20"
        >
          <DollarSign className="h-4 w-4 inline mr-1" />
          Pagar
        </button>
      </div>
      <CommissionPaymentDialog open={showPayDialog} onOpenChange={setShowPayDialog} />
    </>
  );
}
