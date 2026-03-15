import { useParams, Link } from "react-router-dom";
import {
  Star, MapPin, Clock, ShieldCheck, MessageSquare, Share2,
  CheckCircle2, ThumbsUp, Award, ArrowLeft, Loader2, Briefcase,
  Calendar, DollarSign, Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useReviews } from "@/hooks/useReviews";
import { CATEGORIES } from "@/constants/categories";
import { useProviderSchedulePublic, useProviderServicesPublic, DAY_NAMES_SHORT } from "@/hooks/useProviderSchedule";
import { toast } from "sonner";

const getCategoryTheme = (slug: string | null) => {
  const cat = (slug || "").toLowerCase();
  if (cat.includes('plomeria')) return { bg: 'bg-blue-600', txt: 'text-blue-500', from: 'from-blue-500', to: 'to-blue-700' };
  if (cat.includes('limpieza')) return { bg: 'bg-teal-500', txt: 'text-teal-500', from: 'from-teal-400', to: 'to-teal-600' };
  if (cat.includes('electricidad')) return { bg: 'bg-amber-500', txt: 'text-amber-500', from: 'from-amber-400', to: 'to-amber-600' };
  if (cat.includes('jardineria')) return { bg: 'bg-emerald-600', txt: 'text-emerald-500', from: 'from-emerald-500', to: 'to-emerald-700' };
  return { bg: 'bg-primary', txt: 'text-primary', from: 'from-primary/80', to: 'to-primary' };
};

