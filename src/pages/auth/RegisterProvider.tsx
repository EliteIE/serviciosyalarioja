import { useState, useRef } from "react";
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
  TrendingUp,
  Users,
  Loader2,
  Briefcase,
  UploadCloud,
  ChevronDown,
  FileText,
  X
} from "lucide-react";
import { CATEGORIES } from "@/constants/categories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const validateMagicBytes = async (file: File): Promise<boolean> => {
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // PDF: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return true;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  // WebP: RIFF....WEBP (bytes 0-3 = RIFF)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true;
  return false;
};

const RegisterProvider = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    categoria: "",
    descripcion: "",
    zona: "",
    password: ""
  });

  const [docFiles, setDocFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = [];
    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`Formato no soportado: ${f.name}. Usá JPG, PNG, WEBP o PDF.`);
        continue;
      }
      if (f.size > MAX_DOC_SIZE) {
        toast.error(`${f.name} supera los 5MB.`);
        continue;
      }
      const validBytes = await validateMagicBytes(f);
      if (!validBytes) {
        toast.error(`${f.name} no parece ser un archivo válido. Verificá que sea JPG, PNG, WEBP o PDF.`);
        continue;
      }
      valid.push(f);
    }
    setDocFiles((prev) => [...prev, ...valid].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => setDocFiles((prev) => prev.filter((_, i) => i !== idx));

  const uploadDocs = async (userId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of docFiles) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("provider-docs").upload(path, file);
      if (error) throw error;
      urls.push(path);
    }
    return urls;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.email.trim() || !formData.password || !formData.categoria) {
      toast.error("Completá los campos obligatorios"); return;
    }
    if (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      toast.error("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número"); return;
    }

    setIsSubmitting(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
          data: {
            full_name: formData.nombre.trim(),
            phone: formData.telefono.trim(),
            is_provider: true,
            category: formData.categoria,
            bio: formData.descripcion.trim(),
            coverage: formData.zona.trim(),
          },
        },
      });

      if (error) { toast.error(error.message); return; }

      // Upload documents if any
      if (docFiles.length > 0 && authData.user && authData.session) {
        try {
          const docUrls = await uploadDocs(authData.user.id);
          await supabase.from("profiles").update({
            provider_doc_urls: docUrls,
            provider_verification_status: "pending",
          }).eq("id", authData.user.id);
        } catch {
          toast.warning("Los documentos se podrán subir después de confirmar tu email.");
        }
      }

      navigate(`/confirmar-email?email=${encodeURIComponent(formData.email.trim())}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background font-sans">
      
      {/* LADO ESQUERDO: Proposta de Valor para o Prestador (Oculto em Mobile) */}
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
            <img src={logo} alt="Servicios Ya" className="w-10 h-10 rounded-xl shadow-lg" />
            <span className="text-2xl font-bold tracking-tight text-secondary-foreground">Servicios <span className="text-primary">Ya</span></span>
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground uppercase tracking-wider">Profesionales</span>
          </div>
        </div>

        {/* Meio: Mensagem Principal para Prestador */}
        <div className="relative z-10 max-w-lg mt-12">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-secondary-foreground mb-6 leading-[1.1]">
            Convertite en el profesional más buscado.
          </h1>
          <p className="text-lg text-secondary-foreground/80 mb-10 leading-relaxed">
            Unite a la red de expertos de Servicios Ya. Conseguí nuevos clientes todas las semanas, gestioná tus presupuestos y hacé crecer tu negocio.
          </p>

          {/* Badges de Confiança (Benefícios Prestador) */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-1">
                <TrendingUp className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-secondary-foreground font-bold text-lg">Multiplicá tus ingresos</h3>
                <p className="text-secondary-foreground/70 text-sm mt-1">Accedé a cientos de solicitudes de servicio en tu zona de cobertura.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="text-blue-500" size={24} />
              </div>
              <div>
                <h3 className="text-secondary-foreground font-bold text-lg">Construí tu reputación</h3>
                <p className="text-secondary-foreground/70 text-sm mt-1">Las buenas reseñas de tus clientes te destacarán por encima de la competencia.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do lado esquerdo */}
        <div className="relative z-10 mt-12 pt-8 border-t border-secondary-foreground/20">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-green-500" size={20} />
            <p className="text-sm text-secondary-foreground/80">Tu perfil será validado por nuestro equipo de seguridad.</p>
          </div>
        </div>

      </div>

      {/* LADO DIREITO: Formulário de Registo */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex flex-col h-screen overflow-y-auto bg-background">
        
        <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:px-16 relative">
          
          {/* Botão Voltar */}
          <Link to="/" className="absolute top-8 left-6 lg:left-12 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10">
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>

          <div className="w-full max-w-xl mx-auto mt-12 lg:mt-0">
            
            {/* Header do Formulário */}
            <div className="mb-8 text-center lg:text-left">
              {/* Logo para mobile */}
              <div className="lg:hidden flex justify-center mb-6">
                <img src={logo} alt="Servicios Ya" className="w-16 h-16 rounded-2xl shadow-lg" />
              </div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Registro de Prestador</h2>
              <p className="text-muted-foreground mt-2">Completá tus datos para empezar a ofrecer servicios.</p>
            </div>

            {/* Google Login */}
            <button
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${window.location.origin}/login?oauth_role=provider`,
                    queryParams: { prompt: "select_account" }
                  }
                });
                if (error) toast.error("Error al registrar con Google");
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-muted/50 hover:border-primary/30 transition-all text-sm font-semibold text-foreground shadow-sm mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Registrate con Google
            </button>

            <div className="relative flex items-center py-2 mb-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">O completá el formulario</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* Formulário Completo */}
            <form onSubmit={handleRegister} className="space-y-5">
              
              {/* Secção 1: Dados Pessoais (Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      placeholder="Tu nombre completo" 
                      className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
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
                      value={formData.telefono}
                      onChange={handleChange}
                      placeholder="+54 380 ..." 
                      className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
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
                      className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-border my-2"></div>

              {/* Secção 2: Dados Profissionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Categoría principal <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Briefcase className="text-muted-foreground" size={18} />
                    </div>
                    <select 
                      name="categoria"
                      required
                      value={formData.categoria}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-xl border border-border bg-background pl-11 pr-10 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium cursor-pointer"
                    >
                      <option value="" disabled>Seleccioná tu oficio</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Zona de cobertura <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MapPin className="text-muted-foreground" size={18} />
                    </div>
                    <input 
                      type="text" 
                      name="zona"
                      required
                      value={formData.zona}
                      onChange={handleChange}
                      placeholder="Ej: Capital, Barrio Norte" 
                      className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Descripción de tus servicios</label>
                <textarea 
                  name="descripcion"
                  rows={3}
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Contá qué servicios ofrecés y cuál es tu experiencia..." 
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground resize-none"
                ></textarea>
              </div>

              {/* Upload de Documentação */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">
                  Documentación (DNI, matrícula) <span className="text-muted-foreground font-normal ml-1">— máx. 3 archivos</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div 
                  onClick={() => docFiles.length < 3 && fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed border-border rounded-xl bg-background hover:bg-muted/50 hover:border-primary/50 transition-colors flex flex-col items-center justify-center py-6 ${
                    docFiles.length < 3 ? "cursor-pointer group" : "opacity-60"
                  }`}
                >
                  <div className="w-12 h-12 bg-muted rounded-full shadow-sm flex items-center justify-center mb-2 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors text-center px-4">
                    Hacé clic acá para subir archivos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {docFiles.length < 3 ? "JPG, PNG, WEBP o PDF (máx. 5MB)" : "Máximo 3 archivos alcanzado"}
                  </p>
                </div>
                {docFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {docFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm bg-background">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1 text-foreground">{f.name}</span>
                        <span className="text-muted-foreground text-xs shrink-0">{(f.size / 1024).toFixed(0)}KB</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-destructive hover:text-destructive/80 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground mt-1 text-center bg-muted/50 p-2 rounded-lg">
                  Tus documentos serán revisados por nuestro equipo para verificar tu cuenta y garantizar la seguridad de la plataforma.
                </p>
              </div>

              <div className="w-full h-px bg-border my-2"></div>

              {/* Senha */}
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

              {/* Botão de Submit */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center gap-2 py-4 mt-6 text-primary-foreground font-bold rounded-xl shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all text-lg ${isSubmitting ? 'bg-primary/70 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5'}`}
              >
                {isSubmitting ? (
                  <><Loader2 className="animate-spin" size={20} /> Enviando solicitud...</>
                ) : (
                  'Crear Cuenta de Prestador'
                )}
              </button>
            </form>

            {/* Links Inferiores */}
            <div className="mt-8 pb-8 space-y-4 text-center">
              <p className="text-muted-foreground font-medium text-sm">
                ¿Ya tenés cuenta?{' '}
                <Link to="/login" className="font-bold text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-all">
                  Iniciá sesión
                </Link>
              </p>
              
              <div className="pt-4 border-t border-border mt-6 flex justify-center">
                <Link to="/registro/cliente" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card hover:bg-muted border border-border text-sm font-semibold text-card-foreground transition-colors group">
                  <User size={18} className="text-muted-foreground group-hover:text-blue-500 transition-colors" />
                  ¿Querés contratar servicios? <span className="text-blue-600 group-hover:underline">Registrate como cliente</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterProvider;
