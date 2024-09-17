import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useChatMessages = (
  rowsPerPage: number,
  currentPage: number,
  chatConnectionId: string
) => {
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [totalChatMessages, setTotalChatMessages] = useState(0);
  const [loadingChatMessages, setLoadingChatMessages] = useState(true);
  const [errorChatMessages, setErrorChatMessages] = useState<string | null>(
    null
  );

  // Fetch chat messages from Supabase
  const fetchChatMessages = useCallback(async () => {
    const offset = (currentPage - 1) * rowsPerPage;
    setLoadingChatMessages(true);
    setErrorChatMessages(null);

    try {
      let query = supabase
        .from("ChatMessages")
        .select("*", { count: "exact" })
        .eq("chat_connection_id", chatConnectionId)
        .order("created_at", { ascending: true });

      const response: PostgrestResponse<any> = await query.range(
        offset,
        offset + rowsPerPage - 1
      );

      if (response.error) {
        throw response.error;
      }

      setChatMessages(response.data || []);
      setTotalChatMessages(response.count || 0);
    } catch (err) {
      if (err instanceof Error) {
        setErrorChatMessages(err.message || "Error fetching chat messages");
      } else {
        setErrorChatMessages("An unknown error occurred");
      }
    } finally {
      setLoadingChatMessages(false);
    }
  }, [rowsPerPage, currentPage, chatConnectionId]);

  // Set up real-time subscription for INSERT, UPDATE, and DELETE events
  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("chat_sessions_chat_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ChatMessages",
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          setChatMessages((prev) => {
            switch (eventType) {
              case "INSERT":
                if (newRecord.chat_connection_id === chatConnectionId) {
                  return [...prev, newRecord];
                }
                break;
              case "UPDATE":
                return prev.map((message) =>
                  message.chat_message_id === newRecord.chat_message_id
                    ? newRecord
                    : message
                );
                break;
              case "DELETE":
                return prev.filter(
                  (message) =>
                    message.chat_message_id !== oldRecord.chat_message_id
                );
                break;
              default:
                return prev;
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          setErrorChatMessages("Error subscribing to real-time updates");
          console.error("Error subscribing to channel:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatConnectionId]);

  useEffect(() => {
    fetchChatMessages(); // Fetch initial data

    const unsubscribe = subscribeToChanges(); // Set up real-time subscription

    return () => {
      if (unsubscribe) unsubscribe(); // Clean up on unmount
    };
  }, [fetchChatMessages, subscribeToChanges]);

  return {
    chatMessages,
    totalChatMessages,
    loadingChatMessages,
    errorChatMessages,
  };
};

export default useChatMessages;
