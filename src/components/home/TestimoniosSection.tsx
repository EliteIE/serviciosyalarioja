import { Star, Quote, CheckCircle2 } from "lucide-react";

export function TestimoniosSection() {
  const testimonios = [
    {
      id: 1,
      nombre: "Valentina R.",
      rol: "Cliente Verificada",
      texto: '"Encontré un electricista excelente en menos de 5 minutos. Me resolvió el problema en el día y el precio fue súper transparente. ¡La plataforma es genial!"',
      rating: 5,
      inicial: "V",
      colorBg: "bg-blue-100 dark:bg-blue-500/20",
      colorText: "text-blue-600 dark:text-blue-400"
    },
    {
      id: 2,
      nombre: "Alejandro P.",
      rol: "Prestador Top",
      texto: '"Como prestador, dupliqué mis clientes en el primer mes. La verificación genera mucha confianza en la gente y la gestión de cobros es impecable."',
      rating: 5,
      inicial: "A",
      colorBg: "bg-primary/20",
      colorText: "text-primary"
    },
    {
      id: 3,
      nombre: "Camila O.",
      rol: "Cliente Verificada",
      texto: '"Me encanta poder ver las reseñas y el portafolio de trabajos antes de contratar a alguien. Muy transparente y seguro. Lo recomiendo a todos mis conocidos."',
      rating: 5,
      inicial: "C",
      colorBg: "bg-green-100 dark:bg-green-500/20",
      colorText: "text-green-600 dark:text-green-400"
    }
  ];

  return (
    <section className="relative py-20 lg:py-28 bg-slate-900 font-sans overflow-hidden">
      
      {/* Efeitos de Luz no Fundo (Ambient Light) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Cabeçalho da Secção */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">
            Comunidad Servicios Ya
          </h2>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Lo que dicen nuestros usuarios
          </h3>
        </div>

        {/* Grelha de Depoimentos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonios.map((testimonio) => (
            <div 
              key={testimonio.id} 
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl hover:-translate-y-2 hover:border-primary/50 hover:shadow-primary/10 transition-all duration-300 relative group flex flex-col"
            >
              
              {/* Ícone de Aspas Gigante (Decorativo no fundo) */}
              <Quote 
                size={80} 
                className="absolute top-6 right-6 text-slate-700/30 transform -rotate-12 group-hover:scale-110 group-hover:text-slate-600/30 transition-all duration-500" 
              />

              <div className="relative z-10 flex-1">
                {/* Estrelas */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonio.rating)].map((_, i) => (
                    <Star key={i} size={18} className="text-yellow-500" fill="currentColor" />
                  ))}
                </div>

                {/* Texto do Depoimento */}
                <p className="text-slate-300 text-lg leading-relaxed mb-8">
                  {testimonio.texto}
                </p>
              </div>

              {/* Rodapé do Cartão: Info do Utilizador */}
              <div className="relative z-10 flex items-center gap-4 pt-6 border-t border-slate-700/50">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${testimonio.colorBg} ${testimonio.colorText}`}>
                  {testimonio.inicial}
                </div>
                
                {/* Nome e Rol */}
                <div>
                  <h4 className="font-bold text-white text-base">
                    {testimonio.nombre}
                  </h4>
                  <div className="flex items-center gap-1.5 text-sm mt-0.5 text-slate-400">
                    <CheckCircle2 size={14} className={testimonio.rol.includes('Prestador') ? 'text-primary' : 'text-blue-500'} />
                    <span>{testimonio.rol}</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
