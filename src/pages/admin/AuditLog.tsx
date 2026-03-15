import { useState } from "react";
import { FileText, Loader2, Filter, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 25;

const actionColors: Record<string, string> = {
  INSERT: "bg-success/10 text-success",
  UPDATE: "bg-primary/10 text-primary",
  DELETE: "bg-destructive/10 text-destructive",
};

const AdminAuditLog = () => {
  const queryClient = useQueryClient();
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: auditData, isLoading } = useQuery({
    queryKey: ["admin-audit-log"],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const filtered = auditData?.filter(entry => {
    const matchTable = tableFilter === "all" || entry.table_name === tableFilter;
    const matchAction = actionFilter === "all" || entry.action === actionFilter;
    return matchTable && matchAction;
  });

  const totalPages = Math.ceil((filtered?.length || 0) / PAGE_SIZE);
  const paginated = filtered?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const tables = [...new Set(auditData?.map(e => e.table_name) || [])].sort();

  const formatChanges = (entry: any) => {
    try {
      const oldData = entry.old_data ? (typeof entry.old_data === "string" ? JSON.parse(entry.old_data) : entry.old_data) : null;
      const newData = entry.new_data ? (typeof entry.new_data === "string" ? JSON.parse(entry.new_data) : entry.new_data) : null;

      if (entry.action === "DELETE" && oldData) {
        return `Eliminado: ${Object.keys(oldData).slice(0, 3).join(", ")}...`;
      }
      if (entry.action === "INSERT" && newData) {
        const preview = Object.entries(newData).slice(0, 3).map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`).join(", ");
        return preview;
      }
      if (entry.action === "UPDATE" && oldData && newData) {
        const changes: string[] = [];
        for (const key of Object.keys(newData)) {
          if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
            changes.push(`${key}: ${String(oldData[key]).slice(0, 15)} → ${String(newData[key]).slice(0, 15)}`);
          }
        }
        return changes.slice(0, 3).join(", ") || "Sin cambios detectados";
      }
      return "—";
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Log de Auditoría</h1>
          <p className="text-sm text-muted-foreground mt-1">Registro de todos los cambios en el sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v); setPage(0); }}>
            <SelectTrigger className="w-44">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Tabla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las tablas</SelectItem>
              {tables.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="INSERT">INSERT</SelectItem>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-audit-log"] })}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !paginated?.length ? (
            <p className="text-sm text-muted-foreground text-center py-12">Sin registros de auditoría</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Fecha</TableHead>
                    <TableHead className="w-32">Tabla</TableHead>
                    <TableHead className="w-24">Acción</TableHead>
                    <TableHead>Cambios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString("es-AR", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">{entry.table_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${actionColors[entry.action] || ""}`}>{entry.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-md truncate">
                        {formatChanges(entry)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered?.length || 0)} de {filtered?.length}
                  </p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLog;
