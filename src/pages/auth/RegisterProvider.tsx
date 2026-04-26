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
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  Loader2,
  Briefcase,
  UploadCloud,
  ChevronDown,
  FileText,
  X,
  CheckCircle2,
  Info,
  IdCard,
} from "lucide-react";
import { CATEGORIES } from "@/constants/categories";
import { LA_RIOJA_CITIES } from "@/constants/locations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { translateSupabaseError } from "@/lib/translateError";
import { isValidCuit, normalizeCuit, formatCuit } from "@/lib/cuit";
import logo from "@/assets/logo.png";

const TOTAL_STEPS = 5;
const STEP_TITLES = ["Datos personales", "Tu cuenta", "Perfil profesional", "Documentación", "Confirmación"];

const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// File magic-byte sniffing so we don't trust a renamed .exe with a .pdf
// extension. We only let JPG / PNG / WEBP / PDF through.
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

// Three mandatory documents. Keying the state by slot makes it obvious
// to the admin team which file is which and lets us gate submission.
type DocSlot = "dniFront" | "dniBack" | "criminalRecord";

const DOC_META: Record<DocSlot, { label: string; hint: string }> = {
  dniFront: {
    label: "DNI â€” Frente",
    hint: "Foto clara del frente de tu DNI. No recortes los bordes.",
  },
  dniBack: {
    label: "DNI â€” Dorso",
    hint: "Foto clara del dorso. Tiene que verse el código de barras.",
  },
  criminalRecord: {
    label: "Antecedentes Penales",
    hint: "Certificado emitido por el Registro Nacional de Reincidencia (vigente).",
  },
};

const DOC_SLOTS: DocSlot[] = ["dniFront", "dniBack", "criminalRecord"];

