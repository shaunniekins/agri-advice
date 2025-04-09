import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";

const useChatConnectionForTechnicianRecipient = (
  chat_connection_id: string
) => {
  const [chatConnection, setChatConnection] = useState<any[]>([]);
  const [isLoadingChatConnections, setIsLoadingChatConnections] =
    useState<boolean>(true);

  const fetchChatConnections = useCallback(async () => {
    if (!chat_connection_id) return;

    try {
      // Build the query with explicit field selection including status
      const { data, error } = await supabase
        .from("ChatConnections")
        .select(
          "chat_connection_id, farmer_id, recipient_technician_id, parent_chat_connection_id, farmer_deleted, technician_deleted, status, remarks, farmer_archived, technician_archived"
        )
        .eq("chat_connection_id", chat_connection_id);

      if (error) {
        throw error;
      }

      setChatConnection(data);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching chat connections:", err);
      } else {
        console.error("An unknown error occurred");
      }
    } finally {
      setIsLoadingChatConnections(false);
    }
  }, [chat_connection_id]);

  const subscribeToChanges = useCallback(() => {
    if (!chat_connection_id) return () => {};

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`chat_connections_${chat_connection_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ChatConnections",
          filter: `chat_connection_id=eq.${chat_connection_id}`,
        },
        (payload: any) => {
          console.log("Chat connection changed:", payload);
          const { new: newChat, old: oldChat, eventType } = payload;

          // Handle INSERT
          if (eventType === "INSERT") {
            setChatConnection((prev) => [...prev, newChat]);
          }
          // Handle UPDATE
          else if (eventType === "UPDATE") {
            setChatConnection((prev) =>
              prev.map((chat) =>
                chat.chat_connection_id === newChat.chat_connection_id
                  ? newChat
                  : chat
              )
            );
          }
          // Handle DELETE
          else if (eventType === "DELETE") {
            setChatConnection((prev) =>
              prev.filter(
                (chat) => chat.chat_connection_id !== oldChat.chat_connection_id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat_connection_id]);

  useEffect(() => {
    if (chat_connection_id) {
      fetchChatConnections();
      const unsubscribe = subscribeToChanges();
      return unsubscribe;
    }
  }, [fetchChatConnections, subscribeToChanges, chat_connection_id]);

  return {
    chatConnection,
    isLoadingChatConnections,
    fetchChatConnections,
  };
};

export default useChatConnectionForTechnicianRecipient;
