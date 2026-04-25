import { useParams, Link } from "react-router-dom";
import {
  Star, MapPin, Clock, ShieldCheck, MessageSquare, Share2,
  CheckCircle2, ThumbsUp, Award, ArrowLeft, Briefcase,
  Calendar, DollarSign, Globe, Camera
} from "lucide-react";
import { useProviderProfile, useProviderPortfolio } from "@/hooks/useProfiles";
import { useReviews } from "@/hooks/useReviews";
import { CATEGORIES } from "@/constants/categories";
import { useProviderSchedulePublic, useProviderServicesPublic, DAY_NAMES_SHORT } from "@/hooks/useProviderSchedule";
import { toast } from "sonner";
import Seo from "@/components/Seo";
import { ProviderProfileSkeleton } from "@/components/skeletons/ProviderProfileSkeleton";

const getCategoryTheme = (slug: string | null) => {
  const cat = (slug || "").toLowerCase();
  if (cat.includes('plomeria')) return { bg: 'bg-secondary', txt: 'text-secondary-foreground', from: 'from-secondary', to: 'to-[#0F3460]' };
  if (cat.includes('limpieza')) return { bg: 'bg-secondary', txt: 'text-secondary-foreground', from: 'from-[#082345]', to: 'to-secondary' };
  if (cat.includes('electricidad')) return { bg: 'bg-secondary', txt: 'text-secondary-foreground', from: 'from-secondary', to: 'to-background' };
  if (cat.includes('jardineria')) return { bg: 'bg-secondary', txt: 'text-secondary-foreground', from: 'from-[#082345]', to: 'to-background' };
  return { bg: 'bg-secondary', txt: 'text-secondary-foreground', from: 'from-secondary', to: 'to-background' };
};

