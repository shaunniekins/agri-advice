import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useChatHeaders = (
  rowsPerPage: number,
  currentPage: number,
  userId: string,
  userType?: string
) => {
  const [chatHeaders, setChatHeaders] = useState<any[]>([]);
  const [loadingChatHeaders, setLoadingChatHeaders] = useState(true);
  const [errorChatHeaders, setErrorChatHeaders] = useState<string | null>(null);
  const [totalChatHeaders, setTotalChatHeaders] = useState(0);

  // Fetch the latest chat headers for the user
  const fetchChatHeaders = useCallback(async () => {
    if (!userId || !userType) return;

    const offset = (currentPage - 1) * rowsPerPage;

    setLoadingChatHeaders(true);
    setErrorChatHeaders(null);

    try {
      // Get all chat headers where the user is involved
      const baseQuery = supabase
        .from("ViewLatestChatHeaders")
        .select("*")
        .or(
          `first_sender_id.eq.${userId},first_receiver_id.eq.${userId},recipient_technician_id.eq.${userId}`
        );

      // Add deletion filters based on user type - this is critical
      if (userType === "farmer") {
        baseQuery.eq("farmer_deleted", false);
      } else if (userType === "technician") {
        baseQuery.eq("technician_deleted", false);
      }

      // Finish the query with ordering and pagination
      const response = await baseQuery
        .order("latest_created_at", { ascending: false })
        .range(offset, offset + rowsPerPage - 1);

      if (response.error) {
        throw response.error;
      }

      // Set headers directly from database response - we already filtered by deletion status in the query
      setChatHeaders(response.data || []);
      setTotalChatHeaders(response.data?.length || 0);
    } catch (err) {
      if (err instanceof Error) {
        setErrorChatHeaders(err.message || "Error fetching chat headers");
      } else {
        setErrorChatHeaders("An unknown error occurred");
      }
    } finally {
      setLoadingChatHeaders(false);
    }
  }, [rowsPerPage, currentPage, userId, userType]);

  // Explicit refetch function that can be called from components
  const refetch = useCallback(() => {
    fetchChatHeaders();
  }, [fetchChatHeaders]);

  useEffect(() => {
    if (!userType || !userId) return;

    fetchChatHeaders();

    // Set up real-time updates for both ChatMessages and ChatConnections
    const messageChannel = supabase
      .channel("chat_message_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ChatMessages",
        },
        () => {
          fetchChatHeaders();
        }
      )
      .subscribe();

    // Add a new subscription specifically for ChatConnections changes
    const connectionChannel = supabase
      .channel("chat_connection_changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Watch for all events, not just UPDATE
          schema: "public",
          table: "ChatConnections",
        },
        (payload) => {
          // Force refetch for any changes to ChatConnections
          fetchChatHeaders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(connectionChannel);
    };
  }, [fetchChatHeaders, userType, userId]);

  return {
    chatHeaders,
    totalChatHeaders,
    loadingChatHeaders,
    errorChatHeaders,
    refetch, // Export the refetch function
  };
};

export default useChatHeaders;
