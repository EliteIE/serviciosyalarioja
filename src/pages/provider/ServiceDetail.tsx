import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS, CATEGORIES } from "@/constants/categories";
import { ArrowLeft, Calendar, MapPin, AlertTriangle, Image as ImageIcon, Send, XCircle, Loader2, Clock, ShieldCheck, CheckCircle2, DollarSign } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useProviderRequests, useUpdateServiceStatus, useClaimServiceRequest } from "@/hooks/useServiceRequests";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import CommissionBanner from "@/components/provider/CommissionBanner";
import { useCommissionBalance } from "@/hooks/useCommissionBalance";

/** Parse structured description: separates main text from %%FECHA%% and %%HORARIO%% markers */
function parseDescription(raw: string) {
  const lines = raw.split("\n");
  let description = "";
  let preferredDate = "";
  let preferredTime = "";

  for (const line of lines) {
    if (line.startsWith("%%FECHA%%")) {
      preferredDate = line.replace("%%FECHA%%", "");
    } else if (line.startsWith("%%HORARIO%%")) {
      preferredTime = line.replace("%%HORARIO%%", "");
    } else if (line.includes("Fecha preferida:")) {
      // Legacy format
      preferredDate = line.replace(/.*Fecha preferida:\s*/, "").trim();
    } else if (line.includes("Horario preferido:")) {
      preferredTime = line.replace(/.*Horario preferido:\s*/, "").trim();
    } else {
      description += (description ? "\n" : "") + line;
    }
  }

  return { description: description.trim(), preferredDate, preferredTime };
}

const URGENCY_COLORS: Record<string, string> = {
  baja: "text-success",
  media: "text-warning",
  alta: "text-destructive",
};

