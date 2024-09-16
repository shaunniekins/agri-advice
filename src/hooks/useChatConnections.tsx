import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";

const useChatConnections = () => {
  const [chatConnections, setChatConnections] = useState<any[]>([]);
  const [isLoadingChatConnections, setIsLoadingChatConnections] =
    useState<boolean>(true);
  const [totalChatEntries, setTotalChatEntries] = useState<number>(0);

  // Fetch initial data and subscribe to real-time changes
  const fetchAndSubscribeChatConnections = useCallback(
    async (rowsPerPage: number, currentPage: number) => {
      try {
        const offset = (currentPage - 1) * rowsPerPage;

        // Build the query
        const { data, error, count } = await supabase
          .from("ChatConnections")
          .select("*", { count: "exact" }) // To get the total number of rows
          .order("created_at", { ascending: false })
          .range(offset, offset + rowsPerPage - 1);

        if (error) {
          throw error;
        }

        setChatConnections(data);
        setTotalChatEntries(count || 0);
        setIsLoadingChatConnections(false);

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
              setChatConnections((prev) => {
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
                  return prev.filter(
                    (chat) =>
                      chat.chat_connection_id !== oldChat.chat_connection_id
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
        setIsLoadingChatConnections(false);
      }
    },
    []
  );

  // Insert a new chat connection
  const insertChatConnection = useCallback(async (newChat: any) => {
    try {
      const response = await supabase
        .from("ChatConnections")
        .insert(newChat)
        .select();

      if (response.error) {
        throw response.error;
      }

      setChatConnections((prev) => [...prev, ...response.data]);
      return response;
    } catch (error: any) {
      console.error("Error inserting chat connection:", error);
      return null;
    }
  }, []);

  // Update an existing chat connection
  const updateChatConnection = useCallback(
    async (chatConnectionId: number, updatedChat: any) => {
      try {
        const response = await supabase
          .from("ChatConnections")
          .update(updatedChat)
          .eq("chat_connection_id", chatConnectionId)
          .select();

        if (response.error) {
          throw response.error;
        }

        setChatConnections((prev) =>
          prev.map((chat) =>
            chat.chat_connection_id === updatedChat.chat_connection_id
              ? response.data[0]
              : chat
          )
        );
        return response;
      } catch (error: any) {
        console.error("Error updating chat connection:", error);
        return null;
      }
    },
    []
  );

  // Delete a chat connection
  const deleteChatConnection = useCallback(async (chatConnectionId: any) => {
    try {
      const response = await supabase
        .from("ChatConnections")
        .delete()
        .eq("chat_connection_id", chatConnectionId);

      if (response.error) {
        throw response.error;
      }

      setChatConnections((prev) =>
        prev.filter((chat) => chat.chat_connection_id !== chatConnectionId)
      );
      return response;
    } catch (error: any) {
      console.error("Error deleting chat connection:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Fetch first page with default rowsPerPage
    fetchAndSubscribeChatConnections(10, 1);
  }, [fetchAndSubscribeChatConnections]);

  return {
    chatConnections,
    isLoadingChatConnections,
    totalChatEntries,
    fetchAndSubscribeChatConnections,
    insertChatConnection,
    updateChatConnection,
    deleteChatConnection,
  };
};

export default useChatConnections;
