import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const ProviderFinance = () => {
  const { user } = useAuth();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["provider-payments", user?.id],
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

  const statusLabel: Record<string, string> = {
    pending: "Pendiente", approved: "Aprobado", completed: "Completado", refunded: "Reembolsado", failed: "Fallido",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning", completed: "bg-success/10 text-success", failed: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Finanzas</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Ganancia Neta", value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-success" },
          { label: "Comisiones", value: `$${totalCommissions.toLocaleString()}`, icon: TrendingUp, color: "text-muted-foreground" },
          { label: "Bruto", value: `$${totalGross.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
          { label: "Transacciones", value: completed.length, icon: CreditCard, color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <stat.icon className={`h-5 w-5 ${stat.color} mb-1`} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
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
        <CardHeader><CardTitle>Últimas Transacciones</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : !payments?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin transacciones aún</p>
          ) : (
            payments.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tx.status === "completed" ? "bg-success/10" : "bg-muted"}`}>
                    <DollarSign className={`h-4 w-4 ${tx.status === "completed" ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.service_requests?.title || "Servicio"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("es")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-bold text-sm ${tx.status === "completed" ? "text-success" : "text-muted-foreground"}`}>
                    +${Number(tx.provider_amount).toLocaleString()}
                  </span>
                  <Badge className={`ml-2 text-xs ${statusColor[tx.status] || ""}`}>{statusLabel[tx.status] || tx.status}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderFinance;
