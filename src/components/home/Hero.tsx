import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Shield, Star, CreditCard } from "lucide-react";

// Barrios de La Rioja Capital y alrededores
const BARRIOS_LA_RIOJA = [
  "Centro", "Barrio Norte", "Barrio Sur", "Villa Unión",
  "Parque Industrial", "Faldeo del Velazco", "Ciudad del Este",
  "Villa Bustos", "Residencial del Sur", "Las Padercitas",
  "El Quebrachal", "Barrio Vespucio", "Barrio CGT",
  "Barrio Evita", "Villa Gobernador Gordillo", "Barrio ISSARA",
  "Villa Sanagasta", "Vargas", "Barrio Yacampis",
  "Barrio Libertador", "Barrio 25 de Mayo", "Santa Florentina",
  "Barrio Juan XXIII", "Barrio Alberdi", "Barrio Parque",
  "Chilecito", "Chamical", "Chepes", "Aimogasta",
  "Nonogasta", "Famatina", "Sanagasta", "La Banda",
  "Anillaco", "Villa Castelli"
];

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
  const [locationQuery, setLocationQuery] = useState("");
  const [showBarrios, setShowBarrios] = useState(false);
  const navigate = useNavigate();

  const filteredBarrios = useMemo(() => {
    if (!locationQuery.trim()) return BARRIOS_LA_RIOJA.slice(0, 8);
    return BARRIOS_LA_RIOJA.filter(b =>
      b.toLowerCase().includes(locationQuery.toLowerCase())
    ).slice(0, 6);
  }, [locationQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && !locationQuery.trim()) return;

    const params = new URLSearchParams();
    const query = searchQuery.trim().toLowerCase();

    // Smart keyword → category mapping
    let matchedCategory = "";
    for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
      if (query.includes(keyword)) {
        matchedCategory = category;
        break;
      }
    }

    if (matchedCategory) {
      params.append("category", matchedCategory);
    }
    if (searchQuery.trim()) params.append("q", searchQuery.trim());
    if (locationQuery.trim()) params.append("location", locationQuery.trim());

    navigate(`/buscar?${params.toString()}`);
  };

  return (
    <div className="relative min-h-[80vh] bg-secondary flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      
      {/* Efeitos de Fundo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--secondary-foreground)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--secondary-foreground)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl mx-auto text-center flex flex-col items-center">

        {/* Badge de localización + cuotas — ocre-Famatina para "La Rioja" (acento local) */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-foreground/5 border border-secondary-foreground/10 text-xs font-semibold text-secondary-foreground/80 backdrop-blur-sm mt-2">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={12} className="text-riojano" />
            <span className="text-riojano">La Rioja</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-secondary-foreground/30"></span>
          <span className="inline-flex items-center gap-1.5">
            <CreditCard size={12} className="text-primary" />
            Cuotas sin interés con MercadoPago
          </span>
        </div>

        {/* Título Principal */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-secondary-foreground mb-6 tracking-tight leading-[1.1] mt-6">
          Encontrá al profesional <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 relative inline-block">
            perfecto
            {/* Sublinhado decorativo */}
            <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/40" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="transparent" />
            </svg>
          </span> para tu casa
        </h1>

        {/* Subtítulo */}
        <p className="text-lg md:text-xl text-secondary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          Plomeros, electricistas y más prestadores <strong className="text-secondary-foreground">verificados en toda La Rioja</strong>. Pedí presupuestos gratis, compará reseñas reales y pagá seguro <strong className="text-secondary-foreground">en cuotas sin interés</strong>.
        </p>

        {/* Barra de Pesquisa Integrada */}
        <form 
          onSubmit={handleSearch}
          className="w-full max-w-3xl bg-background p-2 md:rounded-full rounded-2xl shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2 transition-all focus-within:ring-4 focus-within:ring-primary/20"
        >
          <div className="flex-1 flex items-center w-full px-4 py-3 md:py-2 border-b md:border-b-0 md:border-r border-border">
            <Search className="text-muted-foreground mr-3 flex-shrink-0" size={24} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Qué necesitás? Ej: plomero..." 
              className="w-full bg-transparent border-none text-foreground focus:outline-none text-lg md:text-base placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex-1 relative w-full">
            <div className="flex items-center w-full px-4 py-3 md:py-2">
              <MapPin className="text-muted-foreground mr-3 flex-shrink-0" size={24} />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => { setLocationQuery(e.target.value); setShowBarrios(true); }}
                onFocus={() => setShowBarrios(true)}
                onBlur={() => setTimeout(() => setShowBarrios(false), 200)}
                placeholder="Tu zona o barrio"
                className="w-full bg-transparent border-none text-foreground focus:outline-none text-lg md:text-base placeholder:text-muted-foreground"
                autoComplete="off"
              />
            </div>
            {showBarrios && filteredBarrios.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                {filteredBarrios.map((barrio) => (
                  <button
                    key={barrio}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setLocationQuery(barrio); setShowBarrios(false); }}
                    className="w-full text-left px-4 py-3 min-h-[44px] text-sm hover:bg-primary/5 text-foreground flex items-center gap-2 transition-colors"
                  >
                    <MapPin size={14} className="text-muted-foreground shrink-0" />
                    {barrio}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit"
            className="w-full md:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl md:rounded-full transition-colors flex items-center justify-center shadow-lg transform hover:-translate-y-[1px]"
          >
            Buscar
          </button>
        </form>

        {/* Links Rápidos / Categorias Populares */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <span className="text-sm font-medium text-secondary-foreground/60 flex items-center gap-2">
            <Star size={16} className="text-primary" />
            Búsquedas populares:
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {['Plomería', 'Electricista', 'Limpieza', 'Aire Acondicionado'].map((categoria) => (
              <button 
                key={categoria}
                onClick={() => {
                  const catMap: Record<string, string> = { 'plomería': 'plomeria', 'electricista': 'electricidad', 'limpieza': 'limpieza', 'aire acondicionado': 'aire-acondicionado' };
                  const slug = catMap[categoria.toLowerCase()] || categoria.toLowerCase();
                  navigate(`/buscar?q=${encodeURIComponent(categoria)}&category=${slug}`);
                }}
                className="min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-1.5 rounded-full bg-secondary-foreground/5 text-secondary-foreground/80 text-sm border border-secondary-foreground/10 hover:bg-secondary-foreground/10 hover:text-secondary-foreground transition-all cursor-pointer"
              >
                {categoria}
              </button>
            ))}
          </div>
        </div>

        {/* Benefícios em miniatura abaixo do hero */}
        <div className="mt-16 max-w-4xl w-full border-t border-secondary-foreground/10 pt-10">
          <div className="flex sm:grid sm:grid-cols-3 gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
            <div className="flex flex-col items-center justify-center text-center group min-w-[200px] snap-center shrink-0 sm:min-w-0 sm:shrink">
              <div className="w-14 h-14 bg-secondary-foreground/5 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                <Shield size={28} />
              </div>
              <h3 className="text-secondary-foreground font-semibold text-base mb-1">Perfiles Verificados</h3>
              <p className="text-secondary-foreground/60 text-sm">Identidad y antecedentes revisados.</p>
            </div>
            <div className="flex flex-col items-center justify-center text-center group min-w-[200px] snap-center shrink-0 sm:min-w-0 sm:shrink">
              <div className="w-14 h-14 bg-secondary-foreground/5 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                <Star size={28} />
              </div>
              <h3 className="text-secondary-foreground font-semibold text-base mb-1">Reseñas Reales</h3>
              <p className="text-secondary-foreground/60 text-sm">Opiniones verificadas de clientes.</p>
            </div>
            <div className="flex flex-col items-center justify-center text-center group min-w-[200px] snap-center shrink-0 sm:min-w-0 sm:shrink">
              <div className="w-14 h-14 bg-secondary-foreground/5 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                <CreditCard size={28} />
              </div>
              <h3 className="text-secondary-foreground font-semibold text-base mb-1">Pagá en Cuotas</h3>
              <p className="text-secondary-foreground/60 text-sm">
                Con MercadoPago, sin interés<sup className="text-[10px]">*</sup>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
