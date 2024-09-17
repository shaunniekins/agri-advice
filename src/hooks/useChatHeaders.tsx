import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useChatHeaders = (
  rowsPerPage: number,
  currentPage: number,
  sender_id: string
) => {
  const [chatHeaders, setChatHeaders] = useState<any[]>([]);
  const [totalChatHeaders, setTotalChatHeaders] = useState(0);
  const [loadingChatHeaders, setLoadingChatHeaders] = useState(true);
  const [errorChatHeaders, setErrorChatHeaders] = useState<string | null>(null);

  // Fetch chat headers from Supabase
  const fetchChatHeaders = useCallback(async () => {
    const offset = (currentPage - 1) * rowsPerPage;
    setLoadingChatHeaders(true);
    setErrorChatHeaders(null);

    try {
      let query = supabase
        .from("ChatMessagesDistinctConnectionsView")
        .select("*", { count: "exact" })
        .eq("sender_id", sender_id)
        .order("last_accessed_at", { ascending: true });

      const response: PostgrestResponse<any> = await query.range(
        offset,
        offset + rowsPerPage - 1
      );

      if (response.error) {
        throw response.error;
      }

      setChatHeaders(response.data || []);
      setTotalChatHeaders(response.count || 0);
    } catch (err) {
      if (err instanceof Error) {
        setErrorChatHeaders(err.message || "Error fetching chat headers");
      } else {
        setErrorChatHeaders("An unknown errorChatHeaders occurred");
      }
    } finally {
      setLoadingChatHeaders(false);
    }
  }, [rowsPerPage, currentPage, sender_id]);

  // Set up real-time subscription for INSERT, UPDATE, and DELETE events
  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("chat_sessions_chat_headers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ChatMessages",
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          setChatHeaders((prev) => {
            switch (eventType) {
              case "INSERT":
                if (newRecord.sender_id === sender_id) {
                  return [newRecord, ...prev];
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
          setErrorChatHeaders("Error subscribing to real-time updates");
          console.error("Error subscribing to channel:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sender_id]);

  useEffect(() => {
    fetchChatHeaders(); // Fetch initial data

    const unsubscribe = subscribeToChanges(); // Set up real-time subscription

    return () => {
      if (unsubscribe) unsubscribe(); // Clean up on unmount
    };
  }, [fetchChatHeaders, subscribeToChanges]);

  return {
    chatHeaders,
    totalChatHeaders,
    loadingChatHeaders,
    errorChatHeaders,
  };
};

export default useChatHeaders;
