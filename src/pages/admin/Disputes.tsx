import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const { data: disputes, isLoading } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with profiles
      const userIds = new Set<string>();
      data.forEach((d) => { userIds.add(d.opened_by); });
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", Array.from(userIds));
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      return data.map(d => ({
        ...d,
        opened_by_name: profileMap.get(d.opened_by) || "—",
      }));
    },
  });

  const resolveDispute = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("disputes")
        .update({ status: "resuelta" as any, resolution: "Resuelta por administrador", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Disputa resuelta");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Disputas</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !disputes?.length ? (
        <div className="text-center py-12 text-muted-foreground">No hay disputas registradas</div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="p-2 rounded-xl bg-accent">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">Disputa</h3>
                      <Badge className={statusColors[dispute.status] || ""}>{statusLabels[dispute.status] || dispute.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{dispute.reason}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Abierta por: {dispute.opened_by_name}</span>
                      {dispute.amount && <span>Monto: ${Number(dispute.amount).toLocaleString()}</span>}
                      <span>{new Date(dispute.created_at).toLocaleDateString("es-AR")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {dispute.status !== "resuelta" && (
                      <Button
                        size="sm"
                        className="gap-1 rounded-lg"
                        onClick={() => resolveDispute.mutate(dispute.id)}
                        disabled={resolveDispute.isPending}
                      >
                        {resolveDispute.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
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
    </div>
  );
};

export default AdminDisputes;
