import { Link } from "react-router-dom";
import { Rocket, Wrench, Shield, Users, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";

const ComingSoon = () => {
  return (
    <div className="relative min-h-screen flex flex-col bg-[hsl(213,80%,8%)] overflow-hidden">
      <Seo
        title="Servicios 360 — Muy pronto en La Rioja"
        description="La plataforma N°1 de servicios del hogar llega a La Rioja. Profesionales verificados, presupuestos transparentes y pagos seguros."
        canonicalPath="/"
      />

      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[8%] h-64 w-64 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] h-80 w-80 rounded-full bg-primary/4 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[hsl(213,80%,20%)]/10 blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 container flex items-center justify-between py-6 px-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Servicios 360"
            className="h-9 w-9"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span className="text-xl font-bold text-white tracking-tight">
            Servicios <span className="text-primary">360</span>
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">Lanzamiento próximo</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            La mejor plataforma de{" "}
            servicios llega a<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[hsl(30,100%,60%)]">
              La Rioja
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 leading-relaxed mb-10 max-w-lg mx-auto">
            Estamos construyendo la plataforma que va a conectar a los mejores profesionales con los vecinos de toda la provincia. Muy pronto, todo en un solo lugar.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {[
              { icon: Shield, text: "Profesionales verificados" },
              { icon: Wrench, text: "12 categorías de servicio" },
              { icon: Users, text: "Presupuestos transparentes" },
            ].map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2"
              >
                <f.icon className="h-4 w-4 text-primary" />
                <span className="text-sm text-white/70 font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/quiero-ser-prestador">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8 gap-2 shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.03] text-base"
              >
                <Rocket className="h-5 w-5" />
                Quiero ser prestador
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="mailto:contacto@servicios360.com.ar" className="group">
              <Button
                variant="ghost"
                size="lg"
                className="text-white/50 hover:text-white hover:bg-white/5 rounded-full px-6 gap-2 font-medium"
              >
                <Mail className="h-4 w-4" />
                Contactanos
              </Button>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container py-6 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>© {new Date().getFullYear()} Servicios 360. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link to="/terminos" className="hover:text-white/60 transition-colors">Términos</Link>
            <Link to="/privacidad" className="hover:text-white/60 transition-colors">Privacidad</Link>
            <Link to="/contacto" className="hover:text-white/60 transition-colors">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoon;
