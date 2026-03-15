import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABELS, STATUS_COLORS } from "@/constants/categories";
import { CheckCircle2, MessageSquare, Loader2, Play, Eye, Plus, DollarSign, KeyRound, Star, X, Check } from "lucide-react";
import { useProviderRequests, useUpdateServiceStatus } from "@/hooks/useServiceRequests";
import { useSendMessage } from "@/hooks/useMessages";
import { useCreateReview, useMyReviewedServiceIds } from "@/hooks/useReviews";
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
  const createReview = useCreateReview();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sendMessage = useSendMessage();

  // Unread messages tracking
  const serviceIds = (services || []).filter(s => s.provider_id).map(s => s.id);
  const { unreadServiceIds } = useUnreadMessages(serviceIds);

  // Check which completed services the provider already reviewed
  const completedServiceIds = useMemo(
    () => (services || []).filter(s => s.status === "completado").map(s => s.id),
    [services]
  );
  const { data: reviewedIds } = useMyReviewedServiceIds(completedServiceIds);

  // Review modal state
  const [reviewService, setReviewService] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);

  const openReviewModal = (service: any) => {
    setReviewService(service);
    setReviewRating(0);
    setReviewHover(0);
    setReviewComment("");
    setReviewSent(false);
  };

  const closeReviewModal = () => {
    setReviewService(null);
    setReviewRating(0);
    setReviewHover(0);
    setReviewComment("");
    setReviewSent(false);
    setReviewSubmitting(false);
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0 || !reviewService) return;
    setReviewSubmitting(true);
    try {
      await createReview.mutateAsync({
        service_request_id: reviewService.id,
        reviewed_id: reviewService.client_id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewSent(true);
      setTimeout(() => closeReviewModal(), 2000);
    } catch {
      toast.error("Error al enviar la reseña. Intentá de nuevo.");
    } finally {
      setReviewSubmitting(false);
    }
  };

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

  const handleConfirmFinish = () => {
    if (!finishServiceId) return;
    setFinishing(true);
    updateStatus.mutate({ id: finishServiceId, status: "finalizado_prestador" }, {
      onSuccess: () => {
        setFinishDialogOpen(false);
        setFinishServiceId(null);
        setFinishing(false);
      },
      onError: () => {
        setFinishing(false);
      },
    });
  };

  const handleRequestExtra = (serviceId: string) => {
    setExtraServiceId(serviceId);
    setExtraDesc("");
    setExtraAmount("");
    setExtraDialogOpen(true);
  };

  const handleSubmitExtra = async () => {
    if (!extraServiceId || !extraDesc || !extraAmount) return;
    const parsedAmount = parseFloat(extraAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("El monto debe ser un número mayor a 0");
      return;
    }
    setSubmittingExtra(true);
    try {
      const { error } = await supabase.from("extra_charges").insert({
        service_request_id: extraServiceId,
        description: extraDesc.trim(),
        amount: parsedAmount,
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
            <TabsTrigger value="finalizado_prestador">
              Pend. Cliente
              {(services || []).filter(s => s.status === "finalizado_prestador").length > 0 && (
                <span className="ml-1 h-5 min-w-[20px] px-1 text-xs rounded-full bg-warning/20 text-warning inline-flex items-center justify-center">
                  {(services || []).filter(s => s.status === "finalizado_prestador").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completado">Completados</TabsTrigger>
          </TabsList>

          {["todos", "nuevo", "presupuestado", "aceptado", "en_progreso", "finalizado_prestador", "completado"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {filterServices(tab).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay servicios en esta categoría</div>
              ) : (
                filterServices(tab).map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
                          {service.client_avatar ? (
                            <img src={service.client_avatar} alt={service.client_name || ""} className="h-full w-full object-cover" />
                          ) : (
                            service.client_name?.[0] || "?"
                          )}
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
                          {service.status === "completado" && !reviewedIds?.has(service.id) && (
                            <Button size="sm" variant="outline" className="gap-1 rounded-lg" onClick={() => openReviewModal(service)}>
                              <Star className="h-3 w-3 text-yellow-500" /> Calificar Cliente
                            </Button>
                          )}
                          {service.status === "completado" && reviewedIds?.has(service.id) && (
                            <Badge className="bg-success/10 text-success border-success/20">✓ Calificado</Badge>
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

      {/* Review modal — provider rates client */}
      {reviewService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden relative animate-in slide-in-from-bottom-4 duration-300">
            {!reviewSent && (
              <button onClick={closeReviewModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-secondary p-2 rounded-full transition-colors z-10">
                <X size={20} />
              </button>
            )}
            {reviewSent ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-4 animate-bounce">
                  <Check size={32} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">¡Gracias!</h3>
                <p className="text-muted-foreground">Tu opinión ayuda a mejorar la comunidad.</p>
              </div>
            ) : (
              <div className="p-8">
                <div className="text-center mb-6 mt-2">
                  <h3 className="text-xl font-bold text-foreground">Calificar al cliente</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    ¿Cómo fue tu experiencia con <strong className="text-foreground">{reviewService.client_name}</strong>?
                  </p>
                </div>
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      onClick={() => setReviewRating(star)}
                      className={`transition-all transform hover:scale-110 ${star <= (reviewHover || reviewRating) ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-800'}`}
                    >
                      <Star size={40} fill="currentColor" strokeWidth={1} />
                    </button>
                  ))}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Dejá un comentario <span className="text-muted-foreground font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="¿Cómo fue la comunicación, puntualidad, trato?"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 resize-none h-24"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeReviewModal} className="flex-1 px-4 py-3 bg-card border border-border text-foreground font-semibold rounded-xl hover:bg-secondary transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewRating === 0 || reviewSubmitting}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-primary-foreground font-semibold rounded-xl transition-all ${reviewRating === 0 ? 'bg-primary/50 cursor-not-allowed' : reviewSubmitting ? 'bg-primary/80 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg'}`}
                  >
                    {reviewSubmitting ? (
                      <><Loader2 size={18} className="animate-spin" /> Enviando...</>
                    ) : (
                      'Enviar Reseña'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
