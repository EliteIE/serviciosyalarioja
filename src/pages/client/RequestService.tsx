import React, { useState, useRef, useMemo } from 'react';
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
  Users
} from 'lucide-react';
import { CATEGORIES } from "@/constants/categories";
import { useCreateServiceRequest, useUploadFile } from "@/hooks/useServiceRequests";
import { toast } from "sonner";

export default function RequestService() {
  const [searchParams] = useSearchParams();
  const providerIdParam = searchParams.get("provider");
  const categoryParam = searchParams.get("category");

  const [category, setCategory] = useState(categoryParam || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [urgencia, setUrgencia] = useState<'baja' | 'media' | 'alta'>('media');
  const [budget, setBudget] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !title || !description || !address) return;

    // Input validation
    if (title.trim().length < 3 || title.trim().length > 120) {
      toast.error("El título debe tener entre 3 y 120 caracteres");
      return;
    }
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
    // Validate category slug
    if (!CATEGORIES.some((c) => c.slug === category)) {
      toast.error("Categoría inválida");
      return;
    }

    try {
      await createRequest.mutateAsync({
        category,
        title: title.trim(),
        description: description.trim(),
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
    setTitle("");
    setDescription("");
    setStreet("");
    setStreetNumber("");
    setUrgencia('media');
    setBudget("");
    setPhotos([]);
    setIsSuccess(false);
  };

  const isSubmitting = createRequest.isPending;

  // Neurotécnica: Endowed Progress Effect — barra de progresso do formulário
  const formProgress = useMemo(() => {
    const fields = [category, title, description, street, streetNumber];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [category, title, description, street, streetNumber]);

  return (
    <div className="font-sans flex justify-center pb-10 px-4 md:px-8 min-h-[calc(100vh-theme(spacing.16))] lg:h-[calc(100vh-theme(spacing.16))]">

      {/* Contentor Principal */}
      <div className="w-full max-w-7xl bg-card rounded-[2rem] shadow-sm border border-border flex flex-col lg:h-full overflow-hidden">

        {/* Cabeçalho do Formulário */}
        <div className="bg-slate-900 px-8 py-8 md:py-10 relative shrink-0">
          {/* Efeito visual de fundo */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary rounded-full opacity-20 blur-[50px] pointer-events-none"></div>

          <h1 className="text-3xl font-extrabold text-white mb-2 relative z-10">
            {isSuccess ? '¡Listo!' : 'Solicitar Servicio'}
          </h1>
          <p className="text-slate-300 relative z-10 text-lg">
            {isSuccess ? 'Tu solicitud ha sido procesada correctamente.' : 'Describí qué necesitás y te conectamos con el mejor profesional de tu zona.'}
          </p>

          {/* Neurotécnica: Progress Bar (Goal Gradient Effect) */}
          {!isSuccess && (
            <div className="mt-5 relative z-10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>{formProgress === 100 ? '¡Todo listo para enviar!' : `${formProgress}% completado`}</span>
                <span className="flex items-center gap-1"><ShieldCheck size={12} /> Datos encriptados</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${formProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Neurotécnica: Social Proof (Bandwagon Effect) */}
          {!isSuccess && (
            <div className="mt-4 flex items-center gap-2 relative z-10">
              <div className="flex -space-x-2">
                {['bg-blue-500', 'bg-green-500', 'bg-purple-500'].map((color, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full ${color} border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white`}>
                    {['M', 'J', 'L'][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-semibold">+12 personas</span> solicitaron servicios hoy en tu zona
              </p>
            </div>
          )}
        </div>

        {/* Zero Risk Bias: reassurance strip */}
        {!isSuccess && (
          <div className="border-b border-border bg-success/5 px-6 py-2.5 flex items-center justify-center gap-6 text-xs shrink-0">
            <span className="flex items-center gap-1.5 text-success font-medium"><ShieldCheck size={14} /> Sin cargo hasta aceptar presupuesto</span>
            <span className="hidden sm:flex items-center gap-1.5 text-muted-foreground"><X size={12} /> Cancelación gratuita</span>
            <span className="hidden md:flex items-center gap-1.5 text-muted-foreground"><Clock size={12} /> Respuesta en &lt;2hs</span>
          </div>
        )}

        {/* Corpo do Formulário ou Animação de Sucesso */}
        <div className="flex-1 lg:overflow-y-auto custom-scrollbar">
          {isSuccess ? (
            <div className="relative p-12 md:p-20 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 lg:h-full">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"></div>
              <div className="relative mb-8">
                {/* Soft background glow */}
                <div className="absolute inset-0 w-32 h-32 -m-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full"></div>
                {/* Círculo expansivo animado */}
                <div className="absolute inset-0 bg-success/80 rounded-full animate-ping opacity-40"></div>
                {/* Ícone de sucesso */}
                <div className="relative bg-gradient-to-tr from-emerald-500 to-green-400 text-white p-5 rounded-full shadow-lg shadow-success/30 transform transition-transform duration-500 hover:scale-110">
                  <Check size={48} strokeWidth={3} />
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight">¡Solicitud enviada con éxito!</h2>
              <p className="text-lg text-foreground/80 max-w-md mb-4 leading-relaxed">
                Los profesionales de tu zona ya fueron notificados. Muy pronto empezarás a recibir presupuestos en tu panel.
              </p>
              {/* Neurotécnica: Peak-End Rule + Anchoring — timeline de expectativa */}
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl px-5 py-3 mb-8">
                <Clock size={18} className="text-amber-500 shrink-0" />
                <p className="text-sm text-foreground">
                  <strong>Tiempo promedio de respuesta:</strong> menos de 2 horas
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl transition-colors"
                >
                  Solicitar otro servicio
                </button>
                <Link to="/cliente">
                  <button type="button" className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                    Ir a mi Dashboard
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <form className="p-6 md:p-8" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
                {/* LADO ESQUIERDO: Detalhes do Serviço */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">1</span>
                    <h2 className="text-xl font-bold text-foreground">Detalles del problema</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-5">
                    {/* Categoria */}
                    <div className="space-y-2 relative">
                      <label className="text-sm font-semibold text-foreground">Categoría <span className="text-destructive">*</span></label>
                      <div className="relative">
                        <select 
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          required
                          className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 cursor-pointer font-medium"
                        >
                          <option value="" disabled>¿Qué tipo de servicio?</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                      </div>
                    </div>

                    {/* Título */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Título <span className="text-destructive">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Reparación..." 
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal"
                      />
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex justify-between">
                      <span>Descripción <span className="text-destructive">*</span></span>
                      <span className={`text-xs font-normal ${description.length > 4500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {description.length}/5000
                      </span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      maxLength={5000}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describí el problema con el mayor detalle posible. ¿Cuándo empezó? ¿Qué intentaste hacer?"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal resize-none"
                    ></textarea>
                    {/* Neurotécnica: Loss Aversion — solicitudes com mais detalhes recebem mais propostas */}
                    {description.length > 0 && description.length < 50 && (
                      <p className="text-[11px] text-amber-600 flex items-center gap-1">
                        <AlertCircle size={12} /> Las descripciones más detalladas reciben hasta un 60% más de presupuestos
                      </p>
                    )}
                  </div>

                  {/* Upload de Fotos */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex justify-between items-center">
                      <span>Fotos del problema</span>
                      <span className="text-muted-foreground font-normal text-xs">(Opcional)</span>
                    </label>
                    
                    <input type="file" ref={fileRef} className="hidden" accept="image/*" multiple onChange={handleUpload} />
                    
                    <div 
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-xl bg-secondary/30 hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center justify-center py-6"
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 bg-background rounded-full shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
                            <ImagePlus size={20} />
                          </div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Agregar fotos</p>
                        </div>
                      )}
                    </div>

                    {photos.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {photos.map((url, i) => (
                          <div key={i} className="relative group">
                            <img src={url} alt="" className="h-16 w-16 rounded-xl object-cover border border-border shadow-sm" />
                            <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* LADO DIREITO: Localização e Preferências */}
                <section className="space-y-6 flex flex-col">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">2</span>
                    <h2 className="text-xl font-bold text-foreground">Ubicación y Preferencias</h2>
                  </div>

                  {/* Calle y Número */}
                  <div className="grid grid-cols-3 gap-3">
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
                          className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal"
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
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium placeholder:text-muted-foreground font-normal"
                      />
                    </div>
                  </div>
                  {!street && localStorage.getItem("last_address") && (
                    <button
                      type="button"
                      onClick={() => {
                        const lastAddr = localStorage.getItem("last_address") || "";
                        // Try to split last address into street and number
                        const match = lastAddr.match(/^(.+?)\s+(\d+\S*)$/);
                        if (match) {
                          setStreet(match[1]);
                          setStreetNumber(match[2]);
                        } else {
                          setStreet(lastAddr);
                        }
                      }}
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      <MapPin size={10} /> Usar última dirección: {localStorage.getItem("last_address")}
                    </button>
                  )}

                  {/* Nível de Urgência */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">Nivel de urgencia</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3">
                      
                      {/* Opção Baixa */}
                      <label className={`relative flex xl:flex-col items-center xl:justify-center p-3 cursor-pointer rounded-xl border-2 transition-all duration-200 ${urgencia === 'baja' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-border/80 bg-background'}`}>
                        <input type="radio" name="urgencia" value="baja" className="sr-only" onChange={() => setUrgencia('baja')} checked={urgencia === 'baja'} />
                        <div className={`w-8 h-8 xl:mb-2 rounded-full flex items-center justify-center mr-3 xl:mr-0 flex-shrink-0 ${urgencia === 'baja' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                          <Clock size={16} />
                        </div>
                        <div className="flex-1 xl:text-center mr-2 xl:mr-0">
                          <h4 className={`font-bold text-sm leading-tight mb-0.5 ${urgencia === 'baja' ? 'text-primary' : 'text-foreground'}`}>Baja</h4>
                          <p className="text-[10px] text-muted-foreground leading-tight hidden xl:block">Puede esperar</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center xl:absolute xl:top-2 xl:right-2 ${urgencia === 'baja' ? 'border-primary' : 'border-muted-foreground'}`}>
                          {urgencia === 'baja' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                        </div>
                      </label>

                      {/* Opção Média */}
                      <label className={`relative flex xl:flex-col items-center xl:justify-center p-3 cursor-pointer rounded-xl border-2 transition-all duration-200 ${urgencia === 'media' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-border/80 bg-background'}`}>
                        <input type="radio" name="urgencia" value="media" className="sr-only" onChange={() => setUrgencia('media')} checked={urgencia === 'media'} />
                        <div className={`w-8 h-8 xl:mb-2 rounded-full flex items-center justify-center mr-3 xl:mr-0 flex-shrink-0 ${urgencia === 'media' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                          <AlertCircle size={16} />
                        </div>
                        <div className="flex-1 xl:text-center mr-2 xl:mr-0">
                          <h4 className={`font-bold text-sm leading-tight mb-0.5 ${urgencia === 'media' ? 'text-primary' : 'text-foreground'}`}>Media</h4>
                          <p className="text-[10px] text-muted-foreground leading-tight hidden xl:block">Esta semana</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center xl:absolute xl:top-2 xl:right-2 ${urgencia === 'media' ? 'border-primary' : 'border-muted-foreground'}`}>
                          {urgencia === 'media' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                        </div>
                      </label>

                      {/* Opção Alta */}
                      <label className={`relative flex xl:flex-col items-center xl:justify-center p-3 cursor-pointer rounded-xl border-2 transition-all duration-200 ${urgencia === 'alta' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-border/80 bg-background'}`}>
                        <input type="radio" name="urgencia" value="alta" className="sr-only" onChange={() => setUrgencia('alta')} checked={urgencia === 'alta'} />
                        <div className={`w-8 h-8 xl:mb-2 rounded-full flex items-center justify-center mr-3 xl:mr-0 flex-shrink-0 ${urgencia === 'alta' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                          <Zap size={16} />
                        </div>
                        <div className="flex-1 xl:text-center mr-2 xl:mr-0">
                          <h4 className={`font-bold text-sm leading-tight mb-0.5 ${urgencia === 'alta' ? 'text-primary' : 'text-foreground'}`}>Alta</h4>
                          <p className="text-[10px] text-muted-foreground leading-tight hidden xl:block">Urgencia</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center xl:absolute xl:top-2 xl:right-2 ${urgencia === 'alta' ? 'border-primary' : 'border-muted-foreground'}`}>
                          {urgencia === 'alta' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Orçamento */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex justify-between">
                      <span>Presupuesto estimado</span>
                      <span className="text-muted-foreground font-normal text-xs">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <DollarSign className="text-muted-foreground" size={18} />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="10000000"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 font-bold placeholder:text-muted-foreground font-normal text-lg"
                      />
                    </div>
                    {/* Neurotécnica: Anchoring — referencia de preço para reduzir incerteza */}
                    <p className="text-[11px] text-muted-foreground">
                      Indicar un presupuesto ayuda a recibir propuestas más precisas y rápidas.
                    </p>
                  </div>

                  {/* Botão Submit */}
                  <div className="mt-auto pt-4 flex-1 flex flex-col justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full flex items-center justify-center gap-2 px-8 py-4 text-primary-foreground font-bold rounded-xl shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all text-lg ${isSubmitting ? 'bg-primary/80 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)] hover:-translate-y-0.5'}`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={20} strokeWidth={2.5} />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send size={20} strokeWidth={2.5} />
                          Enviar Solicitud Gratis
                        </>
                      )}
                    </button>

                    {/* Neurotécnica: Trust Badges + Micro-copy (Redução de Ansiedade) */}
                    <div className="mt-4 space-y-2">
                      <p className="text-center text-xs text-muted-foreground">
                        Sin compromiso — recibí presupuestos y decidí sin presión.
                      </p>
                      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-500" /> 100% Seguro</span>
                        <span className="flex items-center gap-1"><Users size={12} className="text-blue-500" /> +500 Profesionales</span>
                        <span className="flex items-center gap-1"><Check size={12} className="text-primary" /> Sin costo</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
