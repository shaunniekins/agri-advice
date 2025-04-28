import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";

// Define typed interface for presence state
interface PresenceState {
  user_id: string;
  last_active_at?: number;
}

export const useOnlineStatus = (userId: string) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const unmountingRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());
  const channelRef = useRef<any>(null);
  const presenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity to determine if they're actually active
  useEffect(() => {
    if (!userId) return;

    const updateLastActivity = () => {
      lastActivityRef.current = Date.now();

      // Update presence state with new timestamp when user is active
      if (channelRef.current) {
        channelRef.current.track({
          user_id: userId,
          last_active_at: Date.now(),
        });
      }
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
    if (!userId) {
      console.log("useOnlineStatus: No userId provided, exiting.");
      return;
    }

    console.log(`useOnlineStatus: Initializing presence for userId: ${userId}`);
    unmountingRef.current = false;

    // Setup presence channel using Supabase Realtime
    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Handle presence state changes
    const handlePresenceSync = () => {
      try {
        const presenceState = channel.presenceState();

        const newOnlineUsers = new Set<string>();

        // Process all presence states from all users
        Object.keys(presenceState).forEach((presenceKey) => {
          const userStates = presenceState[
            presenceKey
          ] as unknown as PresenceState[];

          userStates.forEach((state) => {
            if (state.user_id) {
              newOnlineUsers.add(state.user_id);
            }
          });
        });

        console.log(`Presence sync: ${newOnlineUsers.size} users online`);
        setOnlineUsers(newOnlineUsers);
      } catch (error) {
        console.error("Error handling presence sync:", error);
      }
    };

    // Subscribe to presence events
    channelRef.current = channel
      .on("presence", { event: "sync" }, handlePresenceSync)
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log(`User ${key} joined with states:`, newPresences);
        handlePresenceSync(); // Refresh full state on joins
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log(`User ${key} left with states:`, leftPresences);
        handlePresenceSync(); // Refresh full state on leaves
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && !unmountingRef.current) {
          console.log(`Successfully subscribed to presence channel`);

          // Start tracking presence for current user
          await channel.track({
            user_id: userId,
            last_active_at: Date.now(),
          });

          // Setup periodic updates to keep presence alive
          const updatePresence = () => {
            if (!unmountingRef.current && channelRef.current) {
              channelRef.current.track({
                user_id: userId,
                last_active_at: Date.now(),
              });
            }
          };

          // Update presence every 30 seconds to keep it alive
          presenceTimeoutRef.current = setInterval(updatePresence, 30000);
        } else if (status === "CHANNEL_ERROR") {
          console.error("Failed to join presence channel");
        }
      });

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && channelRef.current) {
        // User is viewing the page again, update presence
        channelRef.current.track({
          user_id: userId,
          last_active_at: Date.now(),
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up function
    return () => {
      console.log(
        `useOnlineStatus: Cleaning up presence for userId: ${userId}`
      );
      unmountingRef.current = true;

      if (presenceTimeoutRef.current) {
        clearInterval(presenceTimeoutRef.current);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (channelRef.current) {
        // Try to untrack cleanly first
        try {
          channelRef.current
            .untrack()
            .then(() => {
              supabase.removeChannel(channelRef.current);
            })
            .catch((err: any) => {
              console.error("Error untracking presence:", err);
              // Still try to remove the channel even if untracking fails
              supabase.removeChannel(channelRef.current);
            });
        } catch (e) {
          console.error("Error during presence cleanup:", e);
          // Fallback: force remove channel
          supabase.removeChannel(channelRef.current);
        }
      }
    };
  }, [userId]);

  const isUserOnline = (checkUserId: string) => {
    if (!checkUserId) return false;
    return onlineUsers.has(checkUserId);
  };

  return { isUserOnline, onlineUsers };
};
