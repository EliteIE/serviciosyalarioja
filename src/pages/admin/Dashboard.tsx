import { Users, Briefcase, DollarSign, TrendingUp, Loader2, ShieldCheck, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, Bell, Activity, BarChart3, PieChart as PieChartIcon, Wallet, CheckCircle2, XCircle } from "lucide-react";
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
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center shadow-lg shadow-orange-500/10">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">Cargando panel...</p>
      </div>
    );
  }

  const growthPercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(0);
  };

  const userGrowth = Number(growthPercent(stats?.recentUsers || 0, stats?.prevUsers || 0));
  const requestGrowth = Number(growthPercent(stats?.recentRequests || 0, stats?.prevRequests || 0));

  // Security alerts
  const alerts: { text: string; type: "error" | "warning" | "info" }[] = [];
  if ((stats?.disputes || 0) > 0) alerts.push({ text: `${stats?.disputes} disputa(s) abierta(s) requieren atencion`, type: "error" });
  if ((stats?.failedPayments || 0) > 0) alerts.push({ text: `${stats?.failedPayments} pago(s) fallido(s) detectado(s)`, type: "error" });
  if ((stats?.badReviews || 0) > 0) alerts.push({ text: `${stats?.badReviews} resena(s) negativa(s) en los ultimos 30 dias`, type: "warning" });
  const unverified = (stats?.providers || 0) - (stats?.verified || 0);
  if (unverified > 0) alerts.push({ text: `${unverified} prestador(es) pendiente(s) de verificacion`, type: "warning" });

  const statCards = [
    { label: "Usuarios Totales", value: stats?.users || 0, icon: Users, bgColor: "bg-orange-500/10", iconColor: "text-orange-500", borderColor: "border-l-orange-500", path: "/admin/moderacion", trend: userGrowth },
    { label: "Prestadores", value: `${stats?.verified || 0}/${stats?.providers || 0}`, icon: ShieldCheck, bgColor: "bg-emerald-500/10", iconColor: "text-emerald-500", borderColor: "border-l-emerald-500", path: "/admin/prestadores", sublabel: "verificados" },
    { label: "Solicitudes", value: stats?.requests || 0, icon: Briefcase, bgColor: "bg-blue-500/10", iconColor: "text-blue-500", borderColor: "border-l-blue-500", path: "/admin/reportes", trend: requestGrowth },
    { label: "Disputas Abiertas", value: stats?.disputes || 0, icon: AlertTriangle, bgColor: stats?.disputes ? "bg-red-500/10" : "bg-slate-500/10", iconColor: stats?.disputes ? "text-red-500" : "text-slate-400", borderColor: stats?.disputes ? "border-l-red-500" : "border-l-slate-300", path: "/admin/disputas" },
  ];

  const kpiCards = [
    { label: "Volumen Total", value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, bgColor: "bg-orange-500/10", iconColor: "text-orange-500", featured: true },
    { label: "Comisiones Ganadas", value: `$${(stats?.totalFees || 0).toLocaleString()}`, icon: TrendingUp, bgColor: "bg-emerald-500/10", iconColor: "text-emerald-500", featured: false },
    { label: "Ticket Promedio", value: `$${Math.round(stats?.avgTicket || 0).toLocaleString()}`, icon: Wallet, bgColor: "bg-violet-500/10", iconColor: "text-violet-500", featured: false },
    { label: "Tasa Conversion", value: `${conversionData?.conversionRate || 0}%`, icon: CheckCircle2, bgColor: "bg-blue-500/10", iconColor: "text-blue-500", featured: false },
    { label: "Pagos Completados", value: stats?.completedPayments || 0, icon: Clock, bgColor: "bg-amber-500/10", iconColor: "text-amber-500", featured: false },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Panel de Administracion
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Resumen general de la plataforma
          </p>
        </div>
        <Badge className="rounded-full px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 border-orange-200/80 dark:from-orange-500/10 dark:to-amber-500/10 dark:text-orange-400 dark:border-orange-500/20 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-500/20 dark:hover:to-amber-500/20 shadow-sm transition-all duration-300">
          <Activity className="h-3.5 w-3.5 mr-1.5" />
          Ultimos 30 dias
        </Badge>
      </div>

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-red-500/5 dark:via-orange-500/5 dark:to-amber-500/5 border border-red-200/60 dark:border-red-500/20 border-t-4 border-t-red-500 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shadow-sm">
              <Bell className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Alertas que requieren atencion</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{alerts.length} alerta{alerts.length !== 1 ? "s" : ""} activa{alerts.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm rounded-2xl px-4 py-3 bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-white/10 transition-all duration-200 shadow-sm"
              >
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 animate-pulse ${
                  alert.type === "error" ? "bg-red-500 shadow-sm shadow-red-500/50" : alert.type === "warning" ? "bg-amber-500 shadow-sm shadow-amber-500/50" : "bg-blue-500 shadow-sm shadow-blue-500/50"
                }`} />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{alert.text}</span>
                {alert.type === "error" && (
                  <XCircle className="h-4 w-4 text-red-400 ml-auto shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`group relative rounded-3xl bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 border-l-4 ${stat.borderColor} shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
            onClick={() => navigate(stat.path)}
          >
            {/* Subtle decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-100/50 dark:to-slate-700/10 pointer-events-none" />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                {"trend" in stat && stat.trend !== undefined && (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
                    Number(stat.trend) >= 0
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 dark:from-green-500/10 dark:to-emerald-500/10 dark:text-green-400 border border-green-200/50 dark:border-green-500/20"
                      : "bg-gradient-to-r from-red-50 to-rose-50 text-red-600 dark:from-red-500/10 dark:to-rose-500/10 dark:text-red-400 border border-red-200/50 dark:border-red-500/20"
                  }`}>
                    {Number(stat.trend) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(Number(stat.trend))}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1.5">{stat.label}</p>
              {"sublabel" in stat && stat.sublabel && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{stat.sublabel}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue + KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-3xl bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 shadow-lg p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden relative ${
              kpi.featured ? "border-t-4 border-t-orange-500" : ""
            }`}
          >
            {kpi.featured && (
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
            )}
            <div className="relative">
              <div className={`h-10 w-10 rounded-xl ${kpi.bgColor} flex items-center justify-center mb-3 shadow-sm`}>
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{kpi.value}</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Requests Chart */}
        <div className="rounded-3xl bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 border-t-4 border-t-orange-500 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shadow-sm">
                <BarChart3 className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Solicitudes por Mes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ultimos 6 meses</p>
              </div>
            </div>
          </div>
          <div className="px-4 pb-6">
            {monthlyData && monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.97)',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
                      padding: '14px 18px',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(25, 100%, 50%)" radius={[8, 8, 0, 0]} name="Total" />
                  <Bar dataKey="completed" fill="hsl(142, 70%, 45%)" radius={[8, 8, 0, 0]} name="Completados" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-700/30 flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm font-semibold">Sin datos aun</p>
                <p className="text-xs mt-1 opacity-60">Los datos apareceran cuando haya solicitudes</p>
              </div>
            )}
          </div>
        </div>

        {/* Services by Category Chart */}
        <div className="rounded-3xl bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shadow-sm">
                <PieChartIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Solicitudes por Categoria</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Distribucion actual</p>
              </div>
            </div>
          </div>
          <div className="px-6 pb-6">
            {servicesByCategory && servicesByCategory.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={servicesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} strokeWidth={2} stroke="rgba(255,255,255,0.8)">
                      {servicesByCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.97)',
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
                        padding: '14px 18px',
                        backdropFilter: 'blur(8px)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex-1">
                  {servicesByCategory.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3 text-sm group hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-3 py-1.5 -mx-3 transition-colors duration-200">
                      <div className="h-3.5 w-3.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-700 dark:text-slate-300 truncate flex-1 font-medium">{item.name}</span>
                      <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-700/30 flex items-center justify-center mb-4">
                  <PieChartIcon className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm font-semibold">Sin datos aun</p>
                <p className="text-xs mt-1 opacity-60">Los datos apareceran cuando haya solicitudes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Providers by Category + Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Providers by Category */}
        <div className="rounded-3xl bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-sm">
                <Users className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Prestadores por Categoria</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Distribucion de prestadores</p>
              </div>
            </div>
          </div>
          <div className="px-6 pb-6">
            {providersByCategory && providersByCategory.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={providersByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} strokeWidth={2} stroke="rgba(255,255,255,0.8)">
                      {providersByCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.97)',
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
                        padding: '14px 18px',
                        backdropFilter: 'blur(8px)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex-1">
                  {providersByCategory.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3 text-sm group hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-3 py-1.5 -mx-3 transition-colors duration-200">
                      <div className="h-3.5 w-3.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-700 dark:text-slate-300 truncate flex-1 font-medium">{item.name}</span>
                      <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-700/30 flex items-center justify-center mb-4">
                  <PieChartIcon className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm font-semibold">Sin datos aun</p>
                <p className="text-xs mt-1 opacity-60">Los datos apareceran cuando haya prestadores</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="rounded-3xl bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shadow-sm">
                  <Activity className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white">Actividad Reciente</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Registro de auditoria</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/admin/audit")}
                className="text-xs font-bold text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-all duration-200 px-4 py-2 rounded-full hover:bg-orange-50 dark:hover:bg-orange-500/10 uppercase tracking-wider border border-transparent hover:border-orange-200/60 dark:hover:border-orange-500/20 shadow-sm hover:shadow"
              >
                Ver todo
              </button>
            </div>
          </div>
          <div className="px-6 pb-6">
            {recentAudit && recentAudit.length > 0 ? (
              <div className="space-y-1">
                {recentAudit.map((entry: any, index: number) => (
                  <div
                    key={entry.id}
                    className="group flex items-start gap-4 text-sm rounded-2xl px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200"
                  >
                    {/* Timeline dot and line */}
                    <div className="flex flex-col items-center pt-0.5">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 ring-4 ring-orange-500/10 shrink-0 group-hover:ring-orange-500/25 group-hover:scale-110 transition-all duration-300 shadow-sm shadow-orange-500/30" />
                      {index < recentAudit.length - 1 && (
                        <div className="w-0.5 h-full min-h-[24px] bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 mt-1 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {entry.action} <span className="font-normal text-slate-300 dark:text-slate-600">--</span> <span className="text-slate-600 dark:text-slate-300 font-medium">{entry.table_name}</span>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                        {new Date(entry.created_at).toLocaleString("es-AR")}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <ArrowUpRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-700/30 flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm font-semibold">Sin actividad reciente</p>
                <p className="text-xs mt-1 opacity-60">La actividad aparecera aqui automaticamente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
