import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useTechnician = (location_filter: string) => {
  const [technicianData, setTechnicianData] = useState<any[]>([]);
  const [isLoadingTechnician, setIsLoadingTechnician] = useState<boolean>(true);

  const fetchAndSubscribeTechnician = useCallback(async () => {
    if (!location_filter) return;

    try {
      let query = supabase
        .from("ViewUsers")
        .select("*", { count: "exact" })
        .eq("user_type", "technician")
        .eq("address", location_filter);

      const response: PostgrestResponse<any> = await query;

      if (response.error) {
        throw response.error;
      }

      setTechnicianData(response.data || []);
      setIsLoadingTechnician(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching users:", err.message);
      } else {
        console.error("An unknown error occurred while fetching users");
      }
    } finally {
      setIsLoadingTechnician(false);
    }
  }, [location_filter]);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("farmer_users_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "auth",
          table: "users",
        },
        (payload: any) => {
          fetchAndSubscribeTechnician();
        }
      )
      .subscribe((status: any) => {
        if (status !== "SUBSCRIBED") {
          // console.error("Error subscribing to channel:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchAndSubscribeTechnician();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchAndSubscribeTechnician, subscribeToChanges]);

  return {
    technicianData,
    isLoadingTechnician,
    fetchAndSubscribeTechnician,
  };
};

export default useTechnician;
