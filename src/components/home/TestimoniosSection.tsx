import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

export function TestimoniosSection() {
  const testimonios = [
    {
      id: 1,
      nombre: "Valentina R.",
      rol: "Cliente",
      ciudad: "La Rioja Capital",
      texto: '"Se me rompió la canilla un domingo. En un rato tenía 3 presupuestos y a las 2 horas un plomero en casa. Todo por chat, sin dar mi número a nadie."',
      rating: 5,
      inicial: "V",
      colorBg: "bg-blue-500/20",
      colorText: "text-blue-300"
    },
    {
      id: 2,
      nombre: "Alejandro P.",
      rol: "Prestador",
      ciudad: "Chilecito",
      texto: '"Soy electricista matriculado. En el primer mes conseguí más trabajos que por boca a boca en todo el año pasado. La verificación genera confianza."',
      rating: 5,
      inicial: "A",
      colorBg: "bg-primary/20",
      colorText: "text-primary"
    },
    {
      id: 3,
      nombre: "Camila O.",
      rol: "Cliente",
      ciudad: "Chamical",
      texto: '"Me mudé y necesitaba pintor. Ver el portafolio de trabajos anteriores antes de contratar me ayudó un montón a decidir. Quedó impecable."',
      rating: 5,
      inicial: "C",
      colorBg: "bg-green-500/20",
      colorText: "text-green-300"
    },
    {
      id: 4,
      nombre: "Lucas M.",
      rol: "Cliente",
      ciudad: "Aimogasta",
      texto: '"Conseguí un albañil de confianza rapidísimo. La plataforma es muy fácil de usar y me dio mucha seguridad poder ver las calificaciones de otros clientes."',
      rating: 5,
      inicial: "L",
      colorBg: "bg-purple-500/20",
      colorText: "text-purple-300"
    },
    {
      id: 5,
      nombre: "Sofía T.",
      rol: "Prestador",
      ciudad: "Villa Unión",
      texto: '"Como arquitecta, uso la plataforma para conseguir mano de obra calificada. Nunca me falló, siempre encuentro profesionales comprometidos."',
      rating: 5,
      inicial: "S",
      colorBg: "bg-pink-500/20",
      colorText: "text-pink-300"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(2);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonios.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonios.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="relative py-20 lg:py-28 bg-[#0d1627] font-sans overflow-hidden">
      {/* Ondas decorativas de fundo (abstract waves) */}
      <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1440 320" className="absolute top-1/2 -translate-y-1/2 w-[150%] h-[600px] object-cover scale-125" preserveAspectRatio="none">
          <path fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" d="M0,160 C320,300 420,0 720,160 C1020,320 1120,20 1440,160" />
          <path fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" d="M0,180 C320,320 420,20 720,180 C1020,340 1120,40 1440,180" />
          <path fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" d="M0,200 C320,340 420,40 720,200 C1020,360 1120,60 1440,200" />
          <path fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" d="M0,220 C320,360 420,60 720,220 C1020,380 1120,80 1440,220" />
          <path fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" d="M0,240 C320,380 420,80 720,240 C1020,400 1120,100 1440,240" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabeçalho */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Lo que dicen nuestros usuarios
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="relative w-full h-[400px] md:h-[350px] flex items-center justify-center">
          
          {/* Cards */}
          {testimonios.map((testimonio, index) => {
            // Calcular diferença circular
            let diff = index - currentIndex;
            if (diff < -2) diff += testimonios.length;
            if (diff > 2) diff -= testimonios.length;

            // No mobile, mostramos só o atual para evitar poluição ou todos agrupados, mas como temos translate...
            // Para ter a mesma "cara" num celulão vamos manter as animações e só encolher um pouco o diff
            
            const isCenter = diff === 0;
            const isAdjacent = Math.abs(diff) === 1;

            // Ajustando a tradução pra não quebrar no mobile
            const translatePercent = isMobile ? 100 : 105;
            const translateX = \`calc(-50% + \${diff * translatePercent}%)\`;
            
            const scale = isCenter ? 1 : isAdjacent ? 0.85 : 0.7;
            const opacity = isCenter ? 1 : isAdjacent ? 0.6 : 0.2;
            const zIndex = 30 - Math.abs(diff);

            // No mobile, esconder os que estão além de 1 de distância
            if (isMobile && Math.abs(diff) > 1) {
              return null;
            }

            return (
              <div
                key={testimonio.id}
                className={\`absolute top-1/2 left-1/2 w-full max-w-[280px] md:max-w-[340px] p-6 lg:p-8 rounded-[24px] transition-all duration-500 ease-in-out flex flex-col shadow-2xl \${
                  isCenter ? "bg-slate-800/60 backdrop-blur-xl border-white/20 shadow-black/50" : "bg-slate-800/30 backdrop-blur-md border-white/10"
                } border\`}
                style={{
                  transform: \`translate(\${translateX}, -50%) scale(\${scale})\`,
                  opacity,
                  zIndex,
                }}
              >
                {/* Estrelas */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonio.rating)].map((_, i) => (
                    <Star key={i} size={18} className="text-yellow-400" fill="currentColor" />
                  ))}
                </div>

                {/* Texto */}
                <p className="text-slate-300 text-[14px] md:text-[15px] leading-relaxed mb-6 flex-1 min-h-[100px]">
                  {testimonio.texto}
                </p>

                {/* Info do Utilizador */}
                <div className="flex items-center gap-3">
                  <div className={\`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm \${testimonio.colorBg} \${testimonio.colorText}\`}>
                    {testimonio.inicial}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">
                      {testimonio.nombre}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {testimonio.rol} • {testimonio.ciudad}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Botões de Navegação */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-0 md:px-12 lg:px-24 z-40 pointer-events-none">
            <button
              onClick={handlePrev}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/50 border border-white/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-slate-700/80 transition-all pointer-events-auto shadow-lg"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/50 border border-white/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-slate-700/80 transition-all pointer-events-auto shadow-lg"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Indicadores (Dots) */}
        <div className="flex justify-center gap-2 mt-8 md:mt-12">
          {testimonios.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={\`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 \${
                currentIndex === index ? "bg-white scale-125" : "bg-white/30 hover:bg-white/50"
              }\`}
              aria-label={\`Ir para testimonio \${index + 1}\`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
