import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS, CATEGORIES } from "@/constants/categories";
import { ArrowLeft, Calendar, MapPin, AlertTriangle, Image as ImageIcon, Send, XCircle, Loader2, Clock } from "lucide-react";
import { useProviderRequests, useUpdateServiceStatus } from "@/hooks/useServiceRequests";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetMessage, setBudgetMessage] = useState("");
  const [sending, setSending] = useState(false);

  const service = services?.find((s) => s.id === id);

  const getCategoryName = (slug: string) =>
    CATEGORIES.find((c) => c.slug === slug)?.name || slug;

  const handleSendBudget = async () => {
    if (!budgetAmount || !service) return;
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser un número mayor a 0");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.rpc("claim_service_request", {
        p_request_id: service.id,
        p_provider_id: user!.id,
        p_budget_amount: amount,
        p_budget_message: budgetMessage || null,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        toast.error(result.error || "No se pudo enviar el presupuesto");
        return;
      }
      toast.success("¡Presupuesto enviado al cliente!");
      navigate("/prestador/servicios");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar presupuesto");
    } finally {
      setSending(false);
    }
  };

  const handleReject = () => {
    if (!service) return;
    updateStatus.mutate({ id: service.id, status: "cancelado" }, {
      onSuccess: () => navigate("/prestador/servicios"),
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!service) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Solicitud no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/prestador/servicios")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const parsed = parseDescription(service.description);
  const displayTitle = `Solicitud de presupuesto: ${getCategoryName(service.category)}`;

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" className="gap-2" onClick={() => navigate("/prestador/servicios")}>
        <ArrowLeft className="h-4 w-4" /> Volver a Servicios
      </Button>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{displayTitle}</h1>
        <Badge className={STATUS_COLORS[service.status]}>{STATUS_LABELS[service.status]}</Badge>
      </div>

      {/* Client info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Información del Cliente</CardTitle></CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Service details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Detalles de la Solicitud</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Descripción del problema</p>
            <p className="text-sm whitespace-pre-wrap">{parsed.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 text-sm p-3 rounded-xl bg-accent/50">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{service.address}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm p-3 rounded-xl bg-accent/50">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Creado: {new Date(service.created_at).toLocaleDateString("es-AR")}</span>
            </div>

            {parsed.preferredDate && (
              <div className="flex items-center gap-2.5 text-sm p-3 rounded-xl bg-accent/50">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span>Fecha preferida: {parsed.preferredDate}</span>
              </div>
            )}
            {parsed.preferredTime && (
              <div className="flex items-center gap-2.5 text-sm p-3 rounded-xl bg-accent/50">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>Horario: {parsed.preferredTime}</span>
              </div>
            )}

            {/* Urgency with color */}
            <div className={`flex items-center gap-2.5 text-sm p-3 rounded-xl border ${URGENCY_BG[service.urgency]}`}>
              <AlertTriangle className={`h-4 w-4 shrink-0 ${URGENCY_COLORS[service.urgency]}`} />
              <span className="font-medium">Urgencia: <span className={URGENCY_COLORS[service.urgency]}>{URGENCY_LABELS[service.urgency]}</span></span>
            </div>

            {service.budget && (
              <div className="flex items-center gap-2.5 text-sm p-3 rounded-xl bg-accent/50">
                <span className="text-muted-foreground">💰</span>
                <span>Presupuesto ref: ${service.budget.toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      {service.photos && service.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Fotos del problema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {service.photos.map((photo, idx) => (
                <a key={idx} href={photo} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={photo}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-40 object-cover rounded-xl border hover:opacity-90 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send budget form - only for new requests */}
      {service.status === "nuevo" && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Enviar Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ingresá el monto que cobrarías por este trabajo. El cliente recibirá tu presupuesto y podrá aceptarlo o rechazarlo. Si acepta, se abrirá un chat para coordinar detalles.
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Monto del presupuesto ($)</label>
              <Input
                type="number"
                placeholder="Ej: 15000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mensaje al cliente (opcional)</label>
              <Textarea
                placeholder="Describí qué incluye tu presupuesto, tiempos estimados, etc."
                value={budgetMessage}
                onChange={(e) => setBudgetMessage(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2 rounded-xl"
                onClick={handleSendBudget}
                disabled={!budgetAmount || sending}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar Presupuesto
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={handleReject}
                disabled={updateStatus.isPending}
              >
                <XCircle className="h-4 w-4" /> Rechazar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceDetail;
