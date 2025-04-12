import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";

const useChatHeaders = (
  rowsPerPage: number,
  currentPage: number,
  userId: string,
  userType?: string,
  showArchived: boolean = false
) => {
  const [chatHeaders, setChatHeaders] = useState<any[]>([]);
  const [loadingChatHeaders, setLoadingChatHeaders] = useState(true);
  const [errorChatHeaders, setErrorChatHeaders] = useState<string | null>(null);
  const [totalChatHeaders, setTotalChatHeaders] = useState(0);

  const fetchChatHeaders = useCallback(async () => {
    if (!userId || !userType) return;

    const offset = (currentPage - 1) * rowsPerPage;

    setLoadingChatHeaders(true);
    setErrorChatHeaders(null);

    try {
      const baseQuery = supabase
        .from("ViewLatestChatHeaders")
        .select(
          `*,
           display_technician_first_name,
           display_technician_last_name,
           display_farmer_first_name,
           display_farmer_last_name,
           unread_count,
           unread_receiver_id`,
          { count: "exact" }
        )
        .or(
          `first_sender_id.eq.${userId},first_receiver_id.eq.${userId},recipient_technician_id.eq.${userId},farmer_id.eq.${userId}`
        );

      // Add deletion filters based on user type
      if (userType === "farmer") {
        baseQuery.eq("farmer_deleted", false);
        if (showArchived) {
          baseQuery.eq("farmer_archived", true);
        } else {
          baseQuery.eq("farmer_archived", false);
        }
      } else if (userType === "technician") {
        baseQuery.eq("technician_deleted", false);
        if (showArchived) {
          baseQuery.eq("technician_archived", true);
        } else {
          baseQuery.eq("technician_archived", false);
        }
      }

      const response = await baseQuery
        .order("latest_created_at", { ascending: false })
        .range(offset, offset + rowsPerPage - 1);

      if (response.error) {
        console.error("Supabase error:", response.error);
        throw response.error;
      }

      // Process data to set correct unread count for the current user
      const processedData = (response.data || []).map((header) => ({
        ...header,
        unread_count:
          header.unread_receiver_id === userId ? header.unread_count : 0,
      }));

      setChatHeaders(processedData);
      setTotalChatHeaders(response.count || 0);
    } catch (err) {
      if (err instanceof Error) {
        setErrorChatHeaders(err.message || "Error fetching chat headers");
      } else {
        setErrorChatHeaders("An unknown error occurred");
      }
      console.error("Error in fetchChatHeaders:", err);
    } finally {
      setLoadingChatHeaders(false);
    }
  }, [rowsPerPage, currentPage, userId, userType, showArchived]);

  const refetch = useCallback(() => {
    fetchChatHeaders();
  }, [fetchChatHeaders]);

  useEffect(() => {
    if (!userType || !userId) {
      return;
    }
    fetchChatHeaders();

    const messageChannel = supabase
      .channel("chat_message_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ChatMessages" },
        (payload) => {
          fetchChatHeaders();
        }
      )
      .subscribe();

    const connectionChannel = supabase
      .channel("chat_connection_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ChatConnections" },
        (payload) => {
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
    refetch,
  };
};

export default useChatHeaders;
