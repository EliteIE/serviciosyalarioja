import { useState, useRef, useEffect } from "react";
import { User, Phone, MapPin, FileText, Upload, X, Loader2, CheckCircle2, Clock, XCircle, Save, CreditCard, Link2, Unlink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

const MAX_DOC_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const ProviderProfile = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [connectingMP, setConnectingMP] = useState(false);
  const [bankAlias, setBankAlias] = useState("");
  const [bankCvu, setBankCvu] = useState("");

  // Handle MP OAuth callback params
  useEffect(() => {
    if (searchParams.get("mp_connected") === "true") {
      toast.success("¡Cuenta de MercadoPago conectada exitosamente!");
      queryClient.invalidateQueries({ queryKey: ["provider-mp-account"] });
    }
    if (searchParams.get("mp_error")) {
      toast.error("Error al conectar MercadoPago. Intentá de nuevo.");
    }
  }, [searchParams, queryClient]);

  // Fetch full profile with doc info
  const { data: fullProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["provider-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch decrypted bank details from secure view
  const { data: bankDetails } = useQuery({
    queryKey: ["my-bank-details", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("my_bank_details" as any)
        .select("bank_alias, bank_cvu")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as { bank_alias: string | null; bank_cvu: string | null } | null;
    },
    enabled: !!user,
  });

  // Populate bank fields when decrypted data loads
  useEffect(() => {
    if (bankDetails) {
      setBankAlias(bankDetails.bank_alias || "");
      setBankCvu(bankDetails.bank_cvu || "");
    }
  }, [bankDetails]);

  // Fetch MP account status
  const { data: mpAccount, isLoading: mpLoading } = useQuery({
    queryKey: ["provider-mp-account", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_mp_accounts" as any)
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as any;
    },
    enabled: !!user,
  });

  const docPaths: string[] = (fullProfile?.provider_doc_urls as string[] | null) || [];
  const verificationStatus = fullProfile?.provider_verification_status || "pending";

  // Get signed URLs for existing docs
  const { data: signedDocs } = useQuery({
    queryKey: ["provider-docs-signed", user?.id, docPaths.length],
    queryFn: async () => {
      const urls: { path: string; url: string; name: string }[] = [];
      for (const path of docPaths) {
        const { data } = await supabase.storage.from("provider-docs").createSignedUrl(path, 3600);
        if (data?.signedUrl) {
          const name = path.split("/").pop() || "Documento";
          urls.push({ path, url: data.signedUrl, name });
        }
      }
      return urls;
    },
    enabled: !!user && docPaths.length > 0,
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Bank data is sent as plaintext - encrypted automatically by DB trigger
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
          location: location.trim(),
          bank_alias: bankAlias.trim() || null,
          bank_cvu: bankCvu.trim() || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Perfil actualizado");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!user) return;

    const currentDocs = docPaths.length;
    if (currentDocs >= 3) {
      toast.error("Máximo 3 documentos permitidos");
      return;
    }

    const validFiles: File[] = [];
    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`Formato no soportado: ${f.name}`);
        continue;
      }
      if (f.size > MAX_DOC_SIZE) {
        toast.error(`${f.name} supera los 5MB`);
        continue;
      }
      validFiles.push(f);
    }

    const toUpload = validFiles.slice(0, 3 - currentDocs);
    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const newPaths: string[] = [];
      for (const file of toUpload) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("provider-docs").upload(path, file);
        if (error) throw error;
        newPaths.push(path);
      }

      const allPaths = [...docPaths, ...newPaths];
      const { error } = await supabase
        .from("profiles")
        .update({
          provider_doc_urls: allPaths,
          provider_verification_status: "pending",
        })
        .eq("id", user.id);
      if (error) throw error;

      toast.success(`${newPaths.length} documento(s) subido(s) correctamente`);
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ["provider-docs-signed"] });
    } catch (err: any) {
      toast.error(err.message || "Error al subir documentos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveDoc = async (pathToRemove: string) => {
    if (!user) return;
    try {
      await supabase.storage.from("provider-docs").remove([pathToRemove]);
      const newPaths = docPaths.filter((p) => p !== pathToRemove);
      await supabase
        .from("profiles")
        .update({
          provider_doc_urls: newPaths.length > 0 ? newPaths : null,
          provider_verification_status: newPaths.length > 0 ? "pending" : "pending",
        })
        .eq("id", user.id);
      toast.success("Documento eliminado");
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ["provider-docs-signed"] });
    } catch (err: any) {
      toast.error("Error al eliminar documento");
    }
  };

  const handleConnectMP = async () => {
    setConnectingMP(true);
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-oauth", {
        method: "POST",
        body: {},
      });
      if (error) throw error;
      if (data?.oauth_url) {
        window.location.href = data.oauth_url;
      }
    } catch (err: any) {
      toast.error("Error al conectar MercadoPago: " + (err.message || "Intente de nuevo"));
      setConnectingMP(false);
    }
  };

  const handleDisconnectMP = async () => {
    try {
      const { error } = await supabase.functions.invoke("mercadopago-oauth", {
        method: "DELETE",
        body: {},
      });
      if (error) throw error;
      toast.success("Cuenta de MercadoPago desconectada");
      queryClient.invalidateQueries({ queryKey: ["provider-mp-account"] });
    } catch (err: any) {
      toast.error("Error al desconectar");
    }
  };

  const statusConfig = {
    pending: { label: "Pendiente de revisión", icon: Clock, color: "bg-warning/10 text-warning" },
    approved: { label: "Verificado", icon: CheckCircle2, color: "bg-success/10 text-success" },
    rejected: { label: "Rechazado", icon: XCircle, color: "bg-destructive/10 text-destructive" },
  };
  const status = statusConfig[verificationStatus as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">Administrá tu información personal y documentación</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ubicación</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción de tus servicios</Label>
            <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Contá sobre tus servicios..." />
          </div>

          {/* Bank details */}
          <div className="pt-2 border-t space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Datos Bancarios (para cobros por transferencia)</h3>
            <div className="space-y-2">
              <Label>Alias</Label>
              <Input value={bankAlias} onChange={(e) => setBankAlias(e.target.value)} placeholder="mi.alias.mp" />
            </div>
            <div className="space-y-2">
              <Label>CVU</Label>
              <Input value={bankCvu} onChange={(e) => setBankCvu(e.target.value)} placeholder="0000003100000000000000" />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Cambios
          </Button>
        </CardContent>
      </Card>

      {/* MercadoPago Account */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Cuenta de Cobro (MercadoPago)
              </CardTitle>
              <CardDescription>
                Conectá tu cuenta de MercadoPago para recibir pagos automáticamente
              </CardDescription>
            </div>
            {mpAccount && (
              <Badge className="bg-success/10 text-success gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Conectada
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mpLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : mpAccount ? (
            <>
              <div className="rounded-xl bg-success/5 border border-success/20 p-4 space-y-2">
                <p className="text-sm font-medium">✅ Tu cuenta de MercadoPago está conectada</p>
                {mpAccount.mp_email && (
                  <p className="text-sm text-muted-foreground">
                    Email: <span className="font-medium">{mpAccount.mp_email}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Los pagos de tus clientes se depositarán automáticamente en esta cuenta, descontando la comisión de la plataforma.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectMP}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Unlink className="h-4 w-4" />
                Desconectar cuenta
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-warning/5 border border-warning/20 p-4 space-y-2">
                <p className="text-sm font-medium text-warning">⚠️ Cuenta no conectada</p>
                <p className="text-xs text-muted-foreground">
                  Para recibir pagos de tus clientes, necesitás conectar tu cuenta de MercadoPago.
                  El dinero se deposita automáticamente descontando la comisión de la plataforma.
                </p>
              </div>
              <Button
                onClick={handleConnectMP}
                disabled={connectingMP}
                className="gap-2 rounded-xl"
              >
                {connectingMP ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Conectar MercadoPago
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Documents & Verification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Documentación y Verificación</CardTitle>
              <CardDescription>Subí tu DNI, matrícula o documentación profesional para verificar tu cuenta</CardDescription>
            </div>
            <Badge className={`gap-1 ${status.color}`}>
              <status.icon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fullProfile?.provider_verification_notes && verificationStatus === "rejected" && (
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
              <p className="text-sm font-medium text-destructive mb-1">Motivo del rechazo:</p>
              <p className="text-sm text-destructive/80">{fullProfile.provider_verification_notes}</p>
            </div>
          )}

          {/* Existing docs */}
          {signedDocs && signedDocs.length > 0 && (
            <div className="space-y-2">
              <Label>Documentos subidos ({signedDocs.length}/3)</Label>
              {signedDocs.map((doc) => (
                <div key={doc.path} className="flex items-center gap-3 rounded-lg border p-3">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm font-medium hover:underline truncate"
                  >
                    {doc.name}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive/80"
                    onClick={() => handleRemoveDoc(doc.path)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          {docPaths.length < 3 && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Subiendo documentos...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Hacé clic para subir documentos</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WEBP o PDF — máx. 5MB — {3 - docPaths.length} restante(s)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Tus documentos serán revisados por nuestro equipo. Una vez aprobados, tu perfil mostrará el sello de verificado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderProfile;
