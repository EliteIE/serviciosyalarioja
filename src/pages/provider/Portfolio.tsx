import { useState, useRef, useEffect } from "react";
import { Upload, Plus, Loader2, Trash2, Camera, Eye, UploadCloud, ImageIcon, CheckCircle2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadFile } from "@/hooks/useServiceRequests";
import { useProviderPortfolio, useAddPortfolioItem, useDeletePortfolioItem } from "@/hooks/useProfiles";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ProviderPortfolio = () => {
  const { user } = useAuth();
  const addPortfolioItem = useAddPortfolioItem();
  const deletePortfolioItem = useDeletePortfolioItem();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const uploadFile = useUploadFile();
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const { data: photos = [], isLoading } = useProviderPortfolio(user?.id);

  const handleUpload = async (file: File, setter: (url: string) => void, setUploadingState: (v: boolean) => void) => {
    setUploadingState(true);
    try {
      const url = await uploadFile(file, "portfolio");
      setter(url);
    } catch {
      toast.error("Error al subir la imagen");
    }
    setUploadingState(false);
  };

  const handleAdd = async () => {
    if (!title || !beforeUrl || !afterUrl) return;
    setSaving(true);
    try {
      await addPortfolioItem.mutateAsync({
        title,
        description: description.trim() || null,
        before_url: beforeUrl,
        after_url: afterUrl,
      });
      toast.success("¡Trabajo agregado al portafolio!");
      setAddSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (addSuccess) {
      const timer = setTimeout(() => {
        setAddSuccess(false);
        setTitle("");
        setDescription("");
        setBeforeUrl("");
        setAfterUrl("");
        setOpen(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [addSuccess]);

  const handleDelete = async (id: string) => {
    try {
      await deletePortfolioItem.mutateAsync(id);
      toast.success("Trabajo eliminado");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return "Subido recientemente";
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">
            Tus mejores trabajos
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Los perfiles con fotos reciben un <span className="font-semibold text-orange-600">40% más</span> de solicitudes de presupuesto.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setAddSuccess(false); setTitle(""); setDescription(""); setBeforeUrl(""); setAfterUrl(""); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all bg-orange-600 hover:bg-orange-500 text-primary-foreground shadow-lg shadow-orange-600/20 hover:shadow-xl hover:shadow-orange-600/30 duration-200">
              <Plus className="h-4 w-4" /> Agregar Trabajo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-[24px] p-0 overflow-hidden border-0">
            {addSuccess ? (
              /* Success animation state */
              <div className="flex flex-col items-center justify-center py-16 px-8">
                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5 animate-in zoom-in-50 duration-300">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-primary-foreground">¡Trabajo Agregado!</h3>
                <p className="text-sm text-slate-500 mt-1">Tu portafolio se ha actualizado</p>
              </div>
            ) : (
              <>
                {/* Modal header bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-background/50">
                  <DialogHeader className="p-0 space-y-0">
                    <DialogTitle className="text-lg font-bold">Agregar trabajo al portafolio</DialogTitle>
                  </DialogHeader>
                  <button
                    onClick={() => setOpen(false)}
                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Title input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Título del trabajo</Label>
                    <Input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Ej: Reparación de baño completo"
                      className="rounded-[16px] h-11"
                    />
                  </div>

                  {/* Description input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex justify-between">
                      <span>Descripción</span>
                      <span className="text-xs font-normal text-slate-400">{description.length}/200 (opcional)</span>
                    </Label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value.slice(0, 200))}
                      placeholder="Breve descripción del trabajo realizado..."
                      rows={2}
                      maxLength={200}
                      className="w-full rounded-[16px] border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none transition-all"
                    />
                  </div>

                  {/* Before/After upload zones */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Before zone */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Foto Antes</Label>
                      <input type="file" ref={beforeRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], setBeforeUrl, setUploadingBefore)} />
                      {beforeUrl ? (
                        <div className="relative group cursor-pointer rounded-[16px] overflow-hidden" onClick={() => beforeRef.current?.click()}>
                          <img src={beforeUrl} className="h-36 w-full object-cover rounded-[16px]" />
                          <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-6 w-6 text-primary-foreground" />
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => beforeRef.current?.click()}
                          disabled={uploadingBefore}
                          className="w-full h-36 rounded-[16px] border border-dashed border-slate-300 dark:border-slate-600 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/20 dark:hover:border-orange-700 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-slate-400"
                        >
                          {uploadingBefore ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            <>
                              <UploadCloud className="h-7 w-7" />
                              <span className="text-xs font-medium">Subir foto</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* After zone */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Foto Después</Label>
                      <input type="file" ref={afterRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], setAfterUrl, setUploadingAfter)} />
                      {afterUrl ? (
                        <div className="relative group cursor-pointer rounded-[16px] overflow-hidden" onClick={() => afterRef.current?.click()}>
                          <img src={afterUrl} className="h-36 w-full object-cover rounded-[16px]" />
                          <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-6 w-6 text-primary-foreground" />
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => afterRef.current?.click()}
                          disabled={uploadingAfter}
                          className="w-full h-36 rounded-[16px] border border-dashed border-slate-300 dark:border-slate-600 hover:bg-green-50 hover:border-green-400 dark:hover:bg-green-950/20 dark:hover:border-green-700 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-slate-400"
                        >
                          {uploadingAfter ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            <>
                              <Camera className="h-7 w-7" />
                              <span className="text-xs font-medium">Subir foto</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Note */}
                  <p className="text-xs text-slate-400 text-center">
                    Las fotos de Antes y Después generan mucha más confianza
                  </p>

                  {/* Submit button */}
                  <Button
                    className="w-full h-12 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-primary-foreground font-semibold shadow-lg shadow-orange-600/20 duration-200"
                    onClick={handleAdd}
                    disabled={!title || !beforeUrl || !afterUrl || saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Agregar trabajo
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : photos.length === 0 ? (
        /* Premium empty state */
        <div
          className="bg-card rounded-[24px] border border-border/50 p-12 text-center cursor-pointer hover:shadow-lg transition-shadow duration-300"
          onClick={() => setOpen(true)}
        >
          <div className="relative inline-flex items-center justify-center mb-8">
            {/* Blurred circle behind */}
            <div className="absolute w-40 h-40 bg-orange-100 dark:bg-orange-900/30 rounded-full blur-2xl" />
            {/* Stacked illustration cards */}
            <div className="relative">
              <div className="w-28 h-36 bg-slate-200 dark:bg-slate-700 rounded-[16px] shadow-lg flex items-center justify-center -rotate-12 absolute -left-4 top-0">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
              <div className="w-28 h-36 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[16px] shadow-xl flex items-center justify-center rotate-6 relative z-10 ml-4">
                <Camera className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-primary-foreground mt-14">
            Aún no hay fotos en tu portafolio
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Las fotos de antes y después generan confianza con los clientes y te ayudan a conseguir más trabajos.
          </p>
          <Button className="mt-6 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-primary-foreground font-semibold px-6 h-11 shadow-md">
            Subir mi primer trabajo
          </Button>
        </div>
      ) : (
        /* Gallery grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((pair) => (
            <div key={pair.id} className="group rounded-[24px] border border-border/50 bg-card overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Image area */}
              <div className="relative h-48">
                <div className="grid grid-cols-2 h-full">
                  <div className="relative overflow-hidden">
                    <img src={pair.before_url} alt="Antes" className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-primary/60 backdrop-blur-md text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Antes
                    </span>
                  </div>
                  <div className="relative overflow-hidden">
                    <img src={pair.after_url} alt="Después" className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-green-500/80 backdrop-blur-md text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Después
                    </span>
                  </div>
                </div>
                {/* Actions layer */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-transform" onClick={() => window.open(pair.after_url, "_blank")}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-transform" onClick={() => handleDelete(pair.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Content area */}
              <div className="p-5 flex flex-col h-[calc(100%-12rem)]">
                <h3 className="font-semibold text-lg line-clamp-1 mb-2 text-foreground">{pair.title}</h3>
                {pair.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pair.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(pair.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderPortfolio;
