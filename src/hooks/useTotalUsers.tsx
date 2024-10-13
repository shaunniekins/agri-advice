import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useTotalUsers = (filter?: string) => {
  const [totalFarmers, setTotalFarmers] = useState<number>(0);
  const [totalTechnicians, setTotalTechnicians] = useState<number>(0);

  const fetchAndSubscribeUsers = useCallback(async () => {
    try {
      // Fetch total farmers
      let farmerQuery = supabase
        .from("ViewUsers")
        .select("*", { count: "exact" })
        .eq("user_type", "farmer");

      if (filter) {
        farmerQuery = farmerQuery.eq("account_status", filter);
      }

      const farmerResponse: PostgrestResponse<any> = await farmerQuery;

      if (farmerResponse.error) {
        throw farmerResponse.error;
      }

      setTotalFarmers(farmerResponse.count || 0);

      // Fetch total technicians
      let technicianQuery = supabase
        .from("ViewUsers")
        .select("*", { count: "exact" })
        .eq("user_type", "technician");

      if (filter) {
        technicianQuery = technicianQuery.eq("account_status", filter);
      } else {
        technicianQuery = technicianQuery.eq("account_status", "active");
      }

      const technicianResponse: PostgrestResponse<any> = await technicianQuery;

      if (technicianResponse.error) {
        throw technicianResponse.error;
      }

      setTotalTechnicians(technicianResponse.count || 0);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching users:", err.message);
      } else {
        console.error("An unknown error occurred while fetching users");
      }
    }
  }, [filter]);

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
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE" ||
            payload.eventType === "DELETE"
          ) {
            fetchAndSubscribeUsers();
          }
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
  }, [fetchAndSubscribeUsers]);

  useEffect(() => {
    fetchAndSubscribeUsers();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchAndSubscribeUsers, subscribeToChanges]);

  return {
    totalFarmers,
    totalTechnicians,
  };
};

export default useTotalUsers;
