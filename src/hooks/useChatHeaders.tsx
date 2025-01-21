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
      // Modified query to include messages where user is recipient_technician_id
      const query = supabase
        .from("ViewLatestChatHeaders")
        .select("*")
        .or(
          `first_sender_id.eq.${userId},first_receiver_id.eq.${userId},recipient_technician_id.eq.${userId}`
        )
        .order("first_created_at", { ascending: false });

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
    fetchChatHeaders();

    // Set up real-time updates for messages and read status
    const unsubscribe = supabase
      .channel("chat_headers")
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

    return () => {
      supabase.removeChannel(unsubscribe);
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
