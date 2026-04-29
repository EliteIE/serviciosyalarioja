import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/constants/categories";
import {
  useProviderLeads,
  useUpdateProviderLeadNotes,
  useUpdateProviderLeadStatus,
  type ProviderLead,
} from "@/hooks/useProviderIntake";

// ===== Maps de display =====

const STATUS_OPTIONS: ProviderLead["status"][] = [
  "nuevo",
  "contactado",
  "aprobado",
  "rechazado",
  "onboarding",
  "activo",
];

const STATUS_LABEL: Record<ProviderLead["status"], string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  onboarding: "Onboarding",
  activo: "Activo",
};

const STATUS_BADGE: Record<ProviderLead["status"], string> = {
  nuevo: "bg-primary/10 text-primary",
  contactado: "bg-blue-500/10 text-blue-600",
  aprobado: "bg-success/10 text-success",
  rechazado: "bg-destructive/10 text-destructive",
  onboarding: "bg-warning/10 text-warning",
  activo: "bg-secondary/10 text-secondary",
};

const SOURCE_LABEL: Record<ProviderLead["source"], string> = {
  redes_sociales: "Redes sociales",
  referido: "Referido",
  ministerio: "Ministerio",
  otro: "Otro",
};

const CATEGORY_NAME = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name]),
) as Record<string, string>;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+54 ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
};

// ===== Página =====

