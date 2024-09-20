import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";

const useTechnicianUsers = () => {
  const [technicianUsers, setTechnicianUsers] = useState<any[]>([]);
  const [isLoadingTechnicianUsers, setIsLoadingTechnicianUsers] =
    useState<boolean>(true);
  const [totalTechnicianEntries, setTotalTechnicianEntries] =
    useState<number>(0);

  // Fetch initial data and subscribe to real-time changes
  const fetchAndSubscribeTechnicianUsers = useCallback(
    async (rowsPerPage: number, currentPage: number, statusFilter?: string) => {
      try {
        const offset = (currentPage - 1) * rowsPerPage;

        // Build the query
        let query = supabase
          .from("TechnicianUsers")
          .select("*", { count: "exact" }) // To get the total number of rows
          .order("created_at", { ascending: false })
          .range(offset, offset + rowsPerPage - 1);

        // Conditionally add the account_status filter
        if (statusFilter) {
          query = query.eq("account_status", statusFilter);
        }

        // Fetch the paginated data
        const { data, error, count } = await query;

        if (error) {
          throw error;
        }

        setTechnicianUsers(data);
        setTotalTechnicianEntries(count || 0); // Save total entries for pagination
        setIsLoadingTechnicianUsers(false);

        // Subscribe to real-time changes
        const channel: any = supabase
          .channel("technician_users_realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "TechnicianUsers",
            },
            (payload: any) => {
              setTechnicianUsers((prev) => {
                const { new: newUser, old: oldUser, eventType } = payload;

                // Handle INSERT
                if (eventType === "INSERT") {
                  if (newUser.account_status === statusFilter) {
                    // If the inserted user's account_status matches the filter, add them
                    return [...prev, newUser];
                  }
                }

                // Handle UPDATE
                else if (eventType === "UPDATE") {
                  if (newUser.account_status === statusFilter) {
                    // If account_status matches the filter, update the user
                    return prev.map((user) =>
                      user.user_id === newUser.user_id ? newUser : user
                    );
                  } else {
                    // If account_status does not match the filter, remove the user
                    return prev.filter(
                      (user) => user.user_id !== newUser.user_id
                    );
                  }
                }

                // Handle DELETE
                else if (eventType === "DELETE") {
                  // Remove the deleted user from the list
                  return prev.filter(
                    (user) => user.user_id !== oldUser.user_id
                  );
                }

                // Return the updated list
                return prev;
              });
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
        setIsLoadingTechnicianUsers(false);
      }
    },
    []
  );

  // Function to insert a new user
  const insertTechnicianUser = useCallback(async (newUser: any) => {
    try {
      const { data, error }: any = await supabase
        .from("TechnicianUsers")
        .insert(newUser)
        .select();

      if (error) {
        throw error;
      }

      setTechnicianUsers((prev) => [...prev, ...data]);
    } catch (error: any) {
      console.error("Error inserting user:", error);
    }
  }, []);

  // Function to update a user
  const updateTechnicianUser = useCallback(
    async (userId: number, updatedUser: any) => {
      try {
        const { data, error }: any = await supabase
          .from("TechnicianUsers")
          .update(updatedUser)
          .eq("user_id", userId)
          .select();

        if (error) {
          throw error;
        }

        setTechnicianUsers((prev) =>
          prev.map((user) =>
            user.user_id === updatedUser.user_id ? data[0] : user
          )
        );
      } catch (error: any) {
        console.error("Error updating user:", error);
      }
    },
    []
  );

  // Function to delete a user
  const deleteTechnicianUser = useCallback(async (user_id: any) => {
    try {
      const { error }: any = await supabase
        .from("TechnicianUsers")
        .delete()
        .eq("user_id", user_id);

      if (error) {
        throw error;
      }

      setTechnicianUsers((prev) =>
        prev.filter((user) => user.user_id !== user_id)
      );
    } catch (error: any) {
      console.error("Error deleting user:", error);
    }
  }, []);

  useEffect(() => {
    // Fetch first page with default rowsPerPage
    fetchAndSubscribeTechnicianUsers(10, 1);
  }, [fetchAndSubscribeTechnicianUsers]);

  return {
    technicianUsers,
    isLoadingTechnicianUsers,
    totalTechnicianEntries,
    fetchAndSubscribeTechnicianUsers,
    insertTechnicianUser,
    updateTechnicianUser,
    deleteTechnicianUser,
  };
};

export default useTechnicianUsers;
