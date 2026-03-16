import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AvatarUploadProps {
  currentUrl?: string | null;
  initials: string;
  onUploaded?: (url: string) => void;
  onRemoved?: () => void;
}

export default function AvatarUpload({ currentUrl, initials, onUploaded, onRemoved }: AvatarUploadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl || currentUrl;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes (JPG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 2 MB");
      return;
    }

    // Show instant preview (Neurotécnica: feedback imediato)
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      // Delete old avatar if exists (different extension)
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(user.id);
      if (existingFiles && existingFiles.length > 0) {
        const toDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(toDelete);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;

      // Revoke the blob preview now that we have the real URL
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      toast.success("¡Foto de perfil actualizada!");
      onUploaded?.(publicUrl);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message || "Error al subir la imagen");
      setPreviewUrl(null); // Revert preview
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setUploading(true);
    try {
      // Delete from storage
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(user.id);
      if (existingFiles && existingFiles.length > 0) {
        const toDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(toDelete);
      }

      // Clear in profile
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);
      if (error) throw error;

      setPreviewUrl(null);
      toast.success("Foto de perfil eliminada");
      onRemoved?.();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Avatar con overlay de cámara */}
      <div className="relative group">
        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
          <AvatarImage src={displayUrl ?? ""} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Overlay interactivo */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* Badge de cámara fijo */}
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md border-2 border-background cursor-pointer hover:scale-110 transition-transform"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {displayUrl ? "Cambiar foto" : "Subir foto"}
        </button>
        {displayUrl && (
          <>
            <span className="text-muted-foreground text-xs">·</span>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="text-xs font-semibold text-destructive hover:underline flex items-center gap-0.5"
            >
              <Trash2 className="h-3 w-3" /> Eliminar
            </button>
          </>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">JPG, PNG, WebP o GIF · Máx. 2 MB</p>
    </div>
  );
}
