import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Star,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const redirectTo = searchParams.get("redirect");
  const confirmed = searchParams.get("confirmed") === "true";
  const { user, userRole } = useAuth();

  // Clear the confirmed param after showing the message
  useEffect(() => {
    if (confirmed) {
      const timer = setTimeout(() => {
        setSearchParams((prev) => {
          prev.delete("confirmed");
          return prev;
        });
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [confirmed, setSearchParams]);

  // Validate redirect is a safe relative path (prevent open redirect attacks)
  const isSafeRedirect = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") && !redirectTo.startsWith("/\\");

  if (user) {
    if (isSafeRedirect) return <Navigate to={redirectTo} replace />;
    if (userRole === null) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    const dest = userRole === "provider" ? "/prestador" : userRole === "admin" ? "/admin" : "/cliente";
    return <Navigate to={dest} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { 
      toast.error("Completá todos los campos"); 
      return; 
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    
    if (error) { 
      toast.error(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos" : error.message); 
      return; 
    }
    toast.success("¡Bienvenido!");
  };

  return (
    <div className="min-h-screen flex bg-background font-sans">
      
      {/* LADO ESQUERDO: Branding e Proposta de Valor (Oculto em Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary relative flex-col justify-between p-12 overflow-hidden">
        
        {/* Efeitos Visuais de Fundo */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary rounded-full opacity-20 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-600 rounded-full opacity-10 blur-[100px]"></div>
          
          {/* Grelha subtil */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--secondary-foreground)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--secondary-foreground)/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
        </div>

        {/* Topo: Logótipo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Servicios Ya" className="w-10 h-10 rounded-xl shadow-lg" />
            <span className="text-2xl font-bold text-secondary-foreground tracking-tight">Servicios <span className="text-primary">Ya</span></span>
          </div>
        </div>

        {/* Meio: Mensagem Principal */}
        <div className="relative z-10 max-w-lg mt-12">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-secondary-foreground mb-6 leading-[1.1]">
            La red de profesionales más confiable.
          </h1>
          <p className="text-lg text-secondary-foreground/80 mb-10 leading-relaxed">
            Conectamos a miles de clientes con expertos verificados en su zona. Gestioná tus servicios, recibí presupuestos y resolvé todo desde un solo lugar.
          </p>

          {/* Badges de Confiança */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-secondary-foreground bg-secondary-foreground/10 p-3 rounded-xl border border-secondary-foreground/20 w-fit backdrop-blur-sm">
              <ShieldCheck className="text-primary" size={24} />
              <div>
                <p className="font-semibold text-sm">Perfiles Verificados</p>
                <p className="text-xs text-secondary-foreground/70">Identidad comprobada</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-secondary-foreground bg-secondary-foreground/10 p-3 rounded-xl border border-secondary-foreground/20 w-fit backdrop-blur-sm ml-8">
              <Star className="text-yellow-400 fill-yellow-400" size={24} />
              <div>
                <p className="font-semibold text-sm">+10.000 Reseñas</p>
                <p className="text-xs text-secondary-foreground/70">De clientes reales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé: Testemunho (Opcional, dá vida à página) */}
        <div className="relative z-10 mt-12">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-secondary bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground`} style={{ backgroundColor: `hsl(${i * 60 + 150}, 60%, 80%)`}}>
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-secondary-foreground/80 font-medium">Únete a más de <strong className="text-secondary-foreground">50.000</strong> usuarios activos.</p>
          </div>
        </div>

      </div>

      {/* LADO DIREITO: Formulário de Login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-20 relative bg-background">
        
        {/* Botão Voltar (Mobile view & Desktop topo) */}
        <Link to="/" className="absolute top-8 left-6 lg:left-12 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10">
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <div className="w-full max-w-md mx-auto">
          
          {/* Header do Formulário */}
          <div className="text-center mb-10 mt-8 lg:mt-0">
            {/* Logo para mobile */}
            <div className="lg:hidden flex items-center justify-center mb-6">
              <img src={logo} alt="Servicios Ya" className="w-16 h-16 rounded-2xl shadow-lg" />
            </div>
            {confirmed && (
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-success/10 border border-success/20 p-4 text-left">
                <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
                <div>
                  <p className="font-semibold text-success">¡Cuenta activada con éxito!</p>
                  <p className="text-sm text-foreground/80">Tu email fue verificado. Ya podés iniciar sesión.</p>
                </div>
              </div>
            )}
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">¡Hola de nuevo!</h2>
            <p className="text-muted-foreground mt-2">Ingresá a tu cuenta de Servicios Ya</p>
          </div>

          {/* Social Logins (Google / Apple) */}
          <div className="flex gap-3 mb-6">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl hover:bg-muted/50 transition-colors text-sm font-semibold text-foreground shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl hover:bg-muted/50 transition-colors text-sm font-semibold text-foreground shadow-sm">
              <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.31-.85 3.73-.8 1.44.05 2.53.64 3.24 1.55-2.8 1.48-2.3 5.31.42 6.55-.66 1.83-1.6 3.7-2.47 4.87zm-2.89-14.73c.7-1.12 1.17-2.45.92-3.8-1.12.11-2.56.88-3.32 1.88-.72.88-1.28 2.26-1.03 3.55 1.25.16 2.56-.63 3.43-1.63z" />
              </svg>
              Apple
            </button>
          </div>

          <div className="relative flex items-center py-5">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-medium">O continuá con email</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Formulário Tradicional */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Input de Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-muted-foreground" size={20} />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com" 
                  className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3.5 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Input de Senha */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-foreground">Contraseña</label>
                <Link to="/recuperar" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-muted-foreground" size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full rounded-xl border border-border bg-background pl-11 pr-12 py-3.5 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium tracking-widest placeholder:tracking-normal placeholder:text-muted-foreground"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Botão de Submit */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-4 mt-2 text-primary-foreground font-bold rounded-xl shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all text-lg ${isSubmitting ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5'}`}
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={20} /> Ingresando...</>
              ) : (
                'Ingresar a mi cuenta'
              )}
            </button>
          </form>

          {/* Link para Registo */}
          <p className="text-center text-muted-foreground font-medium mt-8">
            ¿No tenés cuenta?{' '}
            <Link to="/registro/cliente" className="font-bold text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-all">
              Registrate gratis
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;
