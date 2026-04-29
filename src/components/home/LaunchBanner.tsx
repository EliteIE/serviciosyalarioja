import { useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LaunchBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[hsl(213,80%,12%)] via-[hsl(213,80%,18%)] to-[hsl(213,80%,12%)]">
      {/* Animated background dots */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 left-[10%] h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <div className="absolute top-4 left-[30%] h-1 w-1 rounded-full bg-primary animate-pulse delay-300" />
        <div className="absolute bottom-3 left-[50%] h-1.5 w-1.5 rounded-full bg-primary animate-pulse delay-500" />
        <div className="absolute top-3 right-[20%] h-1 w-1 rounded-full bg-primary animate-pulse delay-700" />
        <div className="absolute bottom-2 right-[35%] h-1.5 w-1.5 rounded-full bg-primary animate-pulse delay-1000" />
      </div>

      <div className="container relative flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 py-3.5 px-4">
        {/* Icon + Text */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20">
            <Rocket className="h-4.5 w-4.5 text-primary" />
          </div>
          <p className="text-sm font-medium text-white/90 leading-snug">
            <span className="font-bold text-primary">¡Estamos llegando a La Rioja!</span>
            {" "}Muy pronto vas a poder contratar profesionales verificados cerca tuyo.
            <span className="hidden md:inline"> Mientras tanto, estamos sumando a los mejores prestadores de la provincia.</span>
          </p>
        </div>

        {/* CTA Button */}
        <Link to="/registro/prestador" className="shrink-0">
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-5 gap-1.5 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
          >
            Quiero ser prestador
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>

        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto p-1 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
          aria-label="Cerrar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default LaunchBanner;