const RegisterProvider = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cuit: "",
    categoria: "",
    descripcion: "",
    zona: "",
    password: "",
  });

  const [docs, setDocs] = useState<Record<DocSlot, File | null>>({
    dniFront: null,
    dniBack: null,
    criminalRecord: null,
  });
  const fileRefs: Record<DocSlot, React.RefObject<HTMLInputElement>> = {
    dniFront: useRef<HTMLInputElement>(null),
    dniBack: useRef<HTMLInputElement>(null),
    criminalRecord: useRef<HTMLInputElement>(null),
  };
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData({ ...formData, telefono: digits });
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 1: return !!(formData.nombre.trim() && formData.telefono.length === 10 && isValidCuit(formData.cuit));
      case 2: return !!(formData.email.trim() && formData.password.length >= 8);
      case 3: return !!(formData.categoria && formData.zona);
      case 4: return allDocsPresent;
      case 5: return termsAccepted;
      default: return false;
    }
  };

  const nextStep = () => {
    if (step === 1 && formData.telefono.length !== 10) {
      toast.error("El teléfono debe tener exactamente 10 dígitos.");
      return;
    }
    if (step === 2 && (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password))) {
      toast.error("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.");
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const handleDocSelect = async (slot: DocSlot, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(`Formato no soportado en ${DOC_META[slot].label}. Usá JPG, PNG, WEBP o PDF.`);
      if (fileRefs[slot].current) fileRefs[slot].current!.value = "";
      return;
    }
    if (file.size > MAX_DOC_SIZE) {
      toast.error(`${DOC_META[slot].label} supera los 5MB.`);
      if (fileRefs[slot].current) fileRefs[slot].current!.value = "";
      return;
    }
    const validBytes = await validateMagicBytes(file);
    if (!validBytes) {
      toast.error(`${file.name} no parece ser un archivo válido. Verificá que sea JPG, PNG, WEBP o PDF.`);
      if (fileRefs[slot].current) fileRefs[slot].current!.value = "";
      return;
    }

    setDocs((prev) => ({ ...prev, [slot]: file }));
  };

  const removeDoc = (slot: DocSlot) => {
    setDocs((prev) => ({ ...prev, [slot]: null }));
    if (fileRefs[slot].current) fileRefs[slot].current!.value = "";
  };

  const allDocsPresent = DOC_SLOTS.every((s) => docs[s] !== null);

  // Upload each slot to its own deterministic path under the user's folder.
  // Storage RLS already enforces (foldername)[1] = auth.uid()::text.
  const uploadDocs = async (userId: string) => {
    const uploaded: Partial<Record<DocSlot, string>> = {};
    for (const slot of DOC_SLOTS) {
      const file = docs[slot];
      if (!file) continue;
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${userId}/${slot}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("provider-docs").upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      uploaded[slot] = path;
    }
    return uploaded;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdvance()) return;

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
            cuit: normalizeCuit(formData.cuit),
            is_provider: true,
            category: formData.categoria,
            bio: formData.descripcion.trim(),
            coverage: formData.zona.trim(),
          },
        },
      });

      if (error) {
        toast.error(translateSupabaseError(error.message));
        return;
      }

      // Detect duplicate email
      if (authData.user && (!authData.user.identities || authData.user.identities.length === 0)) {
        toast.error("Este email ya está registrado. Iniciá sesión o recuperá tu contraseña.");
        return;
      }

      if (authData.user && authData.session) {
        try {
          const urls = await uploadDocs(authData.user.id);
          await supabase
            .from("profiles")
            .update({
              provider_dni_front_url: urls.dniFront ?? null,
              provider_dni_back_url: urls.dniBack ?? null,
              provider_criminal_record_url: urls.criminalRecord ?? null,
              provider_verification_status: "pending",
              terms_accepted_at: new Date().toISOString(),
              cuit: normalizeCuit(formData.cuit),
            })
            .eq("id", authData.user.id);
        } catch (uploadErr) {
          console.error("[register-provider] doc upload failed", uploadErr);
          toast.warning(
            "Tu cuenta se creó pero no pudimos subir los documentos ahora. Vas a poder terminar desde tu panel.",
          );
        }
      }

      navigate(`/confirmar-email?email=${encodeURIComponent(formData.email.trim())}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background font-sans">

      {/* LEFT PANEL â€” provider value proposition */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-secondary relative flex-col justify-between p-12 overflow-hidden">

        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary rounded-full opacity-20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-600 rounded-full opacity-10 blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--secondary-foreground)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--secondary-foreground)/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="Servicios 360" width={40} height={40} decoding="async" className="w-10 h-10 rounded-[16px] shadow-lg" />
            <span className="text-2xl font-bold tracking-tight text-secondary-foreground">
              Servicios <span className="text-primary">360</span>
            </span>
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground uppercase tracking-wider">
              Profesionales
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg mt-12">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-secondary-foreground mb-6 leading-[1.1]">
            Convertite en el profesional más buscado.
          </h1>
          <p className="text-lg text-secondary-foreground/80 mb-10 leading-relaxed">
            Unite a la red de expertos de Servicios 360. Conseguí nuevos clientes todas las semanas, gestioná tus presupuestos y hacé crecer tu negocio.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-1">
                <TrendingUp className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-secondary-foreground font-bold text-lg">Multiplicá tus ingresos</h3>
                <p className="text-secondary-foreground/70 text-sm mt-1">
                  Accedé a cientos de solicitudes de servicio en tu zona de cobertura.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="text-blue-500" size={24} />
              </div>
              <div>
                <h3 className="text-secondary-foreground font-bold text-lg">Construí tu reputación</h3>
                <p className="text-secondary-foreground/70 text-sm mt-1">
                  Las buenas reseñas de tus clientes te destacarán por encima de la competencia.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 pt-8 border-t border-secondary-foreground/20">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-green-500" size={20} />
            <p className="text-sm text-secondary-foreground/80">
              Tu perfil será validado por nuestro equipo de seguridad.
            </p>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL â€” Wizard */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex flex-col h-screen overflow-y-auto bg-background">
        <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:px-16 relative">

          <Link to="/" className="absolute top-8 left-6 lg:left-12 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10">
            <ArrowLeft size={16} /> Volver al inicio
          </Link>

          <div className="w-full max-w-xl mx-auto mt-12 lg:mt-0">

            <div className="mb-8 text-center lg:text-left">
              <div className="lg:hidden flex justify-center mb-6">
                <Link to="/"><img src={logo} alt="Servicios 360" width={64} height={64} decoding="async" className="w-16 h-16 rounded-[24px] shadow-lg" /></Link>
              </div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Registro de Prestador</h2>
              <p className="text-muted-foreground mt-2">Completá tus datos paso a paso para empezar a ofrecer servicios.</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                {STEP_TITLES.map((title, i) => (
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
                <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }} />
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-5" noValidate>

              {/* STEP 1 â€” Personal Data */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Nombre completo <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="text-muted-foreground" size={18} /></div>
                      <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder="Tu nombre completo" autoComplete="name" className="w-full rounded-[16px] border border-border/50 bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Teléfono <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone className="text-muted-foreground" size={18} /></div>
                      <input type="tel" name="telefono" required inputMode="numeric" value={formData.telefono} onChange={handlePhoneChange} placeholder="3804123456 (10 dígitos)" maxLength={10} className="w-full rounded-[16px] border border-border/50 bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{formData.telefono.length}/10 dígitos</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">CUIT / CUIL <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><IdCard className="text-muted-foreground" size={18} /></div>
                      <input type="text" inputMode="numeric" name="cuit" required value={formData.cuit} onChange={(e) => { const raw = e.target.value.replace(/[^\d-]/g, "").slice(0, 13); setFormData((f) => ({ ...f, cuit: raw })); }} onBlur={() => { const digits = normalizeCuit(formData.cuit); if (digits.length === 11) setFormData((f) => ({ ...f, cuit: formatCuit(digits) })); }} placeholder="20-12345678-9" autoComplete="off" className="w-full rounded-[16px] border border-border/50 bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Tu CUIT/CUIL de 11 dígitos para validar tu identidad fiscal.</p>
                  </div>
                </div>
              )}

              {/* STEP 2 â€” Account */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="text-muted-foreground" size={18} /></div>
                      <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="tu@email.com" autoComplete="email" className="w-full rounded-[16px] border border-border/50 bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Contraseña <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="text-muted-foreground" size={18} /></div>
                      <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número" autoComplete="new-password" className="w-full rounded-[16px] border border-border/50 bg-background pl-11 pr-12 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-[24px] border border-info/30 bg-info/5 p-4">
                    <Info size={18} className="text-info mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/80 leading-relaxed">El registro de prestador es solo por email. Necesitamos verificar tu documentación.</p>
                  </div>
                </div>
              )}

              {/* STEP 3 â€” Professional Profile */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Categoría principal <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Briefcase className="text-muted-foreground" size={18} /></div>
                      <select name="categoria" required value={formData.categoria} onChange={handleChange} className="w-full appearance-none rounded-[16px] border border-border/50 bg-background pl-11 pr-10 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium cursor-pointer">
                        <option value="" disabled>Seleccioná tu oficio</option>
                        {CATEGORIES.map((cat) => (<option key={cat.id} value={cat.slug}>{cat.name}</option>))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Zona de cobertura <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin className="text-muted-foreground" size={18} /></div>
                      <select name="zona" required value={formData.zona} onChange={handleChange} className="w-full appearance-none rounded-[16px] border border-border/50 bg-background pl-11 pr-10 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium cursor-pointer">
                        <option value="" disabled>Seleccioná tu ciudad</option>
                        {LA_RIOJA_CITIES.map((city) => (<option key={city} value={city}>{city}</option>))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Descripción de tus servicios</label>
                    <textarea name="descripcion" rows={3} value={formData.descripcion} onChange={handleChange} placeholder="Contá qué servicios ofrecés y cuál es tu experiencia..." className="w-full rounded-[16px] border border-border/50 bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground resize-none" />
                  </div>
                </div>
              )}

              {/* STEP 4 â€” Documents */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Documentación obligatoria <span className="text-red-500">*</span></h3>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP o PDF. Máx. 5 MB cada uno.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {DOC_SLOTS.map((slot) => {
                      const file = docs[slot];
                      const { label, hint } = DOC_META[slot];
                      return (
                        <div key={slot}>
                          <input ref={fileRefs[slot]} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => handleDocSelect(slot, e)} aria-label={label} />
                          {!file ? (
                            <button type="button" onClick={() => fileRefs[slot].current?.click()} className="w-full flex items-center gap-3 rounded-[24px] border-2 border-dashed border-border/60 bg-background hover:bg-muted/40 hover:border-primary/50 transition-colors p-4 text-left group">
                              <div className="w-11 h-11 rounded-[16px] bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors"><UploadCloud size={20} /></div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">{label} <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-red-500">Requerido</span></p>
                                <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                              </div>
                            </button>
                          ) : (
                            <div className="w-full flex items-center gap-3 rounded-[24px] border border-success/30 bg-success/5 p-3">
                              <div className="w-11 h-11 rounded-[16px] bg-success/15 text-success flex items-center justify-center shrink-0"><CheckCircle2 size={20} /></div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">{label}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5"><FileText size={12} className="shrink-0" /><span className="truncate">{file.name}</span><span className="shrink-0">· {(file.size / 1024).toFixed(0)} KB</span></div>
                              </div>
                              <button type="button" onClick={() => removeDoc(slot)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1" aria-label={`Quitar ${label}`}><X size={18} /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground bg-muted/50 p-2.5 rounded-[16px] leading-relaxed">Tus documentos se guardan cifrados y solo los ven nuestros verificadores.</p>
                </div>
              )}

              {/* STEP 5 â€” Confirmation */}
              {step === 5 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="rounded-[20px] border border-border/50 bg-muted/30 p-5 space-y-3">
                    <h3 className="text-sm font-bold text-foreground">Resumen de tu solicitud</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Nombre:</span><p className="font-semibold text-foreground">{formData.nombre}</p></div>
                      <div><span className="text-muted-foreground">Teléfono:</span><p className="font-semibold text-foreground">{formData.telefono}</p></div>
                      <div><span className="text-muted-foreground">CUIT:</span><p className="font-semibold text-foreground">{formData.cuit}</p></div>
                      <div><span className="text-muted-foreground">Email:</span><p className="font-semibold text-foreground truncate">{formData.email}</p></div>
                      <div><span className="text-muted-foreground">Categoría:</span><p className="font-semibold text-foreground">{CATEGORIES.find(c => c.slug === formData.categoria)?.name || formData.categoria}</p></div>
                      <div><span className="text-muted-foreground">Zona:</span><p className="font-semibold text-foreground">{formData.zona}</p></div>
                    </div>
                    <div className="text-sm"><span className="text-muted-foreground">Documentos:</span><p className="font-semibold text-foreground">{DOC_SLOTS.filter(s => docs[s]).length}/3 cargados âœ“</p></div>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30 cursor-pointer" required />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      Declaro que la información y documentación son verídicas y acepto los{" "}
                      <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Términos de Servicio</Link>{" "}y la{" "}
                      <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Política de Privacidad</Link>{" "}de Servicios 360. <span className="text-red-500">*</span>
                    </span>
                  </label>
                </div>
              )}

              {/* Wizard Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {step > 1 && (
                  <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-3 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-muted transition-all active:scale-[0.98]">
                    <ArrowLeft size={16} /> Anterior
                  </button>
                )}
                {step < TOTAL_STEPS ? (
                  <button type="button" onClick={nextStep} disabled={!canAdvance()} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all ${canAdvance() ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 active:scale-[0.98] shadow-[0_4px_14px_0_rgba(234,88,12,0.3)]' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                    Siguiente <ArrowRight size={16} />
                  </button>
                ) : (
                  <button type="submit" disabled={isSubmitting || !termsAccepted} className={`flex-1 flex items-center justify-center gap-2 py-4 text-primary-foreground font-semibold rounded-full shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all text-lg ${isSubmitting || !termsAccepted ? 'bg-primary/50 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5 active:scale-[0.98]'}`}>
                    {isSubmitting ? (<><Loader2 className="animate-spin" size={20} /> Enviando solicitud...</>) : "Crear Cuenta de Prestador"}
                  </button>
                )}
              </div>
            </form>

            {/* Footer links */}
            <div className="mt-8 pb-8 space-y-4 text-center">
              <p className="text-muted-foreground font-medium text-sm">
                ¿Ya tenés cuenta?{" "}
                <Link to="/login" className="font-bold text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-all">Iniciá sesión</Link>
              </p>
              <div className="pt-4 border-t border-border mt-6 flex justify-center">
                <Link to="/registro/cliente" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-card hover:bg-muted border border-border/50 text-sm font-semibold text-card-foreground transition-all group hover:-translate-y-0.5 active:scale-[0.98]">
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
