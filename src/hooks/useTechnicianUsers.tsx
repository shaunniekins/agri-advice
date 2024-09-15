import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";

const useTechnicianUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch initial data and subscribe to real-time changes
  const fetchAndSubscribe = useCallback(async () => {
    try {
      // Fetch the data from the TechnicianUsers table
      const response: any = await supabase
        .from("TechnicianUsers")
        .select("*")
        .order("created_at");

      if (response.error) {
        throw response.error;
      }

      setUsers(response.data);
      setIsLoading(false);

      // Subscribe to real-time changes
      const channel: any = supabase
        .channel("technician_users")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "TechnicianUsers",
          },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              setUsers((prev) => [...prev, payload.new]);
            } else if (payload.eventType === "UPDATE") {
              setUsers((prev) =>
                prev.map((user) =>
                  user.user_id === payload.new.user_id ? payload.new : user
                )
              );
            } else if (payload.eventType === "DELETE") {
              setUsers((prev) =>
                prev.filter((user) => user.user_id !== payload.old.user_id)
              );
            }
          }
        )
        .subscribe((status: any) => {
          if (status !== "SUBSCRIBED") {
            console.error("Error subscribing to channel:", status);
          }
        });

      // Cleanup the subscription
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error: any) {
      console.error("Error fetching or subscribing:", error);
      setIsLoading(false);
    }
  }, []);

  // Function to insert a new user
  const insertUser = useCallback(async (newUser: any) => {
    try {
      const { data, error }: any = await supabase
        .from("TechnicianUsers")
        .insert(newUser)
        .select();

      if (error) {
        throw error;
      }

      setUsers((prev) => [...prev, ...data]);
    } catch (error: any) {
      console.error("Error inserting user:", error);
    }
  }, []);

  // Function to update a user
  const updateUser = useCallback(async (updatedUser: any) => {
    try {
      const { data, error }: any = await supabase
        .from("TechnicianUsers")
        .update(updatedUser)
        .eq("user_id", updatedUser.user_id)
        .select();

      if (error) {
        throw error;
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === updatedUser.user_id ? data[0] : user
        )
      );
    } catch (error: any) {
      console.error("Error updating user:", error);
    }
  }, []);

  // Function to delete a user
  const deleteUser = useCallback(async (user_id: any) => {
    try {
      const { error }: any = await supabase
        .from("TechnicianUsers")
        .delete()
        .eq("user_id", user_id);

      if (error) {
        throw error;
      }

      setUsers((prev) => prev.filter((user) => user.user_id !== user_id));
    } catch (error: any) {
      console.error("Error deleting user:", error);
    }
  }, []);

  useEffect(() => {
    fetchAndSubscribe();
  }, [fetchAndSubscribe]);

  return { users, isLoading, insertUser, updateUser, deleteUser };
};

export default useTechnicianUsers;
