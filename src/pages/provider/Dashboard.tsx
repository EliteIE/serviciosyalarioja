import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  Star,
  Clock,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  User,
  Image as ImageIcon,
  Zap,
  Target
} from "lucide-react";
import { useProviderRequests } from "@/hooks/useServiceRequests";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useMyReviewedServiceIds } from "@/hooks/useReviews";
import { useProviderEarningsSummary } from "@/hooks/usePayments";
import { useUpdateProfile } from "@/hooks/useProfiles";

const ProviderDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { data: services, isLoading } = useProviderRequests();
  const [available, setAvailable] = useState(profile?.provider_available ?? true);

  const { data: earnings } = useProviderEarningsSummary(user?.id);
  const updateProfile = useUpdateProfile();

  const firstName = profile?.full_name?.split(" ")[0] || "Prestador";
  const activeServices = services?.filter((s) => s.status !== "completado" && s.status !== "cancelado") || [];
  const completedCount = services?.filter((s) => s.status === "completado").length || 0;
  const pendingServices = services?.filter((s) => s.status === "nuevo") || [];
  const inProgressServices = services?.filter((s) => s.status === "presupuestado" || s.status === "aceptado" || s.status === "en_progreso") || [];
  const awaitingClientServices = services?.filter((s) => s.status === "finalizado_prestador") || [];
  const completedServices = useMemo(() => services?.filter((s) => s.status === "completado") || [], [services]);

  // Check which completed services the provider already reviewed
  const completedServiceIds = useMemo(
    () => completedServices.map(s => s.id),
    [completedServices]
  );
  const { data: reviewedIds } = useMyReviewedServiceIds(completedServiceIds);
  const pendingReviewServices = completedServices.filter(s => !reviewedIds?.has(s.id));

  const toggleAvailability = async () => {
    const newVal = !available;
    setAvailable(newVal);
    try {
      await updateProfile.mutateAsync({ provider_available: newVal });
      toast.success(newVal ? "¡Estás disponible para nuevos trabajos!" : "Modo Oculto activado");
    } catch {
      toast.error("Error al actualizar disponibilidad");
      setAvailable(!newVal);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Profile completion percentage
  const profileFields = [
    profile?.full_name,
    profile?.phone,
    profile?.bio,
    profile?.location,
    profile?.provider_category,
  ];
  const filledFields = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round((filledFields / profileFields.length) * 100);

  // KPIs
  const stats = [
    {
      label: 'Servicios Completos',
      value: completedCount.toString(),
      trend: `${profile?.completed_jobs || 0} totales`,
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success/10',
      trendColor: 'text-success',
    },
    {
      label: 'Ingresos Netos',
      value: earnings?.hasPayments ? `$${earnings.total.toLocaleString()}` : '$0',
      trend: earnings?.hasPayments ? `$${earnings.thisMonth.toLocaleString()} este mes` : 'Completá servicios para ganar',
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
      trendColor: earnings?.hasPayments ? 'text-success' : 'text-muted-foreground',
    },
    {
      label: 'Rating',
      value: Number(profile?.rating_avg || 0).toFixed(1),
      trend: `${profile?.review_count || 0} reseñas`,
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      trendColor: 'text-muted-foreground',
    },
    {
      label: 'Nuevos Pedidos',
      value: pendingServices.length.toString(),
      trend: pendingServices.length > 0 ? '¡Requiere acción!' : 'Al día',
      icon: pendingServices.length > 0 ? AlertCircle : Clock,
      color: pendingServices.length > 0 ? 'text-destructive' : 'text-primary',
      bg: pendingServices.length > 0 ? 'bg-destructive/10' : 'bg-primary/10',
      trendColor: pendingServices.length > 0 ? 'text-destructive' : 'text-muted-foreground',
    },
  ];

  return (
    <div className="space-y-8 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-1">¡Hola, {firstName}!</h1>
          <p className="text-sm text-muted-foreground">Tu panel de control de prestador</p>
        </div>

        <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-full border border-border self-start sm:self-auto">
          <span className={`text-sm font-semibold ${available ? 'text-success' : 'text-muted-foreground'}`}>
            {available ? 'Disponible' : 'Oculto'}
          </span>
          <button
            onClick={toggleAvailability}
            aria-label={available ? "Activar modo oculto" : "Volver a estar disponible"}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background p-0 before:content-[''] before:absolute before:inset-x-0 before:-inset-y-3 ${available ? 'bg-success' : 'bg-muted-foreground/30'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${available ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Profile completion alert */}
      {profileCompletion < 100 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Tu perfil está al {profileCompletion}%</p>
              <p className="text-xs text-muted-foreground">Completá tu perfil para recibir más solicitudes</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/prestador/perfil")}
            className="text-sm font-semibold text-primary hover:underline shrink-0 self-end sm:self-auto inline-flex items-center min-h-[44px] px-3 -mx-3"
          >
            Completar
          </button>
        </div>
      )}

      {/* Awaiting client confirmation alert */}
      {awaitingClientServices.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{awaitingClientServices.length} servicio(s) esperando confirmación del cliente</p>
              <p className="text-xs text-muted-foreground">Ya marcaste como finalizados, el cliente debe confirmar para proceder al pago</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/prestador/servicios")}
            className="text-sm font-semibold text-warning hover:underline shrink-0 self-end sm:self-auto inline-flex items-center min-h-[44px] px-3 -mx-3"
          >
            Ver servicios
          </button>
        </div>
      )}

      {/* Pending review banner */}
      {pendingReviewServices.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{pendingReviewServices.length} servicio(s) sin calificar al cliente</p>
              <p className="text-xs text-muted-foreground">Tu opinión ayuda a mejorar la comunidad y a otros profesionales</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/prestador/servicios")}
            className="text-sm font-semibold text-yellow-600 hover:underline shrink-0 self-end sm:self-auto inline-flex items-center min-h-[44px] px-3 -mx-3"
          >
            Calificar ahora
          </button>
        </div>
      )}

      {/* GRID DE KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-card rounded-2xl p-5 lg:p-6 border border-border/60 transition-colors hover:border-border relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 gap-3">
                <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} shrink-0`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                {stat.label === 'Nuevos Pedidos' && parseInt(stat.value) > 0 && (
                  <span className="flex h-2.5 w-2.5 relative mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1 tracking-tight tabular-nums truncate">{stat.value}</h3>
                <p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">{stat.label}</p>
              </div>
              <div className={`mt-3 text-xs font-medium flex items-center gap-1 ${stat.trendColor} truncate`}>
                {stat.trend.includes('+') || stat.trend.includes('$') ? <TrendingUp size={12} className="shrink-0" /> : null}
                <span className="truncate">{stat.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* COLUNA ESQUERDA */}
        <div className="xl:col-span-2 space-y-8">

          {/* Solicitudes Pendientes */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1 gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2 min-w-0">
                <AlertCircle className={pendingServices.length > 0 ? "text-destructive shrink-0" : "text-muted-foreground shrink-0"} size={20} />
                <span className="truncate">Solicitudes Pendientes</span>
              </h2>
              {pendingServices.length > 0 && (
                <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                  {pendingServices.length} {pendingServices.length === 1 ? 'Nueva' : 'Nuevas'}
                </span>
              )}
            </div>

            {pendingServices.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border/60 p-8 text-center text-sm text-muted-foreground">
                No tienes solicitudes pendientes. ¡Buen trabajo!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingServices.map((req) => (
                  <div key={req.id} className="bg-card rounded-2xl border border-primary/20 p-4 sm:p-5 transition-colors hover:border-primary/40 flex flex-col sm:flex-row gap-4">
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-semibold text-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-primary/20">
                      {req.client_avatar ? (
                        <img src={req.client_avatar} alt={req.client_name || ""} className="w-full h-full object-cover" />
                      ) : (
                        req.client_name?.charAt(0) || "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap justify-between items-start gap-x-3 gap-y-1 mb-1">
                        <h4 className="font-semibold text-foreground truncate">{req.client_name || "Cliente"}</h4>
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 tabular-nums whitespace-nowrap">
                          <Clock size={12} /> {new Date(req.created_at).toLocaleDateString("es-AR", { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mb-1.5 truncate">{req.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <User size={12} className="shrink-0" /> <span className="truncate">{req.address || "Dirección no especificada"}</span>
                      </p>
                    </div>
                    <div className="flex flex-col justify-center sm:pl-4 sm:border-l border-border shrink-0">
                      <button
                        onClick={() => navigate(`/prestador/servicios/${req.id}`)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full active:scale-[0.98] transition-all text-sm"
                      >
                        Revisar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Trabajos en Curso */}
          <section>
            <h2 className="text-lg font-semibold tracking-tight text-foreground mb-4 px-1">Trabajos en Curso</h2>
            <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
              <ul className="divide-y divide-border">
                {inProgressServices.length === 0 ? (
                  <li className="p-8 text-center text-sm text-muted-foreground">
                    No tienes trabajos activos en este momento.
                  </li>
                ) : (
                  inProgressServices.map((trabajo) => (
                    <li
                      key={trabajo.id}
                      onClick={() => navigate(`/prestador/servicios/${trabajo.id}`)}
                      className="p-4 sm:p-5 hover:bg-accent/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-full bg-muted text-secondary-foreground font-semibold flex items-center justify-center border border-border overflow-hidden flex-shrink-0">
                          {trabajo.client_avatar ? (
                            <img src={trabajo.client_avatar} alt={trabajo.client_name || ""} className="w-full h-full object-cover" />
                          ) : (
                            trabajo.client_name?.charAt(0) || "?"
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{trabajo.client_name || "Cliente"}</h4>
                          <p className="text-xs text-muted-foreground truncate">{trabajo.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-14 sm:pl-0">
                        <div className="text-left sm:text-right flex flex-col sm:items-end gap-1">
                          <p className="text-sm font-semibold text-foreground tabular-nums">
                            {trabajo.budget_amount ? `$${trabajo.budget_amount.toLocaleString()}` : 'A coordinar'}
                          </p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide
                            ${trabajo.status === 'aceptado' ? 'bg-success/10 text-success' : ''}
                            ${trabajo.status === 'presupuestado' ? 'bg-primary/10 text-primary' : ''}
                            ${trabajo.status === 'en_progreso' ? 'bg-warning/10 text-warning' : ''}
                          `}>
                            {trabajo.status.replace("_", " ")}
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>

          {/* Finalizados pendientes de confirmación */}
          {awaitingClientServices.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold tracking-tight text-foreground mb-4 px-1 flex items-center gap-2">
                <Clock className="text-warning" size={20} />
                Esperando Confirmación del Cliente
              </h2>
              <div className="bg-card rounded-2xl border border-warning/20 overflow-hidden">
                <ul className="divide-y divide-border">
                  {awaitingClientServices.map((trabajo) => (
                    <li
                      key={trabajo.id}
                      onClick={() => navigate(`/prestador/chat?service=${trabajo.id}`)}
                      className="p-4 sm:p-5 hover:bg-accent/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-full bg-warning/10 text-warning font-semibold flex items-center justify-center border border-warning/20 overflow-hidden flex-shrink-0">
                          {trabajo.client_avatar ? (
                            <img src={trabajo.client_avatar} alt={trabajo.client_name || ""} className="w-full h-full object-cover" />
                          ) : (
                            trabajo.client_name?.charAt(0) || "?"
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{trabajo.client_name || "Cliente"}</h4>
                          <p className="text-xs text-muted-foreground truncate">{trabajo.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-14 sm:pl-0">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-warning/10 text-warning whitespace-nowrap">
                          Esperando cliente
                        </span>
                        <MessageSquare size={16} className="text-muted-foreground shrink-0" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>

        {/* COLUNA DIREITA */}
        <div className="xl:col-span-1 space-y-8">

          {/* Ganancias */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Resumen de Ganancias</h2>
              <button onClick={() => navigate("/prestador/finanzas")} aria-label="Ver finanzas" className="text-muted-foreground hover:text-foreground transition-colors -mr-2 p-2 inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="bg-card rounded-2xl border border-border/60 p-6">
              {earnings?.hasPayments ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Ganancia neta total</p>
                    <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">${earnings.total.toLocaleString()}</p>
                  </div>
                  <div className="border-t border-border/60 pt-4 flex justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Este mes</p>
                      <p className="text-base font-semibold tabular-nums text-success truncate">${earnings.thisMonth.toLocaleString()}</p>
                    </div>
                    <div className="text-right min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Cobros</p>
                      <p className="text-base font-semibold tabular-nums text-foreground">{earnings.count}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/prestador/finanzas")}
                    className="w-full text-sm text-primary font-semibold hover:underline text-center min-h-[44px] inline-flex items-center justify-center"
                  >
                    Ver detalle completo →
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-11 h-11 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-3 mx-auto border border-border">
                    <DollarSign size={18} />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Sin ingresos aún</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                    Completá tu primer servicio para ver tus métricas financieras acá.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Tip */}
          <section className="bg-secondary rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
            <h3 className="font-semibold mb-2 tracking-tight flex items-center gap-2">
              <Zap size={18} className="text-yellow-400 shrink-0" />
              Tip para ganar más
            </h3>
            <p className="text-primary-foreground/80 text-sm leading-relaxed mb-5">
              {!profile?.bio
                ? "Agregá una descripción a tu perfil. Los prestadores con bio reciben más solicitudes."
                : "Mejorá tu perfil con fotos de tus trabajos. Los perfiles con portafolio reciben un 40% más de solicitudes."
              }
            </p>
            <Link to={!profile?.bio ? "/prestador/perfil" : "/prestador/portafolio"} className="block">
              <button className="w-full bg-white text-secondary hover:bg-white/95 font-semibold py-2.5 rounded-full transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2">
                <ImageIcon size={16} />
                {!profile?.bio ? "Completar perfil" : "Ir a mi Portafolio"}
              </button>
            </Link>
          </section>

          {/* Quick Stats */}
          <section className="bg-card rounded-2xl border border-border/60 p-6 space-y-4">
            <h3 className="font-semibold text-foreground text-sm tracking-tight">Resumen Rápido</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm gap-3">
                <span className="text-muted-foreground">Verificación</span>
                <span className={`font-semibold whitespace-nowrap ${profile?.provider_verified ? 'text-success' : 'text-warning'}`}>
                  {profile?.provider_verified ? 'Verificado' : 'Pendiente'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm gap-3">
                <span className="text-muted-foreground">Servicios activos</span>
                <span className="font-semibold tabular-nums">{activeServices.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm gap-3">
                <span className="text-muted-foreground">Disponibilidad</span>
                <span className={`font-semibold whitespace-nowrap ${available ? 'text-success' : 'text-muted-foreground'}`}>
                  {available ? 'Activo' : 'Oculto'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm gap-3">
                <span className="text-muted-foreground">Completados</span>
                <span className="font-semibold tabular-nums">{completedCount}</span>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default ProviderDashboard;
