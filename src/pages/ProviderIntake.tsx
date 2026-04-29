import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Phone as PhoneIcon,
  Mail as MailIcon,
  User as UserIcon,
  Briefcase,
  Users,
} from "lucide-react";
import { CATEGORIES } from "@/constants/categories";
import { toast } from "sonner";
import {
  useSubmitProviderIntake,
  type ProviderIntakeStep1,
  type ProviderIntakeStep2,
} from "@/hooks/useProviderIntake";
import logo from "@/assets/logo.png";

type Phase = "step1" | "transition" | "step2" | "done";

const SOURCE_OPTIONS = [
  { value: "redes_sociales", label: "Redes sociales" },
  { value: "referido", label: "Referido" },
  { value: "ministerio", label: "Ministerio" },
  { value: "otro", label: "Otro" },
] as const;

const YEARS_OPTIONS = [
  { value: "<1", label: "Menos de 1 año" },
  { value: "1-3", label: "1 a 3 años" },
  { value: "3-5", label: "3 a 5 años" },
  { value: "5-10", label: "5 a 10 años" },
  { value: "10+", label: "Más de 10 años" },
] as const;

const TEAM_OPTIONS = [
  { value: "solo", label: "Solo" },
  { value: "2-3", label: "2-3 personas" },
  { value: "equipo_formal", label: "Equipo formal" },
] as const;

const CAPACITY_OPTIONS = [
  { value: "1-3", label: "1-3 servicios" },
  { value: "4-7", label: "4-7 servicios" },
  { value: "8-15", label: "8-15 servicios" },
  { value: "15+", label: "Más de 15" },
] as const;

const VEHICLE_OPTIONS = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "moto", label: "Moto" },
] as const;

const CUIT_OPTIONS = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "no_se", label: "No sé" },
] as const;

const ProviderIntake = () => {
  const [phase, setPhase] = useState<Phase>("step1");

  // ----- Estado Passo 1 -----
  const [step1, setStep1] = useState<ProviderIntakeStep1>({
    full_name: "",
    phone: "",
    email: "",
    category: "",
    source: "redes_sociales",
  });

  // ----- Estado Passo 2 -----
  const [step2, setStep2] = useState<ProviderIntakeStep2>({});

  // ----- Refs auxiliares -----
  const submitMutation = useSubmitProviderIntake();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setStep1((s) => ({ ...s, phone: digits }));
  };

  const canSubmitStep1 =
    step1.full_name.trim().length >= 2 &&
    step1.phone.length === 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.email) &&
    !!step1.category &&
    !!step1.source;

  const goToTransition = () => {
    if (!canSubmitStep1) {
      toast.error("Revisá los campos del paso 1");
      return;
    }
    setPhase("transition");
  };

  const submitNow = async (includeStep2: boolean) => {
    try {
      const payload = includeStep2
        ? { step1, step2: cleanStep2(step2) }
        : { step1 };
      await submitMutation.mutateAsync(payload);
      setPhase("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al enviar";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Top bar */}
      <header className="w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 group"
            aria-label="Volver al inicio"
          >
            <img
              src={logo}
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 rounded-xl"
            />
            <span className="text-base font-semibold text-foreground tracking-tight">
              Servicios <span className="text-primary">360</span>
            </span>
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 min-h-[44px] px-3 -mr-3"
          >
            <ArrowLeft size={14} /> Volver
          </Link>
        </div>
      </header>

      {/* Hero compacto */}
      {phase !== "done" && (
        <section className="w-full bg-gradient-to-b from-primary/[0.05] to-transparent border-b border-border/40">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-center">
            <div className="inline-flex items-center gap-2 bg-riojano/10 text-riojano px-3 py-1 rounded-full text-xs font-semibold mb-4">
              <Sparkles size={12} />
              Captación abierta solo en La Rioja Capital · 2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-2">
              Quiero ofrecer mis servicios
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              Contanos brevemente sobre vos y tu oficio. Te vamos a contactar en
              24-48hs hábiles para una entrevista personal.
            </p>
          </div>
        </section>
      )}

      {/* Conteúdo */}
      <main className="flex-1 w-full">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          {phase === "step1" && (
            <Step1Form
              data={step1}
              onChange={setStep1}
              onPhoneChange={handlePhoneChange}
              onContinue={goToTransition}
              canContinue={canSubmitStep1}
            />
          )}

          {phase === "transition" && (
            <TransitionScreen
              fullName={step1.full_name}
              phone={step1.phone}
              loading={submitMutation.isPending}
              onContinue={() => setPhase("step2")}
              onFinish={() => submitNow(false)}
            />
          )}

          {phase === "step2" && (
            <Step2Form
              data={step2}
              onChange={setStep2}
              loading={submitMutation.isPending}
              onSubmit={() => submitNow(true)}
              onBack={() => setPhase("transition")}
            />
          )}

          {phase === "done" && <DoneScreen fullName={step1.full_name} />}
        </div>
      </main>
    </div>
  );
};

