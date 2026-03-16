import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABELS, STATUS_COLORS } from "@/constants/categories";
import { CheckCircle2, MessageSquare, Loader2, Play, Eye, Plus, DollarSign, KeyRound, Star, X, Check, Search, ShieldCheck, Calendar, Clock, MapPin } from "lucide-react";
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
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [codeServiceId, setCodeServiceId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [extraDialogOpen, setExtraDialogOpen] = useState(false);
  const [extraServiceId, setExtraServiceId] = useState<string | null>(null);
  const [extraDesc, setExtraDesc] = useState("");
  const [extraAmount, setExtraAmount] = useState("");
  const [submittingExtra, setSubmittingExtra] = useState(false);

  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [finishServiceId, setFinishServiceId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  // Filter tab + search state
  const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");

  const handleStartWithCode = (serviceId: string) => {
    setCodeServiceId(serviceId);
    setCodeDigits(["", "", "", "", "", ""]);
    setCodeVerified(false);
    setCodeDialogOpen(true);
  };

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const upper = value.toUpperCase();
    const newDigits = [...codeDigits];
    newDigits[index] = upper;
    setCodeDigits(newDigits);
    if (upper && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const codeInput = codeDigits.join("");

  const handleVerifyCode = async () => {
    if (!codeServiceId || codeInput.length < 6) return;
    setVerifying(true);
    try {
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
      setCodeVerified(true);
      toast.success("¡Trabajo iniciado!");
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      setTimeout(() => setCodeDialogOpen(false), 1800);
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

  const tabs = [
    { key: "todos", label: "Todos", count: services?.length || 0 },
    { key: "nuevo", label: "Nuevos" },
    { key: "presupuestado", label: "Aguardando" },
    { key: "aceptado", label: "Aceptados" },
    { key: "en_progreso", label: "En Progreso" },
    { key: "finalizado_prestador", label: "Pend. Cliente", badge: (services || []).filter(s => s.status === "finalizado_prestador").length },
    { key: "completado", label: "Completados" },
  ];

  const filteredServices = useMemo(() => {
    let list = services || [];
    if (activeTab !== "todos") {
      list = list.filter(s => s.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        (s.title?.toLowerCase().includes(q)) ||
        (s.client_name?.toLowerCase().includes(q)) ||
        (s.address?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [services, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Servicios</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-5">
          {/* Toolbar bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Filter pills */}
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <div className="flex gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && ` (${tab.count})`}
                    {tab.badge && tab.badge > 0 ? (
                      <span className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs rounded-full bg-orange-500 text-white inline-flex items-center justify-center">
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            {/* Search bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar servicio..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Service cards */}
          <div className="space-y-4">
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay servicios en esta categoría</div>
            ) : (
              filteredServices.map((service) => {
                const { base, extras, total } = getServiceTotal(service);
                return (
                  <Card key={service.id} className="overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                    {/* Card header */}
                    <div className="flex items-center gap-3 px-5 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0 overflow-hidden">
                        {service.client_avatar ? (
                          <img src={service.client_avatar} alt={service.client_name || ""} className="h-full w-full object-cover" />
                        ) : (
                          service.client_name?.[0] || "?"
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{service.client_name}</span>
                      <Badge className={`${STATUS_COLORS[service.status]} ml-auto`}>{STATUS_LABELS[service.status]}</Badge>
                    </div>

                    {/* Card body */}
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Left side */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-orange-500 transition-colors cursor-default">
                            {service.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(service.created_at).toLocaleDateString("es-AR")}
                            </span>
                            {service.scheduled_date && (
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {service.scheduled_date}
                              </span>
                            )}
                            {service.address && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {service.address}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right side */}
                        <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                          {service.budget_amount ? (
                            <div className="text-right">
                              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">${total.toLocaleString()}</span>
                              {extras > 0 && (
                                <p className="text-xs text-slate-400 mt-0.5">Base: ${base.toLocaleString()} + Extras: ${extras.toLocaleString()}</p>
                              )}
                            </div>
                          ) : (
                            <div />
                          )}
                          <div className="flex gap-2 flex-wrap justify-end">
                            {service.status === "nuevo" && (
                              <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => navigate(`/prestador/servicios/${service.id}`)}>
                                <Eye className="h-3.5 w-3.5" /> Ver Detalles
                              </Button>
                            )}
                            {service.status === "presupuestado" && (
                              <Badge className="bg-warning/10 text-warning border-warning/20">Esperando al cliente</Badge>
                            )}
                            {service.status === "aceptado" && (
                              <Button
                                size="sm"
                                className="gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20"
                                onClick={() => handleStartWithCode(service.id)}
                                disabled={verifying}
                              >
                                <KeyRound className="h-3.5 w-3.5" /> Iniciar con Código
                              </Button>
                            )}
                            {service.status === "en_progreso" && (
                              <>
                                <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => handleRequestExtra(service.id)}>
                                  <Plus className="h-3.5 w-3.5" /> Cargo Extra
                                </Button>
                                <Button size="sm" className="gap-1.5 rounded-xl bg-success hover:bg-success/90" onClick={() => handleComplete(service.id)} disabled={updateStatus.isPending}>
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar
                                </Button>
                              </>
                            )}
                            {service.status === "completado" && !reviewedIds?.has(service.id) && (
                              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => openReviewModal(service)}>
                                <Star className="h-3.5 w-3.5 text-yellow-500" /> Calificar Cliente
                              </Button>
                            )}
                            {service.status === "completado" && reviewedIds?.has(service.id) && (
                              <Badge className="bg-success/10 text-success border-success/20">Calificado</Badge>
                            )}
                            {service.provider_id && (
                              <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl relative" onClick={() => navigate(`/prestador/chat?service=${service.id}`)}>
                                <MessageSquare className="h-3.5 w-3.5" /> Chat
                                {unreadServiceIds.has(service.id) && (
                                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-card" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* OTP-style code verification dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={(open) => { setCodeDialogOpen(open); if (!open) setCodeVerified(false); }}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0">
          {/* Orange gradient top border */}
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />

          {codeVerified ? (
            <div className="p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">¡Código verificado!</h3>
              <p className="text-sm text-muted-foreground">El trabajo ha sido iniciado exitosamente.</p>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                  <KeyRound className="h-7 w-7 text-orange-500" />
                </div>
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-lg">Código de Verificación</DialogTitle>
                  <DialogDescription className="text-sm">
                    Ingresá el código de 6 dígitos que el cliente recibió al aceptar el presupuesto.
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Individual digit boxes */}
              <div className="flex justify-center gap-2">
                {codeDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { digitRefs.current[i] = el; }}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                    className="w-10 h-14 text-center text-xl font-bold font-mono rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all text-foreground"
                  />
                ))}
              </div>

              <Button
                className="w-full gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20"
                onClick={handleVerifyCode}
                disabled={verifying || codeInput.length < 6}
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Verificar e Iniciar Trabajo
              </Button>

              {/* Security note */}
              <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
                <ShieldCheck className="h-4 w-4" />
                <span>El código se verifica de forma segura en el servidor</span>
              </div>
            </div>
          )}
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
