import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, CreditCard } from "lucide-react";

// Smart keyword mapping: user search terms → provider category slugs
const KEYWORD_MAP: Record<string, string> = {
  // Plomería
  "caño": "plomeria", "cañería": "plomeria", "agua": "plomeria",
  "canilla": "plomeria", "grifo": "plomeria", "baño": "plomeria",
  "inodoro": "plomeria", "ducha": "plomeria", "pérdida": "plomeria",
  "desagüe": "plomeria", "cloaca": "plomeria", "tanque": "plomeria",
  "termotanque": "plomeria", "calefón": "plomeria",
  "plomero": "plomeria", "plomería": "plomeria",
  // Gasista
  "gas": "gasista", "garrafa": "gasista", "gasista": "gasista",
  // Electricidad
  "enchufe": "electricidad", "cable": "electricidad", "luz": "electricidad",
  "electricista": "electricidad", "corto": "electricidad",
  "tablero": "electricidad", "térmica": "electricidad", "cortocircuito": "electricidad",
  "instalación eléctrica": "electricidad", "lamparita": "electricidad",
  "ventilador": "electricidad", "toma corriente": "electricidad",
  // Limpieza
  "limpieza": "limpieza", "limpiar": "limpieza", "limpia": "limpieza",
  "desinfección": "limpieza", "post obra": "limpieza", "post-obra": "limpieza",
  "departamento": "limpieza", "oficina": "limpieza", "edificio": "limpieza",
  // Jardinería
  "poda": "jardineria", "césped": "jardineria", "pasto": "jardineria",
  "jardín": "jardineria", "jardinero": "jardineria", "árbol": "jardineria",
  "plantas": "jardineria", "paisajismo": "jardineria", "riego": "jardineria",
  // Aire Acondicionado
  "aire": "aire-acondicionado", "aire acondicionado": "aire-acondicionado", "split": "aire-acondicionado",
  "calefacción": "aire-acondicionado", "estufa": "aire-acondicionado", "refrigeración": "aire-acondicionado",
  // Pintura
  "pintura": "pintura", "pintar": "pintura", "pintor": "pintura",
  "empapelar": "pintura",
  // Albañilería
  "albañil": "albanileria", "obra": "albanileria", "pared": "albanileria",
  "revoque": "albanileria", "cemento": "albanileria", "ladrillo": "albanileria",
  "construcción": "albanileria", "mampostería": "albanileria",
  // Cerrajería
  "cerradura": "cerrajeria", "llave": "cerrajeria", "cerrajero": "cerrajeria",
  "puerta": "cerrajeria", "candado": "cerrajeria",
  // Mudanzas
  "mudanza": "mudanzas", "flete": "mudanzas", "mover": "mudanzas",
  "trasladar": "mudanzas",
  // Carpintería
  "carpintero": "carpinteria", "mueble": "carpinteria", "madera": "carpinteria",
};

export const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const params = new URLSearchParams();
    const lower = query.toLowerCase();

    // Smart keyword → category mapping
    for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
      if (lower.includes(keyword)) {
        params.append("category", category);
        break;
      }
    }
    params.append("q", query);

    navigate(`/buscar?${params.toString()}`);
  };

  return (
    <div className="relative w-full min-h-[500px] md:min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden bg-slate-50">
      
      {/* Imagem de Fundo (Upload do Usuário) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center md:bg-right transition-transform duration-1000 hover:scale-105"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        aria-hidden="true"
      />

      {/* Gradiente de Overlay para Leitura do Texto */}
      <div className="absolute inset-0 z-10 bg-white/90 md:bg-gradient-to-r md:from-white/95 md:via-white/60 md:via-30% md:to-transparent md:to-50%" />

      {/* Container do Conteúdo */}
      <div className="container relative z-20 mx-auto px-4 py-16 md:py-24">
        <div className="w-full max-w-2xl flex flex-col items-start text-left">

          {/* Badge Informativo */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-xs font-semibold text-primary shadow-sm mb-6">
            <CreditCard size={14} aria-hidden="true" />
            Cuotas sin interés con MercadoPago
          </div>

          {/* Headline (Título) */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#082345] mb-6 tracking-tight leading-[1.15]">
            Encontrá al profesional{" "}
            <span className="text-primary relative inline-block">
              perfecto
              <svg
                className="absolute w-full h-3 -bottom-1 left-0 text-primary/30"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="transparent" />
              </svg>
            </span>{" "}
            <br className="hidden md:block" />para tu casa
          </h1>

          {/* Subheadline (Parágrafo) */}
          <p className="text-base md:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
            Profesionales verificados en toda La Rioja. Presupuestos gratis y reseñas reales de clientes como vos.
          </p>

          {/* Barra de Pesquisa */}
          <form
            onSubmit={handleSearch}
            className="w-full bg-white p-2 rounded-2xl md:rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] flex flex-col md:flex-row items-stretch gap-2 transition-all focus-within:ring-4 focus-within:ring-primary/20 border border-slate-100"
            role="search"
            aria-label="Buscar servicios"
          >
            <div className="flex-1 flex items-center px-4 py-2 md:py-0">
              <Search className="text-slate-400 mr-3 flex-shrink-0" size={24} aria-hidden="true" />
              <label htmlFor="hero-search" className="sr-only">
                ¿Qué servicio necesitás?
              </label>
              <input
                id="hero-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej: plomero, electricista, limpieza..."
                className="w-full bg-transparent border-none text-[#082345] focus:outline-none text-base md:text-lg placeholder:text-slate-400 font-medium"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className="shrink-0 w-full md:w-auto px-8 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl md:rounded-full transition-transform active:scale-95 flex items-center justify-center shadow-lg"
            >
              Buscar
            </button>
          </form>

          {/* Buscas Populares */}
          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Star size={12} className="text-primary" aria-hidden="true" />
              Populares
            </span>
            {[
              { label: "Plomería", slug: "plomeria" },
              { label: "Electricista", slug: "electricidad" },
              { label: "Limpieza", slug: "limpieza" },
              { label: "Aire Acondicionado", slug: "aire-acondicionado" },
            ].map(({ label, slug }) => (
              <button
                key={slug}
                type="button"
                onClick={() => navigate(`/buscar?q=${encodeURIComponent(label)}&category=${slug}`)}
                className="px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md text-slate-700 text-xs md:text-sm border border-slate-200 hover:bg-white hover:shadow-md hover:border-primary/30 hover:text-primary transition-all font-medium"
              >
                {label}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
