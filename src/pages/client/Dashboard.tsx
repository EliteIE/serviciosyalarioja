import { Link } from "react-router-dom";
import { ClipboardList, MessageSquare, Clock, CheckCircle2, AlertCircle, Loader2, DollarSign, KeyRound, ShieldCheck, Plus, X, Banknote, CreditCard, Smartphone, ArrowRightLeft, Copy, Check, ListTodo, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { STATUS_LABELS, STATUS_COLORS } from "@/constants/categories";
import { useClientRequests, useUpdateServiceStatus } from "@/hooks/useServiceRequests";
import { useSendMessage } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { usePayments } from "@/hooks/usePayments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

type PaymentMethod = "mercadopago" | "transferencia" | "efectivo" | "tarjeta" | null;

const ClientDashboard = () => {
  const { profile, user } = useAuth();
  const { data: services, isLoading } = useClientRequests();
  const updateStatus = useUpdateServiceStatus();
  const { createCheckout } = usePayments();
  const queryClient = useQueryClient();
  const sendMessage = useSendMessage();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completionServiceId, setCompletionServiceId] = useState<string | null>(null);
  const [q1, setQ1] = useState<boolean | null>(null);
  const [q2, setQ2] = useState<boolean | null>(null);
  const [q3, setQ3] = useState<boolean | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Payment method flow
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeServices = services?.filter((s) => s.status !== "completado" && s.status !== "cancelado") || [];
  const completedServices = services?.filter((s) => s.status === "completado") || [];
  const budgetReceived = services?.filter((s) => s.status === "presupuestado" && s.budget_amount) || [];
  const finalizados = services?.filter((s) => s.status === "finalizado_prestador") || [];

  // Unread messages tracking
  const chatServiceIds = (services || []).filter(s => s.provider_id && s.status !== "completado" && s.status !== "cancelado").map(s => s.id);
  const { unreadServiceIds } = useUnreadMessages(chatServiceIds);

  // Fetch extra charges for active services
  const activeIds = activeServices.map((s) => s.id);
  const { data: extraCharges } = useQuery({
    queryKey: ["extra-charges", "client", activeIds],
    queryFn: async () => {
      if (activeIds.length === 0) return [];
      const { data, error } = await supabase
        .from("extra_charges")
        .select("*")
        .in("service_request_id", activeIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: activeIds.length > 0,
  });

  // Fetch provider profile for transfer details when needed
  const completionService = services?.find((s) => s.id === completionServiceId);
  const { data: providerProfile } = useQuery({
    queryKey: ["provider-bank-details", completionServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_provider_bank_details", { p_service_request_id: completionServiceId! });
      if (error) throw error;
      return (data as any)?.[0] || null;
    },
    enabled: !!completionServiceId && (transferDialogOpen || selectedPaymentMethod === "transferencia"),
  });

  const pendingExtras = extraCharges?.filter((e: any) => e.status === "pendiente") || [];

  const firstName = profile?.full_name?.split(" ")[0] || "Usuario";

  const handleAcceptBudget = async (serviceId: string) => {
    setAccepting(serviceId);
    try {
      const code = generateCode();
      const { error } = await supabase
        .from("service_requests")
        .update({ status: "aceptado" as any, verification_code: code } as any)
        .eq("id", serviceId);
      if (error) throw error;
      setGeneratedCode(code);
      setCodeDialogOpen(true);
      toast.success("¡Presupuesto aceptado!");
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    } catch (err: any) {
      toast.error(err.message || "Error al aceptar presupuesto");
    } finally {
      setAccepting(null);
    }
  };

  const handleRejectBudget = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("service_requests")
        .update({ status: "nuevo" as any, provider_id: null, budget_amount: null, budget_message: null, verification_code: null } as any)
        .eq("id", serviceId);
      if (error) throw error;
      toast.success("Presupuesto rechazado. Tu solicitud vuelve a estar disponible.");
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    } catch (err: any) {
      toast.error(err.message || "Error");
    }
  };

  const handleApproveExtra = async (extraId: string) => {
    try {
      const extra = extraCharges?.find((e: any) => e.id === extraId);
      const { error } = await supabase.from("extra_charges").update({ status: "aprobado" }).eq("id", extraId);
      if (error) throw error;

      if (extra) {
        await sendMessage.mutateAsync({
          service_request_id: extra.service_request_id,
          sender_id: user!.id,
          content: `✅ Cargo extra aprobado: ${extra.description} — $${Number(extra.amount).toLocaleString()}`,
          message_type: "system",
        });
      }

      toast.success("Cargo extra aprobado");
      queryClient.invalidateQueries({ queryKey: ["extra-charges"] });
    } catch (err: any) {
      toast.error(err.message || "Error");
    }
  };

  const handleRejectExtra = async (extraId: string) => {
    try {
      const extra = extraCharges?.find((e: any) => e.id === extraId);
      const { error } = await supabase.from("extra_charges").update({ status: "rechazado" }).eq("id", extraId);
      if (error) throw error;

      if (extra) {
        await sendMessage.mutateAsync({
          service_request_id: extra.service_request_id,
          sender_id: user!.id,
          content: `❌ Cargo extra rechazado: ${extra.description} — $${Number(extra.amount).toLocaleString()}`,
          message_type: "system",
        });
      }

      toast.success("Cargo extra rechazado");
      queryClient.invalidateQueries({ queryKey: ["extra-charges"] });
    } catch (err: any) {
      toast.error(err.message || "Error");
    }
  };

  const openCompletionDialog = (serviceId: string) => {
    setCompletionServiceId(serviceId);
    setQ1(null);
    setQ2(null);
    setQ3(null);
    setSelectedPaymentMethod(null);
    setCompletionDialogOpen(true);
  };

  const handleQuestionnaireDone = () => {
    if (q1 === null || q2 === null || q3 === null) return;
    setCompletionDialogOpen(false);
    setPaymentMethodDialogOpen(true);
  };

  const getServiceTotal = (serviceId: string) => {
    const service = services?.find((s) => s.id === serviceId);
    if (!service) return 0;
    const approvedExtras = extraCharges?.filter((e: any) => e.service_request_id === serviceId && e.status === "aprobado") || [];
    const extraTotal = approvedExtras.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    return (service.budget_amount || 0) + extraTotal;
  };

  const handleSelectPaymentMethod = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    
    if (method === "mercadopago" || method === "tarjeta") {
      // Redirect to MercadoPago checkout
      setPaymentMethodDialogOpen(false);
      setConfirming(true);
      try {
        const service = services?.find((s) => s.id === completionServiceId);
        if (!service) throw new Error("Servicio no encontrado");
        const total = getServiceTotal(completionServiceId!);
        if (total <= 0) throw new Error("No hay monto válido para pagar");
        toast.info("Redirigiendo al pago...");
        await createCheckout(completionServiceId!, total, service.title);
      } catch (err: any) {
        toast.error(err.message || "Error al procesar el pago");
      } finally {
        setConfirming(false);
      }
    } else if (method === "transferencia") {
      setPaymentMethodDialogOpen(false);
      setTransferDialogOpen(true);
    } else if (method === "efectivo") {
      // For cash payment, mark as completed directly with a message
      setPaymentMethodDialogOpen(false);
      setConfirming(true);
      try {
        await supabase
          .from("service_requests")
          .update({ status: "completado" as any })
          .eq("id", completionServiceId!);
        
        await sendMessage.mutateAsync({
          service_request_id: completionServiceId!,
          sender_id: user!.id,
          content: "💵 Pago realizado en efectivo. Servicio finalizado.",
          message_type: "system",
        });

        toast.success("¡Servicio finalizado correctamente!");
        queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      } catch (err: any) {
        toast.error(err.message || "Error al finalizar");
      } finally {
        setConfirming(false);
      }
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTransferConfirm = async () => {
    setTransferDialogOpen(false);
    setTransferConfirmOpen(true);
  };

  const handleTransferComplete = async () => {
    setTransferConfirmOpen(false);
    setConfirming(true);
    try {
      const service = services?.find((s) => s.id === completionServiceId);

      await supabase
        .from("service_requests")
        .update({ status: "completado" as any })
        .eq("id", completionServiceId!);

      await sendMessage.mutateAsync({
        service_request_id: completionServiceId!,
        sender_id: user!.id,
        content: `🏦 Pago realizado por transferencia bancaria al prestador ${providerProfile?.full_name || ""}. Servicio finalizado.`,
        message_type: "system",
      });

      // Create payment record for tracking
      if (service) {
        const total = getServiceTotal(completionServiceId!);
        await supabase.from("payments").insert({
          service_request_id: completionServiceId!,
          client_id: user!.id,
          provider_id: service.provider_id || "",
          amount: total,
          platform_fee: 0,
          provider_amount: total,
          commission_rate: 0,
          status: "completed",
          payment_method: "transferencia",
        });
      }

      toast.success("¡Servicio finalizado correctamente!");
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    } catch (err: any) {
      toast.error(err.message || "Error al finalizar");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col font-sans">
      
      {/* Cabeçalho da Página & CTA Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">¡Hola, {firstName}! 👋</h1>
          <p className="text-muted-foreground">Acá podés gestionar todas tus solicitudes y ver su estado.</p>
        </div>
        <Link to="/cliente/solicitar">
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5 transition-all w-full sm:w-auto">
            <Plus size={20} strokeWidth={2.5} />
            Nuevo Servicio
          </button>
        </Link>
      </div>

      {/* Neurotécnica: Alerta urgente si hay presupuestos o finalizados pendientes (Loss Aversion) */}
      {(budgetReceived.length > 0 || finalizados.length > 0) && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4 mb-6 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {budgetReceived.length > 0 ? `¡Tenés ${budgetReceived.length} presupuesto(s) esperando tu respuesta!` : `¡${finalizados.length} servicio(s) listo(s) para confirmar y pagar!`}
              </p>
              <p className="text-xs text-muted-foreground">Respondé rápido para no perder al profesional</p>
            </div>
          </div>
          <a href="#action-section" className="text-sm font-semibold text-primary hover:underline shrink-0 flex items-center gap-1">
            Ver ahora <ArrowRight size={14} />
          </a>
        </div>
      )}

      {/* Grelha de KPIs (Estatísticas) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
        {[
          { label: 'Servicios Activos', value: activeServices.length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', pulse: activeServices.length > 0 },
          { label: 'Requieren Acción', value: budgetReceived.length + finalizados.length + pendingExtras.length, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100', pulse: (budgetReceived.length + finalizados.length + pendingExtras.length) > 0 },
          { label: 'Completados', value: completedServices.length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', pulse: false },
          { label: 'Total Histórico', value: services?.length || 0, icon: TrendingUp, color: 'text-slate-600', bg: 'bg-slate-100', pulse: false },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} relative`}>
                  <Icon size={24} />
                  {stat.pulse && stat.value > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Coluna Principal */}
        <div className="xl:col-span-2 space-y-8">

          {/* Budget received section */}
          <div id="action-section" />
          {budgetReceived.length > 0 && (
            <Card className="border-primary/30 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" /> Presupuestos Recibidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgetReceived.map((service) => (
                  <div key={service.id} className="p-5 rounded-xl border-2 border-primary/20 bg-primary/[0.02] space-y-4 hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center border border-primary/20">
                          {service.provider_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{service.title}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            {service.provider_name}
                            {service.provider_rating_avg && Number(service.provider_rating_avg) > 0 && (
                              <span className="text-yellow-500 text-xs">★ {Number(service.provider_rating_avg).toFixed(1)}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-primary">${service.budget_amount?.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Presupuesto total</p>
                      </div>
                    </div>
                    {service.budget_message && (
                      <p className="text-sm bg-background/50 border border-border p-3 rounded-lg text-foreground/80 italic">"{service.budget_message}"</p>
                    )}
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 gap-2 rounded-xl shadow-[0_4px_14px_0_rgba(234,88,12,0.25)]"
                        onClick={() => handleAcceptBudget(service.id)}
                        disabled={accepting === service.id}
                      >
                        {accepting === service.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Aceptar Presupuesto
                      </Button>
                      <Button variant="outline" className="gap-2 rounded-xl" onClick={() => handleRejectBudget(service.id)}>
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pending extra charges */}
          {pendingExtras.length > 0 && (
            <Card className="border-warning/30 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-warning" /> Cargos Extra Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingExtras.map((extra: any) => {
                  const service = services?.find((s) => s.id === extra.service_request_id);
                  return (
                    <div key={extra.id} className="p-4 rounded-xl border border-border/50 bg-warning/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{extra.description}</h4>
                          <p className="text-xs text-muted-foreground">Servicio: {service?.title || "—"}</p>
                        </div>
                        <p className="text-lg font-bold text-primary">${Number(extra.amount).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 gap-1 rounded-lg" onClick={() => handleApproveExtra(extra.id)}>
                          <CheckCircle2 className="h-3 w-3" /> Aprobar
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 rounded-lg" onClick={() => handleRejectExtra(extra.id)}>
                          <X className="h-3 w-3" /> Rechazar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Provider marked as done - client needs to confirm */}
          {finalizados.length > 0 && (
            <Card className="border-success/30 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-success" /> Servicios para Confirmar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {finalizados.map((service) => {
                  const serviceExtras = extraCharges?.filter((e: any) => e.service_request_id === service.id && e.status === "aprobado") || [];
                  const extraTotal = serviceExtras.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
                  const total = (service.budget_amount || 0) + extraTotal;
                  return (
                    <div key={service.id} className="p-4 rounded-xl border border-border/50 bg-success/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{service.title}</h4>
                          <p className="text-sm text-muted-foreground">Prestador: {service.provider_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total a pagar</p>
                          <p className="text-2xl font-bold text-success">${total.toLocaleString()}</p>
                          {extraTotal > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Base: ${service.budget_amount?.toLocaleString()} + Extras: ${extraTotal.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button className="w-full gap-2 rounded-xl bg-success hover:bg-success/90" onClick={() => openCompletionDialog(service.id)}>
                        <DollarSign className="h-4 w-4" /> Efectuar Pago
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Secção: Servicios Activos */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xl font-bold text-foreground">Servicios Activos</h2>
              <Link to="/cliente/servicios" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">Ver todos</Link>
            </div>
            
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              {isLoading ? (
                <DashboardSkeleton />
              ) : activeServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tenés servicios activos</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {activeServices.map((servicio) => (
                    <li key={servicio.id} className="p-4 md:p-5 hover:bg-accent/30 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 group">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg ${servicio.provider_name ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border border-dashed'}`}>
                          {servicio.provider_name?.[0] || '?'}
                        </div>
                        
                        {/* Info Principal */}
                        <div className="flex-1 min-w-0">
                          <Link to={`/cliente/servicios`} className="block">
                            <h4 className="text-base font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors truncate">{servicio.title}</h4>
                          </Link>
                          <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <span className="truncate">{servicio.provider_name || 'Sin asignar'}</span>
                            <span className="hidden sm:inline-block w-1.5 h-1.5 bg-border rounded-full"></span>
                            <span className="truncate">{servicio.category}</span>
                          </div>
                          <span className="block mt-0.5 text-xs text-muted-foreground">
                            {new Date(servicio.created_at).toLocaleDateString("es-AR", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>

                          {servicio.status === "aceptado" && servicio.verification_code && (
                            <div className="mt-3 inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-2 py-1 w-fit">
                              <KeyRound className="h-3 w-3 text-primary flex-shrink-0" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Código:</span>
                              <span className="font-mono font-bold text-primary text-sm tracking-widest">{servicio.verification_code}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Badge e Ação */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 mt-1 sm:mt-0 pl-16 sm:pl-0 w-full sm:w-auto">
                        <Badge className={`rounded-full px-3 py-1 whitespace-nowrap ${STATUS_COLORS[servicio.status]}`}>{STATUS_LABELS[servicio.status]}</Badge>
                        {servicio.status === "en_progreso" && (
                          <Link to={`/cliente/chat?service=${servicio.id}`}>
                            <Button size="sm" variant="ghost" className="rounded-xl relative hover:bg-primary/10 hover:text-primary transition-colors border border-border sm:border-transparent">
                              <MessageSquare className="h-4 w-4 mr-2 sm:mr-0" />
                              <span className="sm:hidden">Chat</span>
                              {unreadServiceIds.has(servicio.id) && (
                                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
                              )}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Secção: Completados (Recentemente) */}
          {completedServices.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 px-1">Completados Recientemente</h2>
              
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                <ul className="divide-y divide-border/50">
                  {completedServices.slice(0, 5).map((servicio) => (
                    <li key={servicio.id} className="p-5 hover:bg-accent/30 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 opacity-80 hover:opacity-100">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-muted text-muted-foreground font-bold border border-border">
                        {servicio.provider_name?.[0] || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-foreground truncate">{servicio.title}</h4>
                        <p className="text-xs text-muted-foreground">{servicio.provider_name}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 sm:mt-0">
                        <span className="text-sm text-muted-foreground font-medium hidden sm:block">
                          {new Date(servicio.created_at).toLocaleDateString("es-AR", { day: '2-digit', month: 'short' })}
                        </span>
                        <Badge className={`rounded-full px-3 py-1 bg-green-50 text-green-700 border-green-200`}>
                          {STATUS_LABELS.completado}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

        </div>

        {/* Coluna Lateral */}
        <div className="hidden xl:block space-y-6">
          {/* CTA Urgente */}
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden sticky top-6">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <h3 className="text-xl font-bold mb-2 relative z-10">¿Necesitás ayuda urgente?</h3>
            <p className="text-orange-100 text-sm mb-6 relative z-10">Tenemos profesionales disponibles 24/7 para emergencias en tu zona.</p>
            <Link to="/cliente/solicitar">
              <button className="w-full bg-white text-orange-600 font-bold py-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all relative z-10 border border-transparent hover:border-orange-100">
                Pedir Servicio Express
              </button>
            </Link>
          </div>

          {/* Neurotécnica: Cognitive Fluency — "Cómo funciona" stepper */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
            <h3 className="font-bold text-foreground text-sm mb-4">¿Cómo funciona?</h3>
            <div className="space-y-4">
              {[
                { step: '1', label: 'Pedí', desc: 'Describí qué necesitás' },
                { step: '2', label: 'Elegí', desc: 'Compará presupuestos' },
                { step: '3', label: 'Listo', desc: 'El profesional va a tu casa' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 border border-primary/20">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Badge */}
          <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-1">
              <ShieldCheck size={14} className="text-green-500" />
              <span className="font-semibold text-foreground">100% Garantizado</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Tus datos están protegidos. Solo compartimos tu info con el prestador asignado.</p>
          </div>
        </div>

      </div>

      {/* Verification code dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Tu Código de Verificación</DialogTitle>
            <DialogDescription>
              Guardá este código. Cuando el prestador llegue, te lo pedirá para confirmar que es la persona correcta y comenzar el trabajo.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="inline-block bg-primary/5 border-2 border-primary/30 rounded-2xl px-8 py-6">
              <p className="font-mono text-4xl font-bold text-primary tracking-[0.3em]">{generatedCode}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Este código es único para este servicio. No lo compartas hasta que el prestador esté presente.</p>
          </div>
          <Button className="w-full rounded-xl" onClick={() => setCodeDialogOpen(false)}>Entendido</Button>
        </DialogContent>
      </Dialog>

      {/* Security questionnaire dialog */}
      <Dialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-success" /> Confirmación de Finalización</DialogTitle>
            <DialogDescription>
              Por tu seguridad, respondé estas preguntas antes de proceder al pago.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">1. ¿El servicio fue realizado como lo solicitaste?</p>
              <div className="flex gap-2">
                <Button size="sm" variant={q1 === true ? "default" : "outline"} className="flex-1 rounded-lg" onClick={() => setQ1(true)}>Sí</Button>
                <Button size="sm" variant={q1 === false ? "destructive" : "outline"} className="flex-1 rounded-lg" onClick={() => setQ1(false)}>No</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">2. ¿El prestador se comportó de manera profesional?</p>
              <div className="flex gap-2">
                <Button size="sm" variant={q2 === true ? "default" : "outline"} className="flex-1 rounded-lg" onClick={() => setQ2(true)}>Sí</Button>
                <Button size="sm" variant={q2 === false ? "destructive" : "outline"} className="flex-1 rounded-lg" onClick={() => setQ2(false)}>No</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">3. ¿Recomendarías a este prestador a otras personas?</p>
              <div className="flex gap-2">
                <Button size="sm" variant={q3 === true ? "default" : "outline"} className="flex-1 rounded-lg" onClick={() => setQ3(true)}>Sí</Button>
                <Button size="sm" variant={q3 === false ? "destructive" : "outline"} className="flex-1 rounded-lg" onClick={() => setQ3(false)}>No</Button>
              </div>
            </div>

            <Button
              className="w-full gap-2 rounded-xl bg-success hover:bg-success/90"
              onClick={handleQuestionnaireDone}
              disabled={q1 === null || q2 === null || q3 === null}
            >
              <CheckCircle2 className="h-4 w-4" />
              Continuar al Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment method selection dialog */}
      <Dialog open={paymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" /> Método de Pago
            </DialogTitle>
            <DialogDescription>
              Seleccioná cómo querés pagar este servicio.
              {completionServiceId && (
                <span className="block mt-1 font-semibold text-foreground">
                  Total: ${getServiceTotal(completionServiceId).toLocaleString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <button
              onClick={() => handleSelectPaymentMethod("mercadopago")}
              disabled={confirming}
              className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">MercadoPago</p>
                <p className="text-xs text-muted-foreground">Pagá con tu cuenta de MercadoPago</p>
              </div>
            </button>

            <button
              onClick={() => handleSelectPaymentMethod("tarjeta")}
              disabled={confirming}
              className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Tarjeta Débito/Crédito</p>
                <p className="text-xs text-muted-foreground">Pagá con tu tarjeta a través de MercadoPago</p>
              </div>
            </button>

            <button
              onClick={() => handleSelectPaymentMethod("transferencia")}
              disabled={confirming}
              className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <div className="p-2 rounded-xl bg-green-100 text-green-600">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Transferencia Bancaria</p>
                <p className="text-xs text-muted-foreground">Transferí directamente al prestador</p>
              </div>
            </button>

            <button
              onClick={() => handleSelectPaymentMethod("efectivo")}
              disabled={confirming}
              className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Efectivo</p>
                <p className="text-xs text-muted-foreground">Pagá en efectivo al prestador</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer details dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-success" /> Datos para Transferencia
            </DialogTitle>
            <DialogDescription>
              Realizá la transferencia con los siguientes datos del prestador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-accent/50 border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Prestador</p>
                <p className="font-medium">{providerProfile?.full_name || completionService?.provider_name || "—"}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Monto</p>
                <p className="font-bold text-success text-lg">${completionServiceId ? getServiceTotal(completionServiceId).toLocaleString() : "—"}</p>
              </div>
            </div>

            {providerProfile?.bank_alias || providerProfile?.bank_cvu ? (
              <div className="rounded-xl border p-4 space-y-3">
                {providerProfile.bank_alias && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Alias</p>
                      <p className="font-mono font-semibold text-lg">{providerProfile.bank_alias}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleCopy(providerProfile.bank_alias!, "alias")}
                    >
                      {copiedField === "alias" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
                {providerProfile.bank_cvu && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">CVU</p>
                      <p className="font-mono text-sm">{providerProfile.bank_cvu}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleCopy(providerProfile.bank_cvu!, "cvu")}
                    >
                      {copiedField === "cvu" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-warning/5 border border-warning/20 p-4">
                <p className="text-sm text-warning font-medium">⚠️ El prestador no ha registrado datos bancarios.</p>
                <p className="text-xs text-muted-foreground mt-1">Contactalo por chat para obtener sus datos de transferencia.</p>
              </div>
            )}

            <Button
              className="w-full gap-2 rounded-xl bg-success hover:bg-success/90"
              onClick={handleTransferConfirm}
            >
              <CheckCircle2 className="h-4 w-4" /> Ya realicé la transferencia
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer confirmation dialog */}
      <Dialog open={transferConfirmOpen} onOpenChange={setTransferConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Confirmás el envío?</DialogTitle>
            <DialogDescription>
              ¿Ya realizaste la transferencia bancaria al prestador? Al confirmar, el servicio se dará como finalizado para ambas partes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setTransferConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2 rounded-xl bg-success hover:bg-success/90"
              onClick={handleTransferComplete}
              disabled={confirming}
            >
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Sí, confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDashboard;
