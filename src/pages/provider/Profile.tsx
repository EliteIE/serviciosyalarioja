import { useState, useRef, useEffect, useMemo } from "react";
import {
  User, Phone, MapPin, FileText, Upload, X, Loader2, CheckCircle2,
  Clock, XCircle, Save, CreditCard, Link2, Unlink, Trash2, Mail,
  Plus, Calendar, DollarSign, Briefcase, Globe, Tag, UploadCloud, ShieldAlert
} from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CATEGORIES } from "@/constants/categories";
import {
  useMySchedule, useSaveSchedule,
  useMyServices, useAddService, useDeleteService,
  DAY_NAMES, DAY_NAMES_SHORT,
} from "@/hooks/useProviderSchedule";
import { useFullProfile, useUpdateProfile, useDeleteAccount } from "@/hooks/useProfiles";
import {
  useMyBankDetails,
  useMpAccount,
  useConnectMp,
  useDisconnectMp,
  useUploadProviderDocs,
  useRemoveProviderDoc,
  useUploadCriminalRecord,
  useSignedDocs,
  useSignedCriminalUrl
} from "@/hooks/useProviderSettings";

const MAX_DOC_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const DEFAULT_SCHEDULE = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  start_time: "08:00",
  end_time: "18:00",
  is_active: i >= 1 && i <= 5, // Mon-Fri active by default
}));

