import { useState } from "react";
import { DollarSign, TrendingUp, Settings, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AdminReports = () => {
  const queryClient = useQueryClient();
  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["platform-settings"],
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, service_requests(title)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: monthlyRevenue } = useQuery({
    queryKey: ["admin-monthly-revenue"],
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
      const { error } = await supabase
        .from("platform_settings")
        .update({ value })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      setEditingRate(false);
      toast.success("Configuración actualizada");
    },
  });

  const totalVolume = payments?.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0) || 0;
  const totalFees = payments?.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.platform_fee), 0) || 0;

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reportes Financieros</h1>

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
                <Input type="number" min="0" max="50" value={newRate} onChange={(e) => setNewRate(e.target.value)} className="w-32" />
              ) : (
                <p className="text-2xl font-bold">{settings?.commission_rate || "10"}%</p>
              )}
            </div>
            {editingRate ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateSetting.mutate({ key: "commission_rate", value: newRate })} disabled={updateSetting.isPending}>
                  <Save className="h-4 w-4 mr-1" /> Guardar
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            <p className="text-xl font-bold">{payments?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Transacciones</p>
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
        <CardHeader><CardTitle className="text-base">Últimas Transacciones</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : payments?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin transacciones</p>
          ) : (
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
                {payments?.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.service_requests?.title || "—"}</TableCell>
                    <TableCell>${Number(p.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-success">${Number(p.platform_fee).toLocaleString()}</TableCell>
                    <TableCell><Badge className={statusColor[p.status] || ""}>{statusLabel[p.status] || p.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(p.created_at).toLocaleDateString("es")}</TableCell>
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
