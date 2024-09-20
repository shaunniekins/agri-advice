import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useChatHeaders = (userId: string) => {
  const [chatHeaders, setChatHeaders] = useState<any[]>([]);
  const [loadingChatHeaders, setLoadingChatHeaders] = useState(true);
  const [errorChatHeaders, setErrorChatHeaders] = useState<string | null>(null);

  // Fetch the latest chat headers for the user
  const fetchChatHeaders = useCallback(async () => {
    if (!userId) return;

    setLoadingChatHeaders(true);
    setErrorChatHeaders(null);
    

    try {
      // Query from the new view that returns the latest conversation for each partner
      const { data, error }: PostgrestResponse<any> = await supabase
        .from("ViewLatestChatHeaders")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setChatHeaders(data || []);
    } catch (err) {
      if (err instanceof Error) {
        setErrorChatHeaders(err.message || "Error fetching chat headers");
      } else {
        setErrorChatHeaders("An unknown error occurred");
      }
    } finally {
      setLoadingChatHeaders(false);
    }
  }, [userId]);

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
    loadingChatHeaders,
    errorChatHeaders,
  };
};

export default useChatHeaders;
