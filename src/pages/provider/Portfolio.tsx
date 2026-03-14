import { useState, useRef } from "react";
import { Upload, Plus, Loader2, Trash2 } from "lucide-react";
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
      setTitle("");
      setBeforeUrl("");
      setAfterUrl("");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi Portafolio</h1>
          <p className="text-muted-foreground">Mostrá tus mejores trabajos a futuros clientes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Agregar Trabajo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agregar trabajo al portafolio</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título del trabajo</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Reparación de baño" />
              </div>
              <div className="space-y-2">
                <Label>Foto ANTES</Label>
                <input type="file" ref={beforeRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], setBeforeUrl)} />
                {beforeUrl ? <img src={beforeUrl} className="h-32 rounded-lg object-cover" /> : (
                  <Button variant="outline" onClick={() => beforeRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Seleccionar foto"}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Foto DESPUÉS</Label>
                <input type="file" ref={afterRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], setAfterUrl)} />
                {afterUrl ? <img src={afterUrl} className="h-32 rounded-lg object-cover" /> : (
                  <Button variant="outline" onClick={() => afterRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Seleccionar foto"}
                  </Button>
                )}
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={!title || !beforeUrl || !afterUrl || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Agregar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((pair) => (
            <Card key={pair.id} className="overflow-hidden group relative">
              <CardContent className="p-0">
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <img src={pair.before_url} alt="Antes" className="h-40 w-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-secondary/80 text-secondary-foreground text-[10px] font-bold px-2 py-0.5 rounded">ANTES</span>
                  </div>
                  <div className="relative">
                    <img src={pair.after_url} alt="Después" className="h-40 w-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-primary/80 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">DESPUÉS</span>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <h3 className="font-medium text-sm">{pair.title}</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDelete(pair.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {photos.length === 0 && (
            <Card className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setOpen(true)}>
              <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[250px]">
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium text-sm">Agregar primer trabajo</p>
                <p className="text-xs text-muted-foreground text-center mt-1">Subí fotos del antes y después</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ProviderPortfolio;