const ProviderProfile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const criminalFileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();

  // ─── Basic Info State ───────────────────────────────
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [providerCategory, setProviderCategory] = useState(profile?.provider_category || "");
  const [priceRange, setPriceRange] = useState("");
  const [coverageArea, setCoverageArea] = useState<string[]>([]);
  const [coverageInput, setCoverageInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [connectingMP, setConnectingMP] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [criminalUploading, setCriminalUploading] = useState(false);
  const [bankAlias, setBankAlias] = useState("");
  const [bankCvu, setBankCvu] = useState("");

  // ─── Schedule State ─────────────────────────────────
  const { data: savedSchedule } = useMySchedule();
  const saveScheduleMutation = useSaveSchedule();
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);

  // ─── Services State ─────────────────────────────────
  const { data: myServices } = useMyServices();
  const addServiceMutation = useAddService();
  const deleteServiceMutation = useDeleteService();
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  const [newServicePriceFrom, setNewServicePriceFrom] = useState("");
  const [newServicePriceTo, setNewServicePriceTo] = useState("");
  const [showAddService, setShowAddService] = useState(false);

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
  const { data: fullProfile, refetch: refetchProfile } = useFullProfile();

  // Populate extra fields from full profile
  useEffect(() => {
    if (fullProfile) {
      const profileData = fullProfile as Record<string, unknown>;
      setPriceRange((profileData.provider_price_range as string) || "");
      setCoverageArea((profileData.provider_coverage_area as string[]) || []);
    }
  }, [fullProfile]);

  // Populate schedule from DB
  useEffect(() => {
    if (savedSchedule && savedSchedule.length > 0) {
      const merged = DEFAULT_SCHEDULE.map((def) => {
        const saved = savedSchedule.find((s) => s.day_of_week === def.day_of_week);
        if (saved) return {
          day_of_week: saved.day_of_week,
          start_time: saved.start_time.slice(0, 5),
          end_time: saved.end_time.slice(0, 5),
          is_active: saved.is_active,
        };
        return def;
      });
      setSchedule(merged);
    }
  }, [savedSchedule]);

  // Fetch decrypted bank details from secure view
  const { data: bankDetails } = useMyBankDetails();

  useEffect(() => {
    if (bankDetails) {
      setBankAlias(bankDetails.bank_alias || "");
      setBankCvu(bankDetails.bank_cvu || "");
    }
  }, [bankDetails]);

  // Fetch MP account status
  const { data: mpAccount, isLoading: mpLoading } = useMpAccount();

  const docPaths: string[] = (fullProfile?.provider_doc_urls as string[] | null) || [];
  const verificationStatus = fullProfile?.provider_verification_status || "pending";

  const { data: signedDocs } = useSignedDocs(user, docPaths);

  // ─── Profile Completeness (Neurotécnica: Endowed Progress) ─────
  const profileCompleteness = useMemo(() => {
    const fields = [
      { name: "Foto", done: !!profile?.avatar_url },
      { name: "Nombre", done: !!fullName },
      { name: "Categoría", done: !!providerCategory },
      { name: "Bio", done: !!bio && bio.length >= 20 },
      { name: "Teléfono", done: !!phone },
      { name: "Ubicación", done: !!location },
      { name: "Horarios", done: schedule.some((s) => s.is_active) && (savedSchedule?.length || 0) > 0 },
      { name: "Servicios", done: (myServices?.length || 0) > 0 },
    ];
    const completed = fields.filter((f) => f.done).length;
    return { fields, completed, total: fields.length, percent: Math.round((completed / fields.length) * 100) };
  }, [profile?.avatar_url, fullName, providerCategory, bio, phone, location, schedule, savedSchedule, myServices]);

  // ─── Mutation Hooks ────────────────────────────────
  const updateProfile = useUpdateProfile();
  const connectMp = useConnectMp();
  const disconnectMp = useDisconnectMp();
  const uploadDocs = useUploadProviderDocs();
  const removeDoc = useRemoveProviderDoc();
  const uploadCriminal = useUploadCriminalRecord();
  const deleteAccount = useDeleteAccount();

  // ─── Handlers ──────────────────────────────────────

  const handleSaveProfile = () => {
    if (!user) return;
    setSaving(true);
    updateProfile.mutate({
      full_name: fullName.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      location: location.trim(),
      provider_category: providerCategory || null,
      provider_price_range: priceRange.trim() || null,
      provider_coverage_area: coverageArea.length > 0 ? coverageArea : null,
      bank_alias: bankAlias.trim() || null,
      bank_cvu: bankCvu.trim() || null,
    }, {
      onSuccess: () => {
        toast.success("Perfil actualizado");
        setSaving(false);
      },
      onError: (err) => {
        toast.error(err.message || "Error al guardar");
        setSaving(false);
      }
    });
  };

  const handleSaveSchedule = () => {
    saveScheduleMutation.mutate(schedule);
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) {
      toast.error("El nombre del servicio es obligatorio");
      return;
    }
    addServiceMutation.mutate({
      name: newServiceName.trim(),
      description: newServiceDesc.trim() || undefined,
      estimated_duration: newServiceDuration.trim() || undefined,
      price_from: newServicePriceFrom ? parseFloat(newServicePriceFrom) : undefined,
      price_to: newServicePriceTo ? parseFloat(newServicePriceTo) : undefined,
    }, {
      onSuccess: () => {
        setNewServiceName("");
        setNewServiceDesc("");
        setNewServiceDuration("");
        setNewServicePriceFrom("");
        setNewServicePriceTo("");
        setShowAddService(false);
      },
    });
  };

  const handleAddCoverage = () => {
    const val = coverageInput.trim();
    if (val && !coverageArea.includes(val)) {
      setCoverageArea((prev) => [...prev, val]);
      setCoverageInput("");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!user) return;
    const currentDocs = docPaths.length;
    if (currentDocs >= 3) { toast.error("Máximo 3 documentos permitidos"); return; }
    const validFiles: File[] = [];
    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) { toast.error(`Formato no soportado: ${f.name}`); continue; }
      if (f.size > MAX_DOC_SIZE) { toast.error(`${f.name} supera los 5MB`); continue; }
      validFiles.push(f);
    }
    const toUpload = validFiles.slice(0, 3 - currentDocs);
    if (toUpload.length === 0) return;

    setUploading(true);
    uploadDocs.mutate({ files: toUpload, docPaths }, {
      onSuccess: (newPaths) => {
        toast.success(`${newPaths.length} documento(s) subido(s)`);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      onError: (err) => {
        toast.error(err.message || "Error al subir");
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  const handleRemoveDoc = (pathToRemove: string) => {
    if (!user) return;
    removeDoc.mutate({ pathToRemove, docPaths }, {
      onSuccess: () => toast.success("Documento eliminado"),
      onError: () => toast.error("Error al eliminar documento")
    });
  };

  const handleConnectMP = () => {
    setConnectingMP(true);
    connectMp.mutate(undefined, {
      onSuccess: (data) => {
        if (data?.oauth_url) window.location.href = data.oauth_url;
      },
      onError: (err) => {
        toast.error("Error al conectar MercadoPago: " + (err.message || ""));
        setConnectingMP(false);
      }
    });
  };

  const handleDisconnectMP = () => {
    disconnectMp.mutate(undefined, {
      onSuccess: () => toast.success("Cuenta de MercadoPago desconectada"),
      onError: () => toast.error("Error al desconectar")
    });
  };

  const handleDeleteAccount = () => {
    if (!user) return;
    setDeleting(true);
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        toast.success("Tu cuenta ha sido eliminada");
        signOut();
        navigate("/");
      },
      onError: (err) => {
        toast.error(err.message || "Error al eliminar la cuenta");
        setDeleting(false);
      }
    });
  };

  // ─── Criminal Record Upload Handler ──────────────
  const handleCriminalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const accepted = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!accepted.includes(file.type)) { toast.error("Formato no soportado. Usá JPG, PNG, WEBP o PDF."); return; }
    if (file.size > MAX_DOC_SIZE) { toast.error("El archivo supera los 5MB"); return; }
    
    setCriminalUploading(true);
    uploadCriminal.mutate(file, {
      onSuccess: () => {
        toast.success("Antecedentes penales subidos. Serán revisados por nuestro equipo.");
        setCriminalUploading(false);
        if (criminalFileInputRef.current) criminalFileInputRef.current.value = "";
      },
      onError: (err) => {
        toast.error(err.message || "Error al subir el archivo");
        setCriminalUploading(false);
        if (criminalFileInputRef.current) criminalFileInputRef.current.value = "";
      }
    });
  };

  // Criminal record helpers
  const profileProps = fullProfile as Record<string, unknown> | undefined;
  const criminalRecordUrl = (profileProps?.criminal_record_url as string) || null;
  const criminalRecordStatus: string = (profileProps?.criminal_record_status as string) || "not_submitted";
  const criminalRecordNotes: string | null = (profileProps?.criminal_record_notes as string | null) || null;
  const criminalRecordExpiry: string | null = (profileProps?.criminal_record_expiry as string | null) || null;

  const criminalStatusConfig: Record<string, { label: string; color: string }> = {
    not_submitted: { label: "Pendiente de envío", color: "bg-orange-100 text-orange-700" },
    pending: { label: "En revisión", color: "bg-yellow-100 text-yellow-700" },
    approved: { label: "Aprobado", color: "bg-green-100 text-green-700" },
    rejected: { label: "Rechazado", color: "bg-red-100 text-red-700" },
    expired: { label: "Vencido", color: "bg-red-100 text-red-700" },
  };
  const criminalStatus = criminalStatusConfig[criminalRecordStatus] || criminalStatusConfig.not_submitted;

  const { data: signedCriminalUrl } = useSignedCriminalUrl(user, criminalRecordUrl);

  const statusConfig = {
    pending: { label: "Pendiente de revisión", icon: Clock, color: "bg-warning/10 text-warning" },
    approved: { label: "Verificado", icon: CheckCircle2, color: "bg-success/10 text-success" },
    rejected: { label: "Rechazado", icon: XCircle, color: "bg-destructive/10 text-destructive" },
  };
  const status = statusConfig[verificationStatus as keyof typeof statusConfig] || statusConfig.pending;

  const initials = fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "P";

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Mi Perfil Profesional</h1>
        <p className="text-muted-foreground">Gestioná tu información, servicios y disponibilidad</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* ─── Left Column: Progress Widget (Sticky) ─── */}
        <div className="w-full lg:w-1/3 lg:sticky lg:top-6 space-y-5">
          {/* Profile Completeness Widget */}
          <Card className="rounded-[24px] shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden border-border/50">
            <div className="h-1 bg-muted">
              <div className="h-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-500" style={{ width: `${profileCompleteness.percent}%` }} />
            </div>
            <CardContent className="p-6">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Progreso</p>
                  <h3 className="text-2xl font-extrabold">{profileCompleteness.percent}% <span className="text-lg text-muted-foreground font-medium">completo</span></h3>
                </div>
                <span className="text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-[16px]">{profileCompleteness.completed}/{profileCompleteness.total} Pasos</span>
              </div>
              <p className="text-xs text-muted-foreground mb-5">
                Los perfiles completos reciben hasta un <strong className="text-foreground">80% más de solicitudes</strong>.
              </p>
              <div className="space-y-2.5">
                {profileCompleteness.fields.map((f) => (
                  <div key={f.name} className={`flex items-center gap-3 text-sm font-medium p-2 rounded-[16px] transition-colors ${
                    f.done ? "bg-success/10 text-success" : "border border-border hover:border-orange-200 dark:hover:border-orange-800 text-muted-foreground cursor-pointer"
                  }`}>
                    {f.done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    {f.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save button (desktop only) */}
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full gap-2 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Cambios
          </Button>
        </div>

        {/* ─── Right Column: All Form Sections ─── */}
        <div className="w-full lg:w-2/3 space-y-6">

      {/* ─── Avatar & Email ──────────────────────── */}
      <Card className="rounded-[24px] border-border/50">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0 [&_span]:!h-32 [&_span]:!w-32 [&_.h-24]:!h-32 [&_.w-24]:!w-32">
            <AvatarUpload currentUrl={profile?.avatar_url} initials={initials} />
          </div>
          <div className="text-center sm:text-left">
            <p className="font-semibold text-lg">{fullName || "Sin nombre"}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center sm:justify-start">
              <Mail className="h-3 w-3" /> {user?.email}
            </p>
            {profile?.provider_verified && (
              <span className="text-xs text-success font-semibold flex items-center gap-1 mt-1 justify-center sm:justify-start">
                <CheckCircle2 className="h-3 w-3" /> Prestador verificado
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Personal Info + Category + Bio ────── */}
      <Card className="rounded-[24px] border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9 rounded-[16px] bg-slate-50 focus:border-orange-500" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9 rounded-[16px] bg-slate-50 focus:border-orange-500" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 380 123-4567" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9 rounded-[16px] bg-slate-50 focus:border-orange-500" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="La Rioja, Capital" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoría Principal</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={providerCategory}
                  onChange={(e) => setProviderCategory(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-[16px] border border-input bg-slate-50 text-sm font-medium appearance-none cursor-pointer focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between">
              <span>Descripción profesional</span>
              <span className={`text-xs font-normal ${bio.length > 900 ? "text-destructive" : "text-muted-foreground"}`}>{bio.length}/1000</span>
            </Label>
            <Textarea
              rows={4}
              maxLength={1000}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describí tu experiencia, qué servicios ofrecés, años de experiencia, certificaciones..."
              className="rounded-[16px] bg-slate-50 focus:border-orange-500"
            />
            {bio.length > 0 && bio.length < 50 && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Una descripción más detallada genera más confianza en los clientes
              </p>
            )}
          </div>

          {/* Coverage Area */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Zonas de Cobertura</Label>
            <div className="flex gap-2">
              <Input
                value={coverageInput}
                onChange={(e) => setCoverageInput(e.target.value)}
                placeholder="Ej: Capital, Sanagasta..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCoverage(); } }}
                className="rounded-[16px] bg-slate-50 focus:border-orange-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddCoverage} className="rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {coverageArea.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {coverageArea.map((area) => (
                  <Badge key={area} variant="secondary" className="gap-1 pr-1">
                    {area}
                    <button type="button" onClick={() => setCoverageArea((prev) => prev.filter((a) => a !== area))} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Rango de Precios</Label>
            <Input
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              placeholder="Ej: $5.000 - $50.000 según el trabajo"
              className="rounded-[16px] bg-slate-50 focus:border-orange-500"
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} className="w-full gap-2 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all lg:hidden">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Información
          </Button>
        </CardContent>
      </Card>

      {/* ─── Schedule / Availability ──────────── */}
      <Card className="rounded-[24px] border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" /> Horarios de Disponibilidad</CardTitle>
          <CardDescription>Configurá los días y horarios en que atendés. Los clientes verán esto en tu perfil público.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedule.map((slot, i) => (
            <div key={slot.day_of_week} className={`flex items-center gap-3 p-3 rounded-[16px] border transition-colors ${slot.is_active ? "bg-orange-50/30 dark:bg-orange-950/10 border-orange-200 dark:border-orange-800" : "bg-muted/30 border-transparent"}`}>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => setSchedule((prev) => prev.map((s, j) => j === i ? { ...s, is_active: !s.is_active } : s))}
                className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${slot.is_active ? "bg-orange-500" : "bg-muted-foreground/20"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${slot.is_active ? "left-[18px]" : "left-0.5"}`} />
              </button>

              {/* Day Name */}
              <span className={`w-12 text-sm font-bold ${slot.is_active ? "text-foreground" : "text-muted-foreground"}`}>
                {DAY_NAMES_SHORT[slot.day_of_week]}
              </span>

              {/* Time Selectors */}
              {slot.is_active ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => setSchedule((prev) => prev.map((s, j) => j === i ? { ...s, start_time: e.target.value } : s))}
                    className="h-9 px-2 rounded-[16px] border border-input bg-background text-sm font-medium"
                  />
                  <span className="text-muted-foreground text-sm">a</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => setSchedule((prev) => prev.map((s, j) => j === i ? { ...s, end_time: e.target.value } : s))}
                    className="h-9 px-2 rounded-[16px] border border-input bg-background text-sm font-medium"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">No disponible</span>
              )}
            </div>
          ))}

          <Button
            onClick={handleSaveSchedule}
            disabled={saveScheduleMutation.isPending}
            className="w-full gap-2 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all mt-2"
          >
            {saveScheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Horarios
          </Button>
        </CardContent>
      </Card>

      {/* ─── Services Offered ──────────────────── */}
      <Card className="rounded-[24px] border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5" /> Servicios que Ofrezco</CardTitle>
              <CardDescription>Agregá los servicios específicos que realizás para que los clientes sepan qué pueden contratar.</CardDescription>
            </div>
            <Button size="sm" variant="outline" className="gap-1 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all" onClick={() => setShowAddService(true)}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Existing Services */}
          {myServices && myServices.length > 0 ? (
            myServices.map((svc) => (
              <div key={svc.id} className="flex items-start gap-3 p-4 rounded-[16px] border border-border/50 bg-card group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{svc.name}</p>
                  {svc.description && <p className="text-sm text-muted-foreground mt-0.5">{svc.description}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {svc.estimated_duration && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {svc.estimated_duration}</span>
                    )}
                    {(svc.price_from || svc.price_to) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {svc.price_from && svc.price_to
                          ? `$${svc.price_from.toLocaleString()} - $${svc.price_to.toLocaleString()}`
                          : svc.price_from ? `Desde $${svc.price_from.toLocaleString()}` : `Hasta $${svc.price_to!.toLocaleString()}`
                        }
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
                  onClick={() => deleteServiceMutation.mutate(svc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Todavía no agregaste servicios. Agregá al menos uno para que los clientes te encuentren.</p>
            </div>
          )}

          {/* Add Service Form */}
          {showAddService && (
            <div className="p-4 rounded-[16px] border border-primary/20 bg-primary/5 space-y-3 animate-in fade-in duration-200">
              <p className="font-semibold text-sm">Nuevo Servicio</p>
              <Input
                placeholder="Nombre del servicio (ej: Instalación de termotanque)"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
              />
              <Textarea
                rows={2}
                placeholder="Descripción breve (opcional)"
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Duración (ej: 2-3 hs)" value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} />
                <Input type="number" placeholder="Precio desde" value={newServicePriceFrom} onChange={(e) => setNewServicePriceFrom(e.target.value)} />
                <Input type="number" placeholder="Precio hasta" value={newServicePriceTo} onChange={(e) => setNewServicePriceTo(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="gap-1 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all" onClick={handleAddService} disabled={addServiceMutation.isPending}>
                  {addServiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Guardar Servicio
                </Button>
                <Button size="sm" variant="outline" className="rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all" onClick={() => setShowAddService(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Finanzas y Cobros ──────────────── */}
      <Card className="rounded-[24px] border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5" /> Finanzas y Cobros</CardTitle>
          <CardDescription>Configurá tus métodos de cobro para recibir pagos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bank Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Datos Bancarios (para cobros por transferencia)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alias</Label>
                <Input value={bankAlias} onChange={(e) => setBankAlias(e.target.value)} placeholder="mi.alias.mp" className="rounded-[16px] bg-slate-50 focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <Label>CVU</Label>
                <Input value={bankCvu} onChange={(e) => setBankCvu(e.target.value)} placeholder="0000003100000000000000" className="rounded-[16px] bg-slate-50 focus:border-orange-500" />
              </div>
            </div>
          </div>

          {/* MercadoPago Integration */}
          <div className="rounded-[16px] border border-border/50 bg-blue-50/50 dark:bg-blue-950/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-blue-600" /> MercadoPago
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Conectá tu cuenta para recibir pagos automáticamente</p>
              </div>
              {mpAccount && <Badge className="bg-success/10 text-success gap-1"><CheckCircle2 className="h-3 w-3" /> Conectada</Badge>}
            </div>

            {mpLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div>
            ) : mpAccount ? (
              <>
                <div className="rounded-[16px] bg-success/5 border border-success/20 p-4 space-y-2">
                  <p className="text-sm font-medium">Tu cuenta de MercadoPago está conectada</p>
                  {mpAccount.mp_email && <p className="text-sm text-muted-foreground">Email: <span className="font-medium">{mpAccount.mp_email}</span></p>}
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnectMP} className="gap-2 text-destructive hover:text-destructive rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                  <Unlink className="h-4 w-4" /> Desconectar cuenta
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-[16px] bg-warning/5 border border-warning/20 p-4 space-y-2">
                  <p className="text-sm font-medium text-warning">Cuenta no conectada</p>
                  <p className="text-xs text-muted-foreground">Para recibir pagos, necesitás conectar tu cuenta de MercadoPago.</p>
                </div>
                <Button onClick={handleConnectMP} disabled={connectingMP} className="gap-2 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                  {connectingMP ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Conectar MercadoPago
                </Button>
              </>
            )}
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} className="w-full gap-2 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all lg:hidden">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Datos Bancarios
          </Button>
        </CardContent>
      </Card>

      {/* ─── Antecedentes Penales ────────────── */}
      <Card className="rounded-[24px] border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Antecedentes Penales</CardTitle>
              <CardDescription>Requerido para completar la verificación de tu perfil</CardDescription>
            </div>
            <Badge className={`gap-1 rounded-full ${criminalStatus.color}`}>{criminalStatus.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Approved expiry date */}
          {criminalRecordStatus === "approved" && criminalRecordExpiry && (
            <div className="rounded-[16px] bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-800 p-4">
              <p className="text-sm text-green-700 dark:text-green-400">Válido hasta: <span className="font-semibold">{criminalRecordExpiry}</span></p>
            </div>
          )}

          {/* Rejected notes */}
          {criminalRecordStatus === "rejected" && criminalRecordNotes && (
            <div className="rounded-[16px] bg-destructive/5 border border-destructive/20 p-4">
              <p className="text-sm font-medium text-destructive mb-1">Motivo del rechazo:</p>
              <p className="text-sm text-destructive/80">{criminalRecordNotes}</p>
            </div>
          )}

          {/* Preview of uploaded document */}
          {signedCriminalUrl && (
            <div className="space-y-2">
              <Label>Documento subido</Label>
              <div className="flex items-center gap-3 rounded-[16px] border p-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <a href={signedCriminalUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm font-medium hover:underline truncate">
                  Ver antecedentes penales
                </a>
              </div>
            </div>
          )}

          {/* Upload zone */}
          <div>
            <input ref={criminalFileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleCriminalFileSelect} />
            <div
              onClick={() => !criminalUploading && criminalFileInputRef.current?.click()}
              className="border border-dashed rounded-[16px] p-8 text-center cursor-pointer hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/10 dark:hover:border-orange-700 transition-colors"
            >
              {criminalUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Subiendo documento...</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">{criminalRecordUrl ? "Subir nuevo documento" : "Hacé clic para subir"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Imagen o PDF — máx. 5MB</p>
                </>
              )}
            </div>
          </div>

          {/* Info note */}
          <p className="text-xs text-slate-400">
            Certificado de antecedentes penales emitido en los últimos 6 meses. Será revisado por nuestro equipo.
          </p>
        </CardContent>
      </Card>

      {/* ─── Documents & Verification ────────── */}
      <Card className="rounded-[24px] border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Documentación y Verificación</CardTitle>
              <CardDescription>Subí tu DNI, matrícula o documentación profesional</CardDescription>
            </div>
            <Badge className={`gap-1 ${status.color}`}><status.icon className="h-3 w-3" /> {status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fullProfile?.provider_verification_notes && verificationStatus === "rejected" && (
            <div className="rounded-[16px] bg-destructive/5 border border-destructive/20 p-4">
              <p className="text-sm font-medium text-destructive mb-1">Motivo del rechazo:</p>
              <p className="text-sm text-destructive/80">{fullProfile.provider_verification_notes}</p>
            </div>
          )}

          {signedDocs && signedDocs.length > 0 && (
            <div className="space-y-2">
              <Label>Documentos subidos ({signedDocs.length}/3)</Label>
              {signedDocs.map((doc) => (
                <div key={doc.path} className="flex items-center gap-3 rounded-[16px] border p-3">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm font-medium hover:underline truncate">{doc.name}</a>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => handleRemoveDoc(doc.path)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {docPaths.length < 3 && (
            <div>
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple className="hidden" onChange={handleFileSelect} />
              <div onClick={() => !uploading && fileInputRef.current?.click()} className="border border-dashed rounded-[16px] p-8 text-center cursor-pointer hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/10 dark:hover:border-orange-700 transition-colors">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Subiendo documentos...</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">Hacé clic para subir documentos</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP o PDF — máx. 5MB — {3 - docPaths.length} restante(s)</p>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Danger Zone ─────────────────────── */}
      <Card className="border-destructive/30 bg-red-50/50 dark:bg-red-950/10 rounded-[24px]">
        <CardHeader>
          <CardTitle className="text-lg text-destructive flex items-center gap-2"><Trash2 className="h-5 w-5" /> Zona de Peligro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Al eliminar tu cuenta, se borrarán permanentemente todos tus datos, servicios, portafolio, reseñas y documentación. Esta acción no se puede deshacer.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all"><Trash2 className="h-4 w-4" /> Eliminar mi cuenta</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro que querés eliminar tu cuenta?</AlertDialogTitle>
                <AlertDialogDescription>Esta acción es permanente y no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2">
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sí, eliminar mi cuenta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Mobile save button */}
      <div className="block lg:hidden sticky bottom-4 z-10 pt-4 pb-2">
        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full gap-2 rounded-full hover:-translate-y-0.5 active:scale-[0.98] transition-all h-12 text-base font-bold bg-orange-600 hover:bg-orange-500 shadow-lg"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar Cambios
        </Button>
      </div>

        </div>{/* End right column */}
      </div>{/* End two-column layout */}
    </div>
  );
};

export default ProviderProfile;
