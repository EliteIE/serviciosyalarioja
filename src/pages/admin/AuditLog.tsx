import { useState } from "react";
import { FileText, Loader2, Filter, ChevronLeft, ChevronRight, RefreshCw, Clock, Database, Shield, Plus, Pencil, Trash2, Activity, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAuditLog } from "@/hooks/useAdmin";

const PAGE_SIZE = 25;

const actionColors: Record<string, string> = {
  INSERT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  UPDATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
};

const actionDots: Record<string, string> = {
  INSERT: "bg-emerald-500",
  UPDATE: "bg-amber-500",
  DELETE: "bg-red-500",
};

const actionIconBg: Record<string, string> = {
  INSERT: "bg-emerald-500/10 dark:bg-emerald-500/20",
  UPDATE: "bg-amber-500/10 dark:bg-amber-500/20",
  DELETE: "bg-red-500/10 dark:bg-red-500/20",
};

const actionIconColor: Record<string, string> = {
  INSERT: "text-emerald-600 dark:text-emerald-400",
  UPDATE: "text-amber-600 dark:text-amber-400",
  DELETE: "text-red-600 dark:text-red-400",
};

const ActionIcon = ({ action }: { action: string }) => {
  const iconClass = `h-5 w-5 ${actionIconColor[action] || "text-slate-500"}`;
  switch (action) {
    case "INSERT": return <Plus className={iconClass} />;
    case "UPDATE": return <Pencil className={iconClass} />;
    case "DELETE": return <Trash2 className={iconClass} />;
    default: return <Activity className={iconClass} />;
  }
};

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Ahora mismo";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return null;
};

