import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Clock, Filter, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

const AdminDisputes = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [resolveDialog, setResolveDialog] = useState<any>(null);
  const [resolution, setResolution] = useState("");

  const { data: disputes, isLoading } = useQuery({
    queryKey: ["admin-disputes"],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with profiles and service request info
      const userIds = new Set<string>();
      const srIds = new Set<string>();
      data.forEach((d) => {
        userIds.add(d.opened_by);
        if (d.service_request_id) srIds.add(d.service_request_id);
      });

      const [profilesRes, srRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", Array.from(userIds)),
        srIds.size > 0
          ? supabase.from("service_requests").select("id, title, status, client_id, provider_id").in("id", Array.from(srIds))
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p.full_name]) || []);
      const srMap = new Map(srRes.data?.map(sr => [sr.id, sr]) || []);

      return data.map(d => ({
        ...d,
        opened_by_name: profileMap.get(d.opened_by) || "—",
        service_request: d.service_request_id ? srMap.get(d.service_request_id) : null,
      }));
    },
  });

  const updateDispute = useMutation({
    mutationFn: async ({ id, status, resolutionText }: { id: string; status: string; resolutionText?: string }) => {
      const updateData: Record<string, any> = {
        status: status as any,
        updated_at: new Date().toISOString(),
      };
      if (resolutionText) updateData.resolution = resolutionText;

      const { error } = await supabase
        .from("disputes")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setResolveDialog(null);
      setResolution("");
      toast.success("Disputa actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = disputes?.filter(d => filterStatus === "all" || d.status === filterStatus);

  const countByStatus = (status: string) => disputes?.filter(d => d.status === status).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Gestión de Disputas</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="bg-destructive/10">{countByStatus("abierta")} abiertas</Badge>
            <Badge variant="outline" className="bg-warning/10">{countByStatus("en_revision")} en revisión</Badge>
            <Badge variant="outline" className="bg-success/10">{countByStatus("resuelta")} resueltas</Badge>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="abierta">Abiertas</SelectItem>
              <SelectItem value="en_revision">En Revisión</SelectItem>
              <SelectItem value="resuelta">Resueltas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !filtered?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          {filterStatus !== "all" ? "No hay disputas con este estado" : "No hay disputas registradas"}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((dispute) => (
            <Card key={dispute.id} className={dispute.status === "abierta" ? "border-destructive/20" : ""}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="p-2 rounded-xl bg-accent shrink-0">
                    <AlertTriangle className={`h-5 w-5 ${dispute.status === "abierta" ? "text-destructive" : "text-warning"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold">Disputa</h3>
                      <Badge className={statusColors[dispute.status] || ""}>{statusLabels[dispute.status] || dispute.status}</Badge>
                    </div>
                    <p className="text-sm mt-1">{dispute.reason}</p>

                    {/* Service Request Context */}
                    {dispute.service_request && (
                      <div className="mt-2 p-2 bg-accent/50 rounded-lg text-xs">
                        <span className="text-muted-foreground">Servicio: </span>
                        <span className="font-medium">{dispute.service_request.title}</span>
                        <span className="text-muted-foreground ml-2">Estado: {dispute.service_request.status}</span>
                      </div>
                    )}

                    {/* Resolution if exists */}
                    {dispute.resolution && dispute.status === "resuelta" && (
                      <div className="mt-2 p-2 bg-success/5 border border-success/20 rounded-lg text-xs">
                        <span className="text-muted-foreground">Resolución: </span>
                        <span>{dispute.resolution}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Abierta por: <strong>{dispute.opened_by_name}</strong></span>
                      {dispute.amount && <span>Monto: ${Number(dispute.amount).toLocaleString()}</span>}
                      <span>{new Date(dispute.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {dispute.status === "abierta" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 rounded-lg"
                        onClick={() => updateDispute.mutate({ id: dispute.id, status: "en_revision" })}
                        disabled={updateDispute.isPending}
                      >
                        <Clock className="h-3 w-3" />
                        En Revisión
                      </Button>
                    )}
                    {dispute.status !== "resuelta" && (
                      <Button
                        size="sm"
                        className="gap-1 rounded-lg"
                        onClick={() => { setResolveDialog(dispute); setResolution(""); }}
                      >
                        <CheckCircle2 className="h-3 w-3" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Disputa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-accent rounded-lg text-sm">
              <p className="text-muted-foreground mb-1">Motivo de la disputa:</p>
              <p>{resolveDialog?.reason}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resolución *</label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describí cómo se resolvió esta disputa..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(null)}>Cancelar</Button>
            <Button
              disabled={!resolution.trim() || updateDispute.isPending}
              onClick={() => updateDispute.mutate({
                id: resolveDialog.id,
                status: "resuelta",
                resolutionText: resolution.trim(),
              })}
            >
              {updateDispute.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Confirmar Resolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputes;
