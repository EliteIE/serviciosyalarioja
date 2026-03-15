import { useState } from "react";
import { DollarSign, TrendingUp, Loader2, CreditCard, Download, Filter, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const PAGE_SIZE = 15;

const ProviderFinance = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["provider-payments", user?.id],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, service_requests(title)")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["provider-monthly-revenue", user?.id],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("provider_amount, platform_fee, created_at, status")
        .eq("provider_id", user!.id)
        .eq("status", "completed");
      const months: Record<string, { revenue: number; commission: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("es", { month: "short" });
        months[key] = { revenue: 0, commission: 0 };
      }
      data?.forEach((p) => {
        const key = new Date(p.created_at).toLocaleDateString("es", { month: "short" });
        if (months[key]) {
          months[key].revenue += Number(p.provider_amount);
          months[key].commission += Number(p.platform_fee);
        }
      });
      return Object.entries(months).map(([month, v]) => ({ month, ...v }));
    },
    enabled: !!user,
  });

  const completed = payments?.filter(p => p.status === "completed") || [];
  const totalEarnings = completed.reduce((s, p) => s + Number(p.provider_amount), 0);
  const totalCommissions = completed.reduce((s, p) => s + Number(p.platform_fee), 0);
  const totalGross = completed.reduce((s, p) => s + Number(p.amount), 0);
  const pending = payments?.filter(p => p.status === "pending") || [];
  const pendingAmount = pending.reduce((s, p) => s + Number(p.provider_amount), 0);

  const filteredPayments = payments?.filter(p => statusFilter === "all" || p.status === statusFilter);
  const totalPages = Math.ceil((filteredPayments?.length || 0) / PAGE_SIZE);
  const paginatedPayments = filteredPayments?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const statusLabel: Record<string, string> = {
    pending: "Pendiente", approved: "Aprobado", completed: "Completado", refunded: "Reembolsado", failed: "Fallido",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning", completed: "bg-success/10 text-success", failed: "bg-destructive/10 text-destructive", refunded: "bg-muted text-muted-foreground",
  };

  const exportCSV = () => {
    if (!filteredPayments?.length) {
      toast.error("No hay datos para exportar");
      return;
    }
    const headers = ["Servicio", "Monto Bruto", "Comisión", "Neto", "Estado", "Fecha"];
    const rows = filteredPayments.map((p: any) => [
      p.service_requests?.title || "—",
      Number(p.amount).toFixed(2),
      Number(p.platform_fee).toFixed(2),
      Number(p.provider_amount).toFixed(2),
      statusLabel[p.status] || p.status,
      new Date(p.created_at).toLocaleDateString("es-AR"),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mis_finanzas_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Finanzas</h1>
        <Button variant="outline" size="sm" className="gap-1" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-success mb-1" />
            <p className="text-xl font-bold">${totalEarnings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Ganancia Neta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xl font-bold">${totalCommissions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Comisiones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-primary mb-1" />
            <p className="text-xl font-bold">${totalGross.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Bruto</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CreditCard className="h-5 w-5 text-primary mb-1" />
            <p className="text-xl font-bold">{completed.length}</p>
            <p className="text-xs text-muted-foreground">Cobros Recibidos</p>
          </CardContent>
        </Card>
        <Card className={pending.length > 0 ? "border-warning/30" : ""}>
          <CardContent className="p-4">
            <AlertTriangle className={`h-5 w-5 mb-1 ${pending.length > 0 ? "text-warning" : "text-muted-foreground"}`} />
            <p className="text-xl font-bold">${pendingAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Pendiente ({pending.length})</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Evolución de Ingresos</CardTitle></CardHeader>
        <CardContent>
          {monthlyData && monthlyData.some(m => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(25, 100%, 50%)" strokeWidth={2} dot={{ fill: "hsl(25, 100%, 50%)" }} name="Neto" />
                <Line type="monotone" dataKey="commission" stroke="hsl(213, 80%, 15%)" strokeWidth={2} dot={{ fill: "hsl(213, 80%, 15%)" }} name="Comisión" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos de ingresos aún. Completá servicios para ver tus finanzas.</p>
          )}
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transacciones ({filteredPayments?.length || 0})</CardTitle>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-40">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="refunded">Reembolsados</SelectItem>
                <SelectItem value="failed">Fallidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : !paginatedPayments?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin transacciones</p>
          ) : (
            <>
              {paginatedPayments.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.status === "completed" ? "bg-success/10" : tx.status === "pending" ? "bg-warning/10" : "bg-muted"}`}>
                      <DollarSign className={`h-4 w-4 ${tx.status === "completed" ? "text-success" : tx.status === "pending" ? "text-warning" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.service_requests?.title || "Servicio"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("es-AR")}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className={`font-bold text-sm ${tx.status === "completed" ? "text-success" : "text-muted-foreground"}`}>
                      +${Number(tx.provider_amount).toLocaleString()}
                    </span>
                    <Badge className={`text-xs ${statusColor[tx.status] || ""}`}>{statusLabel[tx.status] || tx.status}</Badge>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredPayments?.length || 0)} de {filteredPayments?.length}
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

export default ProviderFinance;
