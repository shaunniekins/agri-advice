import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useChatMessagesFotOtherPanel = (
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
    if (!chatConnectionId) return;

    const offset = (currentPage - 1) * rowsPerPage;
    setLoadingChatMessages(true);
    setErrorChatMessages(null);

    try {
      const query = supabase
        .from("ViewFullChatMessages")
        .select("*")
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

  // chat_message_id is different from chat_connection_id
  const fetchFullChatMessages = async (chatMessageId: string) => {
    if (!chatMessageId) return null;

    try {
      // First try to get the message directly from the current messages
      // const existingMessage = chatMessages.find(
      //   (msg) => msg.chat_connection_id === chatConnectionId
      // );
      // if (existingMessage) return existingMessage;

      // If not found in current messages, fetch from database
      const { data, error } = await supabase
        .from("ViewFullChatMessages")
        .select("*")
        .eq("chat_message_id", chatMessageId)
        .single(); // Use maybeSingle() instead of single()

      if (error) {
        console.log("Error fetching full chat message:", error);
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
      .channel("chat_messages_changes_2")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ChatMessages",
          filter: `chat_connection_id=eq.${chatConnectionId}`,
        },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT") {
            const fullChatMessage = await fetchFullChatMessages(
              newRecord.chat_message_id
            );
            if (fullChatMessage) {
              setChatMessages((prev) => [...prev, fullChatMessage]);
            }

            return;
          }

          if (eventType === "UPDATE") {
            setChatMessages((prev) =>
              prev.map((msg) =>
                msg.chat_connection_id === newRecord.chat_connection_id
                  ? { ...msg, ...newRecord }
                  : msg
              )
            );
            return;
          }

          if (eventType === "DELETE") {
            setChatMessages((prev) =>
              prev.filter(
                (msg) => msg.chat_connection_id !== oldRecord.chat_connection_id
              )
            );
            setTotalChatMessages((prev) => prev - 1);
          }
        }
      )
      .subscribe();

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

export default useChatMessagesFotOtherPanel;
