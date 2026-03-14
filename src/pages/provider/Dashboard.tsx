import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  TrendingUp, 
  DollarSign, 
  Star, 
  Clock, 
  Briefcase, 
  AlertCircle,
  CheckCircle2,
  Lock,
  MessageSquare,
  ChevronRight,
  User,
  Image as ImageIcon
} from "lucide-react";
import { useProviderRequests } from "@/hooks/useServiceRequests";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

const ProviderDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { data: services, isLoading } = useProviderRequests();
  const [available, setAvailable] = useState(profile?.provider_available ?? true);

  const firstName = profile?.full_name?.split(" ")[0] || "Prestador";
  const activeServices = services?.filter((s) => s.status !== "completado" && s.status !== "cancelado") || [];
  const completedCount = services?.filter((s) => s.status === "completado").length || 0;
  const pendingServices = services?.filter((s) => s.status === "nuevo") || [];
  const inProgressServices = services?.filter((s) => s.status === "presupuestado" || s.status === "aceptado" || s.status === "en_progreso") || [];

  const toggleAvailability = async () => {
    const newVal = !available;
    setAvailable(newVal);
    const { error } = await supabase
      .from("profiles")
      .update({ provider_available: newVal } as any)
      .eq("id", user!.id);
    if (error) {
      toast.error("Error al actualizar disponibilidad");
      setAvailable(!newVal); // revert on error
    } else {
      toast.success(newVal ? "¡Estás disponible para nuevos trabajos!" : "Modo Oculto activado");
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // KPIs
  const stats = [
    { label: 'Servicios Completos', value: completedCount.toString(), trend: 'Este mes', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', trendColor: 'text-success' },
    { label: 'Ingresos Totales', value: 'Bloqueado', trend: 'Requiere cobros in-app', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', trendColor: 'text-muted-foreground' },
    { label: 'Rating', value: Number(profile?.rating_avg || 0).toFixed(1), trend: `${profile?.completed_jobs || 0} reseñas`, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10', trendColor: 'text-muted-foreground' },
    { label: 'Nuevos Pedidos', value: pendingServices.length.toString(), trend: pendingServices.length > 0 ? '¡Requiere acción!' : 'Al día', icon: pendingServices.length > 0 ? AlertCircle : Clock, color: pendingServices.length > 0 ? 'text-destructive' : 'text-primary', bg: pendingServices.length > 0 ? 'bg-destructive/10' : 'bg-primary/10', trendColor: pendingServices.length > 0 ? 'text-destructive' : 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header (TopBar is handled by DashboardLayout, we just add our extra title/toggle) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">¡Hola, {firstName}! 👋</h1>
          <p className="text-muted-foreground">Tu panel de control de prestador</p>
        </div>
        
        {/* Toggle Switch de Disponibilidad */}
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

      {/* GRID DE KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
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
                <h3 className={`text-3xl font-extrabold text-foreground mb-1 tracking-tight ${stat.value === 'Bloqueado' ? 'text-xl text-muted-foreground' : ''}`}>{stat.value}</h3>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              </div>
              <div className={`mt-4 text-xs font-semibold flex items-center gap-1 ${stat.trendColor}`}>
                {stat.trend.includes('+') ? <TrendingUp size={14} /> : null}
                {stat.trend}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA (Acionável: Pendentes e Ativos) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Solicitações Pendentes (Urgente) */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertCircle className={pendingServices.length > 0 ? "text-destructive" : "text-muted-foreground"} size={20} />
                Solicitudes Pendientes
              </h2>
              {pendingServices.length > 0 && (
                <span className="text-sm font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                  {pendingServices.length} {pendingServices.length === 1 ? 'Nueva' : 'Nuevas'}
                </span>
              )}
            </div>
            
            {pendingServices.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground shadow-sm">
                No tienes solicitudes pendientes. ¡Buen trabajo!
              </div>
            ) : (
              <div className="space-y-4">
                {pendingServices.map((req) => (
                  <div key={req.id} className="bg-card rounded-2xl border-2 border-primary/20 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center flex-shrink-0">
                      {req.client_name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-foreground">{req.client_name || "Cliente"}</h4>
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Clock size={12} /> {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mb-2 font-medium truncate max-w-[200px] sm:max-w-md">{req.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User size={14} /> {req.address || "Dirección no especificada"} • Sin presupuesto enviado
                      </p>
                    </div>
                    <div className="flex flex-col justify-center sm:pl-4 sm:border-l border-border mt-4 sm:mt-0">
                      <button 
                        onClick={() => navigate(`/prestador/servicios/${req.id}`)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-sm transition-colors text-sm"
                      >
                        Revisar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Trabalhos Ativos */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4 px-1">Trabajos en Curso</h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
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
                        <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground font-bold flex items-center justify-center border border-border">
                          {trabajo.client_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{trabajo.client_name || "Cliente"}</h4>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">{trabajo.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto transition-transform group-hover:translate-x-1">
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <p className="text-sm font-bold text-foreground">
                            {trabajo.budget ? `$${trabajo.budget.toLocaleString()}` : 'A coordinar'}
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
        </div>

        {/* COLUNA DIREITA (Ganhos e Analytics) */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* Ganancias Semanales (Estado Vazio Desenhado) */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-bold text-foreground">Ganancias Semanales</h2>
              <button className="text-muted-foreground hover:text-foreground"><ChevronRight size={20} /></button>
            </div>
            
            <div className="bg-card rounded-2xl border border-border shadow-sm relative overflow-hidden group">
              
              {/* Fundo Desfocado Simulado (Mock Chart) */}
              <div className="h-48 p-6 flex items-end justify-between gap-2 opacity-30 filter blur-[3px] pointer-events-none">
                <div className="w-full bg-muted rounded-t-sm h-1/4"></div>
                <div className="w-full bg-muted rounded-t-sm h-2/4"></div>
                <div className="w-full bg-muted-foreground/30 rounded-t-sm h-1/4"></div>
                <div className="w-full bg-success rounded-t-sm h-3/4"></div>
                <div className="w-full bg-muted rounded-t-sm h-2/4"></div>
                <div className="w-full bg-muted rounded-t-sm h-1/4"></div>
              </div>

              {/* Overlay de Bloqueio (Empty State Motivacional) */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center transition-colors group-hover:bg-background/90">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-muted-foreground mb-3 shadow-sm border border-border">
                  <Lock size={20} />
                </div>
                <h4 className="font-bold text-foreground text-sm mb-1">Sección Bloqueada</h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                  Completá tu primer servicio y cobrá por la app para ver tus métricas financieras acá.
                </p>
              </div>
            </div>
          </section>

          {/* Dica del Sistema / Upsell */}
          <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-slate-700/50">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary rounded-full opacity-20 blur-xl pointer-events-none"></div>
            <h3 className="font-bold mb-2 relative z-10 flex items-center gap-2">
              <Star size={18} className="text-yellow-400" fill="currentColor" />
              Conseguí más clientes
            </h3>
            <p className="text-slate-300 text-sm mb-5 relative z-10">
              Mejorá tu perfil agregando fotos de tus trabajos anteriores. Los perfiles con portafolio reciben un <span className="text-primary font-bold">40% más de solicitudes</span>.
            </p>
            <Link to="/prestador/portafolio" className="block relative z-10">
              <button className="w-full bg-white text-slate-900 hover:bg-slate-50 font-bold py-2.5 rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center gap-2">
                <ImageIcon size={16} />
                Ir a mi Portafolio
              </button>
            </Link>
          </section>

        </div>

      </div>
    </div>
  );
};

export default ProviderDashboard;
