import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useChatHeaders = (
  rowsPerPage: number,
  currentPage: number,
  userId: string
) => {
  const [chatHeaders, setChatHeaders] = useState<any[]>([]);
  const [loadingChatHeaders, setLoadingChatHeaders] = useState(true);
  const [errorChatHeaders, setErrorChatHeaders] = useState<string | null>(null);
  const [totalChatHeaders, setTotalChatHeaders] = useState(0);

  // Fetch the latest chat headers for the user
  const fetchChatHeaders = useCallback(async () => {
    if (!userId) return;

    const offset = (currentPage - 1) * rowsPerPage;

    setLoadingChatHeaders(true);
    setErrorChatHeaders(null);

    try {
      // Query from the new view that returns the latest conversation for each partner
      const query = supabase
        .from("ViewLatestChatHeaders")
        .select("*")
        .or(
          `sender_id.eq.${userId},receiver_id.eq.${userId},recipient_technician_id.eq.${userId}`
        )
        .order("created_at", { ascending: false });

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
        setErrorChatHeaders("An unknown error occurred");
      }
    } finally {
      setLoadingChatHeaders(false);
    }
  }, [rowsPerPage, currentPage, userId]);

  useEffect(() => {
    fetchChatHeaders(); // Fetch initial chat headers

    // Optionally set up real-time updates for new messages or deleted messages
    const unsubscribe = supabase
      .channel("chat_headers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ChatMessages",
        },
        (payload) => {
          fetchChatHeaders(); // Re-fetch the latest headers on changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(unsubscribe); // Clean up on unmount
    };
  }, [fetchChatHeaders]);

  return {
    chatHeaders,
    totalChatHeaders,
    loadingChatHeaders,
    errorChatHeaders,
  };
};

export default useChatHeaders;
