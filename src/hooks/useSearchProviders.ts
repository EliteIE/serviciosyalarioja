import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface ProviderProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  provider_category: string | null;
  provider_verified: boolean;
  provider_available: boolean;
  rating_avg: number;
  review_count: number;
  completed_jobs: number;
  response_time: string | null;
  bio: string | null;
  location: string | null;
}

export function useSearchProviders(categoriaActiva: string) {
  return useQuery({
    queryKey: ["search-providers", categoriaActiva],
    queryFn: async () => {
      let query = supabase
        .from("profiles_public")
        .select("*")
        .eq("is_provider", true)
        .order("rating_avg", { ascending: false });

      if (categoriaActiva !== "todas") {
        query = query.eq("provider_category", categoriaActiva);
      }

      const { data, error } = await query;
      
      if (error) {
        logger.error("Error fetching providers:", error);
        return [];
      }
      
      return (data as ProviderProfile[]) || [];
    },
  });
}
