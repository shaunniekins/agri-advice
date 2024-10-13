import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useTotalConnections = () => {
  const [totalConnections, setTotalConnections] = useState<number>(0);

  const fetchAndSubscribeConnections = useCallback(async () => {
    try {
      // Fetch total connections
      let farmerQuery = supabase
        .from("ChatConnections")
        .select("*", { count: "exact" });

      const response: PostgrestResponse<any> = await farmerQuery;

      if (response.error) {
        throw response.error;
      }

      setTotalConnections(response.count || 0);
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
