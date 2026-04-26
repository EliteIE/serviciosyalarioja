import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  // Auto-redirect after confirmed
  useEffect(() => {
    if (confirmed) {
      const timer = setTimeout(() => navigate("/login"), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmed, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent p-4 relative">
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>

      <Card className="w-full max-w-md overflow-hidden">
        {!confirmed ? (
          <CardContent className="p-8 text-center space-y-6">
            {/* Animated mail icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse">
              <Mail className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-2">
              <img src={logo} alt="Servicios 360" width={40} height={40} decoding="async" className="mx-auto h-10 w-10 rounded-[16px]" />
              <h1 className="text-2xl font-bold text-foreground">¡Revisá tu correo!</h1>
              <p className="text-muted-foreground">
                Enviamos un enlace de verificación a
              </p>
              {email && (
                <p className="font-semibold text-foreground break-all">{email}</p>
              )}
            </div>

            <div className="rounded-[16px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
                <span className="text-base">⚠️</span> ¡Revisá tu carpeta de spam!
              </div>
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80">
                Hacé clic en el enlace del email para activar tu cuenta. Si no lo encontrás en tu bandeja de entrada, <span className="font-bold">revisá la carpeta de spam o correo no deseado</span>.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Esperando confirmación...
            </div>

            <div className="pt-2 space-y-3">
              <Link to="/login">
                <Button variant="outline" className="w-full rounded-[16px]">
                  Ya confirmé, ir a Iniciar sesión
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                ¿No recibiste el email? Revisá spam o intentá{" "}
                <Link to="/registro/cliente" className="text-primary hover:underline">
                  registrarte de nuevo
                </Link>
              </p>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">¡Email confirmado!</h1>
              <p className="text-muted-foreground">
                Tu cuenta fue verificada exitosamente. Redirigiendo al login...
              </p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ConfirmEmail;
