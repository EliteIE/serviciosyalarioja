import { Users, Briefcase, DollarSign, TrendingUp, Loader2, ShieldCheck, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, Bell, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { CATEGORIES } from "@/constants/categories";

const COLORS = ["hsl(25, 100%, 50%)", "hsl(213, 80%, 15%)", "hsl(142, 70%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(280, 70%, 50%)"];

const getCategoryName = (slug: string) => CATEGORIES.find(c => c.slug === slug)?.name || slug;

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    staleTime: 30_000,
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
      const sixtyDaysAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate()).toISOString();

      const [
        usersRes, providersRes, requestsRes, paymentsRes,
        disputesRes, verifiedRes, recentUsersRes, prevUsersRes,
        recentRequestsRes, prevRequestsRes, failedPaymentsRes,
        badReviewsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_provider", true),
        supabase.from("service_requests").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount, platform_fee, status"),
        supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "abierta"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_provider", true).eq("provider_verified", true),
        // Recent 30 days users
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        // Previous 30 days users (for comparison)
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        // Recent 30 days requests
        supabase.from("service_requests").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        // Previous 30 days requests
        supabase.from("service_requests").select("id", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        // Failed payments
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "failed"),
        // Bad reviews (1-2 stars) last 30 days
        supabase.from("reviews").select("id", { count: "exact", head: true }).lte("rating", 2).gte("created_at", thirtyDaysAgo),
      ]);

      const payments = paymentsRes.data || [];
      const completedPayments = payments.filter(p => p.status === "completed");
      const totalRevenue = completedPayments.reduce((s, p) => s + Number(p.amount), 0);
      const totalFees = completedPayments.reduce((s, p) => s + Number(p.platform_fee), 0);
      const avgTicket = completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0;

      return {
        users: usersRes.count || 0,
        providers: providersRes.count || 0,
        verified: verifiedRes.count || 0,
        requests: requestsRes.count || 0,
        disputes: disputesRes.count || 0,
        totalRevenue,
        totalFees,
        payments: payments.length,
        completedPayments: completedPayments.length,
        avgTicket,
        recentUsers: recentUsersRes.count || 0,
        prevUsers: prevUsersRes.count || 0,
        recentRequests: recentRequestsRes.count || 0,
        prevRequests: prevRequestsRes.count || 0,
        failedPayments: failedPaymentsRes.count || 0,
        badReviews: badReviewsRes.count || 0,
      };
    },
  });

  // Conversion rate: completed / total requests
  const { data: conversionData } = useQuery({
    queryKey: ["admin-conversion"],
    staleTime: 60_000,
    queryFn: async () => {
      const [totalRes, completedRes, cancelledRes] = await Promise.all([
        supabase.from("service_requests").select("id", { count: "exact", head: true }),
        supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "completado"),
        supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "cancelado"),
      ]);
      const total = totalRes.count || 0;
      const completed = completedRes.count || 0;
      const cancelled = cancelledRes.count || 0;
      return {
        conversionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : "0",
        cancellationRate: total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0",
        completed,
        cancelled,
      };
    },
  });

  const { data: servicesByCategory } = useQuery({
    queryKey: ["admin-services-by-category"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("category");
      const counts: Record<string, number> = {};
      data?.forEach((r) => { counts[r.category] = (counts[r.category] || 0) + 1; });
      return Object.entries(counts).map(([slug, value]) => ({ name: getCategoryName(slug), value })).sort((a, b) => b.value - a.value).slice(0, 6);
    },
  });

  const { data: providersByCategory } = useQuery({
    queryKey: ["admin-providers-by-category"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("provider_category").eq("is_provider", true);
      const counts: Record<string, number> = {};
      data?.forEach((r) => {
        const cat = r.provider_category || "sin-categoria";
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return Object.entries(counts).map(([slug, value]) => ({ name: getCategoryName(slug), value })).sort((a, b) => b.value - a.value).slice(0, 6);
    },
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["admin-monthly"],
    staleTime: 60_000,
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data } = await supabase
        .from("service_requests")
        .select("created_at, status")
        .gte("created_at", sixMonthsAgo.toISOString());
      const months: Record<string, { total: number; completed: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("es", { month: "short" });
        months[key] = { total: 0, completed: 0 };
      }
      data?.forEach((r) => {
        const d = new Date(r.created_at);
        const key = d.toLocaleDateString("es", { month: "short" });
        if (months[key]) {
          months[key].total++;
          if (r.status === "completado") months[key].completed++;
        }
      });
      return Object.entries(months).map(([month, v]) => ({ month, ...v }));
    },
  });

  // Recent audit log entries
  const { data: recentAudit } = useQuery({
    queryKey: ["admin-recent-audit"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) return [];
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const growthPercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(0);
  };

  const userGrowth = Number(growthPercent(stats?.recentUsers || 0, stats?.prevUsers || 0));
  const requestGrowth = Number(growthPercent(stats?.recentRequests || 0, stats?.prevRequests || 0));

  // Security alerts
  const alerts: { text: string; type: "error" | "warning" | "info" }[] = [];
  if ((stats?.disputes || 0) > 0) alerts.push({ text: `${stats?.disputes} disputa(s) abierta(s) requieren atención`, type: "error" });
  if ((stats?.failedPayments || 0) > 0) alerts.push({ text: `${stats?.failedPayments} pago(s) fallido(s) detectado(s)`, type: "error" });
  if ((stats?.badReviews || 0) > 0) alerts.push({ text: `${stats?.badReviews} reseña(s) negativa(s) en los últimos 30 días`, type: "warning" });
  const unverified = (stats?.providers || 0) - (stats?.verified || 0);
  if (unverified > 0) alerts.push({ text: `${unverified} prestador(es) pendiente(s) de verificación`, type: "warning" });

  const statCards = [
    { label: "Usuarios Totales", value: stats?.users || 0, icon: Users, color: "text-primary", path: "/admin/moderacion", trend: userGrowth },
    { label: "Prestadores", value: `${stats?.verified || 0}/${stats?.providers || 0}`, icon: ShieldCheck, color: "text-success", path: "/admin/prestadores", sublabel: "verificados" },
    { label: "Solicitudes", value: stats?.requests || 0, icon: Briefcase, color: "text-primary", path: "/admin/reportes", trend: requestGrowth },
    { label: "Disputas Abiertas", value: stats?.disputes || 0, icon: AlertTriangle, color: stats?.disputes ? "text-destructive" : "text-muted-foreground", path: "/admin/disputas" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <Badge variant="outline" className="text-xs">
          <Activity className="h-3 w-3 mr-1" />
          Últimos 30 días
        </Badge>
      </div>

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-destructive" />
              <span className="font-semibold text-sm">Alertas que requieren atención</span>
            </div>
            <div className="space-y-1.5">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className={`h-2 w-2 rounded-full ${
                    alert.type === "error" ? "bg-destructive" : alert.type === "warning" ? "bg-warning" : "bg-primary"
                  }`} />
                  <span>{alert.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-200"
            onClick={() => navigate(stat.path)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                {"trend" in stat && stat.trend !== undefined && (
                  <span className={`text-xs flex items-center gap-0.5 ${Number(stat.trend) >= 0 ? "text-success" : "text-destructive"}`}>
                    {Number(stat.trend) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(Number(stat.trend))}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue + KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">${(stats?.totalRevenue || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Volumen Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-success mb-2" />
            <p className="text-2xl font-bold">${(stats?.totalFees || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Comisiones Ganadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">${Math.round(stats?.avgTicket || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Ticket Promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Briefcase className="h-5 w-5 text-success mb-2" />
            <p className="text-2xl font-bold">{conversionData?.conversionRate || 0}%</p>
            <p className="text-xs text-muted-foreground">Tasa Conversión</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Clock className="h-5 w-5 text-warning mb-2" />
            <p className="text-2xl font-bold">{stats?.completedPayments || 0}</p>
            <p className="text-xs text-muted-foreground">Pagos Completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Solicitudes por Mes</CardTitle></CardHeader>
          <CardContent>
            {monthlyData && monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(25, 100%, 50%)" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="completed" fill="hsl(142, 70%, 45%)" radius={[4, 4, 0, 0]} name="Completados" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos aún</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Solicitudes por Categoría</CardTitle></CardHeader>
          <CardContent>
            {servicesByCategory && servicesByCategory.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={servicesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80}>
                      {servicesByCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {servicesByCategory.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos aún</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Providers by Category + Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Prestadores por Categoría</CardTitle></CardHeader>
          <CardContent>
            {providersByCategory && providersByCategory.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={providersByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80}>
                      {providersByCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {providersByCategory.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos aún</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Audit Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Actividad Reciente</CardTitle>
              <button onClick={() => navigate("/admin/audit")} className="text-xs text-primary hover:underline">Ver todo</button>
            </div>
          </CardHeader>
          <CardContent>
            {recentAudit && recentAudit.length > 0 ? (
              <div className="space-y-3">
                {recentAudit.map((entry: any) => (
                  <div key={entry.id} className="flex items-start gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {entry.action} — {entry.table_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin actividad reciente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
