import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";

const ONLINE_THRESHOLD = 30; // Reduced to 30 seconds for more responsive status changes
const UPDATE_INTERVAL = 15000; // Reduced to 15 seconds for more frequent updates

// Get the Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Define an interface for the expected shape of the status record
interface UserStatusRecord {
  user_id: string;
  is_online: boolean;
  // Add other potential fields if needed, e.g., last_seen
}

export const useOnlineStatus = (userId: string) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const lastCleanupRef = useRef<number>(0);
  const unmountingRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Track user activity to determine if they're actually active
  useEffect(() => {
    if (!userId) return;

    const updateLastActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track various user activities
    window.addEventListener("mousemove", updateLastActivity);
    window.addEventListener("keydown", updateLastActivity);
    window.addEventListener("click", updateLastActivity);
    window.addEventListener("touchstart", updateLastActivity);
    window.addEventListener("scroll", updateLastActivity);

    return () => {
      window.removeEventListener("mousemove", updateLastActivity);
      window.removeEventListener("keydown", updateLastActivity);
      window.removeEventListener("click", updateLastActivity);
      window.removeEventListener("touchstart", updateLastActivity);
      window.removeEventListener("scroll", updateLastActivity);
    };
  }, [userId]);

  useEffect(() => {
    // Log the userId when the effect runs
    console.log(`useOnlineStatus: Initializing for userId: ${userId}`);

    if (!userId) {
      console.log("useOnlineStatus: No userId provided, exiting.");
      return;
    }

    // Update only current user's status
    const updateCurrentUserStatus = async () => {
      try {
        if (unmountingRef.current) return;

        // Reinstate the activity check
        const isRecentlyActive = Date.now() - lastActivityRef.current < 60000; // e.g., active within last 60 seconds

        const updateData = {
          user_id: userId,
          last_seen: new Date().toISOString(),
          is_online: isRecentlyActive, // Use activity status
        };
        console.log(
          `useOnlineStatus: Attempting to upsert status for ${userId}:`,
          updateData
        ); // Log before upsert
        const { error } = await supabase
          .from("UserOnlineStatus")
          .upsert(updateData);

        if (error) {
          console.error(
            `Failed to upsert online status for ${userId}:`,
            JSON.stringify(error, null, 2)
          );
        } else {
          console.log(
            `useOnlineStatus: Successfully upserted status for ${userId} (is_online: ${isRecentlyActive})`
          ); // Log success
        }
      } catch (error) {
        console.error("Unexpected error in updateCurrentUserStatus:", error);
      }
    };

    // Function to set user as offline
    const setUserOffline = async () => {
      try {
        const updateData = {
          user_id: userId,
          last_seen: new Date().toISOString(),
          is_online: false,
        };
        console.log(`useOnlineStatus: Attempting to set offline for ${userId}`); // Log attempt
        const { error } = await supabase
          .from("UserOnlineStatus")
          .upsert(updateData);

        if (error) {
          console.error(
            `Failed to set offline status for ${userId}:`,
            JSON.stringify(error, null, 2)
          );
        } else {
          console.log(
            `useOnlineStatus: Successfully set offline for ${userId}`
          );
        }
      } catch (err) {
        console.error("Unexpected error in setUserOffline:", err);
      }
    };

    // Fetch all online users without cleaning up
    const fetchOnlineUsers = async () => {
      try {
        const { data: onlineUsersData } = await supabase
          .from("UserOnlineStatus")
          .select("user_id")
          .eq("is_online", true);

        if (onlineUsersData) {
          setOnlineUsers(new Set(onlineUsersData.map((user) => user.user_id)));
          console.log(
            "Fetched initial/visible online users:",
            onlineUsersData.map((u) => u.user_id)
          );
        }
      } catch (error) {
        console.error("Failed to fetch online users:", error);
      }
    };

    // Clean up stale online statuses - only performed occasionally
    const cleanupStaleStatuses = async () => {
      const now = Date.now();
      // Only perform cleanup every 1 minute (reduced from 5 minutes)
      if (now - lastCleanupRef.current < 60000) return;

      try {
        const staleThreshold = new Date();
        staleThreshold.setSeconds(
          staleThreshold.getSeconds() - ONLINE_THRESHOLD
        );

        await supabase
          .from("UserOnlineStatus")
          .update({ is_online: false })
          .lt("last_seen", staleThreshold.toISOString());

        lastCleanupRef.current = now;
      } catch (error) {
        console.error("Failed to clean up stale statuses:", error);
      }
    };

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Re-enable setUserOffline
        setUserOffline();
        console.log(
          "useOnlineStatus: Visibility hidden, called setUserOffline"
        );
      } else if (document.visibilityState === "visible") {
        // Set user as online when tab becomes visible again
        updateCurrentUserStatus().then(() => {
          if (!unmountingRef.current) {
            fetchOnlineUsers();
          }
        });
        console.log(
          "useOnlineStatus: Visibility visible, called updateCurrentUserStatus then fetchOnlineUsers"
        );
      }
    };

    // Handle beforeunload event
    const handleBeforeUnload = () => {
      // Set user as offline when page is being unloaded
      unmountingRef.current = true;

      // Re-enable setUserOffline logic (sendBeacon/XHR)
      console.log("useOnlineStatus: Before unload, attempting setUserOffline");
      if (navigator.sendBeacon && supabaseUrl) {
        const headers = {
          "Content-Type": "application/json",
          apikey: supabaseKey || "",
          Prefer: "return=minimal",
        };
        const data = JSON.stringify({
          user_id: userId,
          last_seen: new Date().toISOString(),
          is_online: false,
        });
        navigator.sendBeacon(
          `${supabaseUrl}/rest/v1/UserOnlineStatus?apikey=${encodeURIComponent(
            supabaseKey || ""
          )}`,
          new Blob([data], { type: "application/json" })
        );
      } else {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${supabaseUrl}/rest/v1/UserOnlineStatus`, false);
          xhr.setRequestHeader("apikey", supabaseKey || "");
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.setRequestHeader("Prefer", "return=minimal");
          xhr.send(
            JSON.stringify({
              user_id: userId,
              last_seen: new Date().toISOString(),
              is_online: false,
            })
          );
        } catch (e) {
          console.error("Failed to send offline status via XHR:", e);
        }
      }
    };

    // Initial status update
    const initializeStatus = async () => {
      // Immediately try to set status
      await updateCurrentUserStatus();
      // Add a small delay before fetching, allowing the upsert to potentially complete
      setTimeout(() => {
        if (!unmountingRef.current) {
          fetchOnlineUsers();
        }
      }, 500); // 500ms delay
    };

    initializeStatus();

    // Set up interval for status updates
    const updateIntervalId = setInterval(async () => {
      if (!unmountingRef.current) {
        await updateCurrentUserStatus();
        // Temporarily comment out the cleanup call
        // await cleanupStaleStatuses();
        console.log(
          `useOnlineStatus: Skipped cleanupStaleStatuses in interval for ${userId}`
        );
      }
    }, UPDATE_INTERVAL);

    // Add event listeners for visibility and page unload
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload); // For iOS

    console.log("useOnlineStatus: Skipping blur listener attachment");

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
        (payload) => {
          console.log("Received online status change:", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          setOnlineUsers((prev) => {
            const updated = new Set(prev); // Create a new Set from previous state

            if (eventType === "INSERT" || eventType === "UPDATE") {
              const record = newRecord as Partial<UserStatusRecord>;
              if (record && record.user_id) {
                const user_id = record.user_id;
                const is_online = record.is_online ?? false;
                console.log(
                  `Handling ${eventType} for ${user_id}. Is Online: ${is_online}`
                );
                if (is_online) {
                  updated.add(user_id);
                } else {
                  updated.delete(user_id);
                }
              }
            } else if (eventType === "DELETE") {
              const record = oldRecord as Partial<UserStatusRecord>;
              if (record && record.user_id) {
                console.log(`Handling DELETE for ${record.user_id}`);
                updated.delete(record.user_id);
              }
            }
            console.log("Updated onlineUsers set:", updated);
            // Always return the new set. React will handle optimizing re-renders.
            return updated;
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to online status changes");
          updateCurrentUserStatus().then(() => {
            if (!unmountingRef.current) {
              fetchOnlineUsers();
            }
          });
        } else {
          console.log("Subscription status:", status);
        }
      });

    // Clean up function
    return () => {
      // Mark that we're unmounting to prevent further updates
      unmountingRef.current = true;

      clearInterval(updateIntervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);

      try {
        // Unsubscribe from the channel
        supabase.removeChannel(channel);
        // Re-enable final setUserOffline call
        setUserOffline();
        console.log("useOnlineStatus: Cleanup, called final setUserOffline");
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    };
  }, [userId]);

  const isUserOnline = (checkUserId: string) => {
    if (!checkUserId) return false;
    return onlineUsers.has(checkUserId);
  };

  return { isUserOnline, onlineUsers };
};
