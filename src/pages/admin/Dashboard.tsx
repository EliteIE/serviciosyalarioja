import { Users, Briefcase, DollarSign, TrendingUp, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { CATEGORIES } from "@/constants/categories";

const COLORS = ["hsl(25, 100%, 50%)", "hsl(213, 80%, 15%)", "hsl(142, 70%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

const getCategoryName = (slug: string) => CATEGORIES.find(c => c.slug === slug)?.name || slug;

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, providersRes, requestsRes, paymentsRes, disputesRes, verifiedRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_provider", true),
        supabase.from("service_requests").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount, platform_fee, status"),
        supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "abierta"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_provider", true).eq("provider_verified", true),
      ]);

      const payments = paymentsRes.data || [];
      const totalRevenue = payments.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);
      const totalFees = payments.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.platform_fee), 0);

      return {
        users: usersRes.count || 0,
        providers: providersRes.count || 0,
        verified: verifiedRes.count || 0,
        requests: requestsRes.count || 0,
        disputes: disputesRes.count || 0,
        totalRevenue,
        totalFees,
        payments: payments.length,
      };
    },
  });

  const { data: servicesByCategory } = useQuery({
    queryKey: ["admin-services-by-category"],
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("category");
      const counts: Record<string, number> = {};
      data?.forEach((r) => { counts[r.category] = (counts[r.category] || 0) + 1; });
      return Object.entries(counts).map(([slug, value]) => ({ name: getCategoryName(slug), value })).sort((a, b) => b.value - a.value).slice(0, 6);
    },
  });

  const { data: providersByCategory } = useQuery({
    queryKey: ["admin-providers-by-category"],
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
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("created_at, status");
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

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const statCards = [
    { label: "Usuarios", value: stats?.users || 0, icon: Users, color: "text-primary", path: "/admin/moderacion" },
    { label: "Prestadores", value: `${stats?.verified || 0}/${stats?.providers || 0}`, icon: ShieldCheck, color: "text-success", path: "/admin/prestadores" },
    { label: "Solicitudes", value: stats?.requests || 0, icon: Briefcase, color: "text-primary", path: "/admin/reportes" },
    { label: "Disputas Abiertas", value: stats?.disputes || 0, icon: AlertTriangle, color: "text-warning", path: "/admin/disputas" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de Administración</h1>

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
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            <p className="text-2xl font-bold">{stats?.payments || 0}</p>
            <p className="text-xs text-muted-foreground">Transacciones</p>
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
          <CardHeader><CardTitle className="text-base">Solicitudes por Categoría (pedidos de clientes)</CardTitle></CardHeader>
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

      <Card>
        <CardHeader><CardTitle className="text-base">Prestadores por Categoría (profesionales registrados)</CardTitle></CardHeader>
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
    </div>
  );
};

export default AdminDashboard;
