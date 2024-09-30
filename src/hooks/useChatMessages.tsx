import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useChatMessages = (
  rowsPerPage: number,
  currentPage: number,
  userId: string,
  selectedChatPartnerId: string
) => {
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [totalChatMessages, setTotalChatMessages] = useState(0);
  const [loadingChatMessages, setLoadingChatMessages] = useState(true);
  const [errorChatMessages, setErrorChatMessages] = useState<string | null>(
    null
  );

  // Fetch chat messages from Supabase
  const fetchChatMessages = useCallback(async () => {
    if (!userId || !selectedChatPartnerId) return;

    const offset = (currentPage - 1) * rowsPerPage;
    setLoadingChatMessages(true);
    setErrorChatMessages(null);

    try {
      const query = supabase
        .from("ViewFullChatMessages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .or(
          `sender_id.eq.${selectedChatPartnerId},receiver_id.eq.${selectedChatPartnerId}`
        )
        .order("last_accessed_at", { ascending: true });

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
  }, [rowsPerPage, currentPage, userId, selectedChatPartnerId]);

  const fetchFullChatMessages = async (chatMessageId: number) => {
    if (!chatMessageId) return;

    try {
      const { data, error } = await supabase
        .from("ViewFullChatMessages")
        .select("*")
        .eq("chat_message_id", chatMessageId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error("Error fetching full chat message:", err);
      return null;
    }
  };

  // Set up real-time subscription for INSERT, UPDATE, and DELETE events
  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("chat_messages_session")
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
                if (
                  newRecord.sender_id === userId ||
                  newRecord.receiver_id === userId
                ) {
                  fetchFullChatMessages(newRecord.chat_message_id).then(
                    (fullChatMessage) => {
                      if (fullChatMessage) {
                        setChatMessages([...prev, fullChatMessage]);
                      }
                    }
                  );
                }
                break;
              case "UPDATE":
                return prev.map((message) =>
                  message.chat_message_id === newRecord.chat_message_id
                    ? { ...message, ...newRecord }
                    : message
                );
              case "DELETE":
                return prev.filter(
                  (message) =>
                    message.chat_message_id !== oldRecord.chat_message_id
                );
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
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, selectedChatPartnerId]);

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
