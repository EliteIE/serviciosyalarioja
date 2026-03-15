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
import { supabase } from "@/integrations/supabase/client";
import { SearchSkeleton } from "@/components/skeletons/SearchSkeleton";
import { useFavorites } from "@/hooks/useFavorites";

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
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"rating" | "jobs" | "recommended">("rating");
  const { toggleFavorite, isFavorite } = useFavorites();

  // Sync URL params on mount and navigation
  useEffect(() => {
    const urlCategory = searchParams.get("category");
    if (urlCategory && urlCategory !== categoriaActiva) {
      setCategoriaActiva(urlCategory);
    }
  }, [searchParams]);

  // Configuração visual dinâmica para cada categoria (Adaptação do modelo original)
  const categoriasConfig: Record<string, any> = {
    todas: {
      titulo: 'Explorar Servicios',
      subtitulo: 'Encontrá al profesional ideal para tu necesidad en tu zona.',
      color: 'bg-secondary',
      txtColor: 'text-secondary-foreground',
      icono: LayoutGrid,
      bgEfecto: 'from-secondary to-background'
    },
    plomeria: {
      titulo: 'Expertos en Plomería',
      subtitulo: 'Reparaciones, instalaciones y urgencias con agua y gas.',
      color: 'bg-blue-600',
      txtColor: 'text-white',
      icono: Wrench,
      bgEfecto: 'from-blue-500 to-blue-700'
    },
    limpieza: {
      titulo: 'Profesionales de Limpieza',
      subtitulo: 'Limpieza profunda, post-obra y mantenimiento de espacios.',
      color: 'bg-teal-500',
      txtColor: 'text-white',
      icono: Sparkles,
      bgEfecto: 'from-teal-400 to-teal-600'
    },
    electricidad: {
      titulo: 'Técnicos Electricistas',
      subtitulo: 'Instalaciones seguras, tableros y reparaciones eléctricas.',
      color: 'bg-amber-500',
      txtColor: 'text-white',
      icono: Zap,
      bgEfecto: 'from-amber-400 to-amber-600'
    },
    jardineria: {
      titulo: 'Servicios de Jardinería',
      subtitulo: 'Mantenimiento de espacios verdes, poda y paisajismo.',
      color: 'bg-emerald-600',
      txtColor: 'text-white',
      icono: TreePine,
      bgEfecto: 'from-emerald-500 to-emerald-700'
    }
  };

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      let query = supabase
        .from("profiles_public")
        .select("*")
        .eq("is_provider", true)
        .order("rating_avg", { ascending: false });

      if (categoriaActiva !== "todas") {
        query = query.eq("provider_category", categoriaActiva);
      }

      const { data } = await query;
      setProviders((data as ProviderProfile[]) || []);
      setLoading(false);
    };
    fetchProviders();
  }, [categoriaActiva]);

  const prestadoresFiltrados = useMemo(() => {
    const locationFilter = searchParams.get("location")?.toLowerCase() || "";
    const filtered = providers.filter((p) => {
      if (searchQuery && !p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(p.provider_category || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(p.bio || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (locationFilter && !(p.location || "").toLowerCase().includes(locationFilter)) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating_avg || 0) - (a.rating_avg || 0);
        case "jobs":
          return (b.completed_jobs || 0) - (a.completed_jobs || 0);
        case "recommended":
          const scoreA = (a.rating_avg || 0) * Math.log2((a.review_count || 0) + 1) + (a.completed_jobs || 0) * 0.1;
          const scoreB = (b.rating_avg || 0) * Math.log2((b.review_count || 0) + 1) + (b.completed_jobs || 0) * 0.1;
          return scoreB - scoreA;
        default:
          return 0;
      }
    });
  }, [providers, searchQuery, sortBy, searchParams]);

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
      
      {/* HEADER DINÂMICO (HERO SECTION) */}
      <div className={`relative pt-12 pb-20 px-6 lg:px-10 transition-colors duration-500 overflow-hidden ${tema.color}`}>
        {/* Efeitos de fundo dinâmicos */}
        <div className={`absolute inset-0 bg-gradient-to-br ${tema.bgEfecto} opacity-90`}></div>
        <div className="absolute right-0 top-0 -mt-20 -mr-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl pointer-events-none transition-all duration-700"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto flex items-center gap-6">
          {/* Ícone da Categoria Gigante */}
          <div className={`hidden md:flex w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center ${tema.txtColor} shadow-xl transform transition-transform duration-500 hover:scale-105`}>
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
        <div className="bg-card rounded-2xl shadow-lg border border-border p-2 md:p-4 flex flex-col md:flex-row gap-3">
          
          {/* Input de Pesquisa */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o servicio..." 
              className="w-full bg-muted/50 border border-transparent rounded-xl pl-12 pr-4 py-3.5 text-foreground focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          <div className="w-full md:w-px h-px md:h-12 bg-border my-auto"></div>

          {/* Dropdown de Categoria */}
          <div className="md:w-64 relative">
            <select 
              value={categoriaActiva}
              onChange={(e) => setCategoriaActiva(e.target.value)}
              className="w-full appearance-none bg-transparent border-none rounded-xl pl-4 pr-10 py-3.5 text-foreground font-semibold cursor-pointer focus:ring-2 focus:ring-primary/20"
            >
              <option value="todas">Todas las categorías</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={20} />
          </div>

          {/* Botão Extra Filtros */}
          <button className="hidden md:flex items-center gap-2 px-6 py-3.5 bg-secondary hover:bg-muted text-secondary-foreground font-semibold rounded-xl transition-colors">
            <Filter size={20} />
            Filtros
          </button>
        </div>
      </div>

      {/* ÁREA DE RESULTADOS */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Contador de Resultados */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-muted-foreground font-medium">
            <strong className="text-foreground">{prestadoresFiltrados.length}</strong> profesionales encontrados
          </p>
          
          {/* Ordenação Simples */}
          <div className="flex items-center gap-2 text-sm bg-card px-3 py-1.5 rounded-lg border border-border">
            <span className="text-muted-foreground">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
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
              <Link to={`/prestador/${prestador.id}`} key={prestador.id} className="group">
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                  
                  {/* Header do Cartão (Avatar e Nome) */}
                  <div className="p-6 border-b border-border relative">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-2xl overflow-hidden">
                          {prestador.avatar_url ? (
                            <img src={prestador.avatar_url} alt={prestador.full_name} className="w-full h-full object-cover" />
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
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider mb-2 truncate max-w-full">
                          {getCategoryName(prestador.provider_category)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(prestador.id); }}
                      className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-secondary transition-colors"
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 text-[10px] font-bold">
                          🏆 Top Prestador
                        </span>
                      )}
                      {prestador.completed_jobs >= 10 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                          🔥 Alta demanda
                        </span>
                      )}
                      {prestador.review_count >= 5 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 text-[10px] font-bold">
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
                  <div className="p-4 bg-card border-t border-border mt-auto">
                    <button className="w-full py-3 bg-background border-2 border-primary text-primary font-bold rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
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
