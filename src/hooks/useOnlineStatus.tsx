import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";

// Define typed interface for presence state
interface PresenceState {
  user_id: string;
  last_active_at?: number; // Keep last_active_at if you want to track activity time
}

export const useOnlineStatus = (userId: string) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const unmountingRef = useRef(false);
  const channelRef = useRef<any>(null);

  // Keep activity tracking if desired, but it won't directly drive presence updates anymore
  useEffect(() => {
    if (!userId) return;

    const updateLastActivity = () => {
      // Optionally update presence state with new timestamp when user is active
      // This might be useful if you want other clients to see the last active time,
      // but it's not strictly required for basic online/offline status.
    };

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
      return;
    }

    unmountingRef.current = false;

    // Setup presence channel using Supabase Realtime
    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: userId, // Unique key for this client instance
        },
      },
    });
    channelRef.current = channel; // Store channel reference immediately

    // Handle presence state changes
    const handlePresenceSync = () => {
      if (unmountingRef.current) return; // Avoid state updates during unmount
      try {
        const presenceState = channelRef.current.presenceState();
        const newOnlineUsers = new Set<string>();

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

        setOnlineUsers(newOnlineUsers);
      } catch (error) {
        console.error("Error handling presence sync:", error);
      }
    };

    // Subscribe to presence events
    channel
      .on("presence", { event: "sync" }, handlePresenceSync)
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        handlePresenceSync();
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        handlePresenceSync();
      })
      .subscribe(async (status) => {
        if (unmountingRef.current) return; // Prevent actions if unmounting started

        if (status === "SUBSCRIBED") {
          // Track presence for current user *once* on successful subscription
          try {
            const trackStatus = await channelRef.current.track({
              user_id: userId,
              last_active_at: Date.now(), // Include timestamp if needed
            });

            handlePresenceSync();
          } catch (error) {
            console.error(`Error tracking presence for ${userId}:`, error);
          }
        } else if (status === "CHANNEL_ERROR") {
          console.error(
            `Failed to subscribe to presence channel for ${userId}. Status: ${status}`
          );
        } else if (status === "TIMED_OUT") {
          console.warn(
            `Presence channel subscription timed out for ${userId}.`
          );
        } else if (status === "CLOSED") {
          console.warn(`Presence channel closed for ${userId}.`);
        }
      });

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (unmountingRef.current) return;
      if (document.visibilityState === "visible" && channelRef.current) {
        channelRef.current
          .track({
            user_id: userId,
            last_active_at: Date.now(),
          })
          .catch((error: any) =>
            console.error(
              "Error tracking presence on visibility change:",
              error
            )
          );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up function
    return () => {
      unmountingRef.current = true; // Signal that unmounting has started

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (channelRef.current) {
        const currentChannel = channelRef.current; // Capture ref
        channelRef.current = null; // Clear ref

        const cleanup = async () => {
          try {
            const untrackStatus = await currentChannel.untrack();
          } catch (err) {
            console.error(`Error untracking presence for ${userId}:`, err);
          } finally {
            try {
              const removeStatus = await supabase.removeChannel(currentChannel);
            } catch (removeErr) {
              console.error(`Error removing channel for ${userId}:`, removeErr);
            }
          }
        };
        cleanup();
      } else {
      }
    };
  }, [userId]);

  const isUserOnline = (checkUserId: string) => {
    if (!checkUserId) return false;
    return onlineUsers.has(checkUserId);
  };

  return { isUserOnline, onlineUsers };
};
