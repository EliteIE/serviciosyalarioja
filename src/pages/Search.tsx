import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Briefcase,
  Clock,
  Filter,
  ChevronDown,
  Wrench,
  Sparkles,
  Zap,
  TreePine,
  LayoutGrid,
  Heart
} from "lucide-react";
import { CATEGORIES } from "@/constants/categories";
import { useSearchProviders } from "@/hooks/useSearchProviders";
import { SearchSkeleton } from "@/components/skeletons/SearchSkeleton";
import { useFavorites } from "@/hooks/useFavorites";
import Seo from "@/components/Seo";

interface ProviderProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  provider_category: string | null;
  provider_verified: boolean;
  provider_available: boolean;
  rating_avg: number;
  review_count: number;
  completed_jobs: number;
  response_time: string | null;
  bio: string | null;
  location: string | null;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [categoriaActiva, setCategoriaActiva] = useState(searchParams.get("category") || "todas");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [sortBy, setSortBy] = useState<"rating" | "jobs" | "recommended">("rating");
  const { toggleFavorite, isFavorite } = useFavorites();

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableNow, setAvailableNow] = useState(false);

  // Sync URL params on mount and navigation
  useEffect(() => {
    const urlCategory = searchParams.get("category");
    if (urlCategory && urlCategory !== categoriaActiva) {
      setCategoriaActiva(urlCategory);
    }
  }, [searchParams, categoriaActiva]);

  // Configuração visual dinâmica para cada categoria (Adaptação do modelo original)
  const categoriasConfig: Record<string, unknown> = {
    todas: {
      titulo: 'Explorar Servicios',
      subtitulo: 'Encontrá al profesional ideal para tu necesidad en tu zona.',
      color: 'bg-muted',
      txtColor: 'text-secondary-foreground',
      icono: LayoutGrid,
      bgEfecto: 'from-secondary to-background'
    },
    plomeria: {
      titulo: 'Expertos en Plomería',
      subtitulo: 'Reparaciones, instalaciones y urgencias con agua y gas.',
      color: 'bg-muted',
      txtColor: 'text-secondary-foreground',
      icono: Wrench,
      bgEfecto: 'from-secondary to-[#0F3460]'
    },
    limpieza: {
      titulo: 'Profesionales de Limpieza',
      subtitulo: 'Limpieza profunda, post-obra y mantenimiento de espacios.',
      color: 'bg-muted',
      txtColor: 'text-secondary-foreground',
      icono: Sparkles,
      bgEfecto: 'from-[#082345] to-secondary'
    },
    electricidad: {
      titulo: 'Técnicos Electricistas',
      subtitulo: 'Instalaciones seguras, tableros y reparaciones eléctricas.',
      color: 'bg-muted',
      txtColor: 'text-secondary-foreground',
      icono: Zap,
      bgEfecto: 'from-secondary to-background'
    },
    jardineria: {
      titulo: 'Servicios de Jardinería',
      subtitulo: 'Mantenimiento de espacios verdes, poda y paisajismo.',
      color: 'bg-muted',
      txtColor: 'text-secondary-foreground',
      icono: TreePine,
      bgEfecto: 'from-[#082345] to-background'
    }
  };

  const { data: searchProviders = [], isLoading: loading } = useSearchProviders(categoriaActiva);

  useEffect(() => {
    setProviders(searchProviders);
  }, [searchProviders]);

  const prestadoresFiltrados = useMemo(() => {
    const locationFilter = searchParams.get("location")?.toLowerCase() || "";
    const filtered = providers.filter((p) => {
      if (searchQuery && !p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(p.provider_category || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(p.bio || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (locationFilter && !(p.location || "").toLowerCase().includes(locationFilter)) return false;
      if (ratingFilter > 0 && (p.rating_avg || 0) < ratingFilter) return false;
      if (verifiedOnly && !p.provider_verified) return false;
      if (availableNow && !p.provider_available) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating_avg || 0) - (a.rating_avg || 0);
        case "jobs":
          return (b.completed_jobs || 0) - (a.completed_jobs || 0);
        case "recommended": {
          const scoreA = (a.rating_avg || 0) * Math.log2((a.review_count || 0) + 1) + (a.completed_jobs || 0) * 0.1;
          const scoreB = (b.rating_avg || 0) * Math.log2((b.review_count || 0) + 1) + (b.completed_jobs || 0) * 0.1;
          return scoreB - scoreA;
        }
        default:
          return 0;
      }
    });
  }, [providers, searchQuery, sortBy, searchParams, ratingFilter, verifiedOnly, availableNow]);

  const getCategoryName = (slug: string | null) => CATEGORIES.find(c => c.slug === slug)?.name || slug || "";

  // Fallback seguro caso a categoriaSelecionada n exista nas config (e use a base "todas")
  const tema = categoriasConfig[categoriaActiva] || {
      titulo: `Expertos en ${getCategoryName(categoriaActiva)}`,
      subtitulo: 'Encuentra los mejores profesionales de esta categoría.',
      color: 'bg-primary',
      txtColor: 'text-primary-foreground',
      icono: Briefcase,
      bgEfecto: 'from-primary to-primary/80'
  };
  const IconoTema = tema.icono;

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Seo
        title="Buscar profesionales verificados en La Rioja"
        description="Compará plomeros, electricistas, limpieza, pintura y más profesionales verificados en La Rioja. Filtrá por categoría, zona y calificación. Presupuestos gratis."
        canonicalPath="/buscar"
      />

      {/* HEADER DINÂMICO (HERO SECTION) */}
      <div className={`relative pt-12 pb-20 px-6 lg:px-10 transition-colors duration-500 overflow-hidden ${tema.color}`}>
        {/* Efeitos de fundo dinâmicos */}
        <div className={`absolute inset-0 bg-gradient-to-br ${tema.bgEfecto} opacity-90`}></div>
        <div className="absolute right-0 top-0 -mt-20 -mr-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl pointer-events-none transition-all duration-700"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto flex items-center gap-6">
          {/* Ícone da Categoria Gigante */}
          <div className={`hidden md:flex w-24 h-24 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center ${tema.txtColor} shadow-xl transform transition-transform duration-500 hover:scale-105`}>
            <IconoTema size={48} strokeWidth={1.5} />
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`md:hidden ${tema.txtColor} opacity-80`}><IconoTema size={24} /></span>
              <p className={`${tema.txtColor} opacity-80 font-semibold text-sm uppercase tracking-wider`}>
                {categoriaActiva === 'todas' ? 'Directorio General' : `Categoría Específica`}
              </p>
            </div>
            <h1 className={`text-4xl md:text-5xl font-extrabold ${tema.txtColor} tracking-tight mb-2`}>
              {tema.titulo}
            </h1>
            <p className={`text-lg ${tema.txtColor} opacity-90 max-w-2xl`}>
              {tema.subtitulo}
            </p>
          </div>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-card rounded-[24px] shadow-sm border border-border/50 p-2 md:p-4 flex flex-col md:flex-row gap-3">
          
          {/* Input de Pesquisa */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o servicio..." 
              className="w-full bg-muted/50 border border-transparent rounded-[16px] pl-12 pr-4 py-3.5 text-foreground focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          <div className="w-full md:w-px h-px md:h-12 bg-border my-auto"></div>

          {/* Dropdown de Categoria */}
          <div className="md:w-64 relative">
            <select 
              value={categoriaActiva}
              onChange={(e) => setCategoriaActiva(e.target.value)}
              className="w-full appearance-none bg-transparent border-none rounded-[16px] pl-4 pr-10 py-3.5 text-foreground font-semibold cursor-pointer focus:ring-2 focus:ring-primary/20"
            >
              <option value="todas">Todas las categorías</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={20} />
          </div>

          {/* Botão Extra Filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`hidden md:flex items-center gap-2 px-6 py-3.5 font-semibold rounded-[16px] transition-colors ${
              showFilters || ratingFilter > 0 || verifiedOnly || availableNow
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted text-secondary-foreground'
            }`}
          >
            <Filter size={20} />
            Filtros
            {(ratingFilter > 0 || verifiedOnly || availableNow) && (
              <span className="ml-1 w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center font-bold">
                {(ratingFilter > 0 ? 1 : 0) + (verifiedOnly ? 1 : 0) + (availableNow ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 bg-card rounded-[24px] shadow-sm border border-border/50 p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-wrap items-center gap-6">
              {/* Rating Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">Calificación mínima</span>
                <div className="flex gap-2">
                  {[
                    { label: "Todos", value: 0 },
                    { label: "4+", value: 4 },
                    { label: "4.5+", value: 4.5 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRatingFilter(opt.value)}
                      className={`px-4 py-2 rounded-[16px] text-sm font-semibold transition-colors ${
                        ratingFilter === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {opt.value > 0 && <Star size={14} className="inline mr-1 -mt-0.5" fill="currentColor" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified Toggle */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">Solo verificados</span>
                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`px-4 py-2 rounded-[16px] text-sm font-semibold transition-colors flex items-center gap-2 ${
                    verifiedOnly
                      ? 'bg-blue-500 text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <ShieldCheck size={16} />
                  {verifiedOnly ? 'Activado' : 'Desactivado'}
                </button>
              </div>

              {/* Available Now Toggle */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">Disponible ahora</span>
                <button
                  onClick={() => setAvailableNow(!availableNow)}
                  className={`px-4 py-2 rounded-[16px] text-sm font-semibold transition-colors flex items-center gap-2 ${
                    availableNow
                      ? 'bg-green-500 text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Clock size={16} />
                  {availableNow ? 'Activado' : 'Desactivado'}
                </button>
              </div>

              {/* Clear Filters */}
              {(ratingFilter > 0 || verifiedOnly || availableNow) && (
                <button
                  onClick={() => { setRatingFilter(0); setVerifiedOnly(false); setAvailableNow(false); }}
                  className="ml-auto px-4 py-2 rounded-[16px] text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ÁREA DE RESULTADOS */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Contador de Resultados */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-muted-foreground font-medium">
            <strong className="text-foreground">{prestadoresFiltrados.length}</strong> profesionales encontrados
          </p>
          
          {/* Ordenação Simples */}
          <div className="flex items-center gap-2 text-sm bg-card px-3 py-1.5 rounded-[16px] border border-border">
            <span className="text-muted-foreground">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rating" | "jobs" | "recommended")}
              className="bg-transparent font-semibold text-foreground cursor-pointer outline-none"
            >
              <option value="rating">Mejor calificación</option>
              <option value="recommended">Recomendados</option>
              <option value="jobs">Más trabajos</option>
            </select>
          </div>
        </div>

        {loading ? (
          <SearchSkeleton />
        ) : prestadoresFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No encontramos profesionales</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Actualmente no hay prestadores disponibles que coincidan con tu búsqueda. Probá buscando otra cosa o ampliá tus filtros.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prestadoresFiltrados.map((prestador) => (
              <Link to={`/p/${prestador.id}`} key={prestador.id} className="group">
                <div className="bg-card rounded-[24px] border border-border/50 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full flex flex-col hover:-translate-y-1">
                  
                  {/* Header do Cartão (Avatar e Nome) */}
                  <div className="p-6 border-b border-border relative">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-2xl overflow-hidden">
                          {prestador.avatar_url ? (
                            <img src={prestador.avatar_url} alt={`Foto de ${prestador.full_name}`} width={96} height={96} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          ) : (
                            prestador.full_name?.[0] || "?"
                          )}
                        </div>
                        {prestador.provider_available && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-success border-2 border-card rounded-full" title="En línea ahora"></div>
                        )}
                      </div>

                      {/* Info Principal */}
                      <div className="flex-1 pt-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-bold text-lg text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                            {prestador.full_name}
                          </h3>
                          {prestador.provider_verified && (
                            <ShieldCheck size={18} className="text-blue-500 shrink-0" title="Identidad Verificada" />
                          )}
                        </div>
                        <span className="inline-block px-2.5 py-0.5 rounded-[16px] bg-muted text-secondary-foreground text-xs font-bold uppercase tracking-wider mb-2 truncate max-w-full">
                          {getCategoryName(prestador.provider_category)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(prestador.id); }}
                      className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
                      title={isFavorite(prestador.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                    >
                      <Heart size={18} className={isFavorite(prestador.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                    </button>
                  </div>

                  {/* Corpo do Cartão */}
                  <div className="p-6 bg-muted/20 flex-1 flex flex-col gap-4">

                    {/* Social Proof Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {prestador.rating_avg >= 4.5 && prestador.completed_jobs >= 5 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[16px] bg-yellow-500/10 text-yellow-600 text-[10px] font-bold">
                          🏆 Top Prestador
                        </span>
                      )}
                      {prestador.completed_jobs >= 10 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[16px] bg-primary/10 text-primary text-[10px] font-bold">
                          🔥 Alta demanda
                        </span>
                      )}
                      {prestador.review_count >= 5 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[16px] bg-blue-500/10 text-blue-600 text-[10px] font-bold">
                          💬 Muy recomendado
                        </span>
                      )}
                    </div>

                    {prestador.bio && <p className="text-sm text-muted-foreground line-clamp-2">{prestador.bio}</p>}

                    <div className="flex justify-between items-center mt-auto">
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500" fill="currentColor" />
                        <span className="font-bold text-foreground">{Number(prestador.rating_avg).toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({prestador.review_count})</span>
                      </div>
                      
                      {/* Trabalhos */}
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                        <Briefcase size={16} className="text-muted-foreground" />
                        {prestador.completed_jobs} trab.
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      {/* Localização */}
                      {prestador.location && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm truncate max-w-[120px]">
                          <MapPin size={16} className="text-muted-foreground shrink-0" />
                          <span className="truncate">{prestador.location}</span>
                        </div>
                      )}
                      
                      {/* Response Time */}
                      {prestador.response_time && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                          <Clock size={16} className="text-muted-foreground shrink-0" />
                          {prestador.response_time}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé do Cartão */}
                  <div className="p-4 bg-card border-t border-border/50 mt-auto">
                    <button className="w-full py-3 bg-background border border-primary/50 text-primary font-semibold rounded-full group-hover:bg-primary group-hover:text-primary-foreground group-active:scale-[0.98] transition-all duration-300 shadow-sm">
                      Ver Perfil
                    </button>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
