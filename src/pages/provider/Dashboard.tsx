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
          <h1 className="text-2xl font-bold text-foreground tracking-tight">¡Hola, {firstName}! 👋</h1>
          <p className="text-muted-foreground">Tu panel de control de prestador</p>
        </div>

        <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-full border border-border shadow-sm">
          <span className={`text-sm font-semibold ${available ? 'text-success' : 'text-muted-foreground'}`}>
            {available ? 'Disponible' : 'Oculto'}
          </span>
          <button
            onClick={toggleAvailability}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${available ? 'bg-success' : 'bg-muted-foreground/30'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${available ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Profile completion alert */}
      {profileCompletion < 100 && (
        <div className="bg-primary/5 border border-primary/20 rounded-[24px] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">Tu perfil está al {profileCompletion}%</p>
              <p className="text-xs text-muted-foreground">Completá tu perfil para recibir más solicitudes</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/prestador/perfil")}
            className="text-sm font-semibold text-primary hover:underline shrink-0"
          >
            Completar
          </button>
        </div>
      )}

      {/* Awaiting client confirmation alert */}
      {awaitingClientServices.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-[24px] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-bold">{awaitingClientServices.length} servicio(s) esperando confirmación del cliente</p>
              <p className="text-xs text-muted-foreground">Ya marcaste como finalizados, el cliente debe confirmar para proceder al pago</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/prestador/servicios")}
            className="text-sm font-semibold text-warning hover:underline shrink-0"
          >
            Ver servicios
          </button>
        </div>
      )}

      {/* Pending review banner */}
      {pendingReviewServices.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-[24px] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-bold">{pendingReviewServices.length} servicio(s) sin calificar al cliente</p>
              <p className="text-xs text-muted-foreground">Tu opinión ayuda a mejorar la comunidad y a otros profesionales</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/prestador/servicios")}
            className="text-sm font-semibold text-yellow-600 hover:underline shrink-0"
          >
            Calificar ahora
          </button>
        </div>
      )}

      {/* GRID DE KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-card rounded-[24px] p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <Icon size={24} />
                </div>
                {stat.label === 'Nuevos Pedidos' && parseInt(stat.value) > 0 && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive text-destructive-foreground"></span>
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-foreground mb-1 tracking-tight">{stat.value}</h3>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              </div>
              <div className={`mt-4 text-xs font-semibold flex items-center gap-1 ${stat.trendColor}`}>
                {stat.trend.includes('+') || stat.trend.includes('$') ? <TrendingUp size={14} /> : null}
                {stat.trend}
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
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertCircle className={pendingServices.length > 0 ? "text-destructive" : "text-muted-foreground"} size={20} />
                Solicitudes Pendientes
              </h2>
              {pendingServices.length > 0 && (
                <span className="text-sm font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-[16px]">
                  {pendingServices.length} {pendingServices.length === 1 ? 'Nueva' : 'Nuevas'}
                </span>
              )}
            </div>

            {pendingServices.length === 0 ? (
              <div className="bg-card rounded-[24px] border border-border/50 p-8 text-center text-muted-foreground shadow-sm">
                No tienes solicitudes pendientes. ¡Buen trabajo!
              </div>
            ) : (
              <div className="space-y-4">
                {pendingServices.map((req) => (
                  <div key={req.id} className="bg-card rounded-[24px] border-2 border-primary/20 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {req.client_avatar ? (
                        <img src={req.client_avatar} alt={req.client_name || ""} className="w-full h-full object-cover" />
                      ) : (
                        req.client_name?.charAt(0) || "?"
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-foreground">{req.client_name || "Cliente"}</h4>
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Clock size={12} /> {new Date(req.created_at).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mb-2 font-medium truncate max-w-[200px] sm:max-w-md">{req.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User size={14} /> {req.address || "Dirección no especificada"}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center sm:pl-4 sm:border-l border-border mt-4 sm:mt-0">
                      <button
                        onClick={() => navigate(`/prestador/servicios/${req.id}`)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full shadow-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all text-sm"
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
            <h2 className="text-lg font-bold text-foreground mb-4 px-1">Trabajos en Curso</h2>
            <div className="bg-card rounded-[24px] border border-border/50 overflow-hidden shadow-sm">
              <ul className="divide-y divide-border">
                {inProgressServices.length === 0 ? (
                  <li className="p-8 text-center text-muted-foreground">
                    No tienes trabajos activos en este momento.
                  </li>
                ) : (
                  inProgressServices.map((trabajo) => (
                    <li
                      key={trabajo.id}
                      onClick={() => navigate(`/prestador/servicios/${trabajo.id}`)}
                      className="p-5 hover:bg-accent/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground font-bold flex items-center justify-center border border-border overflow-hidden">
                          {trabajo.client_avatar ? (
                            <img src={trabajo.client_avatar} alt={trabajo.client_name || ""} className="w-full h-full object-cover" />
                          ) : (
                            trabajo.client_name?.charAt(0) || "?"
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{trabajo.client_name || "Cliente"}</h4>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">{trabajo.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto transition-transform group-hover:translate-x-1">
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <p className="text-sm font-bold text-foreground">
                            {trabajo.budget_amount ? `$${trabajo.budget_amount.toLocaleString()}` : 'A coordinar'}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide
                            ${trabajo.status === 'aceptado' ? 'bg-success/10 text-success border-success/20' : ''}
                            ${trabajo.status === 'presupuestado' ? 'bg-primary/10 text-primary border-primary/20' : ''}
                            ${trabajo.status === 'en_progreso' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}
                          `}>
                            {trabajo.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <ChevronRight size={18} />
                        </div>
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
              <h2 className="text-lg font-bold text-foreground mb-4 px-1 flex items-center gap-2">
                <Clock className="text-warning" size={20} />
                Esperando Confirmación del Cliente
              </h2>
              <div className="bg-card rounded-[24px] border border-warning/20 overflow-hidden shadow-sm">
                <ul className="divide-y divide-border">
                  {awaitingClientServices.map((trabajo) => (
                    <li
                      key={trabajo.id}
                      onClick={() => navigate(`/prestador/chat?service=${trabajo.id}`)}
                      className="p-5 hover:bg-accent/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-warning/10 text-warning font-bold flex items-center justify-center border border-warning/20 overflow-hidden">
                          {trabajo.client_avatar ? (
                            <img src={trabajo.client_avatar} alt={trabajo.client_name || ""} className="w-full h-full object-cover" />
                          ) : (
                            trabajo.client_name?.charAt(0) || "?"
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{trabajo.client_name || "Cliente"}</h4>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">{trabajo.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide bg-warning/10 text-warning border-warning/20">
                          Esperando cliente
                        </span>
                        <div className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center">
                          <MessageSquare size={14} />
                        </div>
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
              <h2 className="text-lg font-bold text-foreground">Resumen de Ganancias</h2>
              <button onClick={() => navigate("/prestador/finanzas")} className="text-muted-foreground hover:text-foreground">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="bg-card rounded-[24px] border border-border/50 shadow-sm p-6">
              {earnings?.hasPayments ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ganancia neta total</p>
                    <p className="text-3xl font-extrabold text-foreground">${earnings.total.toLocaleString()}</p>
                  </div>
                  <div className="border-t pt-4 flex justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Este mes</p>
                      <p className="text-lg font-bold text-success">${earnings.thisMonth.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Cobros</p>
                      <p className="text-lg font-bold">{earnings.count}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/prestador/finanzas")}
                    className="w-full text-sm text-primary font-semibold hover:underline text-center pt-2"
                  >
                    Ver detalle completo →
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-muted-foreground mb-3 mx-auto border border-border">
                    <DollarSign size={20} />
                  </div>
                  <h4 className="font-bold text-foreground text-sm mb-1">Sin ingresos aún</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                    Completá tu primer servicio para ver tus métricas financieras acá.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Tip */}
          <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:to-slate-900 rounded-[24px] p-6 text-primary-foreground shadow-lg relative overflow-hidden border border-slate-700/50">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary rounded-full opacity-20 blur-xl pointer-events-none"></div>
            <h3 className="font-bold mb-2 relative z-10 flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              Tip para ganar más
            </h3>
            <p className="text-slate-300 text-sm mb-5 relative z-10">
              {!profile?.bio
                ? "Agregá una descripción a tu perfil. Los prestadores con bio reciben más solicitudes."
                : "Mejorá tu perfil con fotos de tus trabajos. Los perfiles con portafolio reciben un 40% más de solicitudes."
              }
            </p>
            <Link to={!profile?.bio ? "/prestador/perfil" : "/prestador/portafolio"} className="block relative z-10">
              <button className="w-full bg-white text-slate-900 hover:bg-slate-50 font-semibold py-2.5 rounded-full transition-all hover:-translate-y-0.5 active:scale-[0.98] text-sm shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2">
                <ImageIcon size={16} />
                {!profile?.bio ? "Completar perfil" : "Ir a mi Portafolio"}
              </button>
            </Link>
          </section>

          {/* Quick Stats */}
          <section className="bg-card rounded-[24px] border border-border/50 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm">Resumen Rápido</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Verificación</span>
                <span className={`font-semibold ${profile?.provider_verified ? 'text-success' : 'text-warning'}`}>
                  {profile?.provider_verified ? '✓ Verificado' : '⏳ Pendiente'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Servicios activos</span>
                <span className="font-semibold">{activeServices.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Disponibilidad</span>
                <span className={`font-semibold ${available ? 'text-success' : 'text-muted-foreground'}`}>
                  {available ? 'Activo' : 'Oculto'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Completados</span>
                <span className="font-semibold">{completedCount}</span>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default ProviderDashboard;
