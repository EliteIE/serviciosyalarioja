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
  CheckCircle2,
  Info,
  Loader2,
  Check,
  ArrowLeft,
  X
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useProviderSchedulePublic } from "@/hooks/useProviderSchedule";

export default function RequestBudget() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["provider-profile", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("*")
        .eq("id", providerId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });

  const { data: schedule } = useProviderSchedulePublic(providerId || null);

  const getCategoryName = (slug: string | null) =>
    CATEGORIES.find((c) => c.slug === slug)?.name || slug || "";

  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [urgency, setUrgency] = useState<"baja" | "media" | "alta">("media");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preferredDate, setPreferredDate] = useState<Date>();
  const [preferredTime, setPreferredTime] = useState("");
  const address = streetNumber ? `${street.trim()} ${streetNumber.trim()}` : street.trim();

  const fileRef = useRef<HTMLInputElement>(null);
  const createRequest = useCreateServiceRequest();
  const uploadFile = useUploadFile();
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        address,
        urgency,
        budget: undefined,
        photos: photos.length > 0 ? photos : undefined,
        // @ts-ignore - Supabase RPC may need this or not, handling this for compatibility
        provider_id: provider.id,
      });
      setIsSuccess(true);
    } catch (error) {
       // Global toast handles errors
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
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
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
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hidden md:block">
            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
              <Info size={18} className="text-primary" />
              ¿Cómo es el proceso?
            </h3>
            
            <div className="relative border-l-2 border-border ml-3 space-y-6">
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-primary rounded-full border-4 border-card"></div>
                <h4 className="text-sm font-bold text-foreground">1. Enviás tu solicitud</h4>
                <p className="text-xs text-muted-foreground mt-1">Completá los detalles para que el profesional entienda qué necesitás.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-muted-foreground/30 border-border rounded-full border-4 border-card"></div>
                <h4 className="text-sm font-bold text-foreground">2. Recibís un presupuesto</h4>
                <p className="text-xs text-muted-foreground mt-1">El profesional revisa tu pedido y te envía un precio estimado.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-muted-foreground/30 border-border rounded-full border-4 border-card"></div>
                <h4 className="text-sm font-bold text-foreground">3. Aceptás y coordinan</h4>
                <p className="text-xs text-muted-foreground mt-1">Se abre un chat privado para acordar el día y horario final.</p>
              </div>
            </div>
          </div>

          {/* Badge de Segurança */}
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">
            <ShieldCheck className="text-green-600 dark:text-green-500 flex-shrink-0" size={20} />
            <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
              <strong>Transacción segura.</strong> No te cobraremos nada hasta que aceptes el presupuesto final del profesional.
            </p>
          </div>

        </div>

        {/* COLUNA DIREITA: Formulário ou Estado de Sucesso */}
        <div className="w-full lg:w-2/3">
          <div className="bg-card rounded-[2rem] shadow-xl border border-border overflow-hidden relative">
            
            {/* Efeito decorativo no topo */}
            <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/80"></div>

            {isSuccess ? (
              /* ESTADO DE SUCESSO ANIMADO */
              <div className="p-12 md:p-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-500 min-h-[500px]">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-success/80 rounded-full animate-ping opacity-40"></div>
                  <div className="relative bg-gradient-to-tr from-success to-emerald-400 text-white p-5 rounded-full shadow-lg shadow-success/30 transform transition-transform duration-500 hover:scale-110">
                    <Check size={48} strokeWidth={3} />
                  </div>
                </div>
                
                <h2 className="text-3xl font-extrabold text-foreground mb-4 tracking-tight">¡Solicitud enviada!</h2>
                <p className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
                  <strong className="text-foreground">{provider.full_name}</strong> ha recibido tu pedido. Te notificaremos en cuanto te responda con un presupuesto.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <Link to={`/prestador/${provider.id}`}>
                    <button className="w-full px-8 py-3.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-xl transition-colors">
                      Volver al perfil
                    </button>
                  </Link>
                  <Link to="/cliente">
                    <button className="w-full px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all">
                      Ir a mi Dashboard
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              /* FORMULÁRIO DE SOLICITAÇÃO */
              <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8 animate-in fade-in duration-300">
                
                <div className="mb-2">
                  <h1 className="text-2xl font-extrabold text-foreground mb-2">Detalles del servicio</h1>
                  <p className="text-muted-foreground">Completá esta información para que el profesional pueda presupuestar correctamente.</p>
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Descripción del problema <span className="text-destructive">*</span></label>
                  <textarea 
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describí con el mayor detalle posible qué necesitás que haga el profesional..." 
                    className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal resize-none"
                  ></textarea>
                </div>

                {/* Upload de Fotos (Drag & Drop Zone) */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex justify-between">
                    <span>Fotos de referencia</span>
                    <span className="text-muted-foreground font-normal text-xs">(Opcional, pero recomendado)</span>
                  </label>
                  
                  <input type="file" ref={fileRef} className="hidden" accept="image/*" multiple onChange={handleUpload} />
                  
                  <div 
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center justify-center py-8"
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-background border border-border rounded-full shadow-sm flex items-center justify-center mb-3 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
                          <ImagePlus size={24} />
                        </div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Subí fotos para que vea el problema</p>
                        <p className="text-xs text-muted-foreground mt-1">Máx. 3 imágenes (PNG, JPG)</p>
                      </>
                    )}
                  </div>
                  
                  {photos.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {photos.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
                          <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPhotos((p) => p.filter((_, j) => j !== i));
                            }}
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr className="border-border" />

                {/* Calle y Número */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Dirección donde se realizará el servicio <span className="text-destructive">*</span></label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="text-muted-foreground" size={20} />
                      </div>
                      <input
                        type="text"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Ej: Av. San Martín"
                        className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3.5 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={streetNumber}
                      onChange={(e) => setStreetNumber(e.target.value)}
                      placeholder="Número"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal"
                    />
                  </div>
                </div>

                {/* Data e Hora (Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">Fecha preferida</label>
                    <div className="relative">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full rounded-xl border-border bg-background pl-11 pr-4 py-6 text-left font-medium hover:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10",
                              !preferredDate && "text-muted-foreground font-normal"
                            )}
                          >
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                              <Calendar size={20} />
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
                    <label className="text-sm font-bold text-foreground">Horario preferido</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Clock className="text-muted-foreground" size={20} />
                      </div>
                      <select 
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-border bg-background pl-11 pr-4 py-3.5 text-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium font-normal cursor-pointer"
                      >
                        <option value="" disabled>Seleccionar horario</option>
                        {availableTimeSlots.map((slot) => (
                           <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Urgência */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground">Nivel de urgencia</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Baixa */}
                    <label className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all duration-200 ${urgency === 'baja' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50 bg-background'}`}>
                      <input type="radio" name="urgencia" value="baja" className="sr-only" onChange={() => setUrgency('baja')} checked={urgency === 'baja'} />
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${urgency === 'baja' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                          <Clock size={16} />
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${urgency === 'baja' ? 'border-primary' : 'border-input'}`}>
                          {urgency === 'baja' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                        </div>
                      </div>
                      <h4 className={`font-bold text-sm ${urgency === 'baja' ? 'text-primary' : 'text-foreground'}`}>Baja</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Puede esperar</p>
                    </label>

                    {/* Média */}
                    <label className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all duration-200 ${urgency === 'media' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50 bg-background'}`}>
                      <input type="radio" name="urgencia" value="media" className="sr-only" onChange={() => setUrgency('media')} checked={urgency === 'media'} />
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${urgency === 'media' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                          <AlertCircle size={16} />
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${urgency === 'media' ? 'border-primary' : 'border-input'}`}>
                          {urgency === 'media' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                        </div>
                      </div>
                      <h4 className={`font-bold text-sm ${urgency === 'media' ? 'text-primary' : 'text-foreground'}`}>Media</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Esta semana</p>
                    </label>

                    {/* Alta */}
                    <label className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all duration-200 ${urgency === 'alta' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50 bg-background'}`}>
                      <input type="radio" name="urgencia" value="alta" className="sr-only" onChange={() => setUrgency('alta')} checked={urgency === 'alta'} />
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${urgency === 'alta' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                          <Zap size={16} />
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${urgency === 'alta' ? 'border-primary' : 'border-input'}`}>
                          {urgency === 'alta' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                        </div>
                      </div>
                      <h4 className={`font-bold text-sm ${urgency === 'alta' ? 'text-primary' : 'text-foreground'}`}>Alta</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Lo antes posible</p>
                    </label>

                  </div>
                </div>

                {/* Botão de Envio */}
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={createRequest.isPending || !description || !address}
                    className={`w-full flex items-center justify-center gap-2 px-8 py-4 text-primary-foreground font-bold rounded-xl shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all text-lg ${(createRequest.isPending || !description || !address) ? 'bg-primary/50 cursor-not-allowed opacity-90 text-primary-foreground/70' : 'bg-primary hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5'}`}
                  >
                    {createRequest.isPending ? (
                      <><Loader2 className="animate-spin" size={20} strokeWidth={2.5} /> Enviando al profesional...</>
                    ) : (
                      <><Send size={20} strokeWidth={2.5} /> Solicitar Presupuesto</>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
