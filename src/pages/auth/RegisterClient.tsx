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
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Loader2,
  Briefcase,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { translateSupabaseError } from "@/lib/translateError";
import { LA_RIOJA_CITIES } from "@/constants/locations";
import { PROVIDER_INTAKE_PATH } from "@/constants/external";
import logo from "@/assets/logo.png";

const TOTAL_STEPS = 4;

const RegisterClient = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    localidad: "",
    password: ""
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData({ ...formData, telefono: digits });
  };

  // Validação por step
  const canAdvance = (): boolean => {
    switch (step) {
      case 1: return !!(formData.nombre.trim() && formData.telefono.length === 10);
      case 2: return !!(formData.email.trim() && formData.password.length >= 8);
      case 3: return !!formData.localidad;
      case 4: return termsAccepted;
      default: return false;
    }
  };

  const nextStep = async () => {
    if (step === 1 && formData.telefono.length !== 10) {
      toast.error("El teléfono debe tener exactamente 10 dígitos.");
      return;
    }
    if (step === 2) {
      if (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
        toast.error("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.");
        return;
      }
      
      // Verify if email is already registered before advancing
      setIsSubmitting(true);
      try {
        const { data: emailExists, error } = await supabase.rpc('check_email_exists', { 
          check_email: formData.email 
        });
        
        if (!error && emailExists) {
          toast.error("Este email ya está registrado. Iniciá sesión o recuperá tu contraseña.");
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error("Error checking email:", err);
      }
      setIsSubmitting(false);
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const handleGoogleSignup = async () => {
    if (!termsAccepted) {
      toast.error("Aceptá los Términos y la Política de Privacidad para continuar.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: { prompt: "select_account" }
      }
    });
    if (error) toast.error(translateSupabaseError(error.message));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdvance()) return;

    setIsSubmitting(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
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

      if (error) {
        toast.error(translateSupabaseError(error.message));
        return;
      }

      // Detect duplicate email (Supabase returns fake user with no identities)
      if (authData.user && (!authData.user.identities || authData.user.identities.length === 0)) {
        toast.error("Este email ya está registrado. Iniciá sesión o recuperá tu contraseña.");
        return;
      }

      if (authData.user) {
        await supabase
          .from("profiles")
          .update({ terms_accepted_at: new Date().toISOString() })
          .eq("id", authData.user.id);
      }

      navigate(`/confirmar-email?email=${encodeURIComponent(formData.email)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step titles
  const stepTitles = [
    "Datos personales",
    "Tu cuenta",
    "Ubicación",
    "Confirmación"
  ];

  return (
    <div className="min-h-screen flex bg-background font-sans">
      
      {/* LEFT PANEL — Benefits */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-secondary relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary rounded-full opacity-20 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-600 rounded-full opacity-10 blur-[100px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--secondary-foreground)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--secondary-foreground)/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="Servicios 360" width={40} height={40} decoding="async" className="w-10 h-10 rounded-[16px] shadow-lg" />
            <span className="text-2xl font-bold text-secondary-foreground tracking-tight">Servicios <span className="text-primary">360</span></span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg mt-12">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-secondary-foreground mb-6 leading-[1.1]">
            Resolvé cualquier problema en tu hogar.
          </h1>
          <p className="text-lg text-secondary-foreground/80 mb-10 leading-relaxed">
            Unite a la comunidad. Pedí presupuestos gratis, compará perfiles y contratá al profesional ideal con total tranquilidad.
          </p>

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

        <div className="relative z-10 mt-12 pt-8 border-t border-secondary-foreground/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-500" size={20} />
            <p className="text-sm text-secondary-foreground/80">Crear tu cuenta es <strong className="text-secondary-foreground">100% gratis</strong>.</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Wizard Form */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex flex-col justify-center px-6 py-10 lg:px-16 relative overflow-y-auto bg-background">
        
        <Link to="/" className="absolute top-8 left-6 lg:left-12 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10">
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <div className="w-full max-w-lg mx-auto mt-12 xl:mt-0">
          
          {/* Header */}
          <div className="mb-8 text-center xl:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <Link to="/">
                <img src={logo} alt="Servicios 360" width={64} height={64} decoding="async" className="w-16 h-16 rounded-[24px] shadow-lg" />
              </Link>
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Crear Cuenta</h2>
            <p className="text-muted-foreground mt-2">Registrate como cliente en Servicios 360</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {stepTitles.map((title, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    i + 1 < step ? 'bg-primary text-primary-foreground' :
                    i + 1 === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1 < step ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium text-center leading-tight hidden sm:block ${
                    i + 1 <= step ? 'text-foreground' : 'text-muted-foreground'
                  }`}>{title}</span>
                </div>
              ))}
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* STEP 1: Personal Data */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Nombre completo <span className="text-red-500">*</span></label>
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
                      autoComplete="name"
                      className="w-full rounded-[16px] border border-border/50 bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Teléfono <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="text-muted-foreground" size={18} />
                    </div>
                    <input 
                      type="tel" 
                      name="telefono"
                      required
                      inputMode="numeric"
                      value={formData.telefono}
                      onChange={handlePhoneChange}
                      placeholder="3804123456 (10 dígitos)" 
                      maxLength={10}
                      className="w-full rounded-[16px] border border-border/50 bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{formData.telefono.length}/10 dígitos</p>
                </div>
              </div>
            )}

            {/* STEP 2: Account */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Email <span className="text-red-500">*</span></label>
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
                      autoComplete="email"
                      className="w-full rounded-[16px] border border-border/50 bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Contraseña <span className="text-red-500">*</span></label>
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
                      placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número" 
                      autoComplete="new-password"
                      className="w-full rounded-[16px] border border-border/50 bg-background pl-11 pr-12 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
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
              </div>
            )}

            {/* STEP 3: Location */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Localidad <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MapPin className="text-muted-foreground" size={18} />
                    </div>
                    <select
                      name="localidad"
                      required
                      value={formData.localidad}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-[16px] border border-border/50 bg-background pl-11 pr-10 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium cursor-pointer"
                    >
                      <option value="" disabled>Seleccioná tu ciudad</option>
                      {LA_RIOJA_CITIES.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Confirm */}
            {step === 4 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* Summary */}
                <div className="rounded-[20px] border border-border/50 bg-muted/30 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-foreground">Resumen de tu cuenta</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Nombre:</span><p className="font-semibold text-foreground">{formData.nombre}</p></div>
                    <div><span className="text-muted-foreground">Teléfono:</span><p className="font-semibold text-foreground">{formData.telefono}</p></div>
                    <div><span className="text-muted-foreground">Email:</span><p className="font-semibold text-foreground truncate">{formData.email}</p></div>
                    <div><span className="text-muted-foreground">Localidad:</span><p className="font-semibold text-foreground">{formData.localidad}</p></div>
                  </div>
                </div>

                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={!termsAccepted}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-full transition-all text-sm font-semibold shadow-sm ${
                    termsAccepted
                      ? "hover:bg-muted/50 hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98] text-foreground cursor-pointer"
                      : "text-muted-foreground/60 cursor-not-allowed opacity-60"
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Registrate con Google
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">O con email</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    required
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Acepto los{" "}
                    <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                      Términos de Servicio
                    </Link>{" "}
                    y la{" "}
                    <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                      Política de Privacidad
                    </Link>{" "}
                    de Servicios 360. <span className="text-red-500" aria-hidden="true">*</span>
                  </span>
                </label>
              </div>
            )}

            {/* Wizard Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-muted transition-all active:scale-[0.98]"
                >
                  <ArrowLeft size={16} /> Anterior
                </button>
              )}

              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canAdvance()}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all ${
                    canAdvance()
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 active:scale-[0.98] shadow-[0_4px_14px_0_rgba(234,88,12,0.3)]'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  Siguiente <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !termsAccepted}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-primary-foreground font-semibold rounded-full shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all text-lg ${
                    isSubmitting || !termsAccepted
                      ? 'bg-primary/50 cursor-not-allowed shadow-none'
                      : 'bg-primary hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={20} /> Creando cuenta...</>
                  ) : (
                    'Crear Cuenta'
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-8 space-y-4 text-center">
            <p className="text-muted-foreground font-medium text-sm">
              ¿Ya tenés cuenta?{' '}
              <Link to="/login" className="font-bold text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-all">
                Iniciá sesión acá
              </Link>
            </p>
            
            <div className="pt-4 border-t border-border mt-6 flex justify-center">
              <Link to={PROVIDER_INTAKE_PATH} className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-card hover:bg-muted border border-border/50 text-sm font-semibold text-card-foreground transition-all group hover:-translate-y-0.5 active:scale-[0.98]">
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
