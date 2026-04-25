import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Star, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Calendar, 
  ImagePlus, 
  AlertCircle, 
  Zap, 
  Send,
  Check,
  Info,
  Loader2,
  ArrowLeft,
  X,
  ArrowRight,
  LocateFixed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CATEGORIES } from "@/constants/categories";
import { useCreateServiceRequest, useUploadFile } from "@/hooks/useServiceRequests";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderProfile } from "@/hooks/useProfiles";
import { useProviderSchedulePublic } from "@/hooks/useProviderSchedule";

export default function RequestBudget() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { data: provider, isLoading: providerLoading } = useProviderProfile(providerId);
  const { data: schedule } = useProviderSchedulePublic(providerId || null);

  const getCategoryName = (slug: string | null) =>
    CATEGORIES.find((c) => c.slug === slug)?.name || slug || "";

  // Formulário State
  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [urgency, setUrgency] = useState<"baja" | "media" | "alta">("media");
  const [photos, setPhotos] = useState<string[]>([]);
  const [preferredDate, setPreferredDate] = useState<Date>();
  const [preferredTime, setPreferredTime] = useState("");

  const address = streetNumber ? `${street.trim()} ${streetNumber.trim()}` : street.trim();

  // Wizard State
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [uploading, setUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const createRequest = useCreateServiceRequest();
  const uploadFile = useUploadFile();

  const availableTimeSlots = useMemo(() => {
    if (!schedule || schedule.length === 0) return ["A coordinar"];

    if (!preferredDate) {
      // Show all possible slots from all active days
      const allSlots = new Set<string>();
      schedule.forEach((slot) => {
        const start = parseInt(slot.start_time.split(":")[0], 10);
        const end = parseInt(slot.end_time.split(":")[0], 10);
        for (let h = start; h < end; h += 2) {
          const slotEnd = Math.min(h + 2, end);
          allSlots.add(`${String(h).padStart(2, "0")}:00 - ${String(slotEnd).padStart(2, "0")}:00`);
        }
      });
      return [...Array.from(allSlots).sort(), "A coordinar"];
    }

    // Filter by selected day of week
    const dayOfWeek = preferredDate.getDay(); // 0=Sun
    const daySchedule = schedule.find((s) => s.day_of_week === dayOfWeek);
    if (!daySchedule) return ["A coordinar"];

    const start = parseInt(daySchedule.start_time.split(":")[0], 10);
    const end = parseInt(daySchedule.end_time.split(":")[0], 10);
    const slots: string[] = [];
    for (let h = start; h < end; h += 2) {
      const slotEnd = Math.min(h + 2, end);
      slots.push(`${String(h).padStart(2, "0")}:00 - ${String(slotEnd).padStart(2, "0")}:00`);
    }
    return [...slots, "A coordinar"];
  }, [schedule, preferredDate]);

  const activeDays = useMemo(() => {
    if (!schedule) return new Set<number>();
    return new Set(schedule.map((s) => s.day_of_week));
  }, [schedule]);

  useEffect(() => {
    setPreferredTime("");
  }, [preferredDate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?redirect=/solicitar/${providerId}`, { replace: true });
    }
  }, [authLoading, user, navigate, providerId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map((f) => uploadFile(f, "service-photos"))
      );
      setPhotos((prev) => [...prev, ...urls]);
    } catch {
      // error handled by hook
    }
    setUploading(false);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`, {
            headers: {
              'Accept-Language': 'es'
            }
          });
          const data = await res.json();
          if (data && data.address) {
            const road = data.address.road || data.address.pedestrian || "";
            const houseNumber = data.address.house_number || "";
            if (road) setStreet(road);
            if (houseNumber) setStreetNumber(houseNumber);
            toast.success("Ubicación encontrada");
          } else {
            toast.error("No pudimos obtener la dirección exacta.");
          }
        } catch (error) {
          toast.error("Error al obtener la dirección.");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        toast.error("No pudimos acceder a tu ubicación. Permite el acceso e intenta de nuevo.");
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!description || !address || !provider) return;
    const category = provider.provider_category;
    if (!category) {
      toast.error("El prestador no tiene categoría definida");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres");
      return;
    }
    if (address.length < 3) {
      toast.error("Completá la dirección correctamente");
      return;
    }

    const categoryName = getCategoryName(category);
    const title = `Solicitud de presupuesto: ${categoryName}`;

    const parts = [description];
    if (preferredDate) parts.push(`%%FECHA%%${format(preferredDate, "dd/MM/yyyy")}`);
    if (preferredTime) parts.push(`%%HORARIO%%${preferredTime}`);

    try {
      await createRequest.mutateAsync({
        category,
        title,
        description: parts.join("\n"),
        address: address.trim(),
        urgency,
        budget: undefined,
        photos: photos.length > 0 ? photos : undefined,
        // @ts-expect-error - Supabase RPC may need this or not, handling this for compatibility
        provider_id: provider.id,
      });
      setIsSuccess(true);
    } catch (error) {
       // Global toast handles errors
    }
  };

  const formProgress = useMemo(() => {
    return Math.round(((step - 1) / totalSteps) * 100);
  }, [step]);

  const canProceed = () => {
    switch (step) {
      case 1: return description.trim().length >= 10;
      case 2: return true; // Photos optional
      case 3: return street.trim().length >= 3 && streetNumber.trim().length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && step < totalSteps) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  };

  if (authLoading || providerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !provider) return null;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Botão de Voltar ao Perfil */}
      <div className="max-w-6xl mx-auto mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al perfil de {provider.full_name}
        </button>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        
        {/* COLUNA ESQUERDA: Resumo e Confiança (Fixa em Desktop) */}
        <div className="w-full lg:w-1/3 lg:sticky lg:top-8 space-y-6">
          
          {/* Cartão do Profissional */}
          <div className="bg-card rounded-[24px] border border-border p-6 shadow-sm">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Solicitando a</h2>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
                {provider.full_name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-foreground leading-tight flex items-center gap-1.5 truncate">
                  {provider.full_name}
                  {provider.provider_verified && <ShieldCheck size={16} className="text-blue-500 shrink-0" aria-label="Verificado" />}
                </h3>
                <p className="text-sm text-primary font-medium mb-1 truncate">{getCategoryName(provider.provider_category)}</p>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 font-bold text-foreground">
                    <Star size={14} className="text-yellow-500" fill="currentColor" />
                    {Number(provider.rating_avg).toFixed(1)}
                  </div>
                  <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
                  <span className="text-muted-foreground">{provider.completed_jobs} trabajos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline de "Como Funciona" */}
          <div className="bg-card rounded-[24px] border border-border p-6 shadow-sm hidden md:block">
            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
              <Info size={18} className="text-primary" />
              ¿Cómo es el proceso?
            </h3>
            
            <div className="relative border-l-2 border-border ml-3 space-y-6">
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-primary rounded-full border-4 border-card"></div>
                <h4 className="text-sm font-bold text-foreground">1. Enviás tu solicitud</h4>
                <p className="text-xs text-muted-foreground mt-1">Completá los detalles para que entienda qué necesitás.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-muted-foreground/30 border-border rounded-full border-4 border-card"></div>
                <h4 className="text-sm font-bold text-foreground">2. Recibís un presupuesto</h4>
                <p className="text-xs text-muted-foreground mt-1">Él revisa tu pedido y te envía un precio estimado.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-muted-foreground/30 border-border rounded-full border-4 border-card"></div>
                <h4 className="text-sm font-bold text-foreground">3. Aceptás y coordinan</h4>
                <p className="text-xs text-muted-foreground mt-1">Se abre un chat privado para acordar el día final.</p>
              </div>
            </div>
          </div>

          {/* Badge de Segurança */}
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-500/10 rounded-[16px] border border-green-100 dark:border-green-500/20">
            <ShieldCheck className="text-green-600 dark:text-green-500 flex-shrink-0" size={20} />
            <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
              <strong>Transacción segura.</strong> No te cobraremos nada hasta que aceptes el presupuesto final del profesional.
            </p>
          </div>

        </div>

        {/* COLUNA DIREITA: Formulário ou Estado de Sucesso */}
        <div className="w-full lg:w-2/3">
          <div className="bg-card rounded-[24px] shadow-sm border border-border flex flex-col overflow-hidden relative min-h-[500px]">
            
            {/* Header com Progresso */}
            <div className="bg-slate-900 px-8 py-6 relative shrink-0">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary rounded-full opacity-20 blur-[50px] pointer-events-none"></div>

              <div className="flex items-center justify-between relative z-10 mb-4">
                <h1 className="text-2xl font-extrabold text-primary-foreground">
                  {isSuccess ? '¡Listo!' : 'Solicitar Presupuesto'}
                </h1>
              </div>

              {!isSuccess && (
                <div className="relative z-10">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>{step === totalSteps ? 'Paso final' : `Paso ${step} de ${totalSteps}`}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(5, formProgress)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col custom-scrollbar">
              {isSuccess ? (
                /* ESTADO DE SUCESSO ANIMADO */
                <div className="p-12 md:p-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-500 flex-1">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-success/80 rounded-full animate-ping opacity-40"></div>
                    <div className="relative bg-gradient-to-tr from-success to-emerald-400 text-primary-foreground p-5 rounded-full shadow-lg shadow-success/30 transform transition-transform duration-500 hover:scale-110">
                      <Check size={48} strokeWidth={3} />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-extrabold text-foreground mb-4 tracking-tight">¡Solicitud enviada!</h2>
                  <p className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
                    <strong className="text-foreground">{provider.full_name}</strong> ha recibido tu pedido. Te notificaremos en cuanto te responda con un presupuesto.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <Link to={`/p/${provider.id}`}>
                      <button className="w-full px-6 py-3.5 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-full transition-colors hover:-translate-y-0.5 active:scale-[0.98]">
                        Volver al perfil
                      </button>
                    </Link>
                    <Link to="/cliente">
                      <button className="w-full px-6 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                        Ir a mi Dashboard
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                /* FORMULÁRIO WIZARD */
                <div className="p-6 md:p-10 flex-1 flex flex-col h-full">
                  <div className="flex-1">
                    
                    {/* STEP 1: DESCRIÇÃO */}
                    {step === 1 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground mb-2">Describí el problema</h2>
                          <p className="text-muted-foreground">Cuantos más detalles des, mejor presupuesto recibirás de {provider.full_name}.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground flex justify-between">
                            <span>Descripción detallada <span className="text-destructive">*</span></span>
                            <span className={`text-xs font-normal ${description.length > 4500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {description.length}/5000
                            </span>
                          </label>
                          <textarea 
                            required
                            autoFocus
                            rows={8}
                            maxLength={5000}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Necesito arreglar una pérdida de agua en la bacha..." 
                            className="w-full rounded-[16px] border border-border bg-background px-4 py-3.5 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal resize-none"
                          ></textarea>
                          {description.length > 0 && description.length < 50 && (
                            <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-2">
                              <AlertCircle size={12} /> Las descripciones cortas a veces son ignoradas
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* STEP 2: FOTOS */}
                    {step === 2 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground mb-2">Fotos de referencia</h2>
                          <p className="text-muted-foreground">Ayuda al profesional a ver qué necesitas reparar. (Opcional)</p>
                        </div>
                        
                        <div className="space-y-4">
                          <input type="file" ref={fileRef} className="hidden" accept="image/*" multiple onChange={handleUpload} />
                          
                          <div 
                            onClick={() => fileRef.current?.click()}
                            className="w-full border-2 border-dashed border-border rounded-[24px] bg-secondary/30 hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center justify-center py-12"
                          >
                            {uploading ? (
                              <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-14 h-14 bg-background rounded-full shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
                                  <ImagePlus size={28} />
                                </div>
                                <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">Tocá para agregar fotos</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG hasta 5MB</p>
                              </div>
                            )}
                          </div>
                          
                          {photos.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                              {photos.map((url, i) => (
                                <div key={i} className="relative group aspect-square">
                                  <img src={url} alt="" className="w-full h-full rounded-[16px] object-cover border border-border shadow-sm" />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPhotos((p) => p.filter((_, j) => j !== i));
                                    }}
                                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* STEP 3: LOCALIZAÇÃO E HORÁRIO */}
                    {step === 3 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground mb-2">Dónde y Cuándo</h2>
                          <p className="text-muted-foreground">Detalles para coordinar la visita.</p>
                        </div>

                        <div className="space-y-4">
                          <label className="text-sm font-semibold text-foreground">Dirección <span className="text-destructive">*</span></label>
                          <button
                            type="button"
                            onClick={handleGeolocation}
                            disabled={isLocating}
                            className="w-full py-3.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-[16px] flex items-center justify-center gap-2 transition-all border border-primary/20"
                          >
                            {isLocating ? <Loader2 className="animate-spin" size={18} /> : <LocateFixed size={18} />}
                            Usar mi ubicación actual
                          </button>

                          <div className="flex items-center gap-4 py-1">
                            <div className="h-px bg-border flex-1"></div>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">O ingresa manualmente</span>
                            <div className="h-px bg-border flex-1"></div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <MapPin className="text-muted-foreground" size={18} />
                              </div>
                              <input
                                type="text"
                                required
                                value={street}
                                onChange={(e) => setStreet(e.target.value)}
                                placeholder="Ej: Av. San Martín"
                                className="w-full rounded-[16px] border border-border bg-background pl-11 pr-4 py-3.5 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal"
                              />
                            </div>
                            <input
                              type="text"
                              required
                              value={streetNumber}
                              onChange={(e) => setStreetNumber(e.target.value)}
                              placeholder="1234"
                              className="w-full rounded-[16px] border border-border bg-background px-4 py-3.5 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal"
                            />
                          </div>
                        </div>

                        <hr className="border-border" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Fecha preferida <span className="text-muted-foreground font-normal">(Opcional)</span></label>
                            <div className="relative">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full rounded-[16px] border-border bg-background pl-11 pr-4 py-6 text-left font-medium hover:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10",
                                      !preferredDate && "text-muted-foreground font-normal"
                                    )}
                                  >
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                                      <Calendar size={18} />
                                    </div>
                                    {preferredDate ? format(preferredDate, "dd 'de' MMMM, yyyy", { locale: es }) : <span>Seleccionar fecha</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={preferredDate}
                                    onSelect={setPreferredDate}
                                    disabled={(date) => {
                                      if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                                      if (schedule && schedule.length > 0 && !activeDays.has(date.getDay())) return true;
                                      return false;
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Horario preferido <span className="text-muted-foreground font-normal">(Opcional)</span></label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                <Clock className="text-muted-foreground" size={18} />
                              </div>
                              <select 
                                value={preferredTime}
                                onChange={(e) => setPreferredTime(e.target.value)}
                                className="w-full appearance-none rounded-[16px] border border-border bg-background pl-11 pr-4 py-3.5 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium font-normal cursor-pointer"
                              >
                                <option value="" disabled>Seleccionar horario</option>
                                {availableTimeSlots.map((slot) => (
                                   <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: URGÊNCIA E ENVIO */}
                    {step === 4 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground mb-2">Nivel de urgencia</h2>
                          <p className="text-muted-foreground">¿Qué tan pronto necesitas el servicio?</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <label className={`relative flex flex-col items-center justify-center p-4 cursor-pointer rounded-[16px] border-2 transition-all duration-200 ${urgency === 'baja' ? 'border-primary bg-primary/5 shadow-sm scale-105' : 'border-border hover:border-primary/50 bg-background hover:-translate-y-1'}`}>
                            <input type="radio" name="urgencia" value="baja" className="sr-only" onChange={() => setUrgency('baja')} checked={urgency === 'baja'} />
                            <div className={`w-10 h-10 mb-3 rounded-full flex items-center justify-center ${urgency === 'baja' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                              <Clock size={20} />
                            </div>
                            <h4 className={`font-bold text-sm ${urgency === 'baja' ? 'text-primary' : 'text-foreground'}`}>Baja</h4>
                            <p className="text-xs text-muted-foreground mt-1">Puede esperar</p>
                          </label>

                          <label className={`relative flex flex-col items-center justify-center p-4 cursor-pointer rounded-[16px] border-2 transition-all duration-200 ${urgency === 'media' ? 'border-primary bg-primary/5 shadow-sm scale-105' : 'border-border hover:border-primary/50 bg-background hover:-translate-y-1'}`}>
                            <input type="radio" name="urgencia" value="media" className="sr-only" onChange={() => setUrgency('media')} checked={urgency === 'media'} />
                            <div className={`w-10 h-10 mb-3 rounded-full flex items-center justify-center ${urgency === 'media' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                              <AlertCircle size={20} />
                            </div>
                            <h4 className={`font-bold text-sm ${urgency === 'media' ? 'text-primary' : 'text-foreground'}`}>Media</h4>
                            <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
                          </label>

                          <label className={`relative flex flex-col items-center justify-center p-4 cursor-pointer rounded-[16px] border-2 transition-all duration-200 ${urgency === 'alta' ? 'border-primary bg-primary/5 shadow-sm scale-105' : 'border-border hover:border-primary/50 bg-background hover:-translate-y-1'}`}>
                            <input type="radio" name="urgencia" value="alta" className="sr-only" onChange={() => setUrgency('alta')} checked={urgency === 'alta'} />
                            <div className={`w-10 h-10 mb-3 rounded-full flex items-center justify-center ${urgency === 'alta' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                              <Zap size={20} />
                            </div>
                            <h4 className={`font-bold text-sm ${urgency === 'alta' ? 'text-primary' : 'text-foreground'}`}>Alta</h4>
                            <p className="text-xs text-muted-foreground mt-1">Lo antes posible</p>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botões do Wizard */}
                  <div className="mt-8 pt-6 border-t border-border flex gap-4">
                    {step > 1 && (
                      <button type="button" onClick={prevStep} className="px-6 py-4 bg-secondary text-foreground font-bold rounded-full transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                        Atrás
                      </button>
                    )}
                    
                    {step < totalSteps ? (
                      <button 
                        type="button" 
                        onClick={nextStep} 
                        disabled={!canProceed()}
                        className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 text-primary-foreground font-bold rounded-full shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all text-lg ${!canProceed() ? 'bg-primary/50 cursor-not-allowed opacity-90' : 'bg-primary hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5 active:scale-[0.98]'}`}
                      >
                        Siguiente <ArrowRight size={20} />
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={(e) => handleSubmit(e)} 
                        disabled={createRequest.isPending || !canProceed()}
                        className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 text-primary-foreground font-bold rounded-full shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all text-lg ${createRequest.isPending || !canProceed() ? 'bg-primary/50 cursor-not-allowed opacity-90' : 'bg-primary hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5 active:scale-[0.98]'}`}
                      >
                        {createRequest.isPending ? (
                          <><Loader2 className="animate-spin" size={20} strokeWidth={2.5} /> Enviando...</>
                        ) : (
                          <><Send size={20} strokeWidth={2.5} /> Enviar a {provider.full_name}</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