// =====================================================================
// Helpers
// =====================================================================

function cleanStep2(s: ProviderIntakeStep2): ProviderIntakeStep2 {
  // Remove campos vazios/falsy do payload pra economizar storage e
  // manter consistência com a validação Zod do backend.
  const out: ProviderIntakeStep2 = {};
  if (s.years_experience) out.years_experience = s.years_experience;
  if (s.description?.trim()) out.description = s.description.trim();
  if (s.secondary_categories?.length)
    out.secondary_categories = s.secondary_categories;
  if (s.team_type) out.team_type = s.team_type;
  if (s.weekly_capacity) out.weekly_capacity = s.weekly_capacity;
  if (s.vehicle) out.vehicle = s.vehicle;
  if (s.has_cuit) out.has_cuit = s.has_cuit;
  if (s.extra_notes?.trim()) out.extra_notes = s.extra_notes.trim();
  if (
    s.reference_1?.name?.trim() ||
    s.reference_1?.phone?.trim() ||
    s.reference_1?.relation?.trim()
  ) {
    out.reference_1 = {
      name: s.reference_1?.name?.trim(),
      phone: s.reference_1?.phone?.trim(),
      relation: s.reference_1?.relation?.trim(),
    };
  }
  if (
    s.reference_2?.name?.trim() ||
    s.reference_2?.phone?.trim() ||
    s.reference_2?.relation?.trim()
  ) {
    out.reference_2 = {
      name: s.reference_2?.name?.trim(),
      phone: s.reference_2?.phone?.trim(),
      relation: s.reference_2?.relation?.trim(),
    };
  }
  return out;
}

const inputClass =
  "w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground";
const labelClass = "block text-sm font-semibold text-foreground mb-1.5";
const fieldHintClass = "text-xs text-muted-foreground mt-1";
const sectionClass =
  "bg-card rounded-2xl border border-border/60 p-5 sm:p-6 space-y-5";

// =====================================================================
// Step 1
// =====================================================================

type Step1Props = {
  data: ProviderIntakeStep1;
  onChange: React.Dispatch<React.SetStateAction<ProviderIntakeStep1>>;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContinue: () => void;
  canContinue: boolean;
};

