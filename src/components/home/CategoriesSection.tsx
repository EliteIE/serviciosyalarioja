import { Link } from "react-router-dom";
import { ArrowRight, Wrench, Zap, Sparkles, Paintbrush, Hammer, TreePine } from "lucide-react";
import { CATEGORIES } from "@/constants/categories";

const iconMap: Record<string, React.ElementType> = {
  Wrench, Zap, Sparkles, Paintbrush, Hammer, TreePine,
};

export const CategoriesSection = () => {
  return (
    <section className="bg-background py-16 md:py-24 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Cabeçalho da Secção */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
              Categorías populares
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Encontrá al experto ideal para tu próximo proyecto.
            </p>
          </div>
          
          {/* Link "Ver todas" - Visível em Desktop */}
          <Link 
            to="/buscar" 
            className="hidden sm:flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors group"
          >
            Ver todas 
            <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grelha de Cartões (Responsiva) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
          {CATEGORIES.slice(0, 6).map((categoria) => {
            const Icon = iconMap[categoria.icon] || Wrench;
            return (
              <Link 
                key={categoria.id} 
                to={`/buscar?q=${categoria.slug}`}
                className="group flex flex-col items-center p-6 md:p-8 bg-card rounded-[2rem] border border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-primary/20 transition-all duration-300 ease-in-out cursor-pointer"
              >
                {/* Contentor do Ícone com Efeito de Fundo */}
                <div className="w-16 h-16 md:w-20 md:h-20 mb-5 rounded-2xl bg-muted/40 text-muted-foreground flex items-center justify-center transition-colors duration-300 group-hover:bg-primary/5 group-hover:text-primary">
                  <Icon size={32} strokeWidth={1.5} />
                </div>
                
                {/* Textos */}
                <h3 className="text-foreground font-bold text-base md:text-lg text-center group-hover:text-primary transition-colors">
                  {categoria.name}
                </h3>
              </Link>
            );
          })}
        </div>

        {/* Link "Ver todas" - Visível em Mobile */}
        <div className="mt-10 flex justify-center sm:hidden">
          <Link to="/buscar" className="w-full">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-card border border-border rounded-xl text-foreground font-semibold hover:bg-secondary transition-colors">
              Ver todas las categorías
              <ArrowRight size={18} />
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
};
