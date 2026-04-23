import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Mail, 
  ArrowLeft,
  ShieldCheck,
  LifeBuoy,
  Loader2,
  MailCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Ingresá tu email");
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen flex bg-background font-sans">
      
      {/* LADO ESQUERDO: Branding e Empatia (Oculto em Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary relative flex-col justify-between p-12 overflow-hidden">
        
        {/* Efeitos Visuais de Fundo (Mais subtis para acalmar) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600 rounded-full opacity-10 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-primary rounded-full opacity-[0.15] blur-[100px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--secondary-foreground)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--secondary-foreground)/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
        </div>

        {/* Topo: Logótipo Branco */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Servicios 360" className="w-10 h-10 rounded-xl shadow-lg" />
            <span className="text-2xl font-bold tracking-tight text-secondary-foreground">Servicios <span className="text-primary">360</span></span>
          </div>
        </div>

        {/* Meio: Mensagem Empática */}
        <div className="relative z-10 max-w-lg mt-12">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-secondary-foreground mb-6 leading-[1.1]">
            No te preocupes,<br/>a todos nos pasa.
          </h1>
          <p className="text-lg text-secondary-foreground/80 mb-10 leading-relaxed">
            Ingresá el email asociado a tu cuenta y te enviaremos las instrucciones paso a paso para que puedas restablecer tu contraseña de forma segura.
          </p>

          {/* Badges de Confiança (Suporte e Segurança) */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-secondary-foreground bg-secondary-foreground/10 p-3 rounded-xl border border-secondary-foreground/20 w-fit backdrop-blur-sm">
              <ShieldCheck className="text-green-500" size={24} />
              <div>
                <p className="font-semibold text-sm">Recuperación Segura</p>
                <p className="text-xs text-secondary-foreground/70">Tus datos están protegidos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-secondary-foreground bg-secondary-foreground/10 p-3 rounded-xl border border-secondary-foreground/20 w-fit backdrop-blur-sm ml-8">
              <LifeBuoy className="text-blue-500" size={24} />
              <div>
                <p className="font-semibold text-sm">Soporte Técnico</p>
                <p className="text-xs text-secondary-foreground/70">Estamos para ayudarte</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé vazio para equilibrar o layout */}
        <div className="relative z-10 mt-12 pt-8"></div>

      </div>

      {/* LADO DIREITO: Formulário de Recuperação */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-20 relative bg-background">
        
        {/* Botão Voltar ao Login */}
        {!isSuccess && (
          <Link to="/login" className="absolute top-8 left-6 lg:left-12 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10">
            <ArrowLeft size={16} />
            Volver al login
          </Link>
        )}

        <div className="w-full max-w-md mx-auto">
          
          {isSuccess ? (
            /* ESTADO DE SUCESSO (Email Enviado) */
            <div className="text-center animate-[fadeIn_0.5s_ease-out]">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <MailCheck className="text-success" size={40} strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-4">¡Revisá tu bandeja!</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Enviamos un enlace de recuperación seguro a <br/>
                <strong className="text-foreground">{email}</strong>
              </p>
              
              <div className="bg-muted/30 border border-border rounded-xl p-4 mb-8 text-sm text-muted-foreground text-left">
                <p><strong className="text-foreground">¿No recibiste el email?</strong></p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Revisá tu carpeta de Spam.</li>
                  <li>Asegurate de que el email esté bien escrito.</li>
                </ul>
              </div>

              <Link 
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-4 text-foreground bg-background border border-border font-bold rounded-xl hover:bg-muted/50 transition-all text-lg shadow-sm"
              >
                <ArrowLeft size={20} />
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            /* ESTADO INICIAL (Formulário) */
            <div className="animate-[fadeIn_0.3s_ease-out]">
              {/* Header do Formulário */}
              <div className="text-center lg:text-left mb-10 mt-8 lg:mt-0">
                {/* Logo para mobile */}
                <div className="lg:hidden flex justify-center mb-6">
                  <img src={logo} alt="Servicios 360" className="w-16 h-16 rounded-2xl shadow-lg" />
                </div>
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Recuperar Contraseña</h2>
                <p className="text-muted-foreground mt-3 text-sm lg:text-base leading-relaxed">
                  Ingresá tu correo electrónico y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              {/* Formulário */}
              <form onSubmit={handleRecover} className="space-y-6">
                
                {/* Input de Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Email registrado</label>
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
                      className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-4 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground text-base"
                    />
                  </div>
                </div>

                {/* Botão de Submit */}
                <button 
                  type="submit" 
                  disabled={isSubmitting || !email}
                  className={`w-full flex items-center justify-center gap-2 py-4 mt-4 text-primary-foreground font-bold rounded-xl transition-all text-lg ${
                    !email ? 'bg-primary/50 cursor-not-allowed shadow-none' :
                    isSubmitting ? 'bg-primary/70 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5'
                  }`}
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={20} /> Enviando enlace...</>
                  ) : (
                    'Enviar enlace'
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
