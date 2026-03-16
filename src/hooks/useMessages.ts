import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

export interface ChatMessage {
  id: string;
  service_request_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export const useMessages = (serviceRequestId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!serviceRequestId) return;

    const channel = supabase
      .channel(`messages:${serviceRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `service_request_id=eq.${serviceRequestId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          const msg: ChatMessage = {
            ...(payload.new as any),
            sender_name: profile?.full_name || "",
            sender_avatar: profile?.avatar_url || "",
          };

          queryClient.setQueryData<ChatMessage[]>(
            ["messages", serviceRequestId],
            (old) => {
              if (old?.some((m) => m.id === msg.id)) return old;
              return [...(old || []), msg];
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [serviceRequestId, queryClient]);

  return useQuery({
    queryKey: ["messages", serviceRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("service_request_id", serviceRequestId!)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Enrich with profiles
      const senderIds = [...new Set(data.map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", senderIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((m) => ({
        ...m,
        metadata: m.metadata as Record<string, unknown> | null,
        sender_name: profileMap.get(m.sender_id)?.full_name || "",
        sender_avatar: profileMap.get(m.sender_id)?.avatar_url || "",
      })) as ChatMessage[];
    },
    enabled: !!serviceRequestId,
  });
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const lastSentRef = { current: 0 };
  const MAX_MESSAGE_LENGTH = 5000;
  const MIN_INTERVAL_MS = 800; // anti-spam: min 800ms between messages

  return useMutation({
    mutationFn: async ({
      service_request_id,
      sender_id: _sender_id,
      content,
      message_type = "text",
      metadata,
    }: {
      service_request_id: string;
      sender_id: string;
      content: string;
      message_type?: string;
      metadata?: Record<string, unknown>;
    }) => {
      // SECURITY: Always use authenticated user's ID, never trust caller-supplied sender_id
      if (!user) throw new Error("No autenticado");
      const authenticatedSenderId = user.id;

      // Rate limiting
      const now = Date.now();
      if (now - lastSentRef.current < MIN_INTERVAL_MS) {
        throw new Error("Esperá un momento antes de enviar otro mensaje");
      }
      // Content validation
      if (message_type === "text" && content.trim().length === 0) {
        throw new Error("El mensaje no puede estar vacío");
      }
      if (content.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres`);
      }

      lastSentRef.current = now;

      const { error } = await supabase.from("messages").insert({
        service_request_id,
        sender_id: authenticatedSenderId,
        content: content.trim(),
        message_type,
        metadata: (metadata || null) as import("@/integrations/supabase/types").Json,
      });
      if (error) throw error;
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
