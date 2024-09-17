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

  return {
    chatConnections,
    isLoadingChatConnections,
    totalChatEntries,
    fetchAndSubscribeChatConnections
  };
};

export default useChatConnections;