export default function ProviderProfilePage() {
  const { id } = useParams();

  const { data: provider, isLoading } = useProviderProfile(id);
  const { data: reviews } = useReviews(id || null);
  const { data: schedule } = useProviderSchedulePublic(id || null);
  const { data: services } = useProviderServicesPublic(id || null);
  const { data: portfolioItems } = useProviderPortfolio(id);

  if (isLoading) {
    return <ProviderProfileSkeleton />;
  }

  // Treat unverified/soft-deleted providers as not-found: RLS should already
  // hide them for anon/authenticated users, but this guards rendering when
  // the row is accessible via a privileged session or stale cache.
  const providerRecord = provider as (typeof provider & {
    provider_verified?: boolean;
    deleted_at?: string | null;
  }) | null;
  if (!providerRecord || !providerRecord.provider_verified || providerRecord.deleted_at) {
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
  const coverageArea: string[] = (provider as { provider_coverage_area?: string[] }).provider_coverage_area || [];
  const priceRange: string | null = (provider as { provider_price_range?: string | null }).provider_price_range || null;

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews?.filter(r => r.rating === stars).length || 0;
    const percentage = totalAvaliacoes > 0 ? Math.round((count / totalAvaliacoes) * 100) : 0;
    return { stars, percentage, count };
  });

  // Check if provider is currently within their schedule hours
  // Note: assumes DB times (start_time, end_time) are stored in the same local timezone as the client
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todaySlot = schedule?.find(s => s.day_of_week === currentDay && s.is_active);
  const isCurrentlyAvailable = provider.provider_available && todaySlot &&
    currentTime >= todaySlot.start_time.slice(0, 5) && currentTime <= todaySlot.end_time.slice(0, 5);

  const ratingAvg = typeof (provider as { rating_avg?: number | null }).rating_avg === "number"
    ? (provider as { rating_avg: number }).rating_avg
    : null;

  const seoDescription = `${provider.full_name || "Profesional"} — ${categoryName} verificado en ${coverageArea[0] || "La Rioja"}. ${totalAvaliacoes} reseñas${ratingAvg ? `, calificación ${ratingAvg.toFixed(1)}/5` : ""}. Pedí presupuesto gratis en Servicios 360.`;

  const localBusinessLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: provider.full_name,
    description: (provider as { bio?: string | null }).bio || seoDescription,
    url: `https://www.servicios360.com.ar/p/${id}`,
    image: provider.avatar_url || "https://www.servicios360.com.ar/og-image.png",
    areaServed: coverageArea.length > 0 ? coverageArea : ["La Rioja"],
    priceRange: priceRange || "$$",
  };
  if (ratingAvg && totalAvaliacoes > 0) {
    localBusinessLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingAvg.toFixed(1),
      reviewCount: totalAvaliacoes,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      <Seo
        title={`${provider.full_name || "Profesional"} — ${categoryName} en ${coverageArea[0] || "La Rioja"}`}
        description={seoDescription}
        canonicalPath={`/p/${id}`}
        image={provider.avatar_url || undefined}
        ogType="profile"
        jsonLd={localBusinessLd}
      />

      {/* HERO */}
      <div className="bg-card border-b border-border">
        <div className={`h-48 md:h-64 w-full bg-gradient-to-r ${theme.from} ${theme.to} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]"></div>
          <Link to="/buscar" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-primary-foreground/80 hover:text-primary-foreground transition-colors bg-primary/20 px-3 py-1.5 rounded-full backdrop-blur-md">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6 -mt-16 sm:-mt-20 relative z-10 mb-4 sm:mb-0">
              <div className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-card bg-background flex items-center justify-center ${theme.txt} shadow-lg flex-shrink-0 overflow-hidden`}>
                {provider.avatar_url ? (
                  <img src={provider.avatar_url} alt={`Foto de ${provider.full_name || "el profesional"}`} width={160} height={160} decoding="async" className="w-full h-full object-cover" />
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
                  <span className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded-[16px] uppercase tracking-wider text-xs">{categoryName}</span>
                  {provider.provider_verified && (
                    <span className="flex items-center gap-1 text-primary-foreground bg-primary/20 font-semibold px-2 py-1 rounded-[16px] text-xs border border-primary/30">
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
              <div className="w-12 h-12 rounded-[16px] bg-orange-100 flex items-center justify-center text-orange-600"><Star size={24} fill="currentColor" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{Number(provider.rating_avg).toFixed(1)}</p>
                <p className="text-sm text-muted-foreground font-medium">{totalAvaliacoes} valoraciones</p>
              </div>
            </div>
            <div className="w-px h-10 bg-border my-auto hidden sm:block"></div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-12 h-12 rounded-[16px] bg-blue-100 flex items-center justify-center text-blue-600"><CheckCircle2 size={24} /></div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{provider.completed_jobs}</p>
                <p className="text-sm text-muted-foreground font-medium">Trabajos completados</p>
              </div>
            </div>
            {Number(provider.rating_avg) >= 4.5 && provider.completed_jobs >= 5 && (
              <>
                <div className="w-px h-10 bg-border my-auto hidden sm:block"></div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-12 h-12 rounded-[16px] bg-green-100 flex items-center justify-center text-green-600"><Award size={24} /></div>
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
            <section className="bg-card rounded-[24px] border border-border/50 p-6 md:p-8 shadow-none">
              <h2 className="text-xl font-bold text-foreground mb-4">Sobre mí</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-6">
                {provider.bio && provider.bio.toLowerCase() !== "teste teste" ? provider.bio : "Este profesional aún no ha agregado una descripción detallada sobre sus servicios."}
              </p>

              {coverageArea.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-muted-foreground" /> Zonas de Cobertura
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {coverageArea.map((area, i) => (
                      <span key={i} className="px-3 py-1.5 bg-secondary border border-border text-secondary-foreground font-medium text-sm rounded-[16px]">{area}</span>
                    ))}
                  </div>
                </div>
              )}

              {priceRange && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-[16px]">
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
              <section className="bg-card rounded-[24px] border border-border/50 p-6 md:p-8 shadow-none">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" /> Servicios que realiza
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((svc) => (
                    <div key={svc.id} className="p-4 rounded-[16px] border bg-muted/20 hover:bg-muted/40 transition-colors">
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

            {/* Portfolio */}
            {portfolioItems && portfolioItems.length > 0 && (
              <section className="bg-card rounded-[24px] border border-border/50 p-6 md:p-8 shadow-none">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Camera className="h-5 w-5" /> Portafolio de Trabajos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-border bg-muted/20 overflow-hidden">
                      <div className="grid grid-cols-2 h-40">
                        <div className="relative overflow-hidden">
                          <img src={item.before_url} alt="Foto del trabajo antes de realizarse" width={400} height={400} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          <span className="absolute bottom-2 left-2 bg-primary/60 backdrop-blur-md text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Antes
                          </span>
                        </div>
                        <div className="relative overflow-hidden">
                          <img src={item.after_url} alt="Foto del trabajo terminado" width={400} height={400} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          <span className="absolute bottom-2 left-2 bg-green-500/80 backdrop-blur-md text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Después
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        <p className="font-semibold text-sm text-foreground">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Schedule */}
            {schedule && schedule.length > 0 && (
              <section className="bg-card rounded-[24px] border border-border/50 p-6 md:p-8 shadow-none">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Horarios de Atención
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    const slot = schedule.find(s => s.day_of_week === day);
                    const isToday = day === currentDay;
                    return (
                      <div key={day} className={`text-center p-3 rounded-[16px] border transition-colors ${slot ? isToday ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20" : "bg-card border-border" : "bg-muted/30 border-transparent"}`}>
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
              <section className="bg-card rounded-[24px] border border-border/50 p-6 md:p-8 shadow-none">
                <h2 className="text-xl font-bold text-foreground mb-6">Reseñas de clientes</h2>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border last:border-0 pb-6 last:pb-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-sm overflow-hidden">
                            {review.reviewer_avatar ? (
                              <img src={review.reviewer_avatar} alt={`Foto de ${review.reviewer_name || "usuario"}`} width={48} height={48} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            ) : (review.reviewer_name?.[0] || "?")}
                          </div>
                          <div>
                            <p className="font-bold text-foreground leading-none mb-1">{review.reviewer_name || "Usuario verificado"}</p>
                            <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted/50'}`} />
                          ))}
                        </div>
                      </div>
                      <p className={`text-sm leading-relaxed ${review.comment ? "text-muted-foreground" : "text-muted-foreground/50 italic"}`}>
                        {review.comment || "El usuario no dejó ningún comentario escrito."}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-8 space-y-6">
            <div className="bg-card rounded-[24px] border border-border/50 p-6 shadow-sm">
              <Link to={`/solicitar/${provider.id}`}>
                <button className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5 active:scale-[0.98] transition-all text-lg mb-4 flex items-center justify-center gap-2">
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

            <div className="bg-card rounded-[24px] border border-border/50 p-6 shadow-none">
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
