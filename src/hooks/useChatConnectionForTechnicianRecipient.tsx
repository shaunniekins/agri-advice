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
      // Build the query
      const { data, error } = await supabase
        .from("ChatConnections")
        .select("chat_connection_id, recipient_technician_id")
        .eq("chat_connection_id", chat_connection_id);
      // .not("recipient_technician_id", "is", null);

      if (error) {
        throw error;
      }

      setChatConnection(data);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching chat headers");
      } else {
        console.error("An unknown error occurred");
      }
    } finally {
      setIsLoadingChatConnections(false);
    }
  }, [chat_connection_id]);

  const subscribeToChanges = useCallback(() => {
    // Subscribe to real-time changes
    const channel: any = supabase
      .channel("chat_connections_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ChatConnections",
        },
        (payload: any) => {
          setChatConnection((prev) => {
            const { new: newChat, old: oldChat, eventType } = payload;

            // Handle INSERT
            if (eventType === "INSERT") {
              return [...prev, newChat];
            }

            // Handle UPDATE
            else if (eventType === "UPDATE") {
              return prev.map((chat) =>
                chat.chat_connection_id === newChat.chat_connection_id
                  ? newChat
                  : chat
              );
            }

            // Handle DELETE
            else if (eventType === "DELETE") {
              console.log("delete");
              return prev.filter(
                (chat) => chat.chat_connection_id !== oldChat.chat_connection_id
              );
            }

            return prev;
          });
        }
      )
      .subscribe((status: any) => {
        if (status !== "SUBSCRIBED") {
          // console.error("Error subscribing to channel:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat_connection_id]);

  useEffect(() => {
    fetchChatConnections();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchChatConnections, subscribeToChanges]);

  return {
    chatConnection,
    isLoadingChatConnections,
    fetchChatConnections,
  };
};

export default useChatConnectionForTechnicianRecipient;
