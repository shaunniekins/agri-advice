import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useTotalConnections = () => {
  const [totalConnections, setTotalConnections] = useState<number>(0);

  const fetchAndSubscribeConnections = useCallback(async () => {
    try {
      // Fetch total connections from ReadingLists
      let readingListsQuery = supabase
        .from("ReadingLists")
        .select("*", { count: "exact" });

      const readingListsResponse: PostgrestResponse<any> =
        await readingListsQuery;

      if (readingListsResponse.error) {
        throw readingListsResponse.error;
      }

      const readingListsCount = readingListsResponse.count || 0;

      // Fetch total connections from SuggestedLinks
      let suggestedLinksQuery = supabase
        .from("SuggestedLinks")
        .select("*", { count: "exact" });

      const suggestedLinksResponse: PostgrestResponse<any> =
        await suggestedLinksQuery;

      if (suggestedLinksResponse.error) {
        throw suggestedLinksResponse.error;
      }

      const suggestedLinksCount = suggestedLinksResponse.count || 0;

      // Sum the counts from both tables
      const totalConnectionsCount = readingListsCount + suggestedLinksCount;

      setTotalConnections(totalConnectionsCount);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching connections:", err.message);
      } else {
        console.error("An unknown error occurred while fetching connections");
      }
    }
  }, []);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("chat_connections_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ChatConnections",
        },
        (payload: any) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE" ||
            payload.eventType === "DELETE"
          ) {
            fetchAndSubscribeConnections();
          }
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
  }, [fetchAndSubscribeConnections]);

  useEffect(() => {
    fetchAndSubscribeConnections();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchAndSubscribeConnections, subscribeToChanges]);

  return {
    totalConnections,
  };
};

export default useTotalConnections;
