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
        (payload: { eventType: string; new: any; old: any }) => {
          if (payload.eventType === "INSERT") {
            setFeedbackData((prev) => {
              const newData = [...prev, payload.new].sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              );
              return rowsPerPage ? newData.slice(0, rowsPerPage) : newData;
            });
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