const AdminAuditLog = () => {
  const queryClient = useQueryClient();
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: auditData, isLoading } = useAdminAuditLog(tableFilter, actionFilter);

  const filtered = auditData?.filter(entry => {
    const matchTable = tableFilter === "all" || entry.table_name === tableFilter;
    const matchAction = actionFilter === "all" || entry.action === actionFilter;
    return matchTable && matchAction;
  });

  const totalPages = Math.ceil((filtered?.length || 0) / PAGE_SIZE);
  const paginated = filtered?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const tables = [...new Set(auditData?.map(e => e.table_name) || [])].sort();

  const formatChanges = (entry) => {
    try {
      const oldData = entry.old_data ? (typeof entry.old_data === "string" ? JSON.parse(entry.old_data) : entry.old_data) : null;
      const newData = entry.new_data ? (typeof entry.new_data === "string" ? JSON.parse(entry.new_data) : entry.new_data) : null;

      if (entry.action === "DELETE" && oldData) {
        return `Eliminado: ${Object.keys(oldData).slice(0, 3).join(", ")}...`;
      }
      if (entry.action === "INSERT" && newData) {
        const preview = Object.entries(newData).slice(0, 3).map(([k, v]) => `${k}: ${(typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)).slice(0, 30)}`).join(", ");
        return preview;
      }
      if (entry.action === "UPDATE" && oldData && newData) {
        const changes: string[] = [];
        for (const key of Object.keys(newData)) {
          if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
            changes.push(`${key}: ${(typeof oldData[key] === "object" && oldData[key] !== null ? JSON.stringify(oldData[key]) : String(oldData[key])).slice(0, 15)} → ${(typeof newData[key] === "object" && newData[key] !== null ? JSON.stringify(newData[key]) : String(newData[key])).slice(0, 15)}`);
          }
        }
        return changes.slice(0, 3).join(", ") || "Sin cambios detectados";
      }
      return "—";
    } catch {
      return "—";
    }
  };

  // Count by action type for summary cards
  const insertCount = auditData?.filter(e => e.action === "INSERT").length || 0;
  const updateCount = auditData?.filter(e => e.action === "UPDATE").length || 0;
  const deleteCount = auditData?.filter(e => e.action === "DELETE").length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-orange-500/30">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">
              Log de Auditoría
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registro completo de todos los cambios en el sistema
            </p>
          </div>
        </div>

        {/* Stats badges */}
        {auditData && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 text-xs font-semibold text-foreground border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <Database className="h-3.5 w-3.5 text-orange-500" />
              {auditData.length} registros
            </div>
          </div>
        )}
      </div>

      {/* Summary stat cards */}
      {auditData && auditData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 bg-card border border-border p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">{insertCount}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Inserciones</p>
            </div>
          </div>
          <div className="rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 bg-card border border-border p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Pencil className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">{updateCount}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Actualizaciones</p>
            </div>
          </div>
          <div className="rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 bg-card border border-border p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">{deleteCount}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Eliminaciones</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="rounded-3xl shadow-lg bg-card border border-border p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20">
              <Filter className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">Filtros</span>
            </div>

            <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v); setPage(0); }}>
              <SelectTrigger className="w-48 rounded-xl border-border bg-slate-50/50 dark:bg-slate-800/50 shadow-sm hover:bg-accent transition-colors duration-200">
                <Database className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Tabla" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todas las tablas</SelectItem>
                {tables.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
              <SelectTrigger className="w-44 rounded-xl border-border bg-slate-50/50 dark:bg-slate-800/50 shadow-sm hover:bg-accent transition-colors duration-200">
                <Activity className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="INSERT">INSERT</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-border hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:border-orange-300 dark:hover:border-orange-500/30 hover:text-orange-600 dark:hover:text-orange-400 group transition-all duration-300"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-audit-log"] })}
          >
            <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
          </Button>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-500/20 dark:to-orange-500/10">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Cargando registros...</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Obteniendo datos del log de auditoría</p>
            </div>
          </div>
        ) : !paginated?.length ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="relative">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-800/30 blur-sm" />
              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-800/80 border border-slate-200/60 dark:border-slate-700 shadow-inner">
                <Search className="h-9 w-9 text-slate-300 dark:text-slate-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold tracking-tight text-foreground">
                Sin registros de auditoría
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs">
                No se encontraron entradas con los filtros seleccionados. Intentá ajustar los criterios de búsqueda.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-5 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all duration-200"
              onClick={() => { setTableFilter("all"); setActionFilter("all"); setPage(0); }}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-gradient-to-r from-slate-50/80 to-slate-50/40 dark:from-slate-800/40 dark:to-slate-800/20">
                    <TableHead className="w-12 pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground" />
                    <TableHead className="w-48 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Fecha
                    </TableHead>
                    <TableHead className="w-36 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tabla
                    </TableHead>
                    <TableHead className="w-28 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Acción
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Cambios
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((entry, index: number) => {
                    const relative = formatRelativeTime(entry.created_at);
                    return (
                      <TableRow
                        key={entry.id}
                        className="border-b border-slate-100/80 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200 group"
                      >
                        {/* Icon column */}
                        <TableCell className="pl-6 pr-0">
                          <div className={`h-10 w-10 rounded-xl ${actionIconBg[entry.action] || "bg-muted"} flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
                            <ActionIcon action={entry.action} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-foreground whitespace-nowrap">
                              {new Date(entry.created_at).toLocaleString("es-AR", {
                                day: "2-digit", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                            {relative && (
                              <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                <Clock className="h-3 w-3" />
                                {relative}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 text-xs font-mono font-semibold text-foreground border border-slate-200/40 dark:border-slate-700/40">
                            {entry.table_name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${actionColors[entry.action] || ""}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${actionDots[entry.action] || "bg-slate-400"}`} />
                            {entry.action}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <span className="inline-block text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg truncate max-w-full border border-border/40">
                            {formatChanges(entry)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-gradient-to-r from-slate-50/50 to-slate-50/20 dark:from-slate-800/30 dark:to-slate-800/10">
                <p className="text-sm text-muted-foreground">
                  Mostrando{" "}
                  <span className="font-bold text-foreground">
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered?.length || 0)}
                  </span>{" "}
                  de{" "}
                  <span className="font-bold text-foreground">
                    {filtered?.length}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="rounded-full px-4 border-border hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:border-orange-300 dark:hover:border-orange-500/30 hover:text-orange-600 dark:hover:text-orange-400 disabled:opacity-40 transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20">
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {page + 1}
                    </span>
                    <span className="text-sm text-slate-400 dark:text-slate-500">/</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {totalPages}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="rounded-full px-4 border-border hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:border-orange-300 dark:hover:border-orange-500/30 hover:text-orange-600 dark:hover:text-orange-400 disabled:opacity-40 transition-all duration-200"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLog;
