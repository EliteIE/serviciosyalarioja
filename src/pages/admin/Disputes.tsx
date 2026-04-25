import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Clock, Filter, MessageSquare, User, DollarSign, CalendarDays, Briefcase, ShieldAlert, FileText, Search, Scale, XCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminDisputes, useAdminUpdateDispute } from "@/hooks/useAdmin";

const statusColors: Record<string, string> = {
  abierta: "bg-destructive/10 text-destructive",
  en_revision: "bg-warning/10 text-warning",
  resuelta: "bg-success/10 text-success",
};

const statusLabels: Record<string, string> = {
  abierta: "Abierta",
  en_revision: "En Revisión",
  resuelta: "Resuelta",
};

const borderColors: Record<string, string> = {
  abierta: "border-l-4 border-l-red-500",
  en_revision: "border-l-4 border-l-amber-500",
  resuelta: "border-l-4 border-l-green-500",
};

const AdminDisputes = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [resolveDialog, setResolveDialog] = useState<unknown>(null);
  const [resolution, setResolution] = useState("");

  const { data: disputes, isLoading } = useAdminDisputes();
  const updateDispute = useAdminUpdateDispute();

  const handleUpdateDispute = async (id: string, status: string, resolutionText?: string) => {
    await updateDispute.mutateAsync({ id, status, resolutionText });
    setResolveDialog(null);
    setResolution("");
  };

  const filtered = disputes?.filter(d => filterStatus === "all" || d.status === filterStatus);

  const countByStatus = (status: string) => disputes?.filter(d => d.status === status).length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="rounded-[24px] shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-900/95">
        <CardContent className="p-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-[16px] bg-gradient-to-br from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 flex items-center justify-center shadow-sm ring-1 ring-red-100 dark:ring-red-900/30">
                <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">
                  Gestión de Disputas
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Revisá y resolvé las disputas entre usuarios
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Filter dropdown */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 rounded-[16px] border-border bg-card shadow-sm hover:shadow transition-shadow">
                  <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent className="rounded-[16px] shadow-xl border-border">
                  <SelectItem value="all">Todas las disputas</SelectItem>
                  <SelectItem value="abierta">Abiertas</SelectItem>
                  <SelectItem value="en_revision">En Revisión</SelectItem>
                  <SelectItem value="resuelta">Resueltas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="rounded-[24px] shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-card group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[16px] bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Abiertas</p>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">{countByStatus("abierta")}</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-card group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[16px] bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">En Revisión</p>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">{countByStatus("en_revision")}</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-card group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[16px] bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Resueltas</p>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">{countByStatus("resuelta")}</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card className="rounded-[24px] shadow-lg border-0 bg-card">
          <CardContent className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-16 w-16 rounded-[16px] bg-gradient-to-br from-orange-500/10 to-orange-600/10 dark:from-orange-500/20 dark:to-orange-600/20 flex items-center justify-center shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Cargando disputas...</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Esto puede tomar un momento</p>
            </div>
          </CardContent>
        </Card>
      ) : !filtered?.length ? (
        /* Premium empty state */
        <Card className="rounded-[24px] shadow-lg border-0 bg-card">
          <CardContent className="flex flex-col items-center justify-center py-24 px-6">
            <div className="h-24 w-24 rounded-[16px] bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/60 flex items-center justify-center mb-6 shadow-inner">
              <Scale className="h-11 w-11 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-foreground mb-2">
              {filterStatus !== "all" ? "Sin resultados" : "Sin disputas"}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
              {filterStatus !== "all"
                ? "No hay disputas con este estado. Probá con otro filtro."
                : "No hay disputas registradas. Cuando se genere una, aparecerá acá."}
            </p>
            {filterStatus !== "all" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-5 rounded-full border-border hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 dark:hover:bg-orange-950/30 dark:hover:text-orange-400 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                onClick={() => setFilterStatus("all")}
              >
                Ver todas las disputas
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((dispute) => (
            <Card
              key={dispute.id}
              className={`rounded-[24px] shadow-lg border-0 bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${borderColors[dispute.status] || ""}`}
            >
              <CardContent className="p-7">
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                  {/* Icon */}
                  <div className={`h-12 w-12 rounded-[16px] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                    dispute.status === "abierta"
                      ? "bg-red-500/10 dark:bg-red-500/20"
                      : dispute.status === "en_revision"
                        ? "bg-amber-500/10 dark:bg-amber-500/20"
                        : "bg-green-500/10 dark:bg-green-500/20"
                  }`}>
                    <AlertTriangle className={`h-6 w-6 ${
                      dispute.status === "abierta"
                        ? "text-red-600 dark:text-red-400"
                        : dispute.status === "en_revision"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-green-600 dark:text-green-400"
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2.5">
                      <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">Disputa</h3>
                      <Badge className={`${statusColors[dispute.status] || ""} rounded-full px-3 py-0.5 text-xs font-semibold border-0 shadow-sm`}>
                        {statusLabels[dispute.status] || dispute.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-foreground leading-relaxed">{dispute.reason}</p>

                    {/* Service Request Context */}
                    {dispute.service_request && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-800/60 dark:to-slate-800/30 rounded-[16px] flex items-center gap-3 ring-1 ring-slate-100 dark:ring-slate-800">
                        <div className="h-10 w-10 rounded-[16px] bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                          <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Servicio relacionado</p>
                          <p className="text-sm font-bold text-foreground truncate">
                            {dispute.service_request.title}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-auto text-[10px] shrink-0 rounded-full px-2.5 py-0.5 font-semibold border-border">
                          {dispute.service_request.status}
                        </Badge>
                      </div>
                    )}

                    {/* Resolution if exists */}
                    {dispute.resolution && dispute.status === "resuelta" && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/20 border border-green-200/60 dark:border-green-900/40 rounded-[16px] flex items-start gap-3">
                        <div className="h-8 w-8 rounded-[16px] bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">Resolución</p>
                          <p className="text-sm text-green-800 dark:text-green-300 leading-relaxed">{dispute.resolution}</p>
                        </div>
                      </div>
                    )}

                    {/* Metadata row */}
                    <div className="flex flex-wrap gap-5 mt-4 pt-4 border-t border-border/60">
                      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-6 w-6 rounded-[16px] bg-muted flex items-center justify-center">
                          <User className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        </div>
                        <span className="font-semibold text-foreground">{dispute.opened_by_name}</span>
                      </span>
                      {dispute.amount && (
                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="h-6 w-6 rounded-[16px] bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
                            <DollarSign className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                          </div>
                          <span className="font-semibold text-foreground">${Number(dispute.amount).toLocaleString()}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-6 w-6 rounded-[16px] bg-muted flex items-center justify-center">
                          <CalendarDays className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        </div>
                        {new Date(dispute.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2.5 shrink-0 sm:flex-col">
                    {dispute.status === "abierta" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 rounded-full shadow-sm border-border hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 dark:hover:bg-amber-950/30 dark:hover:text-amber-400 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                        onClick={() => updateDispute.mutate({ id: dispute.id, status: "en_revision" })}
                        disabled={updateDispute.isPending}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        En Revisión
                      </Button>
                    )}
                    {dispute.status !== "resuelta" && (
                      <Button
                        size="sm"
                        className="gap-2 rounded-full shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-primary-foreground border-0 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-[0.98]"
                        onClick={() => { setResolveDialog(dispute); setResolution(""); }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={!!resolveDialog} onOpenChange={(o) => !o && setResolveDialog(null)}>
        <DialogContent className="rounded-[24px] sm:rounded-[24px] border-0 shadow-2xl bg-card p-0 overflow-hidden max-w-lg">
          <DialogHeader className="px-7 pt-7 pb-0">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-[16px] bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 flex items-center justify-center shadow-sm ring-1 ring-green-100 dark:ring-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">
                  Resolver Disputa
                </DialogTitle>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Ingresá la resolución para cerrar esta disputa</p>
              </div>
            </div>
          </DialogHeader>

          <div className="px-7 py-5 space-y-5">
            {/* Dispute reason section */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-50/50 dark:from-slate-800/60 dark:to-slate-800/30 rounded-[16px] ring-1 ring-slate-100 dark:ring-slate-800">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-7 w-7 rounded-[16px] bg-slate-200/50 dark:bg-slate-700/50 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Motivo de la disputa
                </p>
              </div>
              <p className="text-sm text-foreground leading-relaxed pl-[38px]">
                {resolveDialog?.reason}
              </p>
            </div>

            {/* Resolution input */}
            <div className="space-y-2.5">
              <label className="text-sm font-bold text-foreground">
                Resolución <span className="text-orange-500">*</span>
              </label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describí cómo se resolvió esta disputa..."
                rows={4}
                className="rounded-[16px] border-border bg-card focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none shadow-sm transition-all duration-200"
              />
            </div>
          </div>

          <DialogFooter className="px-7 py-5 bg-gradient-to-t from-slate-50 to-slate-50/50 dark:from-slate-800/40 dark:to-slate-800/20 border-t border-border gap-3">
            <Button
              variant="outline"
              onClick={() => setResolveDialog(null)}
              className="rounded-full border-border hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Cancelar
            </Button>
            <Button
              disabled={!resolution.trim() || updateDispute.isPending}
              onClick={() => handleUpdateDispute(
                resolveDialog.id,
                "resuelta",
                resolution.trim()
              )}
              className="rounded-full shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-primary-foreground border-0 gap-2 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {updateDispute.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirmar Resolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputes;
