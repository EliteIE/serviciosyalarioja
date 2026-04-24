import { Link } from "react-router-dom";
import { X } from "lucide-react";

export const ProviderCTA = () => {
  return (
    <section className="w-full bg-[#f8fafc] py-12 md:py-16 overflow-hidden border-y border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4 relative">
          
          {/* 1. Lado Esquerdo: Imagem do Profissional */}
          <div className="hidden lg:flex w-full lg:w-1/3 items-end justify-center relative h-[400px]">
            {/* O usuário deve colocar a imagem sem fundo do encanador em public/plumber-hero.png */}
            <img 
              src="/plumber-hero.png" 
              alt="Profesional" 
              className="absolute bottom-[-64px] max-h-[480px] w-auto object-contain object-bottom drop-shadow-2xl z-10"
              onError={(e) => {
                // Fallback visual caso a imagem ainda não exista
                e.currentTarget.src = "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&h=600&fit=crop";
                e.currentTarget.className = "max-h-[400px] w-full object-cover rounded-2xl shadow-xl";
              }}
            />
          </div>

          {/* 2. Meio: Textos e Botões */}
          <div className="w-full lg:w-1/3 flex flex-col justify-center text-center lg:text-left z-20">
            <span className="text-slate-500 font-semibold text-sm mb-3">
              Exclusivo para Profesionales
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#082345] mb-4 leading-[1.1]">
              ¿Sos profesional?<br />
              Multiplicá tus ingresos.
            </h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto lg:mx-0 text-base leading-relaxed">
              Miles de clientes en tu zona están buscando lo que hacés. Unite a Servicios 360, destacá tu talento y conseguí nuevos proyectos sin esfuerzo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/registro/prestador">
                <button className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Registrate gratis ahora
                </button>
              </Link>
              <Link to="/como-funciona" className="text-[#082345] font-bold hover:underline px-4 py-3">
                Conocé cómo funciona
              </Link>
            </div>
          </div>

          {/* 3. Lado Direito: Mockup do Dashboard */}
          <div className="w-full lg:w-1/3 flex items-center justify-center lg:justify-end relative p-4 lg:p-8 z-20">
            {/* Dashboard Window Principal */}
            <div className="w-full max-w-[400px] bg-white rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 overflow-visible flex relative aspect-[4/3]">
              
              {/* Sidebar */}
              <div className="w-[28%] bg-white border-r border-slate-100 py-4 px-2 flex flex-col gap-3">
                {/* Logo Fake */}
                <div className="flex items-center gap-1.5 px-2 mb-4">
                  <div className="w-4 h-4 bg-primary rounded flex-shrink-0"></div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-sm"></div>
                </div>
                {/* Menu Item Ativo */}
                <div className="bg-orange-50 text-primary rounded-lg px-2 py-2.5 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm bg-primary/40 flex-shrink-0"></div>
                  <div className="w-full h-2 bg-primary/80 rounded-sm"></div>
                </div>
                {/* Menu Items Inativos */}
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="px-2 py-2 flex items-center gap-2 opacity-60">
                    <div className="w-3.5 h-3.5 rounded-sm bg-slate-300 flex-shrink-0"></div>
                    <div className="w-full h-2 bg-slate-200 rounded-sm"></div>
                  </div>
                ))}
              </div>

              {/* Main Content Area */}
              <div className="w-[72%] bg-slate-50/50 p-4 flex flex-col gap-4">
                {/* Header (Busca e Avatares) */}
                <div className="flex justify-between items-center">
                  <div className="w-1/2 h-7 bg-white rounded-md border border-slate-200 flex items-center px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                    <div className="w-1/2 h-1.5 bg-slate-200 rounded-sm ml-2"></div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                    <div className="w-6 h-6 rounded-full bg-slate-300"></div>
                    <div className="w-6 h-6 rounded-full bg-[#082345]"></div>
                  </div>
                </div>

                {/* Título Notifications */}
                <div className="flex justify-between items-end mt-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#082345]">Notifications</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-slate-500 font-medium">Job notifications</p>
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-primary rounded text-[9px] text-white font-bold">
                    Upgrade
                  </div>
                </div>

                {/* Lista de Notificações */}
                <div className="flex flex-col gap-2.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        </div>
                        <div className="w-24 h-2.5 bg-slate-200 rounded-sm"></div>
                      </div>
                      <div className="w-3/4 h-2 bg-slate-100 rounded-sm ml-7"></div>
                      <div className="px-2 py-1 border border-orange-200 rounded text-[9px] text-primary flex items-center justify-center self-start ml-7 mt-1 font-medium bg-orange-50/50">
                        Ver detalles
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popup "Tu Perfil Destacado" Sobreposto */}
              <div className="absolute -bottom-6 -right-6 lg:-right-10 w-[220px] bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] border border-slate-100 p-5 flex flex-col items-center text-center z-30 animate-fade-in">
                <button className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
                <div className="w-14 h-14 rounded-full mb-3 bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                  <img src="https://ui-avatars.com/api/?name=Profissional&background=082345&color=fff" alt="User" className="w-full h-full object-cover" />
                </div>
                <h4 className="font-extrabold text-sm text-[#082345] mb-1.5">Tu Perfil Destacado</h4>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                  Tu perfil profesional es uno de los más visitados de la semana en tu zona.
                </p>
                <button className="w-full bg-primary hover:bg-primary/90 text-white text-[11px] font-bold py-2.5 rounded-lg transition-colors">
                  Ver mi perfil destacado
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
