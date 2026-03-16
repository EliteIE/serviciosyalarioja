import { useState, useRef, useEffect } from "react";
import { Upload, Plus, Loader2, Trash2, Camera, Eye, UploadCloud, ImageIcon, CheckCircle2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadFile } from "@/hooks/useServiceRequests";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const ProviderPortfolio = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const uploadFile = useUploadFile();
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["portfolio", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleUpload = async (file: File, setter: (url: string) => void) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, "portfolio");
      setter(url);
    } catch {
      toast.error("Error al subir la imagen");
    }
    setUploading(false);
  };

  const handleAdd = async () => {
    if (!title || !beforeUrl || !afterUrl) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("portfolio_items").insert({
        user_id: user!.id,
        title,
        before_url: beforeUrl,
        after_url: afterUrl,
      });
      if (error) throw error;
      toast.success("¡Trabajo agregado al portafolio!");
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
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
        setBeforeUrl("");
        setAfterUrl("");
        setOpen(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [addSuccess]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Trabajo eliminado");
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
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
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Tus mejores trabajos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Los perfiles con fotos reciben un <span className="font-semibold text-orange-600">40% más</span> de solicitudes de presupuesto.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setAddSuccess(false); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20 hover:shadow-xl hover:shadow-orange-600/30 hover:-translate-y-0.5 transition-all duration-200">
              <Plus className="h-4 w-4" /> Agregar Trabajo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-0">
            {addSuccess ? (
              /* Success animation state */
              <div className="flex flex-col items-center justify-center py-16 px-8">
                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5 animate-in zoom-in-50 duration-300">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">¡Trabajo Agregado!</h3>
                <p className="text-sm text-slate-500 mt-1">Tu portafolio se ha actualizado</p>
              </div>
            ) : (
              <>
                {/* Modal header bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 dark:bg-slate-900/50">
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
                      className="rounded-xl h-11"
                    />
                  </div>

                  {/* Before/After upload zones */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Before zone */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Foto Antes</Label>
                      <input type="file" ref={beforeRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], setBeforeUrl)} />
                      {beforeUrl ? (
                        <div className="relative group cursor-pointer rounded-xl overflow-hidden" onClick={() => beforeRef.current?.click()}>
                          <img src={beforeUrl} className="h-36 w-full object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => beforeRef.current?.click()}
                          disabled={uploading}
                          className="w-full h-36 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/20 dark:hover:border-orange-700 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-slate-400"
                        >
                          {uploading ? (
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
                      <input type="file" ref={afterRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], setAfterUrl)} />
                      {afterUrl ? (
                        <div className="relative group cursor-pointer rounded-xl overflow-hidden" onClick={() => afterRef.current?.click()}>
                          <img src={afterUrl} className="h-36 w-full object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => afterRef.current?.click()}
                          disabled={uploading}
                          className="w-full h-36 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:bg-green-50 hover:border-green-400 dark:hover:bg-green-950/20 dark:hover:border-green-700 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-slate-400"
                        >
                          {uploading ? (
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
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-semibold shadow-lg shadow-orange-600/20 transition-all duration-200"
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
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center cursor-pointer hover:shadow-lg transition-shadow duration-300"
          onClick={() => setOpen(true)}
        >
          <div className="relative inline-flex items-center justify-center mb-8">
            {/* Blurred circle behind */}
            <div className="absolute w-40 h-40 bg-orange-100 dark:bg-orange-900/30 rounded-full blur-2xl" />
            {/* Stacked illustration cards */}
            <div className="relative">
              <div className="w-28 h-36 bg-slate-200 dark:bg-slate-700 rounded-2xl shadow-lg flex items-center justify-center -rotate-12 absolute -left-4 top-0">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
              <div className="w-28 h-36 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl flex items-center justify-center rotate-6 relative z-10 ml-4">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-14">
            Aún no hay fotos en tu portafolio
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
            Las fotos de antes y después generan confianza con los clientes y te ayudan a conseguir más trabajos.
          </p>
          <Button className="mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-semibold px-6 h-11 shadow-md">
            Subir mi primer trabajo
          </Button>
        </div>
      ) : (
        /* Gallery grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((pair) => (
            <div key={pair.id} className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Image area */}
              <div className="relative h-48">
                <div className="grid grid-cols-2 h-full">
                  <div className="relative overflow-hidden">
                    <img src={pair.before_url} alt="Antes" className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Antes
                    </span>
                  </div>
                  <div className="relative overflow-hidden">
                    <img src={pair.after_url} alt="Después" className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-green-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Después
                    </span>
                  </div>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                  <button
                    onClick={() => window.open(pair.after_url, "_blank")}
                    className="h-10 w-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-lg"
                  >
                    <Eye className="h-4 w-4 text-slate-700" />
                  </button>
                  <button
                    onClick={() => handleDelete(pair.id)}
                    className="h-10 w-10 rounded-full bg-white/90 hover:bg-red-50 flex items-center justify-center transition-colors shadow-lg"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
              {/* Footer */}
              <div className="px-4 py-3">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">{pair.title}</h3>
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
