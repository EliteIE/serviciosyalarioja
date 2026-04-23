import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";

export const useAdminPendingCommissions = () => {
  return useQuery({
    queryKey: ["admin-pending-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_payments")
        .select("*, profiles:provider_id(full_name, avatar_url)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useConfirmCommission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from("commission_payments")
        .update({ status: "completed", confirmed_by: user?.id, confirmed_at: new Date().toISOString() } as never)
        .eq("id", paymentId);
      if (error) throw error;
      // Call the RPC to process the payment
      const { error: rpcError } = await supabase.rpc("process_commission_payment", { p_payment_id: paymentId });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-commissions"] });
      toast.success("Pago de comision confirmado");
    },
    onError: () => toast.error("Error al confirmar pago"),
  });
};

export const usePlatformSettings = () => {
  return useQuery({
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
};

export const useUpdatePlatformSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const numValue = Number(value);
      if (key === "commission_rate" && (isNaN(numValue) || numValue < 0 || numValue > 50)) {
        throw new Error("La comisión debe estar entre 0% y 50%");
      }
      const { error } = await supabase
        .from("platform_settings")
        .upsert({ key, value: String(numValue) }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success("Configuración actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useAdminPayments = () => {
  return useQuery({
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
};

export const useAdminMonthlyRevenue = () => {
  return useQuery({
    queryKey: ["admin-monthly-revenue"],
    staleTime: 60_000,
    queryFn: async () => {
      const sixMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString();
      const { data, error } = await supabase
        .from("payments")
        .select("amount, platform_fee, created_at, status")
        .eq("status", "completed")
        .gte("created_at", sixMonthsAgo);
        
      if (error) throw error;
        
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
};

export const useAdminStats = () => {
  return useQuery({
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

      // Log errors from parallel queries and default to 0 on failure
      const allResults = [
        { name: "users", res: usersRes },
        { name: "providers", res: providersRes },
        { name: "requests", res: requestsRes },
        { name: "payments", res: paymentsRes },
        { name: "disputes", res: disputesRes },
        { name: "verified", res: verifiedRes },
        { name: "recentUsers", res: recentUsersRes },
        { name: "prevUsers", res: prevUsersRes },
        { name: "recentRequests", res: recentRequestsRes },
        { name: "prevRequests", res: prevRequestsRes },
        { name: "failedPayments", res: failedPaymentsRes },
        { name: "badReviews", res: badReviewsRes },
      ];
      for (const { name, res } of allResults) {
        if (res.error) {
          logger.error(`Admin stats query error [${name}]:`, res.error);
        }
      }

      const safeCount = (res: { count: number | null; error: any }) => res.error ? 0 : (res.count || 0);

      const payments = paymentsRes.error ? [] : (paymentsRes.data || []);
      const completedPayments = payments.filter(p => p.status === "completed");
      const totalRevenue = completedPayments.reduce((s, p) => s + Number(p.amount), 0);
      const totalFees = completedPayments.reduce((s, p) => s + Number(p.platform_fee), 0);
      const avgTicket = completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0;

      return {
        totalUsers: safeCount(usersRes),
        totalProviders: safeCount(providersRes),
        totalRequests: safeCount(requestsRes),
        totalRevenue,
        totalFees,
        avgTicket,
        openDisputes: safeCount(disputesRes),
        verifiedProviders: safeCount(verifiedRes),
        recentUsers: safeCount(recentUsersRes),
        prevUsers: safeCount(prevUsersRes),
        recentRequests: safeCount(recentRequestsRes),
        prevRequests: safeCount(prevRequestsRes),
        failedPayments: safeCount(failedPaymentsRes),
        badReviews: safeCount(badReviewsRes),
      };
    },
  });
};

export const useAdminCommissionStats = () => {
  return useQuery({
    queryKey: ["admin-commission-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("commission_balance")
        .select("total_owed, is_blocked");
      const totalPending = (data || []).reduce((sum: number, b) => sum + Number(b.total_owed || 0), 0);
      const blockedCount = (data || []).filter((b) => b.is_blocked).length;
      return { totalPending, blockedCount };
    },
  });
};

export const useAdminConversionData = () => {
  return useQuery({
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
};

const getCategoryName = (slug: string) => {
  // Simple fallback since we don't have access to categories constant directly inside hook easily 
  // Wait, I can import CATEGORIES from "@/constants/categories" at the top!
  return slug;
};

export const useAdminServicesByCategory = (getCatName: (s: string) => string) => {
  return useQuery({
    queryKey: ["admin-services-by-category"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("category");
      const counts: Record<string, number> = {};
      data?.forEach((r) => { counts[r.category] = (counts[r.category] || 0) + 1; });
      return Object.entries(counts).map(([slug, value]) => ({ name: getCatName(slug), value })).sort((a, b) => b.value - a.value).slice(0, 6);
    },
  });
};

export const useAdminProvidersByCategory = (getCatName: (s: string) => string) => {
  return useQuery({
    queryKey: ["admin-providers-by-category"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("provider_category").eq("is_provider", true);
      const counts: Record<string, number> = {};
      data?.forEach((r) => {
        const cat = r.provider_category || "sin-categoria";
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return Object.entries(counts).map(([slug, value]) => ({ name: getCatName(slug), value })).sort((a, b) => b.value - a.value).slice(0, 6);
    },
  });
};

export const useAdminMonthlyData = () => {
  return useQuery({
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
};

export const useAdminRecentAuditLog = () => {
  return useQuery({
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
};

export const useAdminProviders = () => {
  return useQuery({
    queryKey: ["admin-providers"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_provider", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useAdminVerifyProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: any = {
        provider_verified: status === "approved",
        provider_verification_status: status,
      };
      if (notes !== undefined) {
        updateData.provider_verification_notes = notes || null;
      }
      
      const { error } = await supabase.from("profiles").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Estado del prestador actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useAdminUpdateCriminalRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, notes, expiry }: { id: string; status: string; notes?: string; expiry?: string }) => {
      const updateData: Record<string, unknown> = { criminal_record_status: status };
      if (notes !== undefined) updateData.criminal_record_notes = notes;
      if (expiry) updateData.criminal_record_expiry = expiry;
      const { error } = await supabase.from("profiles").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast.success("Antecedentes penales actualizados");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useAdminFileSignedUrl = () => {
  return useMutation({
    mutationFn: async (path: string) => {
      const { data, error } = await supabase.storage.from("provider-docs").createSignedUrl(path, 3600);
      if (error) throw error;
      return data?.signedUrl;
    },
  });
};

export const useAdminPendingProviders = () => {
  return useQuery({
    queryKey: ["admin-pending-providers"],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_provider", true)
        .eq("provider_verified", false)
        .or("provider_verification_status.eq.pending,provider_verification_status.is.null")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useAdminReviews = () => {
  return useQuery({
    queryKey: ["admin-reviews"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, reviewer:profiles!reviews_reviewer_id_fkey(full_name), reviewed:profiles!reviews_reviewed_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) {
        const { data: fallback, error: e2 } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (e2) throw e2;

        if (fallback && fallback.length > 0) {
          const profileIds = [...new Set(fallback.flatMap(r => [r.reviewer_id, r.reviewed_id].filter(Boolean)))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", profileIds);
          
          const profileMap: Record<string, string> = {};
          profiles?.forEach(p => { profileMap[p.id] = p.full_name; });
          
          fallback.forEach((r: any) => {
            r.reviewer = { full_name: profileMap[r.reviewer_id] || null };
            r.reviewed = { full_name: profileMap[r.reviewed_id] || null };
          });
        }
        return fallback;
      }
      return data;
    },
  });
};

export const useAdminDeleteReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Reseña eliminada correctamente");
    },
    onError: (err: Error) => toast.error("Error al eliminar: " + err.message),
  });
};

export const useAdminDisputes = () => {
  return useQuery({
    queryKey: ["admin-disputes"],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = new Set<string>();
      const srIds = new Set<string>();
      data.forEach((d) => {
        userIds.add(d.opened_by);
        if (d.service_request_id) srIds.add(d.service_request_id);
      });

      const [profilesRes, srRes] = await Promise.all([
        userIds.size > 0
          ? supabase.from("profiles").select("id, full_name").in("id", Array.from(userIds))
          : Promise.resolve({ data: [] }),
        srIds.size > 0
          ? supabase.from("service_requests").select("id, title, status, client_id, provider_id").in("id", Array.from(srIds))
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p.full_name]));
      const srMap = new Map((srRes.data || []).map(sr => [sr.id, sr]));

      return data.map(d => ({
        ...d,
        opened_by_name: profileMap.get(d.opened_by) || "—",
        service_request: d.service_request_id ? srMap.get(d.service_request_id) : null,
      }));
    },
  });
};

export const useAdminUpdateDispute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, resolutionText }: { id: string; status: string; resolutionText?: string }) => {
      const updateData: Record<string, any> = { status };
      if (resolutionText) updateData.resolution = resolutionText;

      const { error } = await supabase.from("disputes").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Disputa actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useAdminAuditLog = (tableFilter: string, actionFilter: string) => {
  return useQuery({
    queryKey: ["admin-audit-log", tableFilter, actionFilter],
    staleTime: 15_000,
    queryFn: async () => {
      let query = supabase.from("audit_log").select("*");
      
      if (tableFilter !== "all") query = query.eq("table_name", tableFilter);
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      
      const { data, error } = await query.order("created_at", { ascending: false }).limit(500);
      
      if (error) {
        logger.error("Error fetching audit log:", error);
        toast.error("Error al cargar auditoría");
        return [];
      }
      return data;
    },
  });
};
