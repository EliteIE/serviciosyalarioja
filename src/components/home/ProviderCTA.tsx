import { Link } from "react-router-dom";
import { Briefcase, TrendingUp, ShieldCheck, UserCheck, Star } from "lucide-react";

export const ProviderCTA = () => {
  return (
    <section className="container py-16 md:py-24">
      <div className="w-full bg-secondary rounded-3xl overflow-hidden shadow-2xl relative flex flex-col lg:flex-row items-center border border-secondary-foreground/10">
        
        {/* Efeitos de Iluminação de Fundo (Blur) */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] rounded-full bg-primary opacity-10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] rounded-full bg-accent-foreground opacity-5 blur-[80px] pointer-events-none"></div>

        {/* Lado Esquerdo: Textos e Botões (Copy & CTA) */}
        <div className="relative z-10 w-full lg:w-3/5 px-8 py-12 md:px-14 md:py-20 text-left">
          
          {/* Badge (Tag) */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-foreground/10 border border-secondary-foreground/10 text-primary text-sm font-semibold mb-6">
            <Briefcase size={16} />
            <span>Exclusivo para Profesionales</span>
          </div>
          
          {/* Título */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-secondary-foreground mb-6 leading-[1.1]">
            ¿Sos profesional? <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Multiplicá tus ingresos.
            </span>
          </h2>
          
          {/* Subtítulo */}
          <p className="text-lg md:text-xl text-secondary-foreground/80 mb-8 leading-relaxed max-w-2xl">
            Miles de clientes en tu zona están buscando lo que hacés. Unite a <strong className="text-secondary-foreground font-semibold">Servicios Ya</strong>, destacá tu talento y conseguí nuevos proyectos sin esfuerzo.
          </p>

          {/* Pontos de Confiança (Trust Badges) */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="flex items-center gap-2 text-secondary-foreground/90 bg-secondary-foreground/5 px-4 py-2.5 rounded-lg border border-secondary-foreground/10">
              <ShieldCheck className="text-success" size={20} />
              <span className="text-sm font-medium">Clientes verificados</span>
            </div>
            <div className="flex items-center gap-2 text-secondary-foreground/90 bg-secondary-foreground/5 px-4 py-2.5 rounded-lg border border-secondary-foreground/10">
              <TrendingUp className="text-primary" size={20} />
              <span className="text-sm font-medium">Crecimiento constante</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/registro/prestador">
              <button className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] transform hover:-translate-y-1 flex items-center justify-center gap-2">
                Registrate gratis ahora
              </button>
            </Link>
            <Link to="/como-funciona" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-secondary-foreground/5 text-secondary-foreground font-semibold rounded-xl transition-all duration-300 border border-secondary-foreground/20 hover:border-secondary-foreground/40">
                Conocé cómo funciona
              </button>
            </Link>
          </div>
        </div>

        {/* Lado Direito: Elemento Visual / Mockup */}
        <div className="relative z-10 w-full lg:w-2/5 px-8 pb-12 lg:py-20 flex justify-center lg:justify-end lg:pr-14">
          
          {/* Cartão de "Perfil de Sucesso" Simulando a Plataforma */}
          <div className="w-full max-w-sm bg-secondary/80 backdrop-blur-sm rounded-2xl border border-secondary-foreground/10 shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500 relative">
            
            {/* Cabeçalho do Cartão */}
            <div className="flex items-center gap-4 mb-6 border-b border-secondary-foreground/10 pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg border-2 border-secondary">
                <UserCheck className="text-primary-foreground" size={28} />
              </div>
              <div>
                <h3 className="text-secondary-foreground font-bold text-lg">Tu Perfil Destacado</h3>
                <div className="flex items-center gap-1 text-warning mt-1">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <span className="text-secondary-foreground/60 text-xs ml-1">(5.0)</span>
                </div>
              </div>
            </div>

            {/* Simulação de Notificação de Trabalho */}
            <div className="space-y-4">
              <div className="bg-secondary-foreground/5 rounded-xl p-4 border border-secondary-foreground/10">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded">¡Nuevo Trabajo!</span>
                  <span className="text-xs text-secondary-foreground/50">Hace 2 min</span>
                </div>
                <p className="text-secondary-foreground text-sm font-medium">Instalación eléctrica residencial</p>
                <p className="text-secondary-foreground/60 text-xs mt-1">A 2.5 km de tu ubicación</p>
              </div>

              <div className="bg-secondary-foreground/5 rounded-xl p-4 border border-secondary-foreground/10 opacity-60">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">Presupuesto Aprobado</span>
                  <span className="text-xs text-secondary-foreground/50">Ayer</span>
                </div>
                <p className="text-secondary-foreground text-sm font-medium">Reparación de cañerías</p>
              </div>
            </div>

            {/* Fake Button */}
            <div className="mt-6 w-full py-3 bg-secondary-foreground/10 rounded-lg text-center text-secondary-foreground/70 text-sm font-medium">
              Recibiendo solicitudes...
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};
