import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABELS, STATUS_COLORS } from "@/constants/categories";
import { CheckCircle2, MessageSquare, Loader2, Play, Eye, Plus, DollarSign, KeyRound } from "lucide-react";
import { useProviderRequests, useUpdateServiceStatus } from "@/hooks/useServiceRequests";
import { useSendMessage } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const ProviderServices = () => {
  const { data: services, isLoading } = useProviderRequests();
  const updateStatus = useUpdateServiceStatus();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sendMessage = useSendMessage();

  // Unread messages tracking
  const serviceIds = (services || []).filter(s => s.provider_id).map(s => s.id);
  const { unreadServiceIds } = useUnreadMessages(serviceIds);

  // Fetch approved extra charges for total display
  const { data: extraCharges } = useQuery({
    queryKey: ["extra-charges", "provider", serviceIds],
    queryFn: async () => {
      if (serviceIds.length === 0) return [];
      const { data, error } = await supabase
        .from("extra_charges")
        .select("*")
        .in("service_request_id", serviceIds)
        .eq("status", "aprobado");
      if (error) throw error;
      return data;
    },
    enabled: serviceIds.length > 0,
  });

  const getServiceTotal = (service: any) => {
    const base = service.budget_amount || 0;
    const extras = (extraCharges || [])
      .filter((e: any) => e.service_request_id === service.id)
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    return { base, extras, total: base + extras };
  };

  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeServiceId, setCodeServiceId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [extraDialogOpen, setExtraDialogOpen] = useState(false);
  const [extraServiceId, setExtraServiceId] = useState<string | null>(null);
  const [extraDesc, setExtraDesc] = useState("");
  const [extraAmount, setExtraAmount] = useState("");
  const [submittingExtra, setSubmittingExtra] = useState(false);

  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [finishServiceId, setFinishServiceId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const handleStartWithCode = (serviceId: string) => {
    setCodeServiceId(serviceId);
    setCodeInput("");
    setCodeDialogOpen(true);
  };

  const handleVerifyCode = async () => {
    if (!codeServiceId || !codeInput.trim()) return;
    setVerifying(true);
    try {
      // Server-side code verification — code never leaves the database
      const { data, error } = await supabase.rpc("verify_and_start_service", {
        p_request_id: codeServiceId,
        p_code: codeInput.trim(),
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        toast.error(result.error || "Error al verificar código");
        return;
      }
      toast.success("¡Trabajo iniciado!");
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      setCodeDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al verificar código");
    } finally {
      setVerifying(false);
    }
  };

  const handleComplete = (id: string) => {
    setFinishServiceId(id);
    setFinishDialogOpen(true);
  };

  const handleConfirmFinish = async () => {
    if (!finishServiceId) return;
    setFinishing(true);
    try {
      updateStatus.mutate({ id: finishServiceId, status: "finalizado_prestador" }, {
        onSuccess: () => {
          setFinishDialogOpen(false);
          setFinishServiceId(null);
        },
      });
    } finally {
      setFinishing(false);
    }
  };

  const handleRequestExtra = (serviceId: string) => {
    setExtraServiceId(serviceId);
    setExtraDesc("");
    setExtraAmount("");
    setExtraDialogOpen(true);
  };

  const handleSubmitExtra = async () => {
    if (!extraServiceId || !extraDesc || !extraAmount) return;
    setSubmittingExtra(true);
    try {
      const { error } = await supabase.from("extra_charges").insert({
        service_request_id: extraServiceId,
        description: extraDesc,
        amount: parseFloat(extraAmount),
      });
      if (error) throw error;

      // Register in chat as system message
      await sendMessage.mutateAsync({
        service_request_id: extraServiceId,
        sender_id: user!.id,
        content: `💰 Cargo extra solicitado: ${extraDesc} — $${parseFloat(extraAmount).toLocaleString()}. Aguardando aprobación del cliente.`,
        message_type: "system",
      });

      toast.success("Cargo extra solicitado al cliente");
      setExtraDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["extra-charges"] });
    } catch (err: any) {
      toast.error(err.message || "Error al solicitar cargo extra");
    } finally {
      setSubmittingExtra(false);
    }
  };

  const filterServices = (tab: string) =>
    (services || []).filter((s) => tab === "todos" || s.status === tab);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Servicios</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue="todos">
          <TabsList className="flex-wrap">
            <TabsTrigger value="todos">Todos ({services?.length || 0})</TabsTrigger>
            <TabsTrigger value="nuevo">Nuevos</TabsTrigger>
            <TabsTrigger value="presupuestado">Aguardando</TabsTrigger>
            <TabsTrigger value="aceptado">Aceptados</TabsTrigger>
            <TabsTrigger value="en_progreso">En Progreso</TabsTrigger>
            <TabsTrigger value="completado">Completados</TabsTrigger>
          </TabsList>

          {["todos", "nuevo", "presupuestado", "aceptado", "en_progreso", "completado"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {filterServices(tab).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay servicios en esta categoría</div>
              ) : (
                filterServices(tab).map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          {service.client_name?.[0] || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold">{service.title}</h3>
                            <Badge className={STATUS_COLORS[service.status]}>{STATUS_LABELS[service.status]}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{service.client_name}</span>
                            {service.budget_amount && (() => {
                              const { base, extras, total } = getServiceTotal(service);
                              return (
                                <span className="font-bold text-orange-500">
                                  ${total.toLocaleString()}
                                  {extras > 0 && <span className="font-normal text-xs ml-1">(Base: ${base.toLocaleString()} + Extras: ${extras.toLocaleString()})</span>}
                                </span>
                              );
                            })()}
                            <span>{new Date(service.created_at).toLocaleDateString("es-AR")}</span>
                            <span>{service.address}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 flex-wrap">
                          {service.status === "nuevo" && (
                            <Button size="sm" className="gap-1 rounded-lg" onClick={() => navigate(`/prestador/servicios/${service.id}`)}>
                              <Eye className="h-3 w-3" /> Ver Detalles
                            </Button>
                          )}
                          {service.status === "presupuestado" && (
                            <Badge className="bg-warning/10 text-warning border-warning/20">⏳ Esperando al cliente</Badge>
                          )}
                          {service.status === "aceptado" && (
                            <Button size="sm" className="gap-1 rounded-lg" onClick={() => handleStartWithCode(service.id)} disabled={verifying}>
                              <KeyRound className="h-3 w-3" /> Iniciar con Código
                            </Button>
                          )}
                          {service.status === "en_progreso" && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="gap-1 rounded-lg" onClick={() => handleRequestExtra(service.id)}>
                                <Plus className="h-3 w-3" /> Cargo Extra
                              </Button>
                              <Button size="sm" className="gap-1 rounded-lg bg-success hover:bg-success/90" onClick={() => handleComplete(service.id)} disabled={updateStatus.isPending}>
                                <CheckCircle2 className="h-3 w-3" /> Finalizar
                              </Button>
                            </div>
                          )}
                          {service.provider_id && (
                            <Button size="sm" variant="ghost" className="gap-1 rounded-lg relative" onClick={() => navigate(`/prestador/chat?service=${service.id}`)}>
                              <MessageSquare className="h-3 w-3" /> Chat
                              {unreadServiceIds.has(service.id) && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-card" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Code verification dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Código de Verificación</DialogTitle>
            <DialogDescription>
              Ingresá el código de 6 dígitos que el cliente recibió al aceptar el presupuesto. Esto confirma que estás en el lugar correcto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Ej: ABC123"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
            />
            <Button className="w-full gap-2 rounded-xl" onClick={handleVerifyCode} disabled={verifying || codeInput.length < 6}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Verificar e Iniciar Trabajo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extra charge dialog */}
      <Dialog open={extraDialogOpen} onOpenChange={setExtraDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Solicitar Cargo Extra</DialogTitle>
            <DialogDescription>
              Describí el trabajo adicional y el monto. El cliente deberá aprobarlo antes de que se sume al total.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Descripción</label>
              <Textarea placeholder="Ej: Cambio de pieza adicional" value={extraDesc} onChange={(e) => setExtraDesc(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Monto ($)</label>
              <Input type="number" placeholder="Ej: 5000" value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} min={0} />
            </div>
            <Button className="w-full gap-2 rounded-xl" onClick={handleSubmitExtra} disabled={submittingExtra || !extraDesc || !extraAmount}>
              {submittingExtra ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Solicitar Cargo Extra
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finish confirmation dialog */}
      <AlertDialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" /> ¿Confirmar finalización?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Al confirmar, el cliente será notificado y deberá aprobar la finalización del servicio antes de proceder al pago. ¿Estás seguro de que el trabajo está completo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-lg bg-success hover:bg-success/90 gap-2" onClick={handleConfirmFinish} disabled={finishing}>
              {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Sí, Finalizar Servicio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProviderServices;
