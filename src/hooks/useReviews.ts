import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Review {
  id: string;
  service_request_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string | null;
  tags: string[] | null;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  service_title?: string;
  service_category?: string;
}

export const useReviews = (userId: string | null) => {
  return useQuery({
    queryKey: ["reviews", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const reviewerIds = [...new Set(data.map((r) => r.reviewer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", reviewerIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const requestIds = [...new Set(data.map((r) => r.service_request_id).filter(Boolean))];
      const { data: requests } = await supabase
        .from("service_requests")
        .select("id, title, category")
        .in("id", requestIds);

      const requestMap = new Map(requests?.map((req) => [req.id, req]) || []);

      return data.map((r) => {
        const req = requestMap.get(r.service_request_id);
        return {
          ...r,
          reviewer_name: profileMap.get(r.reviewer_id)?.full_name || "",
          reviewer_avatar: profileMap.get(r.reviewer_id)?.avatar_url || "",
          service_title: req?.title || "Servicio",
          service_category: req?.category || "General",
        };
      }) as Review[];
    },
    enabled: !!userId,
  });
};

/** Check which service_request_ids the current user has already reviewed */
export const useMyReviewedServiceIds = (serviceRequestIds: string[]) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-reviews", user?.id, serviceRequestIds],
    queryFn: async () => {
      if (serviceRequestIds.length === 0) return new Set<string>();
      const { data, error } = await supabase
        .from("reviews")
        .select("service_request_id")
        .eq("reviewer_id", user!.id)
        .in("service_request_id", serviceRequestIds);
      if (error) throw error;
      return new Set((data || []).map((r) => r.service_request_id));
    },
    enabled: !!user && serviceRequestIds.length > 0,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (review: {
      service_request_id: string;
      reviewed_id: string;
      rating: number;
      comment?: string;
      tags?: string[];
    }) => {
      const { error } = await supabase.from("reviews").insert({
        ...review,
        reviewer_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      toast.success("¡Reseña enviada!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
