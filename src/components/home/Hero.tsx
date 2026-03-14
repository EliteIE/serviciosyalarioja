import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Shield, Star } from "lucide-react";

export const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && !locationQuery.trim()) return;
    
    // Construct search URL
    const params = new URLSearchParams();
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
        
        {/* Título Principal */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-secondary-foreground mb-6 tracking-tight leading-[1.1] mt-8">
          Encontrá al profesional <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 relative inline-block">
            perfecto
            {/* Sublinhado decorativo */}
            <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/40" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="transparent" />
            </svg>
          </span> para vos
        </h1>

        {/* Subtítulo */}
        <p className="text-lg md:text-xl text-secondary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          Prestadores verificados, presupuestos transparentes y garantía en cada servicio. Tu tranquilidad empieza acá.
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

          <div className="flex-1 flex items-center w-full px-4 py-3 md:py-2">
            <MapPin className="text-muted-foreground mr-3 flex-shrink-0" size={24} />
            <input 
              type="text" 
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Tu zona o barrio" 
              className="w-full bg-transparent border-none text-foreground focus:outline-none text-lg md:text-base placeholder:text-muted-foreground"
            />
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
                onClick={() => navigate(`/buscar?q=${categoria.toLowerCase()}`)}
                className="px-4 py-1.5 rounded-full bg-secondary-foreground/5 text-secondary-foreground/80 text-sm border border-secondary-foreground/10 hover:bg-secondary-foreground/10 hover:text-secondary-foreground transition-all cursor-pointer"
              >
                {categoria}
              </button>
            ))}
          </div>
        </div>

        {/* Benefícios em miniatura abaixo do hero */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full border-t border-secondary-foreground/10 pt-10">
          <div className="flex flex-col items-center justify-center text-center group">
            <div className="w-14 h-14 bg-secondary-foreground/5 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
              <Shield size={28} />
            </div>
            <h3 className="text-secondary-foreground font-semibold text-base mb-1">Perfiles Verificados</h3>
            <p className="text-secondary-foreground/60 text-sm">Identidad y antecedentes revisados.</p>
          </div>
          <div className="flex flex-col items-center justify-center text-center group">
            <div className="w-14 h-14 bg-secondary-foreground/5 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
              <Star size={28} />
            </div>
            <h3 className="text-secondary-foreground font-semibold text-base mb-1">Reseñas Reales</h3>
            <p className="text-secondary-foreground/60 text-sm">Opiniones 100% de clientes.</p>
          </div>
          <div className="flex flex-col items-center justify-center text-center group">
            <div className="w-14 h-14 bg-secondary-foreground/5 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
              <Search size={28} />
            </div>
            <h3 className="text-secondary-foreground font-semibold text-base mb-1">Presupuesto Rápido</h3>
            <p className="text-secondary-foreground/60 text-sm">Compará precios sin compromiso.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
