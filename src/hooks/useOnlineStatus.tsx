import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";

const ONLINE_THRESHOLD = 30; // Reduced to 30 seconds for more responsive status changes
const UPDATE_INTERVAL = 15000; // Reduced to 15 seconds for more frequent updates
const POLL_INTERVAL = 10000; // Poll online users every 10 seconds

// Get the Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    if (!userId) return;

    // Update only current user's status
    const updateCurrentUserStatus = async () => {
      try {
        // Don't update if we're in the process of unmounting
        if (unmountingRef.current) return;

        // Only update if user has been active recently (within the last minute)
        const isRecentlyActive = Date.now() - lastActivityRef.current < 60000;

        await supabase.from("UserOnlineStatus").upsert({
          user_id: userId,
          last_seen: new Date().toISOString(),
          is_online: isRecentlyActive, // Set to false if inactive for a while
        });
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };

    // Function to set user as offline
    const setUserOffline = async () => {
      try {
        await supabase.from("UserOnlineStatus").upsert({
          user_id: userId,
          last_seen: new Date().toISOString(),
          is_online: false,
        });
      } catch (err) {
        console.error("Error setting offline status:", err);
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
        // Set user as offline when tab is hidden
        setUserOffline();
      } else if (document.visibilityState === "visible") {
        // Set user as online when tab becomes visible again
        updateCurrentUserStatus();
        fetchOnlineUsers(); // Refresh online users when tab becomes visible
      }
    };

    // Handle beforeunload event
    const handleBeforeUnload = () => {
      // Set user as offline when page is being unloaded
      unmountingRef.current = true;

      // Use navigator.sendBeacon for more reliable async network requests during page unload
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
        // Fallback for browsers that don't support sendBeacon
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
          console.error("Failed to send offline status:", e);
        }
      }
    };

    // Initial status update
    const initializeStatus = async () => {
      await updateCurrentUserStatus();
      await fetchOnlineUsers();
    };

    initializeStatus();

    // Set up interval for status updates
    const updateIntervalId = setInterval(async () => {
      if (!unmountingRef.current) {
        await updateCurrentUserStatus();
        await cleanupStaleStatuses();
      }
    }, UPDATE_INTERVAL);

    // Set up separate polling interval for fetching online users
    const pollIntervalId = setInterval(async () => {
      if (!unmountingRef.current) {
        await fetchOnlineUsers();
      }
    }, POLL_INTERVAL);

    // Add event listeners for visibility and page unload
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload); // For iOS

    // Add fallback for mobile devices
    window.addEventListener("blur", setUserOffline);

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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to online status changes");
        }
      });

    // Clean up function
    return () => {
      // Mark that we're unmounting to prevent further updates
      unmountingRef.current = true;

      clearInterval(updateIntervalId);
      clearInterval(pollIntervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      window.removeEventListener("blur", setUserOffline);

      try {
        // Unsubscribe from the channel
        supabase.removeChannel(channel);

        // Set user as offline
        setUserOffline();
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
