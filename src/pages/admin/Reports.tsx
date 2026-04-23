import { useState } from "react";
import { DollarSign, TrendingUp, Settings, Loader2, Save, Download, Filter, ChevronLeft, ChevronRight, AlertTriangle, BarChart3, Receipt, XCircle, Percent, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useAdminPendingCommissions, 
  useConfirmCommission, 
  usePlatformSettings, 
  useUpdatePlatformSetting, 
  useAdminPayments, 
  useAdminMonthlyRevenue 
} from "@/hooks/useAdmin";

const PAGE_SIZE = 20;

const AdminReports = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: pendingCommissions } = useAdminPendingCommissions();
  const confirmCommission = useConfirmCommission();
  const { data: settings } = usePlatformSettings();
  const { data: payments, isLoading } = useAdminPayments();
  const { data: monthlyRevenue } = useAdminMonthlyRevenue();
  const updateSetting = useUpdatePlatformSetting();
  
  const handleUpdateSetting = async () => {
    try {
      await updateSetting.mutateAsync({ key: "commission_rate", value: newRate });
      setEditingRate(false);
    } catch {
      // The error is already handled and toasted by the hook internally if needed
    }
  };

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
    const rows = filteredPayments.map((p) => [
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
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-primary-foreground">
            Reportes Financieros
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
          <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/40">
              <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            Configuración de Comisiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-primary-foreground">
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
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 text-primary-foreground shadow-md"
                  onClick={handleUpdateSetting}
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
            <p className="text-2xl font-extrabold text-slate-900 dark:text-primary-foreground">${totalVolume.toLocaleString()}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">Volumen Total</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 mb-3">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-primary-foreground">${totalFees.toLocaleString()}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">Comisiones</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 mb-3">
              <Receipt className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-primary-foreground">${Math.round(avgTicket).toLocaleString()}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">Ticket Promedio</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-primary-foreground">${totalRefunded.toLocaleString()}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">Reembolsado ({refunded.length})</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-slate-900/50">
          <CardContent className="p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${failed > 0 ? "bg-red-500/10" : "bg-slate-500/10"}`}>
              <XCircle className={`h-5 w-5 ${failed > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`} />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-primary-foreground">{failed}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">Pagos Fallidos</p>
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
              <CardTitle className="text-base font-semibold text-foreground">
                Ingresos Mensuales
              </CardTitle>
              <p className="text-xs text-muted-foreground">Ultimos 6 meses</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {monthlyRevenue && monthlyRevenue.some(m => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyRevenue} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <BarChart3 className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Sin transacciones aún</p>
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
                <CardTitle className="text-base font-semibold text-foreground">
                  Transacciones
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {filteredPayments?.length || 0} registros
                </p>
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-44 rounded-xl border-border">
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
              <p className="text-sm text-muted-foreground">Cargando transacciones...</p>
            </div>
          ) : !paginatedPayments?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <Receipt className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Sin transacciones</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No hay registros para el filtro seleccionado</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Servicio</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monto</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comisión</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors duration-150">
                      <TableCell className="font-medium text-foreground">{p.service_requests?.title || "—"}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-primary-foreground">${Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">${Number(p.platform_fee).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium shadow-none ${statusColor[p.status] || ""}`}>
                          {statusLabel[p.status] || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString("es-AR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium text-foreground">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredPayments?.length || 0)}</span> de <span className="font-medium text-foreground">{filteredPayments?.length}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl h-9 w-9 p-0 border-border disabled:opacity-40"
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
                      className="rounded-xl h-9 w-9 p-0 border-border disabled:opacity-40"
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

      {/* Pending Commission Payments */}
      <Card className="rounded-3xl shadow-lg border-t-4 border-amber-500 overflow-hidden dark:bg-slate-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Pagos de Comisiones Pendientes
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {pendingCommissions?.length || 0} pagos pendientes de confirmacion
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!pendingCommissions?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <CheckCircle2 className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Sin comisiones pendientes</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Todos los pagos de comisiones estan al dia</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prestador</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monto</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metodo</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingCommissions.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors duration-150">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {payment.profiles?.avatar_url ? (
                          <img src={payment.profiles.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700" />
                        )}
                        {payment.profiles?.full_name || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-primary-foreground">${Number(payment.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className="rounded-full px-2.5 py-0.5 text-xs font-medium shadow-none bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700">
                        {payment.payment_method || "transferencia"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(payment.created_at).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-primary-foreground shadow-md text-xs"
                        disabled={confirmCommission.isPending}
                        onClick={() => confirmCommission.mutate(payment.id)}
                      >
                        {confirmCommission.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                        Confirmar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
