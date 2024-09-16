import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";

const useChatMessages = () => {
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isLoadingChatMessages, setIsLoadingChatMessages] =
    useState<boolean>(true);
  const [totalMessageEntries, setTotalMessageEntries] = useState<number>(0);

  // Fetch initial data and subscribe to real-time changes
  const fetchAndSubscribeChatMessages = useCallback(
    async (rowsPerPage: number, currentPage: number) => {
      try {
        const offset = (currentPage - 1) * rowsPerPage;

        // Build the query
        const { data, error, count } = await supabase
          .from("ChatMessages")
          .select("*", { count: "exact" }) // To get the total number of rows
          .order("created_at", { ascending: false })
          .range(offset, offset + rowsPerPage - 1);

        if (error) {
          throw error;
        }

        setChatMessages(data);
        setTotalMessageEntries(count || 0);
        setIsLoadingChatMessages(false);

        // Subscribe to real-time changes
        const channel: any = supabase
          .channel("chat_messages_realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "ChatMessages",
            },
            (payload: any) => {
              setChatMessages((prev) => {
                const { new: newMessage, old: oldMessage, eventType } = payload;

                // Handle INSERT
                if (eventType === "INSERT") {
                  return [...prev, newMessage];
                }

                // Handle UPDATE
                else if (eventType === "UPDATE") {
                  return prev.map((message) =>
                    message.chat_message_id === newMessage.chat_message_id
                      ? newMessage
                      : message
                  );
                }

                // Handle DELETE
                else if (eventType === "DELETE") {
                  return prev.filter(
                    (message) =>
                      message.chat_message_id !== oldMessage.chat_message_id
                  );
                }

                return prev;
              });
            }
          )
          .subscribe((status: any) => {
            if (status !== "SUBSCRIBED") {
              console.error("Error subscribing to channel:", status);
            }
          });

        // Cleanup the subscription
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error: any) {
        console.error("Error fetching or subscribing:", error);
        setIsLoadingChatMessages(false);
      }
    },
    []
  );

  // Insert a new chat message
  const insertChatMessage = useCallback(async (newMessage: any) => {
    try {
      const response = await supabase
        .from("ChatMessages")
        .insert(newMessage)
        .select();

      if (response.error) {
        throw response.error;
      }

      setChatMessages((prev) => [...prev, ...response.data]);
      return response;
    } catch (error: any) {
      console.error("Error inserting chat message:", error);
      return null;
    }
  }, []);

  // Update an existing chat message
  const updateChatMessage = useCallback(
    async (chatMessageId: number, updatedMessage: any) => {
      try {
        const response = await supabase
          .from("ChatMessages")
          .update(updatedMessage)
          .eq("chat_message_id", chatMessageId)
          .select();

        if (response.error) {
          throw response.error;
        }

        setChatMessages((prev) =>
          prev.map((message) =>
            message.chat_message_id === updatedMessage.chat_message_id
              ? response.data[0]
              : message
          )
        );
        return response;
      } catch (error: any) {
        console.error("Error updating chat message:", error);
        return null;
      }
    },
    []
  );

  // Delete a chat message
  const deleteChatMessage = useCallback(async (chatMessageId: any) => {
    try {
      const response = await supabase
        .from("ChatMessages")
        .delete()
        .eq("chat_message_id", chatMessageId);

      if (response.error) {
        throw response.error;
      }

      setChatMessages((prev) =>
        prev.filter((message) => message.chat_message_id !== chatMessageId)
      );
      return response;
    } catch (error: any) {
      console.error("Error deleting chat message:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Fetch first page with default rowsPerPage
    fetchAndSubscribeChatMessages(10, 1);
  }, [fetchAndSubscribeChatMessages]);

  return {
    chatMessages,
    isLoadingChatMessages,
    totalMessageEntries,
    fetchAndSubscribeChatMessages,
    insertChatMessage,
    updateChatMessage,
    deleteChatMessage,
  };
};

export default useChatMessages;
