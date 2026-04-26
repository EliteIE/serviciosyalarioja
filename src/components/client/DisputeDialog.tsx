import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateDispute } from "@/hooks/useDisputes";

type DisputeReason =
  | "trabajo_no_completado"
  | "cobro_indebido"
  | "calidad_insatisfactoria"
  | "dano"
  | "otro";

const REASON_LABELS: Record<DisputeReason, string> = {
  trabajo_no_completado: "El trabajo no fue completado",
  cobro_indebido: "Cobro indebido o excesivo",
  calidad_insatisfactoria: "Calidad insatisfactoria",
  dano: "Daños ocasionados",
  otro: "Otro motivo",
};

const MIN_DESCRIPTION_LENGTH = 20;

interface DisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequestId: string;
  serviceTitle?: string;
}

export const DisputeDialog = ({
  open,
  onOpenChange,
  serviceRequestId,
  serviceTitle,
}: DisputeDialogProps) => {
  const [reason, setReason] = useState<DisputeReason | "">("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const createDispute = useCreateDispute();

  const resetForm = () => {
    setReason("");
    setDescription("");
    setAmount("");
  };

  const handleClose = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!reason) return;
    const trimmed = description.trim();
    if (trimmed.length < MIN_DESCRIPTION_LENGTH) return;

    const parsedAmount = amount ? Number(amount) : null;
    if (amount && (Number.isNaN(parsedAmount) || (parsedAmount ?? 0) < 0)) return;

    const composedReason = `[${REASON_LABELS[reason]}] ${trimmed}`;

    try {
      await createDispute.mutateAsync({
        service_request_id: serviceRequestId,
        reason: composedReason,
        amount: parsedAmount,
      });
      resetForm();
      onOpenChange(false);
    } catch {
      /* toast handled inside hook */
    }
  };

  const descriptionRemaining = Math.max(0, MIN_DESCRIPTION_LENGTH - description.trim().length);
  const canSubmit =
    !!reason &&
    description.trim().length >= MIN_DESCRIPTION_LENGTH &&
    !createDispute.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[16px] bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Reportar un problema</DialogTitle>
              <DialogDescription>
                {serviceTitle ? `Servicio: ${serviceTitle}` : "Contanos qué pasó"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-[16px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3 text-xs text-amber-800 dark:text-amber-200">
            Tu reporte será revisado por nuestro equipo. El prestador recibirá
            una notificación y podrá responder. Disputas falsas pueden
            llevar a la suspensión de tu cuenta.
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispute-reason">Motivo *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as DisputeReason)}>
              <SelectTrigger id="dispute-reason">
                <SelectValue placeholder="Elegí un motivo" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REASON_LABELS) as DisputeReason[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {REASON_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispute-description">
              Descripción detallada *
            </Label>
            <Textarea
              id="dispute-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí qué pasó, cuándo y cómo te afectó. Al menos 20 caracteres."
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {descriptionRemaining > 0
                ? `Faltan ${descriptionRemaining} caracteres`
                : `${description.trim().length} caracteres`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispute-amount">
              Monto en disputa (opcional)
            </Label>
            <Input
              id="dispute-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej: 15000"
            />
            <p className="text-xs text-muted-foreground">
              Indicá el monto si reclamás una devolución o compensación.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {createDispute.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Abrir disputa"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisputeDialog;
