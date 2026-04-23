import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ScheduleSlot {
  id: string;
  provider_id: string;
  day_of_week: number; // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  start_time: string;  // "HH:MM:SS"
  end_time: string;
  is_active: boolean;
}

export interface ProviderService {
  id: string;
  provider_id: string;
  name: string;
  description: string | null;
  estimated_duration: string | null;
  price_from: number | null;
  price_to: number | null;
}

export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const DAY_NAMES_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// ─── Schedule Hooks ───────────────────────────────────────────────

export const useMySchedule = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["provider-schedule", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_schedule" as never)
        .select("*")
        .eq("provider_id", user!.id)
        .order("day_of_week", { ascending: true });
      if (error) throw error;
      return (data || []) as ScheduleSlot[];
    },
    enabled: !!user,
  });
};

export const useProviderSchedulePublic = (providerId: string | null) => {
  return useQuery({
    queryKey: ["provider-schedule-public", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_schedule" as never)
        .select("*")
        .eq("provider_id", providerId!)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true });
      if (error) throw error;
      return (data || []) as ScheduleSlot[];
    },
    enabled: !!providerId,
  });
};

export const useSaveSchedule = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slots: { day_of_week: number; start_time: string; end_time: string; is_active: boolean }[]) => {
      if (!user) throw new Error("No autenticado");

      // Fetch existing slots before deleting so we can restore on insert failure
      const { data: existingSlots, error: fetchError } = await supabase
        .from("provider_schedule" as never)
        .select("*")
        .eq("provider_id", user.id);
      if (fetchError) throw fetchError;

      // Delete existing slots and re-insert all
      const { error: delError } = await supabase
        .from("provider_schedule" as never)
        .delete()
        .eq("provider_id", user.id);
      if (delError) throw delError;

      if (slots.length === 0) return;

      const rows = slots.map((s) => ({
        provider_id: user.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active,
      }));

      const { error } = await supabase
        .from("provider_schedule" as never)
        .insert(rows);
      if (error) {
        // Attempt to restore previous slots since insert failed after delete
        if (existingSlots && existingSlots.length > 0) {
          await supabase
            .from("provider_schedule" as never)
            .insert(existingSlots);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-schedule"] });
      toast.success("Horarios guardados correctamente");
    },
    onError: (err: Error) => toast.error("Error al guardar horarios: " + err.message),
  });
};

// ─── Services Hooks ───────────────────────────────────────────────

export const useMyServices = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["provider-services", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_services" as never)
        .select("*")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ProviderService[];
    },
    enabled: !!user,
  });
};

export const useProviderServicesPublic = (providerId: string | null) => {
  return useQuery({
    queryKey: ["provider-services-public", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_services" as never)
        .select("*")
        .eq("provider_id", providerId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ProviderService[];
    },
    enabled: !!providerId,
  });
};

export const useAddService = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (svc: { name: string; description?: string; estimated_duration?: string; price_from?: number; price_to?: number }) => {
      const { error } = await supabase
        .from("provider_services" as never)
        .insert({ provider_id: user!.id, ...svc });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-services"] });
      toast.success("Servicio agregado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteService = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase
        .from("provider_services" as never)
        .delete()
        .eq("id", id)
        .eq("provider_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-services"] });
      toast.success("Servicio eliminado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
