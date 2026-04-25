import React, { useState, useMemo } from 'react';
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Calendar, 
  MessageSquare, 
  Star, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Wrench,
  Sparkles,
  Zap,
  X,
  Loader2,
  Check,
  Briefcase
} from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS } from "@/constants/categories";
import { useClientRequests, useCancelServiceRequest } from "@/hooks/useServiceRequests";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useCreateReview, useMyReviewedServiceIds } from "@/hooks/useReviews";
import { useActiveDisputeIds } from "@/hooks/useDisputes";
import DisputeDialog from "@/components/client/DisputeDialog";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Mapeamento de icones por categoria
const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('plomeria')) return Wrench;
  if (cat.includes('limpieza')) return Sparkles;
  if (cat.includes('electricidad')) return Zap;
  return Briefcase;
};

// Cores temáticas para os ícones
const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('plomeria')) return 'blue';
  if (cat.includes('limpieza')) return 'orange';
  if (cat.includes('electricidad')) return 'green';
  return 'slate';
};

export default function ClientServices() {
  const { data: services, isLoading } = useClientRequests();
  const createReview = useCreateReview();
  const cancelService = useCancelServiceRequest();

  // Check which completed services the client already reviewed
  const completedServiceIds = useMemo(
    () => (services || []).filter(s => s.status === "completado").map(s => s.id),
    [services]
  );
  const { data: reviewedIds } = useMyReviewedServiceIds(completedServiceIds);

  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Cancel confirmation
  const [cancelServiceId, setCancelServiceId] = useState<string | null>(null);

  // Dispute dialog
  const [disputeFor, setDisputeFor] = useState<{ id: string; title: string } | null>(null);

  // Dispute eligibility — services in/after work
  const disputeEligibleIds = useMemo(
    () =>
      (services || [])
        .filter((s) => ["en_progreso", "finalizado_prestador", "completado"].includes(s.status))
        .map((s) => s.id),
    [services]
  );
  const { data: activeDisputeIds } = useActiveDisputeIds(disputeEligibleIds);

  // Modal de Avaliação
  const [servicioACalificar, setServicioACalificar] = useState<unknown>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [isSubmittingResena, setIsSubmittingResena] = useState(false);
  const [resenaEnviada, setResenaEnviada] = useState(false);

  // Chat Unread Count
  const chatServiceIds = (services || [])
    .filter((s) => s.provider_id && s.status !== "completado" && s.status !== "cancelado")
    .map((s) => s.id);
  const { unreadServiceIds } = useUnreadMessages(chatServiceIds);

  const handleEnviarResena = async () => {
    if (rating === 0 || !servicioACalificar) return;
    setIsSubmittingResena(true);
    try {
      await createReview.mutateAsync({
        service_request_id: servicioACalificar.id,
        reviewed_id: servicioACalificar.provider_id,
        rating,
        comment: comentario.trim() || undefined,
      });
      setResenaEnviada(true);
      setTimeout(() => fecharModalResena(), 2000);
    } catch {
      toast.error("Error al enviar la reseña. Intentá de nuevo.");
    } finally {
      setIsSubmittingResena(false);
    }
  };

  const fecharModalResena = () => {
    setServicioACalificar(null);
    setRating(0);
    setHoverRating(0);
    setComentario('');
    setResenaEnviada(false);
    setIsSubmittingResena(false);
  };

  // Filtragem local
  const solicitudesFiltradas = useMemo(() => {
    if (!services) return [];
    
    return services.filter(s => {
      // Filtro de Texto
      const textMatch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.provider_name && s.provider_name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!textMatch) return false;

      // Filtro de Abas
      if (filtroActivo === 'todos') return true;
      if (filtroActivo === 'activos') return ['nuevo', 'aceptado', 'en_progreso'].includes(s.status);
      return s.status === filtroActivo;
    });
  }, [services, filtroActivo, searchTerm]);

  // Contadores para as tabs
  const counts = useMemo(() => {
    const total = services?.length || 0;
    const activos = services?.filter(s => ['nuevo', 'aceptado', 'en_progreso'].includes(s.status)).length || 0;
    const completados = services?.filter(s => s.status === 'completado').length || 0;
    const cancelados = services?.filter(s => s.status === 'cancelado').length || 0;
    return { total, activos, completados, cancelados };
  }, [services]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="font-sans flex flex-col pb-10 max-w-7xl mx-auto w-full">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Servicios</h1>
          <p className="text-sm text-muted-foreground">Historial completo y gestión de tus solicitudes</p>
        </div>
        <Link to="/cliente/solicitar">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full hover:-translate-y-0.5 active:scale-[0.98] shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all">
            <Plus size={18} strokeWidth={2.5} />
            <span>Nuevo Servicio</span>
          </button>
        </Link>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-card p-4 rounded-[24px] border border-border shadow-sm mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        
        {/* Abas de Navegação (Tabs) */}
        <div className="flex overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 gap-2 no-scrollbar">
          <button 
            onClick={() => setFiltroActivo('todos')}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] ${filtroActivo === 'todos' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            Todos ({counts.total})
          </button>
          <button 
            onClick={() => setFiltroActivo('activos')}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] ${filtroActivo === 'activos' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            Activos ({counts.activos})
          </button>
          <button 
            onClick={() => setFiltroActivo('completado')}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] ${filtroActivo === 'completado' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            Completados ({counts.completados})
          </button>
          <button 
            onClick={() => setFiltroActivo('cancelado')}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] ${filtroActivo === 'cancelado' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            Cancelados ({counts.cancelados})
          </button>
        </div>

        {/* Pesquisa e Ordenação */}
        <div className="flex w-full lg:w-auto gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar servicio..." 
              className="w-full bg-background border border-border rounded-[16px] pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
            />
          </div>
          <button className="p-2 border border-border rounded-[16px] text-muted-foreground hover:bg-secondary transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-2">
            <Filter size={18} />
            <span className="sr-only sm:not-sr-only sm:text-sm font-medium">Filtrar</span>
          </button>
        </div>
      </div>

      {/* Grelha de Cartões (Grid Layout) */}
      {solicitudesFiltradas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-[24px] shadow-sm">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No hay servicios que coincidan</p>
          <p className="text-sm">Intentá cambiar los filtros o los términos de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solicitudesFiltradas.map((solicitud) => {
            const Icon = getCategoryIcon(solicitud.category);
            const colorClass = getCategoryColor(solicitud.category);
            
            return (
              <div key={solicitud.id} className="bg-card rounded-[24px] border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                
                {/* Cabeçalho do Cartão */}
                <div className="p-5 border-b border-border flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[16px] bg-primary/10 text-primary flex items-center justify-center">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate w-24 sm:w-32">{solicitud.category}</p>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                        <Calendar size={12} />
                        {new Date(solicitud.created_at).toLocaleDateString("es-AR", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${STATUS_COLORS[solicitud.status]}`}>
                    {STATUS_LABELS[solicitud.status]}
                  </span>
                </div>

                {/* Corpo do Cartão */}
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-foreground text-lg mb-4 line-clamp-2 group-hover:text-primary transition-colors cursor-pointer">
                    {solicitud.title}
                  </h3>
                  
                  {/* Info do Prestador */}
                  <div className="flex items-center gap-3 bg-secondary/30 p-3 rounded-[16px] border border-border">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ${!solicitud.provider_name ? 'bg-secondary text-muted-foreground' : 'bg-primary/20 text-primary'}`}>
                      {solicitud.provider_avatar ? (
                        <img src={solicitud.provider_avatar} alt={solicitud.provider_name || ""} className="h-full w-full object-cover" />
                      ) : (
                        !solicitud.provider_name ? '?' : solicitud.provider_name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-none mb-1">
                        {solicitud.provider_name || 'Sin asignar'}
                      </p>
                      {solicitud.status === 'completado' && (
                        <p className="text-xs text-muted-foreground">Servicio completado</p>
                      )}
                    </div>
                  </div>

                  {/* Goal Gradient: Service Progress Timeline */}
                  {solicitud.status !== 'cancelado' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        {[
                          { key: 'nuevo', label: 'Solicitado' },
                          { key: 'presupuestado', label: 'Presupuesto' },
                          { key: 'aceptado', label: 'Aceptado' },
                          { key: 'en_progreso', label: 'En progreso' },
                          { key: 'completado', label: 'Completado' },
                        ].map((step, i, arr) => {
                          const statusOrder = ['nuevo', 'presupuestado', 'aceptado', 'en_progreso', 'finalizado_prestador', 'completado'];
                          const currentIndex = statusOrder.indexOf(solicitud.status);
                          const stepIndex = statusOrder.indexOf(step.key);
                          const isActive = stepIndex <= currentIndex;
                          const isCurrent = step.key === solicitud.status || (solicitud.status === 'finalizado_prestador' && step.key === 'en_progreso');
                          return (
                            <div key={step.key} className="flex flex-col items-center flex-1">
                              <div className={`w-3 h-3 rounded-full border-2 transition-all ${isActive ? 'bg-primary border-primary' : 'bg-background border-border'} ${isCurrent ? 'ring-2 ring-primary/30 ring-offset-1' : ''}`} />
                              <span className={`text-[8px] mt-1 font-medium leading-none ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="h-0.5 bg-border rounded-full -mt-[22px] mb-4 mx-[6%] relative">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-700"
                          style={{
                            width: (() => {
                              const statusOrder = ['nuevo', 'presupuestado', 'aceptado', 'en_progreso', 'finalizado_prestador', 'completado'];
                              const idx = statusOrder.indexOf(solicitud.status);
                              return `${Math.max(0, (idx / (statusOrder.length - 1)) * 100)}%`;
                            })()
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Rodapé do Cartão (Ações) */}
                <div className="px-5 py-4 bg-secondary/10 border-t border-border flex items-center justify-between gap-3 mt-auto">
                  <Link to={`/cliente/chat?service=${solicitud.id}`} className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                    Ver detalles
                  </Link>
                  
                  <div className="flex gap-2">
                    {(solicitud.status === 'aceptado' || solicitud.status === 'en_progreso') && (
                      <Link to={`/cliente/chat?service=${solicitud.id}`}>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-sm rounded-full transition-all hover:-translate-y-0.5 active:scale-[0.98] relative">
                          <MessageSquare size={16} />
                          Chat
                          {unreadServiceIds.has(solicitud.id) && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-card" />
                          )}
                        </button>
                      </Link>
                    )}
                    {solicitud.status === 'completado' && !reviewedIds?.has(solicitud.id) && (
                      <button
                        onClick={() => setServicioACalificar(solicitud)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border text-foreground hover:bg-secondary font-semibold text-sm rounded-full transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-sm"
                      >
                        <Star size={16} className="text-yellow-500" />
                        Calificar
                      </button>
                    )}
                    {solicitud.status === 'completado' && reviewedIds?.has(solicitud.id) && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 text-success text-sm font-semibold rounded-full">
                        <CheckCircle2 size={14} /> Calificado
                      </span>
                    )}
                    {solicitud.status === 'nuevo' && (
                      <button
                        onClick={() => setCancelServiceId(solicitud.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border text-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 font-semibold text-sm rounded-full transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-sm"
                      >
                        <X size={14} />
                        Cancelar
                      </button>
                    )}
                    {['en_progreso', 'finalizado_prestador', 'completado'].includes(solicitud.status) &&
                      !activeDisputeIds?.has(solicitud.id) && (
                        <button
                          onClick={() => setDisputeFor({ id: solicitud.id, title: solicitud.title })}
                          className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border text-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold text-sm rounded-full transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-sm"
                        >
                          <AlertTriangle size={14} />
                          Reportar problema
                        </button>
                    )}
                    {activeDisputeIds?.has(solicitud.id) && (
                      <Link
                        to="/cliente/disputas"
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 font-semibold text-sm rounded-full transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                      >
                        <AlertTriangle size={14} />
                        Disputa abierta
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Avaliação (Calificar) */}
      {servicioACalificar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-[24px] shadow-xl border border-border w-full max-w-md overflow-hidden relative animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Botão Fechar */}
            {!resenaEnviada && (
              <button 
                onClick={fecharModalResena}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-secondary p-2 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>
            )}

            {/* Conteúdo do Modal */}
            {resenaEnviada ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-4 animate-bounce">
                  <Check size={32} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">¡Gracias!</h3>
                <p className="text-muted-foreground">Tu opinión ayuda a mantener la calidad de nuestra plataforma.</p>
              </div>
            ) : (
              <div className="p-8">
                <div className="text-center mb-6 mt-2">
                  <h3 className="text-xl font-bold text-foreground">Calificar profesional</h3>
                  <p className="text-sm text-muted-foreground mt-1">¿Cómo fue tu experiencia con <strong className="text-foreground">{servicioACalificar.provider_name}</strong>?</p>
                </div>

                {/* Sistema Interativo de Estrelas */}
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className={`transition-all transform hover:scale-110 ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-800'}`}
                    >
                      <Star size={40} fill="currentColor" strokeWidth={1} />
                    </button>
                  ))}
                </div>

                {/* Área de Comentário */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Dejá un comentario <span className="text-muted-foreground font-normal">(Opcional)</span>
                  </label>
                  <textarea 
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Escribí qué te pareció el servicio..."
                    className="w-full rounded-[16px] border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 resize-none h-24"
                  />
                </div>

                {/* Botões de Ação do Modal */}
                <div className="flex gap-3">
                  <button 
                    onClick={fecharModalResena}
                    className="flex-1 px-4 py-3 bg-card border border-border text-foreground font-semibold rounded-full hover:bg-secondary transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleEnviarResena}
                    disabled={rating === 0 || isSubmittingResena}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-primary-foreground font-semibold rounded-full transition-all hover:-translate-y-0.5 active:scale-[0.98] ${rating === 0 ? 'bg-primary/50 cursor-not-allowed' : isSubmittingResena ? 'bg-primary/80 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg'}`}
                  >
                    {isSubmittingResena ? (
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

      {/* AlertDialog de confirmación para cancelar */}
      <AlertDialog open={!!cancelServiceId} onOpenChange={(open) => { if (!open) setCancelServiceId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Tu solicitud será cancelada y los prestadores no podrán verla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!cancelServiceId) return;
                try {
                  await cancelService.mutateAsync(cancelServiceId);
                  toast.success("Solicitud cancelada");
                } catch {
                  toast.error("Error al cancelar");
                } finally {
                  setCancelServiceId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dispute Dialog */}
      {disputeFor && (
        <DisputeDialog
          open={!!disputeFor}
          onOpenChange={(open) => { if (!open) setDisputeFor(null); }}
          serviceRequestId={disputeFor.id}
          serviceTitle={disputeFor.title}
        />
      )}
    </div>
  );
}
