import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useReadingLists = () => {
  const [readingLists, setReadingLists] = useState<any[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState<boolean>(true);
  const [lastListOrderValue, setLastListOrderValue] = useState<number | null>(null);

  const fetchReadingLists = useCallback(async () => {
    try {
      const response: PostgrestResponse<any> = await supabase
        .from("ReadingLists")
        .select("*")
        .order("list_order");

      if (response.error) {
        throw response.error;
      }

      const lists = response.data || [];
      setReadingLists(lists);

      if (lists.length > 0) {
        const lastOrder = lists[lists.length - 1].list_order;
        setLastListOrderValue(lastOrder);
      } else {
        setLastListOrderValue(null);
      }

      setIsLoadingLists(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching reading lists:", err.message);
      } else {
        console.error("An unknown error occurred while fetching reading lists");
      }
    } finally {
      setIsLoadingLists(false);
    }
  }, []);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("reading_lists_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ReadingLists",
        },
        (payload) => {
          fetchReadingLists();
        }
      )
      .subscribe((status: any) => {
        if (status !== "SUBSCRIBED") {
          // console.error("Error subscribing to reading lists changes");
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [fetchReadingLists]);

  useEffect(() => {
    fetchReadingLists();
    const unsubscribe = subscribeToChanges();

    return () => {
      unsubscribe();
    };
  }, [fetchReadingLists, subscribeToChanges]);

  return { readingLists, isLoadingLists, lastListOrderValue };
};

export default useReadingLists;
