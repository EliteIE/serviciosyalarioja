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
    <div className="relative bg-secondary flex flex-col items-center justify-center px-4 py-20 md:py-28 overflow-hidden">

      {/* Ambient background effects */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--secondary-foreground)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--secondary-foreground)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-3xl mx-auto text-center flex flex-col items-center">

        {/* Subtle disclosure badge (replaces the old trust-badge row below) */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-foreground/5 border border-secondary-foreground/10 text-xs font-medium text-secondary-foreground/70 backdrop-blur-sm">
          <CreditCard size={12} className="text-primary" aria-hidden="true" />
          Cuotas sin interés con MercadoPago
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-secondary-foreground mt-6 mb-5 tracking-tight leading-[1.1]">
          Encontrá al profesional{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 relative inline-block">
            perfecto
            <svg
              className="absolute w-full h-3 -bottom-1 left-0 text-primary/40"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="transparent" />
            </svg>
          </span>{" "}
          para tu casa
        </h1>

        {/* Short subheadline — no redundant pitch list */}
        <p className="text-base md:text-lg text-secondary-foreground/70 mb-8 max-w-xl mx-auto leading-relaxed">
          Profesionales verificados en toda La Rioja. Presupuestos gratis y reseñas reales.
        </p>

        {/* Single-field search — no zone dropdown */}
        <form
          onSubmit={handleSearch}
          className="w-full max-w-2xl bg-background p-2 rounded-2xl md:rounded-full shadow-2xl flex items-stretch gap-2 transition-all focus-within:ring-4 focus-within:ring-primary/20"
          role="search"
          aria-label="Buscar servicios"
        >
          <div className="flex-1 flex items-center px-4">
            <Search className="text-muted-foreground mr-3 flex-shrink-0" size={20} aria-hidden="true" />
            <label htmlFor="hero-search" className="sr-only">
              ¿Qué servicio necesitás?
            </label>
            <input
              id="hero-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Qué necesitás? Ej: plomero, electricista, limpieza..."
              className="w-full bg-transparent border-none text-foreground focus:outline-none text-base placeholder:text-muted-foreground py-3"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className="shrink-0 px-6 md:px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl md:rounded-full transition-colors flex items-center justify-center shadow-lg min-h-[44px]"
          >
            Buscar
          </button>
        </form>

        {/* Popular searches — compact chips, no heading bloat */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-medium text-secondary-foreground/50 inline-flex items-center gap-1.5">
            <Star size={12} className="text-primary" aria-hidden="true" />
            Populares:
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
              className="min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-full bg-secondary-foreground/5 text-secondary-foreground/80 text-sm border border-secondary-foreground/10 hover:bg-secondary-foreground/10 hover:text-secondary-foreground transition-all"
            >
              {label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
