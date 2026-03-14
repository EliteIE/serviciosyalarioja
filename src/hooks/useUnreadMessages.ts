import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns a Set of service_request_ids that have unread messages for the current user.
 * "Unread" = messages sent by someone else after the user's last message in that conversation.
 *
 * Optimized: uses a single batched query instead of N+1 individual queries.
 */
export const useUnreadMessages = (serviceRequestIds: string[]) => {
  const { user } = useAuth();
  const [unreadServiceIds, setUnreadServiceIds] = useState<Set<string>>(new Set());

  const checkUnread = useCallback(async () => {
    if (!user || serviceRequestIds.length === 0) {
      setUnreadServiceIds(new Set());
      return;
    }

    // Fetch the latest message per service_request in a single query
    const { data: messages } = await supabase
      .from("messages")
      .select("id, service_request_id, sender_id, created_at")
      .in("service_request_id", serviceRequestIds)
      .order("created_at", { ascending: false });

    if (!messages || messages.length === 0) {
      setUnreadServiceIds(new Set());
      return;
    }

    // Group messages by service_request_id and compute unread status
    const unread = new Set<string>();

    const grouped = new Map<string, typeof messages>();
    for (const msg of messages) {
      const list = grouped.get(msg.service_request_id) || [];
      list.push(msg);
      grouped.set(msg.service_request_id, list);
    }

    for (const [srId, msgs] of grouped) {
      // Find the user's latest message in this conversation
      const myLastMsg = msgs.find((m) => m.sender_id === user.id);
      const lastSentAt = myLastMsg?.created_at || "1970-01-01T00:00:00Z";

      // Check if there are messages from others after that timestamp
      const hasUnread = msgs.some(
        (m) => m.sender_id !== user.id && m.created_at > lastSentAt
      );

      if (hasUnread) unread.add(srId);
    }

    setUnreadServiceIds(unread);
  }, [user, serviceRequestIds.join(",")]);

  useEffect(() => {
    checkUnread();

    if (!user || serviceRequestIds.length === 0) return;

    // Listen for new messages in real-time — scoped per service request to avoid receiving all messages
    const channelName = `unread-msgs-${user.id}-${serviceRequestIds.slice(0, 5).join("-")}`;
    const channel = supabase.channel(channelName);

    for (const srId of serviceRequestIds) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `service_request_id=eq.${srId}`,
        },
        (payload) => {
          const msg = payload.new as { service_request_id: string; sender_id: string };
          if (msg.sender_id !== user.id) {
            setUnreadServiceIds((prev) => new Set([...prev, msg.service_request_id]));
          }
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkUnread]);

  const markAsRead = (serviceRequestId: string) => {
    setUnreadServiceIds((prev) => {
      const next = new Set(prev);
      next.delete(serviceRequestId);
      return next;
    });
  };

  return { unreadServiceIds, hasUnread: unreadServiceIds.size > 0, markAsRead };
};
