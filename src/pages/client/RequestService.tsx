import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ChevronDown,
  MapPin,
  DollarSign,
  ImagePlus,
  Clock,
  AlertCircle,
  Zap,
  Send,
  Check,
  Loader2,
  X,
  ShieldCheck,
  Users,
  ArrowRight,
  ArrowLeft,
  Calendar,
  LocateFixed
} from 'lucide-react';
import { CATEGORIES } from "@/constants/categories";
import { useCreateServiceRequest, useUploadFile } from "@/hooks/useServiceRequests";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function RequestService() {
  const [searchParams] = useSearchParams();
  const providerIdParam = searchParams.get("provider");
  const categoryParam = searchParams.get("category");

  // Formulário State
  const [category, setCategory] = useState(categoryParam || "");
  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [urgencia, setUrgencia] = useState<'baja' | 'media' | 'alta'>('media');
  const [budget, setBudget] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [preferredDate, setPreferredDate] = useState<Date>();
  const [preferredTime, setPreferredTime] = useState("");
  
  // Wizard State
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [uploading, setUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const address = streetNumber ? `${street.trim()} ${streetNumber.trim()}` : street.trim();

  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const createRequest = useCreateServiceRequest();
  const uploadFile = useUploadFile();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map((f) => uploadFile(f, "service-photos")));
      setPhotos((prev) => [...prev, ...urls]);
    } catch {
      // error handled by hook
    }
    setUploading(false);
  };

  const getCategoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name || slug || "";

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
    if (!category || !description || !address) return;

    if (description.trim().length < 10 || description.trim().length > 5000) {
      toast.error("La descripción debe tener entre 10 y 5000 caracteres");
      return;
    }
    if (address.length < 3 || address.length > 200) {
      toast.error("La dirección debe tener entre 3 y 200 caracteres");
      return;
    }
    const budgetNum = budget ? parseFloat(budget) : undefined;
    if (budgetNum !== undefined && (isNaN(budgetNum) || budgetNum < 0 || budgetNum > 10_000_000)) {
      toast.error("El presupuesto debe estar entre $0 y $10.000.000");
      return;
    }
    if (!CATEGORIES.some((c) => c.slug === category)) {
      toast.error("Categoría inválida");
      return;
    }

    const categoryName = getCategoryName(category);
    const generatedTitle = `Solicitud: ${categoryName}`;

    const parts = [description];
    if (preferredDate) parts.push(`\n%%FECHA%%${format(preferredDate, "dd/MM/yyyy")}`);
    if (preferredTime) parts.push(`%%HORARIO%%${preferredTime}`);

    try {
      await createRequest.mutateAsync({
        category,
        title: generatedTitle,
        description: parts.join("\n"),
        address: address.trim(),
        urgency: urgencia,
        budget: budgetNum,
        photos: photos.length > 0 ? photos : undefined,
        provider_id: providerIdParam || undefined,
      });
      localStorage.setItem("last_address", address.trim());
      setIsSuccess(true);
    } catch (err) {
      // error toast already handled globally in hook
    }
  };

  const resetForm = () => {
    setCategory("");
    setDescription("");
    setStreet("");
    setStreetNumber("");
    setUrgencia('media');
    setBudget("");
    setPhotos([]);
    setPreferredDate(undefined);
    setPreferredTime("");
    setStep(1);
    setIsSuccess(false);
  };

  const isSubmitting = createRequest.isPending;

  const formProgress = useMemo(() => {
    return Math.round(((step - 1) / totalSteps) * 100);
  }, [step]);

  const canProceed = () => {
    switch (step) {
      case 1: return !!category;
      case 2: return description.trim().length >= 10;
      case 3: return true; // Photos optional
      case 4: return street.trim().length >= 3 && streetNumber.trim().length > 0;
      case 5: return true;
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

  const availableTimeSlots = [
    "08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", 
    "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "A coordinar"
  ];

  return (
    <div className="font-sans flex justify-center pb-10 px-4 md:px-8 min-h-[calc(100vh-theme(spacing.16))] lg:h-[calc(100vh-theme(spacing.16))] bg-background">

      {/* Contentor Principal */}
      <div className="w-full max-w-4xl bg-card rounded-[24px] shadow-sm border border-border flex flex-col lg:h-full overflow-hidden relative">

        {/* Cabeçalho do Formulário */}
        <div className="bg-slate-900 px-8 py-8 relative shrink-0">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary rounded-full opacity-20 blur-[50px] pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-2 relative z-10">
            {step > 1 && !isSuccess && (
              <button onClick={prevStep} className="p-2 -ml-2 rounded-full hover:bg-primary-foreground/10 text-primary-foreground transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-3xl font-extrabold text-primary-foreground">
              {isSuccess ? '¡Listo!' : 'Solicitar Servicio'}
            </h1>
          </div>
          
          <p className="text-slate-300 relative z-10 text-sm md:text-base">
            {isSuccess ? 'Tu solicitud ha sido procesada correctamente.' : 'Describí qué necesitás y te conectamos con el mejor profesional de tu zona.'}
          </p>

          {!isSuccess && (
            <div className="mt-5 relative z-10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>{step === totalSteps ? 'Paso final' : `Paso ${step} de ${totalSteps}`}</span>
                <span className="flex items-center gap-1"><ShieldCheck size={12} /> Datos encriptados</span>
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

        {/* Corpo do Formulário ou Animação de Sucesso */}
        <div className="flex-1 lg:overflow-y-auto custom-scrollbar flex flex-col">
          {isSuccess ? (
            <div className="relative p-12 md:p-20 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 flex-1">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"></div>
              <div className="relative mb-8">
                <div className="absolute inset-0 w-32 h-32 -m-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full"></div>
                <div className="absolute inset-0 bg-success/80 rounded-full animate-ping opacity-40"></div>
                <div className="relative bg-gradient-to-tr from-emerald-500 to-green-400 text-primary-foreground p-5 rounded-full shadow-lg shadow-success/30 transform transition-transform duration-500 hover:scale-110">
                  <Check size={48} strokeWidth={3} />
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight">¡Solicitud enviada con éxito!</h2>
              <p className="text-lg text-foreground/80 max-w-md mb-4 leading-relaxed">
                Los profesionales de tu zona ya fueron notificados. Muy pronto empezarás a recibir presupuestos en tu panel.
              </p>
              
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-[16px] px-5 py-3 mb-8">
                <Clock size={18} className="text-amber-500 shrink-0" />
                <p className="text-sm text-foreground">
                  <strong>Tiempo promedio de respuesta:</strong> menos de 2 horas
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-full transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  Solicitar otro servicio
                </button>
                <Link to="/cliente">
                  <button type="button" className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                    Ir a mi Dashboard
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 md:p-10 flex-1 flex flex-col h-full">
              
              <div className="flex-1">
                {/* STEP 1: CATEGORIA */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">¿Qué tipo de servicio necesitás?</h2>
                      <p className="text-muted-foreground">Elegí la categoría que mejor describa tu problema.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.slug);
                            setTimeout(() => setStep(2), 200); // Auto-advance
                          }}
                          className={`flex flex-col items-center justify-center p-4 rounded-[16px] border-2 transition-all duration-200 hover:-translate-y-1 ${category === cat.slug ? 'border-primary bg-primary/5 shadow-md scale-105' : 'border-border hover:border-primary/30 bg-background'}`}
                        >
                          <span className="text-2xl mb-2">{cat.icon}</span>
                          <span className={`text-sm font-semibold text-center ${category === cat.slug ? 'text-primary' : 'text-foreground'}`}>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 2: DESCRIÇÃO */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">Describí el problema</h2>
                      <p className="text-muted-foreground">Cuantos más detalles des, mejores presupuestos recibirás.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex justify-between">
                        <span>Descripción detallada <span className="text-destructive">*</span></span>
                        <span className={`text-xs font-normal ${description.length > 4500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {description.length}/5000
                        </span>
                      </label>
                      <textarea
                        rows={8}
                        required
                        autoFocus
                        maxLength={5000}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Necesito arreglar una pérdida de agua en la bacha de la cocina. Empezó hace 2 días y gotea constantemente..."
                        className="w-full rounded-[16px] border border-border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal resize-none"
                      ></textarea>
                      {description.length > 0 && description.length < 50 && (
                        <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-2">
                          <AlertCircle size={12} /> Las descripciones de más de 50 caracteres reciben mejores propuestas
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: FOTOS */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">Fotos de referencia</h2>
                      <p className="text-muted-foreground">Una imagen vale más que mil palabras. (Opcional)</p>
                    </div>

                    <div className="space-y-4">
                      <input type="file" ref={fileRef} className="hidden" accept="image/*" multiple onChange={handleUpload} />
                      
                      <div 
                        onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-border rounded-[24px] bg-muted/30 hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center justify-center py-12"
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
                              <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: LOCALIZAÇÃO */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">¿Dónde se realizará el servicio?</h2>
                      <p className="text-muted-foreground">Para mostrarte profesionales cercanos.</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGeolocation}
                      disabled={isLocating}
                      className="w-full py-3.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-[16px] flex items-center justify-center gap-2 transition-all border border-primary/20"
                    >
                      {isLocating ? <Loader2 className="animate-spin" size={18} /> : <LocateFixed size={18} />}
                      Usar mi ubicación actual
                    </button>

                    <div className="flex items-center gap-4 py-2">
                      <div className="h-px bg-border flex-1"></div>
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">O ingresa manualmente</span>
                      <div className="h-px bg-border flex-1"></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <label className="text-sm font-semibold text-foreground">Calle <span className="text-destructive">*</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MapPin className="text-muted-foreground" size={18} />
                          </div>
                          <input
                            type="text"
                            required
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            placeholder="Ej: Av. San Martín"
                            className="w-full rounded-[16px] border border-border bg-background pl-11 pr-4 py-3.5 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Número <span className="text-destructive">*</span></label>
                        <input
                          type="text"
                          required
                          value={streetNumber}
                          onChange={(e) => setStreetNumber(e.target.value)}
                          placeholder="1234"
                          className="w-full rounded-[16px] border border-border bg-background px-4 py-3.5 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: PREFERÊNCIAS E ENVIO */}
                {step === 5 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">Últimos detalles</h2>
                      <p className="text-muted-foreground">Preferencias de horario y urgencia.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground">Nivel de urgencia</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className={`relative flex flex-col items-center justify-center p-3 cursor-pointer rounded-[16px] border-2 transition-all duration-200 ${urgencia === 'baja' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-border/80 bg-background'}`}>
                          <input type="radio" name="urgencia" value="baja" className="sr-only" onChange={() => setUrgencia('baja')} checked={urgencia === 'baja'} />
                          <div className={`w-8 h-8 mb-2 rounded-full flex items-center justify-center ${urgencia === 'baja' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Clock size={16} />
                          </div>
                          <h4 className={`font-bold text-sm leading-tight mb-0.5 ${urgencia === 'baja' ? 'text-primary' : 'text-foreground'}`}>Baja</h4>
                          <p className="text-[10px] text-muted-foreground leading-tight">Puede esperar</p>
                        </label>

                        <label className={`relative flex flex-col items-center justify-center p-3 cursor-pointer rounded-[16px] border-2 transition-all duration-200 ${urgencia === 'media' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-border/80 bg-background'}`}>
                          <input type="radio" name="urgencia" value="media" className="sr-only" onChange={() => setUrgencia('media')} checked={urgencia === 'media'} />
                          <div className={`w-8 h-8 mb-2 rounded-full flex items-center justify-center ${urgencia === 'media' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <AlertCircle size={16} />
                          </div>
                          <h4 className={`font-bold text-sm leading-tight mb-0.5 ${urgencia === 'media' ? 'text-primary' : 'text-foreground'}`}>Media</h4>
                          <p className="text-[10px] text-muted-foreground leading-tight">Esta semana</p>
                        </label>

                        <label className={`relative flex flex-col items-center justify-center p-3 cursor-pointer rounded-[16px] border-2 transition-all duration-200 ${urgencia === 'alta' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-border/80 bg-background'}`}>
                          <input type="radio" name="urgencia" value="alta" className="sr-only" onChange={() => setUrgencia('alta')} checked={urgencia === 'alta'} />
                          <div className={`w-8 h-8 mb-2 rounded-full flex items-center justify-center ${urgencia === 'alta' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Zap size={16} />
                          </div>
                          <h4 className={`font-bold text-sm leading-tight mb-0.5 ${urgencia === 'alta' ? 'text-primary' : 'text-foreground'}`}>Alta</h4>
                          <p className="text-[10px] text-muted-foreground leading-tight">Lo antes posible</p>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Fecha preferida <span className="text-muted-foreground font-normal">(Opcional)</span></label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full rounded-[16px] border-border bg-background pl-11 pr-4 py-6 text-left font-medium hover:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10", !preferredDate && "text-muted-foreground font-normal")}>
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground"><Calendar size={18} /></div>
                              {preferredDate ? format(preferredDate, "dd 'de' MMMM, yyyy", { locale: es }) : <span>Seleccionar fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent mode="single" selected={preferredDate} onSelect={setPreferredDate} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Horario preferido <span className="text-muted-foreground font-normal">(Opcional)</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10"><Clock className="text-muted-foreground" size={18} /></div>
                          <select value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="w-full appearance-none rounded-[16px] border border-border bg-background pl-11 pr-4 py-3.5 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium font-normal cursor-pointer">
                            <option value="" disabled>Seleccionar horario</option>
                            {availableTimeSlots.map((slot) => (<option key={slot} value={slot}>{slot}</option>))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex justify-between">
                        <span>Presupuesto estimado</span>
                        <span className="text-muted-foreground font-normal text-xs">(Opcional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><DollarSign className="text-muted-foreground" size={18} /></div>
                        <input type="number" min="0" max="10000000" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" className="w-full rounded-[16px] border border-border bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-bold placeholder:text-muted-foreground font-normal text-lg" />
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Botões do Wizard (Footer) */}
              <div className="mt-8 pt-6 border-t border-border flex gap-4">
                {step > 1 && (
                  <button type="button" onClick={prevStep} className="px-6 py-4 bg-muted text-foreground font-bold rounded-full transition-all hover:-translate-y-0.5 active:scale-[0.98]">
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
                    disabled={isSubmitting || !canProceed()}
                    className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 text-primary-foreground font-bold rounded-full shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all text-lg ${isSubmitting || !canProceed() ? 'bg-primary/50 cursor-not-allowed opacity-90' : 'bg-primary hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5 active:scale-[0.98]'}`}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="animate-spin" size={20} strokeWidth={2.5} /> Enviando...</>
                    ) : (
                      <><Send size={20} strokeWidth={2.5} /> Enviar Solicitud Gratis</>
                    )}
                  </button>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
