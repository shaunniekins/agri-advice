import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

const ONLINE_THRESHOLD = 30; // seconds

export const useOnlineStatus = (userId: string) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    // Clean up stale online statuses
    const cleanupStaleStatuses = async () => {
      const staleThreshold = new Date();
      staleThreshold.setSeconds(staleThreshold.getSeconds() - ONLINE_THRESHOLD);

      await supabase
        .from("UserOnlineStatus")
        .update({ is_online: false })
        .lt("last_seen", staleThreshold.toISOString());
    };

    // Update current user's status
    const updateUserStatus = async () => {
      await cleanupStaleStatuses();

      await supabase.from("UserOnlineStatus").upsert({
        user_id: userId,
        last_seen: new Date().toISOString(),
        is_online: true,
      });

      // Fetch all online users
      const { data: onlineUsersData } = await supabase
        .from("UserOnlineStatus")
        .select("user_id")
        .eq("is_online", true);

      if (onlineUsersData) {
        setOnlineUsers(new Set(onlineUsersData.map((user) => user.user_id)));
      }
    };

    // Initial status update
    updateUserStatus();

    // Set up interval to update status
    const intervalId = setInterval(updateUserStatus, 15000);

    // Subscribe to online status changes
    const channel = supabase
      .channel("online-users")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "UserOnlineStatus",
        },
        async (payload) => {
          await cleanupStaleStatuses();
          if (payload.new) {
            const { user_id, is_online } = payload.new as any;
            setOnlineUsers((prev) => {
              const updated = new Set(prev);
              if (is_online) {
                updated.add(user_id);
              } else {
                updated.delete(user_id);
              }
              return updated;
            });
          }
        }
      )
      .subscribe();

    // Clean up function
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);

      // Set user as offline when component unmounts
      supabase.from("UserOnlineStatus").upsert({
        user_id: userId,
        is_online: false,
      });
    };
  }, [userId]);

  const isUserOnline = (checkUserId: string) => {
    return onlineUsers.has(checkUserId);
  };

  return { isUserOnline };
};
