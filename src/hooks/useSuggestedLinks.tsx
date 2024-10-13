import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useSuggestedLinks = () => {
  const [suggestedLinks, setSuggestedLinks] = useState<any[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState<boolean>(true);
  const [lastLinkOrderValue, setLastLinkOrderValue] = useState<number | null>(
    null
  );

  const fetchSuggestedLinks = useCallback(async () => {
    try {
      const response: PostgrestResponse<any> = await supabase
        .from("SuggestedLinks")
        .select("*")
        .order("link_order");

      if (response.error) {
        throw response.error;
      }

      const links = response.data || [];
      setSuggestedLinks(links);

      if (links.length > 0) {
        const lastOrder = links[links.length - 1].link_order;
        setLastLinkOrderValue(lastOrder);
      } else {
        setLastLinkOrderValue(null);
      }

      setIsLoadingLinks(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching suggested links:", err.message);
      } else {
        console.error(
          "An unknown error occurred while fetching suggested links"
        );
      }
    } finally {
      setIsLoadingLinks(false);
    }
  }, []);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("suggested_links_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "SuggestedLinks",
        },
        (payload) => {
          fetchSuggestedLinks();
        }
      )
      .subscribe((status: any) => {
        if (status !== "SUBSCRIBED") {
          // console.error("Error subscribing to suggested links changes");
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [fetchSuggestedLinks]);

  useEffect(() => {
    fetchSuggestedLinks();
    const unsubscribe = subscribeToChanges();

    return () => {
      unsubscribe();
    };
  }, [fetchSuggestedLinks, subscribeToChanges]);

  return { suggestedLinks, isLoadingLinks, lastLinkOrderValue };
};

export default useSuggestedLinks;
