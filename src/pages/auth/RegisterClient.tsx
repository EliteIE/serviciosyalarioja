import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User,
  Mail, 
  Phone,
  MapPin,
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Loader2,
  Briefcase
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const RegisterClient = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    localidad: "",
    password: ""
  });
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.password) {
      toast.error("Completá nombre, email y contraseña");
      return;
    }
    if (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      toast.error("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número");
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email, 
      password: formData.password,
      options: { 
        emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
        data: { 
          full_name: formData.nombre, 
          phone: formData.telefono, 
          location: formData.localidad || "La Rioja", 
          is_provider: false 
        } 
      },
    });
    setIsSubmitting(false);
    
    if (error) { 
      toast.error(error.message); 
      return; 
    }
    
    navigate(`/confirmar-email?email=${encodeURIComponent(formData.email)}`);
  };

  return (
    <div className="min-h-screen flex bg-background font-sans">
      
      {/* LADO ESQUERDO: Benefícios para o Cliente (Oculto em Mobile) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-secondary relative flex-col justify-between p-12 overflow-hidden">
        
        {/* Efeitos Visuais de Fundo */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary rounded-full opacity-20 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-600 rounded-full opacity-10 blur-[100px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--secondary-foreground)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--secondary-foreground)/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
        </div>

        {/* Topo: Logótipo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Servicios 360" width={40} height={40} decoding="async" className="w-10 h-10 rounded-xl shadow-lg" />
            <span className="text-2xl font-bold text-secondary-foreground tracking-tight">Servicios <span className="text-primary">360</span></span>
          </div>
        </div>

        {/* Meio: Mensagem Principal para Cliente */}
        <div className="relative z-10 max-w-lg mt-12">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-secondary-foreground mb-6 leading-[1.1]">
            Resolvé cualquier problema en tu hogar.
          </h1>
          <p className="text-lg text-secondary-foreground/80 mb-10 leading-relaxed">
            Unite a la comunidad. Pedí presupuestos gratis, compará perfiles y contratá al profesional ideal con total tranquilidad.
          </p>

          {/* Badges de Confiança (Benefícios Cliente) */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Clock className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-secondary-foreground font-bold text-lg">Respuestas Rápidas</h3>
                <p className="text-secondary-foreground/70 text-sm mt-1">Recibí presupuestos en minutos, no en días.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                <ShieldCheck className="text-blue-500" size={24} />
              </div>
              <div>
                <h3 className="text-secondary-foreground font-bold text-lg">Contratación Segura</h3>
                <p className="text-secondary-foreground/70 text-sm mt-1">Leé reseñas reales y verificá la identidad del experto antes de decidir.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do lado esquerdo */}
        <div className="relative z-10 mt-12 pt-8 border-t border-secondary-foreground/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-500" size={20} />
            <p className="text-sm text-secondary-foreground/80">Crear tu cuenta es <strong className="text-secondary-foreground">100% gratis</strong>.</p>
          </div>
        </div>

      </div>

      {/* LADO DIREITO: Formulário de Registo */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex flex-col justify-center px-6 py-10 lg:px-16 relative overflow-y-auto bg-background">
        
        {/* Botão Voltar */}
        <Link to="/" className="absolute top-8 left-6 lg:left-12 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10">
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <div className="w-full max-w-lg mx-auto mt-12 xl:mt-0">
          
          {/* Header do Formulário */}
          <div className="mb-8 text-center xl:text-left">
            {/* Logo para mobile */}
            <div className="lg:hidden flex justify-center mb-6">
              <img src={logo} alt="Servicios 360" width={64} height={64} decoding="async" className="w-16 h-16 rounded-2xl shadow-lg" />
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Crear Cuenta</h2>
            <p className="text-muted-foreground mt-2">Registrate como cliente en Servicios 360</p>
          </div>

          {/* Google Login */}
          <button
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/login`,
                  queryParams: { prompt: "select_account" }
                }
              });
              if (error) toast.error("Error al registrar con Google");
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-muted/50 hover:border-primary/30 transition-all text-sm font-semibold text-foreground shadow-sm mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Registrate con Google
          </button>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">O registrate con email</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Formulário Completo */}
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Linha 1: Nome e Telefone (Grid em Desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Nombre completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="text-muted-foreground" size={18} />
                  </div>
                  <input 
                    type="text" 
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre" 
                    className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Teléfono</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="text-muted-foreground" size={18} />
                  </div>
                  <input 
                    type="tel" 
                    name="telefono"
                    required
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="+54 380 ..." 
                    className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Linha 2: Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-muted-foreground" size={18} />
                </div>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com" 
                  className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Linha 3: Localidade */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">Localidad</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="text-muted-foreground" size={18} />
                </div>
                <input 
                  type="text" 
                  name="localidad"
                  required
                  value={formData.localidad}
                  onChange={handleChange}
                  placeholder="Tu ciudad o barrio" 
                  className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Linha 4: Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-muted-foreground" size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número" 
                  className="w-full rounded-xl border border-border bg-background pl-11 pr-12 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Termos e Condições */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Al hacer clic en "Crear Cuenta", aceptás nuestros <Link to="/terminos" className="text-primary hover:underline">Términos de Servicio</Link> y <Link to="/privacidad" className="text-primary hover:underline">Política de Privacidad</Link>.
              </p>
            </div>

            {/* Botão de Submit */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-4 mt-2 text-primary-foreground font-bold rounded-xl shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all text-lg ${isSubmitting ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5'}`}
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={20} /> Creando cuenta...</>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          {/* Links Inferiores */}
          <div className="mt-8 space-y-4 text-center">
            <p className="text-muted-foreground font-medium text-sm">
              ¿Ya tenés cuenta?{' '}
              <Link to="/login" className="font-bold text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-all">
                Iniciá sesión acá
              </Link>
            </p>
            
            {/* Bloco destacado para Prestadores */}
            <div className="pt-4 border-t border-border mt-6 flex justify-center">
              <Link to="/registro/prestador" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card hover:bg-muted border border-border text-sm font-semibold text-card-foreground transition-colors group">
                <Briefcase size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                ¿Querés ofrecer servicios? <span className="text-primary group-hover:underline">Registrate como prestador</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterClient;
