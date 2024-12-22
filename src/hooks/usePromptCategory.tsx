import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const usePromptCategory = () => {
  const [category, setCategory] = useState<any[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState<boolean>(true);

  const fetchCategory = useCallback(async () => {
    try {
      const response: PostgrestResponse<any> = await supabase
        .from("PromptCategory")
        .select("*")
        .order("category_name");

      if (response.error) {
        throw response.error;
      }

      const category = response.data || [];
      setCategory(category);
      setIsLoadingCategory(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching category:", err.message);
      } else {
        console.error("An unknown error occurred while fetching category");
      }
    } finally {
      setIsLoadingCategory(false);
    }
  }, []);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("category_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "PromptCategory",
        },
        (payload) => {
          fetchCategory();
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
  }, [fetchCategory]);

  useEffect(() => {
    fetchCategory();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchCategory, subscribeToChanges]);

  return { category, isLoadingCategory, fetchCategory };
};

export default usePromptCategory;
