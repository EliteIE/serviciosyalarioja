import { useState } from "react";
import { DollarSign, TrendingUp, Settings, Loader2, Save, Download, Filter, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const PAGE_SIZE = 20;

const AdminReports = () => {
  const queryClient = useQueryClient();
  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: settings } = useQuery({
    queryKey: ["platform-settings"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_settings").select("*");
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.key] = s.value; });
      return map;
    },
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, service_requests(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: monthlyRevenue } = useQuery({
    queryKey: ["admin-monthly-revenue"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("amount, platform_fee, created_at, status")
        .eq("status", "completed");
      const months: Record<string, { revenue: number; fee: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("es", { month: "short" });
        months[key] = { revenue: 0, fee: 0 };
      }
      data?.forEach((p) => {
        const key = new Date(p.created_at).toLocaleDateString("es", { month: "short" });
        if (months[key]) {
          months[key].revenue += Number(p.amount);
          months[key].fee += Number(p.platform_fee);
        }
      });
      return Object.entries(months).map(([month, v]) => ({ month, ...v }));
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 50) {
        throw new Error("La comisión debe estar entre 0% y 50%");
      }
      const { error } = await supabase
        .from("platform_settings")
        .update({ value: String(numValue) })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      setEditingRate(false);
      toast.success("Configuración actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filteredPayments = payments?.filter(p => statusFilter === "all" || p.status === statusFilter);
  const totalPages = Math.ceil((filteredPayments?.length || 0) / PAGE_SIZE);
  const paginatedPayments = filteredPayments?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const completed = payments?.filter(p => p.status === "completed") || [];
  const totalVolume = completed.reduce((s, p) => s + Number(p.amount), 0);
  const totalFees = completed.reduce((s, p) => s + Number(p.platform_fee), 0);
  const avgTicket = completed.length > 0 ? totalVolume / completed.length : 0;
  const refunded = payments?.filter(p => p.status === "refunded") || [];
  const totalRefunded = refunded.reduce((s, p) => s + Number(p.amount), 0);
  const failed = payments?.filter(p => p.status === "failed")?.length || 0;

  const statusLabel: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobado",
    completed: "Completado",
    refunded: "Reembolsado",
    failed: "Fallido",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    approved: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    refunded: "bg-muted text-muted-foreground",
    failed: "bg-destructive/10 text-destructive",
  };

  const exportCSV = () => {
    if (!filteredPayments?.length) {
      toast.error("No hay datos para exportar");
      return;
    }
    const headers = ["Servicio", "Monto", "Comisión", "Estado", "Fecha"];
    const rows = filteredPayments.map((p: any) => [
      p.service_requests?.title || "—",
      Number(p.amount).toFixed(2),
      Number(p.platform_fee).toFixed(2),
      statusLabel[p.status] || p.status,
      new Date(p.created_at).toLocaleDateString("es-AR"),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacciones_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes Financieros</h1>
        <Button variant="outline" size="sm" className="gap-1" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4" /> Configuración de Comisiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Comisión de la plataforma (%)</Label>
              {editingRate ? (
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  className="w-32"
                />
              ) : (
                <p className="text-2xl font-bold">{settings?.commission_rate || "10"}%</p>
              )}
            </div>
            {editingRate ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateSetting.mutate({ key: "commission_rate", value: newRate })} disabled={updateSetting.isPending}>
                  {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingRate(false)}>Cancelar</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => { setNewRate(settings?.commission_rate || "10"); setEditingRate(true); }}>Editar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-primary mb-1" />
            <p className="text-xl font-bold">${totalVolume.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Volumen Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-success mb-1" />
            <p className="text-xl font-bold">${totalFees.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Comisiones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xl font-bold">${Math.round(avgTicket).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Ticket Promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <AlertTriangle className="h-5 w-5 text-warning mb-1" />
            <p className="text-xl font-bold">${totalRefunded.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Reembolsado ({refunded.length})</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <AlertTriangle className={`h-5 w-5 mb-1 ${failed > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <p className="text-xl font-bold">{failed}</p>
            <p className="text-xs text-muted-foreground">Pagos Fallidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ingresos Mensuales</CardTitle></CardHeader>
        <CardContent>
          {monthlyRevenue && monthlyRevenue.some(m => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                <Bar dataKey="revenue" fill="hsl(25, 100%, 50%)" radius={[4, 4, 0, 0]} name="Volumen" />
                <Bar dataKey="fee" fill="hsl(142, 70%, 45%)" radius={[4, 4, 0, 0]} name="Comisión" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin transacciones aún</p>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transacciones ({filteredPayments?.length || 0})</CardTitle>
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
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !paginatedPayments?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin transacciones</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.service_requests?.title || "—"}</TableCell>
                      <TableCell>${Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-success">${Number(p.platform_fee).toLocaleString()}</TableCell>
                      <TableCell><Badge className={statusColor[p.status] || ""}>{statusLabel[p.status] || p.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(p.created_at).toLocaleDateString("es-AR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredPayments?.length || 0)} de {filteredPayments?.length}
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

export default AdminReports;