const Step1Form = ({
  data,
  onChange,
  onPhoneChange,
  onContinue,
  canContinue,
}: Step1Props) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onContinue();
    }}
    className="space-y-6"
  >
    <div className={sectionClass}>
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs tabular-nums">
          1
        </span>
        Tus datos
      </div>

      <div>
        <label htmlFor="full_name" className={labelClass}>
          Nombre y apellido <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <UserIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            id="full_name"
            type="text"
            value={data.full_name}
            onChange={(e) =>
              onChange((s) => ({ ...s, full_name: e.target.value }))
            }
            placeholder="Juan Pérez"
            autoComplete="name"
            required
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>
          Teléfono / WhatsApp <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <PhoneIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={data.phone}
            onChange={onPhoneChange}
            placeholder="3804123456 (10 dígitos)"
            autoComplete="tel"
            maxLength={10}
            required
            className={`${inputClass} pl-9 tabular-nums`}
          />
        </div>
        <p className={fieldHintClass}>{data.phone.length}/10 dígitos</p>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <MailIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) =>
              onChange((s) => ({ ...s, email: e.target.value.trim() }))
            }
            placeholder="tu@email.com"
            autoComplete="email"
            required
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>
    </div>

    <div className={sectionClass}>
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs tabular-nums">
          2
        </span>
        Tu oficio
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>
          Oficio principal <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Briefcase
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <select
            id="category"
            value={data.category}
            onChange={(e) =>
              onChange((s) => ({ ...s, category: e.target.value }))
            }
            required
            className={`${inputClass} pl-9 appearance-none cursor-pointer`}
          >
            <option value="" disabled>
              Seleccioná tu oficio
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>
          ¿Cómo nos conociste? <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SOURCE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => onChange((s) => ({ ...s, source: opt.value }))}
              className={`text-sm font-medium px-3 py-2.5 rounded-xl border transition-colors min-h-[44px] ${
                data.source === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border/60 hover:border-border"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    <button
      type="submit"
      disabled={!canContinue}
      className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/40 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 rounded-full transition-colors active:scale-[0.98] inline-flex items-center justify-center gap-2 min-h-[48px]"
    >
      Continuar
      <ArrowRight size={16} />
    </button>

    <p className="text-xs text-muted-foreground text-center max-w-md mx-auto leading-relaxed">
      Al continuar, aceptás que el equipo de Servicios 360 te contacte por
      WhatsApp/llamada al teléfono que dejaste para coordinar tu entrevista.
    </p>
  </form>
);

// =====================================================================
// Transition (entre steps)
// =====================================================================

type TransitionProps = {
  fullName: string;
  phone: string;
  loading: boolean;
  onContinue: () => void;
  onFinish: () => void;
};

const TransitionScreen = ({
  fullName,
  phone,
  loading,
  onContinue,
  onFinish,
}: TransitionProps) => {
  const formattedPhone = phone.length === 10
    ? `+54 ${phone.slice(0, 3)} ${phone.slice(3, 6)}-${phone.slice(6)}`
    : phone;
  const firstName = fullName.split(" ")[0] || "";

  return (
    <div className="space-y-6">
      <div className="bg-success/10 border border-success/30 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-3">
          <CheckCircle2 className="text-success" size={28} />
        </div>
        <h2 className="text-xl font-semibold text-foreground tracking-tight mb-1">
          ¡Listo{firstName ? `, ${firstName}` : ""}!
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Recibimos tu solicitud. Te vamos a contactar en{" "}
          <strong className="text-foreground">24-48hs hábiles</strong> por
          WhatsApp o llamada al{" "}
          <strong className="text-foreground tabular-nums">
            {formattedPhone}
          </strong>
          .
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 p-6">
        <h3 className="text-base font-semibold text-foreground tracking-tight mb-1">
          ¿Querés contarnos un poco más sobre vos?
        </h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Es opcional, pero ayuda a que tu aprobación sea más rápida. Toma
          aproximadamente 3 minutos.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onContinue}
            disabled={loading}
            className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/40 text-primary-foreground font-semibold py-3 rounded-full transition-colors active:scale-[0.98] inline-flex items-center justify-center gap-2 min-h-[48px]"
          >
            Continuar (opcional)
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={onFinish}
            disabled={loading}
            className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-medium py-3 rounded-full transition-colors active:scale-[0.98] inline-flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando...
              </>
            ) : (
              "Salir"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// Step 2 (opcional)
// =====================================================================

type Step2Props = {
  data: ProviderIntakeStep2;
  onChange: React.Dispatch<React.SetStateAction<ProviderIntakeStep2>>;
  loading: boolean;
  onSubmit: () => void;
  onBack: () => void;
};

const Step2Form = ({ data, onChange, loading, onSubmit, onBack }: Step2Props) => {
  const toggleSecondary = (slug: string) => {
    onChange((s) => {
      const set = new Set(s.secondary_categories || []);
      if (set.has(slug)) set.delete(slug);
      else set.add(slug);
      return { ...s, secondary_categories: Array.from(set) };
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      {/* Bloco A: Experiencia */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Briefcase size={16} />
          Experiencia
        </div>

        <div>
          <label className={labelClass}>Años ejerciendo el oficio</label>
          <select
            value={data.years_experience || ""}
            onChange={(e) =>
              onChange((s) => ({
                ...s,
                years_experience:
                  (e.target.value as ProviderIntakeStep2["years_experience"]) ||
                  undefined,
              }))
            }
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="">Seleccioná</option>
            {YEARS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Descripción breve de tu trabajo
          </label>
          <textarea
            id="description"
            value={data.description || ""}
            onChange={(e) =>
              onChange((s) => ({ ...s, description: e.target.value }))
            }
            placeholder="Ej: Hago instalaciones eléctricas residenciales y comerciales. Especialista en tableros y luces LED."
            maxLength={500}
            rows={3}
            className={`${inputClass} resize-y`}
          />
          <p className={fieldHintClass}>
            {(data.description || "").length}/500 caracteres
          </p>
        </div>

        <div>
          <label className={labelClass}>
            Especialidades secundarias (opcional)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.slug}
                onClick={() => toggleSecondary(c.slug)}
                className={`text-xs font-medium px-2.5 py-2 rounded-lg border transition-colors min-h-[40px] ${
                  data.secondary_categories?.includes(c.slug)
                    ? "bg-primary/10 text-primary border-primary"
                    : "bg-background text-foreground border-border/60 hover:border-border"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>¿Trabajás solo o con equipo?</label>
          <div className="grid grid-cols-3 gap-2">
            {TEAM_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() =>
                  onChange((s) => ({ ...s, team_type: opt.value }))
                }
                className={`text-xs font-medium px-2 py-2.5 rounded-xl border transition-colors min-h-[44px] ${
                  data.team_type === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border/60 hover:border-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bloco B: Capacidade */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Users size={16} />
          Capacidad
        </div>

        <div>
          <label className={labelClass}>
            Cantidad de servicios que podés tomar por semana
          </label>
          <select
            value={data.weekly_capacity || ""}
            onChange={(e) =>
              onChange((s) => ({
                ...s,
                weekly_capacity:
                  (e.target.value as ProviderIntakeStep2["weekly_capacity"]) ||
                  undefined,
              }))
            }
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="">Seleccioná</option>
            {CAPACITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>¿Tenés vehículo propio?</label>
          <div className="grid grid-cols-3 gap-2">
            {VEHICLE_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() =>
                  onChange((s) => ({ ...s, vehicle: opt.value }))
                }
                className={`text-xs font-medium px-2 py-2.5 rounded-xl border transition-colors min-h-[44px] ${
                  data.vehicle === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border/60 hover:border-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bloco C: Referências */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <ShieldCheck size={16} />
          Referencias (opcional)
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Personas que pueden hablar de tu trabajo. Aceleran tu aprobación.
        </p>

        {[1, 2].map((n) => {
          const key = (n === 1 ? "reference_1" : "reference_2") as
            | "reference_1"
            | "reference_2";
          const ref = data[key] || {};
          return (
            <div key={n} className="space-y-2">
              <p className="text-xs font-semibold text-foreground">
                Referencia {n}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={ref.name || ""}
                  onChange={(e) =>
                    onChange((s) => ({
                      ...s,
                      [key]: { ...(s[key] || {}), name: e.target.value },
                    }))
                  }
                  className={inputClass}
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Teléfono"
                  value={ref.phone || ""}
                  onChange={(e) =>
                    onChange((s) => ({
                      ...s,
                      [key]: { ...(s[key] || {}), phone: e.target.value },
                    }))
                  }
                  className={`${inputClass} tabular-nums`}
                />
                <input
                  type="text"
                  placeholder="Relación (ej: cliente)"
                  value={ref.relation || ""}
                  onChange={(e) =>
                    onChange((s) => ({
                      ...s,
                      [key]: { ...(s[key] || {}), relation: e.target.value },
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bloco D: Compromiso */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <CheckCircle2 size={16} />
          Compromiso
        </div>

        <div>
          <label className={labelClass}>¿Tenés CUIT/CUIL activo?</label>
          <div className="grid grid-cols-3 gap-2">
            {CUIT_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() =>
                  onChange((s) => ({ ...s, has_cuit: opt.value }))
                }
                className={`text-xs font-medium px-2 py-2.5 rounded-xl border transition-colors min-h-[44px] ${
                  data.has_cuit === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border/60 hover:border-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="extra_notes" className={labelClass}>
            ¿Algo más que querramos saber? (opcional)
          </label>
          <textarea
            id="extra_notes"
            value={data.extra_notes || ""}
            onChange={(e) =>
              onChange((s) => ({ ...s, extra_notes: e.target.value }))
            }
            placeholder="Cualquier información extra que creas relevante."
            maxLength={1000}
            rows={3}
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="sm:flex-1 bg-muted hover:bg-muted/80 text-foreground font-medium py-3 rounded-full transition-colors active:scale-[0.98] inline-flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          Atrás
        </button>
        <button
          type="submit"
          disabled={loading}
          className="sm:flex-[2] bg-primary hover:bg-primary/90 disabled:bg-primary/40 text-primary-foreground font-semibold py-3 rounded-full transition-colors active:scale-[0.98] inline-flex items-center justify-center gap-2 min-h-[48px]"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar mi solicitud
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// =====================================================================
// Done
// =====================================================================

const DoneScreen = ({ fullName }: { fullName: string }) => {
  const firstName = fullName.split(" ")[0] || "";
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="w-16 h-16 mx-auto rounded-full bg-success/10 border border-success/30 flex items-center justify-center mb-4">
        <CheckCircle2 className="text-success" size={32} />
      </div>
      <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
        ¡Gracias{firstName ? `, ${firstName}` : ""}!
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
        Recibimos toda la información. Nuestro equipo va a revisarla y te
        vamos a contactar en las próximas{" "}
        <strong className="text-foreground">24-48 horas hábiles</strong>.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background font-semibold px-6 py-3 rounded-full transition-colors active:scale-[0.98] min-h-[48px]"
      >
        Volver al inicio
      </Link>
    </div>
  );
};

export default ProviderIntake;