const URGENCY_BG: Record<string, string> = {
  baja: "bg-success/10 border-success/20",
  media: "bg-warning/10 border-warning/20",
  alta: "bg-destructive/10 border-destructive/20",
};

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: services, isLoading } = useProviderRequests();
  const updateStatus = useUpdateServiceStatus();
  const claimServiceRequest = useClaimServiceRequest();
  const { user } = useAuth();
  const { isBlocked } = useCommissionBalance();
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetMessage, setBudgetMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [budgetSent, setBudgetSent] = useState(false);

  const service = services?.find((s) => s.id === id);

  const getCategoryName = (slug: string) =>
    CATEGORIES.find((c) => c.slug === slug)?.name || slug;

  const handleSendBudget = async () => {
    if (isBlocked) {
      toast.error("No puedes enviar presupuestos hasta pagar tus comisiones pendientes");
      return;
    }
    if (!budgetAmount || !service) return;
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser un número mayor a 0");
      return;
    }
    setSending(true);
    try {
      await claimServiceRequest.mutateAsync({
        requestId: service.id,
        providerId: user!.id,
        budgetAmount: amount,
        budgetMessage: budgetMessage || null,
      });
      toast.success("¡Presupuesto enviado al cliente!");
      setBudgetSent(true);
    } catch (err: any) {
      toast.error(err.message || "Error al enviar presupuesto");
    } finally {
      setSending(false);
    }
  };

  const handleReject = () => {
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!service) return;
    // SECURITY: Verify ownership — only assigned provider or unassigned service
    if (service.provider_id && service.provider_id !== user?.id) {
      toast.error("No tienes permiso para rechazar esta solicitud");
      return;
    }
    updateStatus.mutate({ id: service.id, status: "cancelado" }, {
      onSuccess: () => {
        setRejectDialogOpen(false);
        navigate("/prestador/servicios");
      },
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Deny access (not-found) before any detail renders:
  //   - row missing
  //   - service is assigned to a different provider
  //   - service was soft-deleted
  const isForeignAssigned =
    service?.provider_id && user?.id && service.provider_id !== user.id;
  const isSoftDeleted = (service as { deleted_at?: string | null } | null)?.deleted_at;
  if (!service || isForeignAssigned || isSoftDeleted) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Solicitud no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/prestador/servicios")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const parsed = parseDescription(service.description || "");
  const displayTitle = `Solicitud de presupuesto: ${getCategoryName(service.category)}`;

  return (
    <div className="space-y-6 max-w-6xl">
      <Button variant="ghost" className="gap-2" onClick={() => navigate("/prestador/servicios")}>
        <ArrowLeft className="h-4 w-4" /> Volver a Servicios
      </Button>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left column - Service details (2/3) */}
        <div className="flex-1 lg:w-2/3 space-y-6">
          {/* Unified card: header + client info + metadata */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Service header */}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold">{displayTitle}</h1>
                <Badge className={STATUS_COLORS[service.status]}>{STATUS_LABELS[service.status]}</Badge>
              </div>

              {/* Client info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 rounded-xl">
                  {service.client_avatar && <AvatarImage src={service.client_avatar} alt={service.client_name || "Cliente"} />}
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-lg">
                    {service.client_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{service.client_name || "Cliente"}</p>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                </div>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-accent/50">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Dirección</span>
                  </div>
                  <span className="text-sm font-medium">{service.address}</span>
                </div>

                {parsed.preferredDate && (
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-accent/50">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fecha Pref.</span>
                    </div>
                    <span className="text-sm font-medium">{parsed.preferredDate}</span>
                  </div>
                )}

                {parsed.preferredTime && (
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-accent/50">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Horario</span>
                    </div>
                    <span className="text-sm font-medium">{parsed.preferredTime}</span>
                  </div>
                )}

                <div className={`flex flex-col gap-1 p-3 rounded-xl border ${URGENCY_BG[service.urgency]}`}>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${URGENCY_COLORS[service.urgency]}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Urgencia</span>
                  </div>
                  <span className={`text-sm font-medium ${URGENCY_COLORS[service.urgency]}`}>{URGENCY_LABELS[service.urgency]}</span>
                </div>

                {!parsed.preferredDate && !parsed.preferredTime && (
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-accent/50">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Creado</span>
                    </div>
                    <span className="text-sm font-medium">{new Date(service.created_at).toLocaleDateString("es-AR")}</span>
                  </div>
                )}

                {service.budget && (
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-accent/50">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Presup. Ref.</span>
                    </div>
                    <span className="text-sm font-medium">${service.budget.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <div className="rounded-xl bg-accent/50 p-5">
            <p className="text-sm font-medium text-muted-foreground mb-2">Descripción del problema</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{parsed.description}</p>
          </div>

          {/* Photos */}
          {service.photos && service.photos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Fotos del problema
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {service.photos.map((photo, idx) => (
                  <a key={idx} href={photo} target="_blank" rel="noopener noreferrer" className="block group">
                    <img
                      src={photo}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-40 object-cover rounded-xl border transition-opacity duration-200 group-hover:opacity-75"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Budget form (1/3) */}
        {service.status === "nuevo" && (
          <div className="lg:w-1/3">
            <div className="lg:sticky lg:top-6">
              <CommissionBanner />
              {budgetSent ? (
                /* Success state */
                <Card className="overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-green-400 to-green-600" />
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4 py-12">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in-50 duration-300">
                      <CheckCircle2 className="h-9 w-9 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold">¡Presupuesto Enviado!</h3>
                      <p className="text-sm text-muted-foreground">
                        El cliente recibirá tu presupuesto y podrá aceptarlo o rechazarlo.
                      </p>
                    </div>
                    <Button
                      className="w-full gap-2 rounded-xl mt-4"
                      onClick={() => navigate("/prestador/servicios")}
                    >
                      <ArrowLeft className="h-4 w-4" /> Volver a mis servicios
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                /* Budget form */
                <Card className="overflow-hidden shadow-lg">
                  <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
                  <CardContent className="p-6 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Send className="h-5 w-5 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-bold">Enviar Presupuesto</h3>
                    </div>

                    {/* Price input */}
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Monto del presupuesto</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="15000"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(e.target.value)}
                          min={0}
                          className="pl-10 text-2xl font-extrabold h-14"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Mensaje al cliente (opcional)</label>
                      <Textarea
                        placeholder="Describí qué incluye tu presupuesto, tiempos estimados, etc."
                        value={budgetMessage}
                        onChange={(e) => setBudgetMessage(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Security note */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
                      <span>
                        Tu información está protegida. El cliente solo verá tu presupuesto y mensaje. Los datos de contacto se comparten al aceptar.
                      </span>
                    </div>

                    {/* Submit button */}
                    <Button
                      className="w-full gap-2 rounded-xl h-12 text-base font-semibold bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 shadow-lg shadow-orange-500/25 transition-all"
                      onClick={handleSendBudget}
                      disabled={!budgetAmount || sending || isBlocked}
                      title={isBlocked ? "Pagá tus comisiones pendientes para enviar presupuestos" : undefined}
                    >
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      Enviar Presupuesto
                    </Button>

                    {/* Reject button */}
                    <button
                      type="button"
                      className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors py-1"
                      onClick={handleReject}
                      disabled={updateStatus.isPending}
                    >
                      Rechazar solicitud
                    </button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Al rechazar, esta solicitud quedará disponible para otros prestadores. No podrás enviar un presupuesto después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={updateStatus.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updateStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
              Sí, rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceDetail;
