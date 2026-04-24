import { Link } from "react-router-dom";
import { Briefcase, TrendingUp, ShieldCheck, User, Star } from "lucide-react";

export const ProviderCTA = () => {
  return (
    <section className="container py-16 md:py-24">
      {/* Container Principal Dark Navy */}
      <div className="w-full bg-secondary rounded-3xl overflow-hidden shadow-2xl relative flex flex-col lg:flex-row items-center border border-secondary-foreground/5">
        
        {/* Efeitos de Iluminação Sutis */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] rounded-full bg-primary opacity-5 blur-[100px] pointer-events-none"></div>

        {/* Lado Esquerdo: Textos e Botões */}
        <div className="relative z-10 w-full lg:w-[55%] px-8 py-12 md:px-16 md:py-20 text-left">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-semibold mb-6">
            <Briefcase size={16} />
            <span>Exclusivo para Profesionales</span>
          </div>
          
          {/* Título */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.1]">
            ¿Sos profesional? <br />
            <span className="text-primary">
              Multiplicá tus ingresos.
            </span>
          </h2>
          
          {/* Texto */}
          <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed max-w-xl">
            Miles de clientes en tu zona están buscando lo que hacés. Unite a <strong className="text-white font-semibold">Servicios 360</strong>, destacá tu talento y conseguí nuevos proyectos sin esfuerzo.
          </p>

          {/* Badges de Confiança */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="flex items-center gap-3 text-white/90 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
              <ShieldCheck className="text-emerald-400" size={20} />
              <span className="text-sm font-medium">Clientes verificados</span>
            </div>
            <div className="flex items-center gap-3 text-white/90 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
              <TrendingUp className="text-primary" size={20} />
              <span className="text-sm font-medium">Crecimiento constante</span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/registro/prestador">
              <button className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] transform hover:-translate-y-1 flex items-center justify-center">
                Registrate gratis ahora
              </button>
            </Link>
            <Link to="/como-funciona" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white/5 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40 flex items-center justify-center">
                Conocé cómo funciona
              </button>
            </Link>
          </div>
        </div>

        {/* Lado Direito: Mockup Dark */}
        <div className="relative z-10 w-full lg:w-[45%] px-8 pb-12 lg:py-20 flex justify-center lg:justify-end lg:pr-16">
          
          {/* Card Mockup */}
          <div className="w-full max-w-[380px] bg-[#051329] rounded-2xl border border-white/10 shadow-2xl p-6 transform hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden">
            
            {/* Cabeçalho do Card */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <User className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Tu Perfil Destacado</h3>
                <div className="flex items-center gap-1 text-yellow-400 mt-1">
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <span className="text-white/50 text-xs ml-1">(5.0)</span>
                </div>
              </div>
            </div>

            {/* Notificações */}
            <div className="space-y-3">
              {/* Notificação 1 */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">¡Nuevo Trabajo!</span>
                  <span className="text-[10px] text-white/40">Hace 2 min</span>
                </div>
                <p className="text-white text-sm font-medium">Instalación eléctrica residencial</p>
                <p className="text-white/50 text-xs mt-1">A 2.5 km de tu ubicación</p>
              </div>

              {/* Notificação 2 */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 opacity-70">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Presupuesto Aprobado</span>
                  <span className="text-[10px] text-white/40">Ayer</span>
                </div>
                <p className="text-white text-sm font-medium">Reparación de cañerías</p>
              </div>
            </div>

            {/* Botão Inferior Mock */}
            <div className="mt-5 w-full py-3 bg-white/5 rounded-lg text-center text-white/40 text-xs font-medium border border-white/5">
              Recibiendo solicitudes...
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