const AdminProviderLeads = () => {
  const [statusFilter, setStatusFilter] =
    useState<ProviderLead["status"] | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ProviderLead | null>(null);

  const { data: leads, isLoading } = useProviderLeads({
    status: statusFilter,
    category: categoryFilter,
  });

  const updateStatus = useUpdateProviderLeadStatus();
  const updateNotes = useUpdateProviderLeadNotes();

  const filtered = useMemo(() => {
    if (!leads) return [];
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.full_name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q),
    );
  }, [leads, search]);

  const stats = useMemo(() => {
    const all = leads || [];
    return {
      total: all.length,
      nuevo: all.filter((l) => l.status === "nuevo").length,
      contactado: all.filter((l) => l.status === "contactado").length,
      aprobado: all.filter((l) => l.status === "aprobado").length,
      step2: all.filter((l) => l.step2_completed).length,
    };
  }, [leads]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">
            Leads de Prestadores
          </h1>
          <p className="text-sm text-muted-foreground">
            Captación 1×1 — solicitudes recibidas vía formulario público.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total"
          value={stats.total}
          icon={Users}
          color="text-secondary"
          bg="bg-secondary/10"
        />
        <KpiCard
          label="Nuevos sin contactar"
          value={stats.nuevo}
          icon={Inbox}
          color="text-primary"
          bg="bg-primary/10"
          pulse={stats.nuevo > 0}
        />
        <KpiCard
          label="Contactados"
          value={stats.contactado}
          icon={MessageSquare}
          color="text-blue-600"
          bg="bg-blue-500/10"
        />
        <KpiCard
          label="Perfil completo"
          value={stats.step2}
          icon={CheckCircle2}
          color="text-success"
          bg="bg-success/10"
        />
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-2xl border border-border/60 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o teléfono..."
              className="w-full rounded-xl border border-border/60 bg-background pl-9 pr-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as ProviderLead["status"] | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-44 rounded-xl">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="bg-card rounded-2xl border border-border/60 p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Cargando leads...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/60 p-12 text-center">
          <UserPlus className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground">
            {leads?.length === 0
              ? "Aún no hay leads"
              : "No hay leads que coincidan con los filtros"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Los nuevos leads aparecerán aquí cuando se complete el formulario.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
          <ul className="divide-y divide-border">
            {filtered.map((lead) => (
              <li
                key={lead.id}
                className="p-4 sm:p-5 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => setSelected(lead)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar + info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-semibold text-base flex items-center justify-center flex-shrink-0 border border-primary/20">
                      {lead.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {lead.full_name}
                        </h4>
                        {lead.step2_completed && (
                          <Badge
                            variant="outline"
                            className="rounded-full px-2 py-0 text-[10px] font-semibold bg-success/10 text-success border-success/20"
                          >
                            Perfil completo
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Phone size={11} />
                          <span className="tabular-nums">
                            {formatPhone(lead.phone)}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 truncate">
                          <Mail size={11} />
                          <span className="truncate">{lead.email}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">
                          {CATEGORY_NAME[lead.category] || lead.category}
                        </span>
                        <span aria-hidden>·</span>
                        <span>vía {SOURCE_LABEL[lead.source]}</span>
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">
                          {formatDate(lead.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status + ação */}
                  <div className="flex items-center gap-3 sm:justify-end shrink-0 pl-14 sm:pl-0">
                    <Badge
                      className={`rounded-full px-3 py-1 ${STATUS_BADGE[lead.status]}`}
                    >
                      {STATUS_LABEL[lead.status]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(lead);
                      }}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detail dialog */}
      <LeadDetailDialog
        lead={selected}
        onClose={() => setSelected(null)}
        onUpdateStatus={(status) => {
          if (!selected) return;
          updateStatus.mutate({ id: selected.id, status });
          setSelected({ ...selected, status });
        }}
        onSaveNotes={(contact_notes) => {
          if (!selected) return;
          updateNotes.mutate({ id: selected.id, contact_notes });
          setSelected({ ...selected, contact_notes });
        }}
        savingNotes={updateNotes.isPending}
        savingStatus={updateStatus.isPending}
      />
    </div>
  );
};

// ===== KPI Card =====

const KpiCard = ({
  label,
  value,
  icon: Icon,
  color,
  bg,
  pulse,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
  bg: string;
  pulse?: boolean;
}) => (
  <Card className="rounded-2xl border-border/60 shadow-none">
    <CardContent className="p-5">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-1.5 truncate">
            {label}
          </p>
          <h3 className="text-2xl lg:text-3xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </h3>
        </div>
        <div
          className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center ${bg} ${color} relative shrink-0`}
        >
          <Icon size={20} strokeWidth={2} />
          {pulse && value > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ===== Detail Dialog =====

type DialogProps = {
  lead: ProviderLead | null;
  onClose: () => void;
  onUpdateStatus: (status: ProviderLead["status"]) => void;
  onSaveNotes: (notes: string) => void;
  savingNotes: boolean;
  savingStatus: boolean;
};

const LeadDetailDialog = ({
  lead,
  onClose,
  onUpdateStatus,
  onSaveNotes,
  savingNotes,
  savingStatus,
}: DialogProps) => {
  const [notes, setNotes] = useState("");

  // sync notes quando trocar de lead
  useMemo(() => {
    setNotes(lead?.contact_notes || "");
  }, [lead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lead) return null;

  const step2 = lead.step2_payload;

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <UserPlus className="text-primary" size={20} />
            {lead.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Info principal */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Datos de contacto
            </h3>
            <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
              <Field
                icon={Phone}
                label="Teléfono"
                value={formatPhone(lead.phone)}
              />
              <Field icon={Mail} label="Email" value={lead.email} />
              <Field
                icon={Users}
                label="Categoría"
                value={CATEGORY_NAME[lead.category] || lead.category}
              />
              <Field
                icon={Inbox}
                label="Vía"
                value={SOURCE_LABEL[lead.source]}
              />
              <Field
                icon={Clock}
                label="Recibido"
                value={formatDate(lead.created_at)}
              />
            </div>
          </section>

          {/* Status quick switch */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Estado
            </h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={savingStatus || lead.status === s}
                  onClick={() => onUpdateStatus(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors min-h-[36px] ${
                    lead.status === s
                      ? `${STATUS_BADGE[s]} border-transparent`
                      : "bg-background text-foreground border-border/60 hover:border-border"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </section>

          {/* Step 2 detail (se houver) */}
          {step2 && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                <ShieldCheck size={12} />
                Perfil profundo (paso 2)
              </h3>
              <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                {step2.years_experience && (
                  <Field
                    label="Años de experiencia"
                    value={step2.years_experience}
                  />
                )}
                {step2.team_type && (
                  <Field
                    label="Equipo"
                    value={
                      step2.team_type === "solo"
                        ? "Solo"
                        : step2.team_type === "2-3"
                          ? "2-3 personas"
                          : "Equipo formal"
                    }
                  />
                )}
                {step2.weekly_capacity && (
                  <Field
                    label="Capacidad semanal"
                    value={`${step2.weekly_capacity} servicios`}
                  />
                )}
                {step2.vehicle && (
                  <Field
                    label="Vehículo"
                    value={
                      step2.vehicle === "si"
                        ? "Sí"
                        : step2.vehicle === "no"
                          ? "No"
                          : "Moto"
                    }
                  />
                )}
                {step2.has_cuit && (
                  <Field
                    label="CUIT/CUIL"
                    value={
                      step2.has_cuit === "si"
                        ? "Sí"
                        : step2.has_cuit === "no"
                          ? "No"
                          : "No sabe"
                    }
                  />
                )}
                {step2.description && (
                  <div className="pt-2 border-t border-border/40">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Descripción
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {step2.description}
                    </p>
                  </div>
                )}
                {step2.secondary_categories &&
                  step2.secondary_categories.length > 0 && (
                    <div className="pt-2 border-t border-border/40">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Especialidades secundarias
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {step2.secondary_categories.map((c) => (
                          <Badge
                            key={c}
                            variant="secondary"
                            className="rounded-full text-xs"
                          >
                            {CATEGORY_NAME[c] || c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {(step2.reference_1 || step2.reference_2) && (
                  <div className="pt-2 border-t border-border/40 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Referencias
                    </p>
                    {[step2.reference_1, step2.reference_2]
                      .filter((r) => r && (r.name || r.phone))
                      .map((r, i) => (
                        <div key={i} className="text-xs">
                          <strong>{r?.name || "—"}</strong>
                          {r?.phone && ` · ${r.phone}`}
                          {r?.relation && ` · ${r.relation}`}
                        </div>
                      ))}
                  </div>
                )}
                {step2.extra_notes && (
                  <div className="pt-2 border-t border-border/40">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Notas del prestador
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {step2.extra_notes}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {!step2 && (
            <section>
              <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-warning shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-foreground">
                  El prestador no completó el paso 2. Considerá pedir más
                  información durante la entrevista.
                </p>
              </div>
            </section>
          )}

          {/* Notas internas */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Notas internas (solo equipo)
            </h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comentarios sobre la entrevista, próximos pasos, observaciones..."
              rows={4}
              className="rounded-xl resize-y"
            />
          </section>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full sm:flex-1"
          >
            Cerrar
          </Button>
          <Button
            onClick={() => onSaveNotes(notes)}
            disabled={savingNotes || notes === (lead.contact_notes || "")}
            className="rounded-full sm:flex-1"
          >
            {savingNotes ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              "Guardar notas"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Phone;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2 text-sm">
    {Icon && (
      <Icon size={14} className="text-muted-foreground mt-0.5 shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground break-words">{value}</span>
    </div>
  </div>
);

export default AdminProviderLeads;
