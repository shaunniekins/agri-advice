import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useUsers = (
  rowsPerPage: number,
  currentPage: number,
  userType: string,
  filter?: string
) => {
  const [usersData, setUsersData] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [totalUserEntries, setTotalUserEntries] = useState<number>(0);

  const fetchAndSubscribeUsers = useCallback(async () => {
    if (!userType) return;

    const offset = (currentPage - 1) * rowsPerPage;

    try {
      let query = supabase
        .from("ViewUsers")
        .select("*", { count: "exact" })
        .range(offset, offset + rowsPerPage - 1);

      if (userType) {
        query = query.eq("user_type", userType);

        if (filter && userType === "farmer") {
          query = query.eq("account_status", filter);
        }
      }

      const response: PostgrestResponse<any> = await query;

      if (response.error) {
        throw response.error;
      }

      setUsersData(response.data || []);
      setTotalUserEntries(response.count || 0);
      setIsLoadingUsers(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching users:", err.message);
      } else {
        console.error("An unknown error occurred while fetching users");
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }, [rowsPerPage, currentPage, userType, filter]);

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
          if (payload.eventType === "INSERT") {
            setUsersData((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setUsersData((prev) =>
              prev.map((user) =>
                user.user_id === payload.new.user_id ? payload.new : user
              )
            );
          } else if (payload.eventType === "DELETE") {
            setUsersData((prev) =>
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchAndSubscribeUsers();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchAndSubscribeUsers, subscribeToChanges]);

  return {
    usersData,
    isLoadingUsers,
    totalUserEntries,
    fetchAndSubscribeUsers,
  };
};

export default useUsers;
