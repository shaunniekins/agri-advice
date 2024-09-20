import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";

const useFarmerUsers = () => {
  const [farmerUsers, setFarmerUsers] = useState<any[]>([]);
  const [isLoadingFarmerUsers, setIsLoadingFarmerUsers] =
    useState<boolean>(true);
  const [totalFarmerEntries, setTotalFarmerEntries] = useState<number>(0);

  // Fetch initial data and subscribe to real-time changes
  const fetchAndSubscribeFarmerUsers = useCallback(
    async (rowsPerPage: number, currentPage: number) => {
      try {
        const offset = (currentPage - 1) * rowsPerPage;

        // Build the query
        let query = supabase
          .from("FarmerUserView")
          .select("*", { count: "exact" })
          .eq("user_type", "farmer")
          .range(offset, offset + rowsPerPage - 1);

        // Fetch the paginated data
        const { data, error, count } = await query;

        if (error) {
          throw error;
        }

        setFarmerUsers(data);
        setTotalFarmerEntries(count || 0); // Save total entries for pagination
        setIsLoadingFarmerUsers(false);

        // Subscribe to real-time changes
        const channel: any = supabase
          .channel("tfarmer_users_realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "auth",
              table: "users",
            },
            (payload: any) => {
              if (payload.eventType === "INSERT") {
                setFarmerUsers((prev) => [...prev, payload.new]);
              } else if (payload.eventType === "UPDATE") {
                setFarmerUsers((prev) =>
                  prev.map((user) =>
                    user.user_id === payload.new.user_id ? payload.new : user
                  )
                );
              } else if (payload.eventType === "DELETE") {
                setFarmerUsers((prev) =>
                  prev.filter((user) => user.user_id !== payload.old.user_id)
                );
              }
            }
          )
          .subscribe((status: any) => {
            if (status !== "SUBSCRIBED") {
              // console.error("Error subscribing to channel:", status);
            }
          });

        // Cleanup the subscription
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error: any) {
        console.error("Error fetching or subscribing:", error);
        setIsLoadingFarmerUsers(false);
      }
    },
    []
  );

  useEffect(() => {
    // Fetch first page with default rowsPerPage
    fetchAndSubscribeFarmerUsers(10, 1);
  }, [fetchAndSubscribeFarmerUsers]);

  return {
    farmerUsers,
    isLoadingFarmerUsers,
    totalFarmerEntries,
    fetchAndSubscribeFarmerUsers,
  };
};

export default useFarmerUsers;