export default function ProviderProfilePage() {
  const { id } = useParams();

  const { data: provider, isLoading } = useQuery({
    queryKey: ["provider-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: reviews } = useReviews(id || null);
  const { data: schedule } = useProviderSchedulePublic(id || null);
  const { data: services } = useProviderServicesPublic(id || null);

  if (isLoading) {
    return <div className="min-h-screen flex justify-center items-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground gap-4">
        <h2 className="text-2xl font-bold text-foreground">Profesional no encontrado</h2>
        <Link to="/buscar" className="flex items-center gap-2 text-primary hover:underline"><ArrowLeft size={16} /> Volver a explorar</Link>
      </div>
    );
  }

  const categoryName = CATEGORIES.find(c => c.slug === provider.provider_category)?.name || provider.provider_category || "Servicio General";
  const theme = getCategoryTheme(provider.provider_category);
  const totalAvaliacoes = reviews?.length || 0;
  const coverageArea: string[] = (provider as any).provider_coverage_area || [];
  const priceRange: string | null = (provider as any).provider_price_range || null;

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews?.filter(r => r.rating === stars).length || 0;
    const percentage = totalAvaliacoes > 0 ? Math.round((count / totalAvaliacoes) * 100) : 0;
    return { stars, percentage, count };
  });

  // Check if provider is currently within their schedule hours
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todaySlot = schedule?.find(s => s.day_of_week === currentDay && s.is_active);
  const isCurrentlyAvailable = provider.provider_available && todaySlot &&
    currentTime >= todaySlot.start_time.slice(0, 5) && currentTime <= todaySlot.end_time.slice(0, 5);

  return (
    <div className="min-h-screen bg-background font-sans pb-20">

      {/* HERO */}
      <div className="bg-card border-b border-border">
        <div className={`h-48 md:h-64 w-full bg-gradient-to-r ${theme.from} ${theme.to} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]"></div>
          <Link to="/buscar" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6 -mt-16 sm:-mt-20 relative z-10 mb-4 sm:mb-0">
              <div className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-card bg-background flex items-center justify-center ${theme.txt} shadow-lg flex-shrink-0 overflow-hidden`}>
                {provider.avatar_url ? (
                  <img src={provider.avatar_url} alt={provider.full_name || ""} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-extrabold">{provider.full_name?.charAt(0) || "?"}</span>
                )}
                {isCurrentlyAvailable && (
                  <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-6 h-6 bg-success border-4 border-card rounded-full" title="Disponible ahora"></div>
                )}
              </div>

              <div className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{provider.full_name}</h1>
                  {provider.provider_verified && <ShieldCheck size={24} className="text-blue-500 shrink-0" />}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded-lg uppercase tracking-wider text-xs">{categoryName}</span>
                  {provider.provider_verified && (
                    <span className="flex items-center gap-1 text-primary-foreground bg-primary/20 font-semibold px-2 py-1 rounded-lg text-xs border border-primary/30">
                      <ShieldCheck size={14} /> Garantizado
                    </span>
                  )}
                  {provider.location && (
                    <div className="flex items-center gap-1 text-muted-foreground font-medium">
                      <MapPin size={16} /> {provider.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden sm:flex gap-3 pb-2">
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Enlace copiado"); }}
                className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors bg-card border border-border shadow-sm" title="Compartir">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex overflow-x-auto gap-8 border-t border-border py-6 no-scrollbar">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600"><Star size={24} fill="currentColor" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{Number(provider.rating_avg).toFixed(1)}</p>
                <p className="text-sm text-muted-foreground font-medium">{totalAvaliacoes} valoraciones</p>
              </div>
            </div>
            <div className="w-px h-10 bg-border my-auto hidden sm:block"></div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><CheckCircle2 size={24} /></div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{provider.completed_jobs}</p>
                <p className="text-sm text-muted-foreground font-medium">Trabajos completados</p>
              </div>
            </div>
            {Number(provider.rating_avg) >= 4.5 && provider.completed_jobs >= 5 && (
              <>
                <div className="w-px h-10 bg-border my-auto hidden sm:block"></div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><Award size={24} /></div>
                  <div><p className="text-xl font-bold text-foreground leading-tight">Top<br/>Prestador</p></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* LEFT */}
          <div className="w-full lg:w-2/3 space-y-8">

            {/* About */}
            <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-4">Sobre mí</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-6">
                {provider.bio || "Este profesional aún no ha agregado una descripción sobre sus servicios."}
              </p>

              {coverageArea.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-muted-foreground" /> Zonas de Cobertura
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {coverageArea.map((area, i) => (
                      <span key={i} className="px-3 py-1.5 bg-secondary border border-border text-secondary-foreground font-medium text-sm rounded-lg">{area}</span>
                    ))}
                  </div>
                </div>
              )}

              {priceRange && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                  <DollarSign className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Rango de precios</p>
                    <p className="text-sm font-semibold text-foreground">{priceRange}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Services */}
            {services && services.length > 0 && (
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" /> Servicios que realiza
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((svc) => (
                    <div key={svc.id} className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <p className="font-semibold text-foreground mb-1">{svc.name}</p>
                      {svc.description && <p className="text-sm text-muted-foreground mb-2">{svc.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {svc.estimated_duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {svc.estimated_duration}</span>}
                        {(svc.price_from || svc.price_to) && (
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <DollarSign className="h-3 w-3" />
                            {svc.price_from && svc.price_to
                              ? `$${svc.price_from.toLocaleString()} - $${svc.price_to.toLocaleString()}`
                              : svc.price_from ? `Desde $${svc.price_from.toLocaleString()}` : `Hasta $${svc.price_to!.toLocaleString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Schedule */}
            {schedule && schedule.length > 0 && (
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Horarios de Atención
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    const slot = schedule.find(s => s.day_of_week === day);
                    const isToday = day === currentDay;
                    return (
                      <div key={day} className={`text-center p-3 rounded-xl border transition-colors ${slot ? isToday ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20" : "bg-card border-border" : "bg-muted/30 border-transparent"}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isToday ? "text-primary" : slot ? "text-foreground" : "text-muted-foreground"}`}>
                          {DAY_NAMES_SHORT[day]}
                        </p>
                        {slot ? (
                          <p className="text-sm font-semibold text-foreground">
                            {slot.start_time.slice(0, 5)}<br/>
                            <span className="text-muted-foreground font-normal">a</span><br/>
                            {slot.end_time.slice(0, 5)}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mt-1">Cerrado</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isCurrentlyAvailable && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-success font-semibold">
                    <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" /> Disponible ahora mismo
                  </div>
                )}
              </section>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6">Reseñas de clientes</h2>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border last:border-0 pb-6 last:pb-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-sm overflow-hidden">
                            {review.reviewer_avatar ? (
                              <img src={review.reviewer_avatar} alt={review.reviewer_name || ""} className="w-full h-full object-cover" />
                            ) : (review.reviewer_name?.[0] || "?")}
                          </div>
                          <div>
                            <p className="font-bold text-foreground leading-none mb-1">{review.reviewer_name}</p>
                            <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted/50'}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-8 space-y-6">
            <div className="bg-card rounded-2xl border-2 border-primary/20 p-6 shadow-xl shadow-primary/5">
              <Link to={`/solicitar/${provider.id}`}>
                <button className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5 transition-all text-lg mb-4 flex items-center justify-center gap-2">
                  <MessageSquare size={20} /> Pedir Presupuesto
                </button>
              </Link>
              <p className="text-center text-sm text-foreground mb-6">
                Respuesta habitual: <strong>{provider.response_time || "1-2 horas"}</strong>
              </p>
              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Clock size={20} /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Disponibilidad</p>
                    <p className="text-sm font-semibold text-foreground">
                      {isCurrentlyAvailable ? "Disponible ahora" : provider.provider_available ? "Disponible (fuera de horario)" : "Consultar disponibilidad"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><ThumbsUp size={20} /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Reseñas</p>
                    <p className="text-sm font-semibold text-foreground">{totalAvaliacoes} opiniones verificadas</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-6">Resumen de Calificaciones</h3>
              <div className="space-y-3">
                {ratingCounts.map((item) => (
                  <div key={item.stars} className="flex items-center gap-3">
                    <div className="flex items-center justify-end gap-1 w-8 text-sm font-semibold text-muted-foreground">
                      {item.stars} <Star size={12} fill="currentColor" className="text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <div className="w-8 text-right text-xs text-muted-foreground">{item.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
