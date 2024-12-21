import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const usePremadePrompts = () => {
  const [premadePrompts, setPremadePrompts] = useState<any[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState<boolean>(true);
  const [lastOrderValue, setLastOrderValue] = useState<number | null>(null);

  const fetchPremadePrompts = useCallback(async () => {
    try {
      const response: PostgrestResponse<any> = await supabase
        .from("PremadePrompts")
        .select("*")
        .order("category");

      if (response.error) {
        throw response.error;
      }

      const prompts = response.data || [];
      setPremadePrompts(prompts);

      if (prompts.length > 0) {
        const lastOrder = prompts[prompts.length - 1].prompt_order;
        setLastOrderValue(lastOrder);
      } else {
        setLastOrderValue(null);
      }

      setIsLoadingPrompts(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching premade prompts:", err.message);
      } else {
        console.error(
          "An unknown error occurred while fetching premade prompts"
        );
      }
    } finally {
      setIsLoadingPrompts(false);
    }
  }, []);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("premade_prompts_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "PremadePrompts",
        },
        (payload) => {
          fetchPremadePrompts();
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
  }, [fetchPremadePrompts]);

  useEffect(() => {
    fetchPremadePrompts();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchPremadePrompts, subscribeToChanges]);

  return { premadePrompts, isLoadingPrompts, lastOrderValue };
};

export default usePremadePrompts;
