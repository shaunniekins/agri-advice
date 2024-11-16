import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useFeedback = (rowsPerPage: number, currentPage: number) => {
  const [feedbackData, setFeedbackData] = useState<any[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(true);
  const [totalFeedbackEntries, setTotalFeedbackEntries] = useState<number>(0);

  const fetchAndSubscribeFeedback = useCallback(async () => {
    try {
      let query = supabase
        .from("ViewFullFeedback")
        .select("*", { count: "exact" })
        .order("feedback_created_at", { ascending: false });

      const response: PostgrestResponse<any> = await query;

      if (response.error) {
        throw response.error;
      }

      setFeedbackData(response.data || []);
      setTotalFeedbackEntries(response.count || 0);
      setIsLoadingFeedback(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching feedback:", err.message);
      } else {
        console.error("An unknown error occurred while fetching feedback");
      }
    } finally {
      setIsLoadingFeedback(false);
    }
  }, [rowsPerPage, currentPage]);

  const fetchFullFeedback = async (feedbackId: number) => {
    if (!feedbackId) return;

    try {
      const { data, error } = await supabase
        .from("ViewFullFeedback")
        .select("*")
        .eq("feedback_id", feedbackId);

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching full feedback:", err.message);
      } else {
        console.error("An unknown error occurred while fetching full feedback");
      }
    }
  };

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("feedback_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Feedback",
        },
        async (payload: { eventType: string; new: any; old: any }) => {
          if (payload.eventType === "INSERT") {
            const fullFeedback = await fetchFullFeedback(
              payload.new.feedback_id
            );
            if (fullFeedback && fullFeedback.length > 0) {
              setFeedbackData((prev) => {
                const newData = [fullFeedback[0], ...prev].sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                );
                return rowsPerPage ? newData.slice(0, rowsPerPage) : newData;
              });
            }
          } else if (payload.eventType === "UPDATE") {
            setFeedbackData((prev) =>
              prev.map((feedback) =>
                feedback.feedback_id === payload.new.feedback_id
                  ? payload.new
                  : feedback
              )
            );
          } else if (payload.eventType === "DELETE") {
            setFeedbackData((prev) =>
              prev.filter(
                (feedback) => feedback.feedback_id !== payload.old.feedback_id
              )
            );
          }
        }
      )
      .subscribe((status: any) => {
        if (status !== "SUBSCRIBED") {
          //   console.error("Error subscribing to channel:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rowsPerPage, currentPage]);

  useEffect(() => {
    fetchAndSubscribeFeedback();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchAndSubscribeFeedback, subscribeToChanges]);

  return {
    feedbackData,
    isLoadingFeedback,
    totalFeedbackEntries,
  };
};

export default useFeedback;
