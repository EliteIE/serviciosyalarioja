import { useState } from "react";
import { DollarSign, TrendingUp, Settings, Loader2, Save, Download, Filter, ChevronLeft, ChevronRight, AlertTriangle, BarChart3, Receipt, XCircle, Percent, FileSpreadsheet } from "lucide-react";
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
        .upsert({ key, value: String(numValue) }, { onConflict: "key" });
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
    pending: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    approved: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    refunded: "bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700",
    failed: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
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
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reportes Financieros
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Resumen de ingresos, comisiones y transacciones
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30 transition-all duration-200"
          onClick={exportCSV}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Commission Settings Card */}
      <Card className="rounded-3xl shadow-lg border-t-4 border-orange-500 overflow-hidden dark:bg-slate-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/40">
              <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            Configuración de Comisiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Comisión de la plataforma (%)
              </Label>
              {editingRate ? (
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  className="w-32 rounded-xl border-slate-300 focus:border-orange-400 focus:ring-orange-400 dark:border-slate-600"
                />
              ) : (
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {settings?.commission_rate || "10"}
                  </p>
                  <span className="text-lg font-bold text-orange-500">%</span>
                </div>
              )}
            </div>
            {editingRate ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                  onClick={() => updateSetting.mutate({ key: "commission_rate", value: newRate })}
                  disabled={updateSetting.isPending}
                >
                  {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setEditingRate(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30"
                onClick={() => { setNewRate(settings?.commission_rate || "10"); setEditingRate(true); }}
              >
                <Percent className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 mb-3">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">${totalVolume.toLocaleString()}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Volumen Total</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 mb-3">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">${totalFees.toLocaleString()}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Comisiones</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 mb-3">
              <Receipt className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">${Math.round(avgTicket).toLocaleString()}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Ticket Promedio</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">${totalRefunded.toLocaleString()}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Reembolsado ({refunded.length})</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${failed > 0 ? "bg-red-500/10" : "bg-slate-500/10"}`}>
              <XCircle className={`h-5 w-5 ${failed > 0 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`} />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{failed}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Pagos Fallidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="rounded-3xl shadow-lg dark:bg-slate-900/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Ingresos Mensuales
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ultimos 6 meses</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {monthlyRevenue && monthlyRevenue.some(m => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyRevenue} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    padding: '10px 14px',
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(25, 100%, 50%)" radius={[8, 8, 0, 0]} name="Volumen" />
                <Bar dataKey="fee" fill="hsl(142, 70%, 45%)" radius={[8, 8, 0, 0]} name="Comisión" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                <BarChart3 className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sin transacciones aún</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Los datos aparecerán cuando se completen pagos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="rounded-3xl shadow-lg overflow-hidden dark:bg-slate-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10">
                <FileSpreadsheet className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Transacciones
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filteredPayments?.length || 0} registros
                </p>
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-44 rounded-xl border-slate-200 dark:border-slate-700">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
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
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Cargando transacciones...</p>
            </div>
          ) : !paginatedPayments?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                <Receipt className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sin transacciones</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No hay registros para el filtro seleccionado</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Servicio</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monto</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Comisión</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.map((p: any) => (
                    <TableRow key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors duration-150">
                      <TableCell className="font-medium text-slate-800 dark:text-slate-200">{p.service_requests?.title || "—"}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-white">${Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">${Number(p.platform_fee).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium shadow-none ${statusColor[p.status] || ""}`}>
                          {statusLabel[p.status] || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400">{new Date(p.created_at).toLocaleDateString("es-AR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Mostrando <span className="font-medium text-slate-700 dark:text-slate-300">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredPayments?.length || 0)}</span> de <span className="font-medium text-slate-700 dark:text-slate-300">{filteredPayments?.length}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl h-9 w-9 p-0 border-slate-200 dark:border-slate-700 disabled:opacity-40"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center px-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {page + 1} / {totalPages}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl h-9 w-9 p-0 border-slate-200 dark:border-slate-700 disabled:opacity-40"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                    >
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
