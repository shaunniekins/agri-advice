import { useEffect } from "react";
import { supabase } from "@/utils/supabase";
import {
  unarchiveChatConnectionForFarmer,
  unarchiveChatConnectionForTechnician,
} from "@/app/api/chatConnectionsIUD";

/**
 * Hook to automatically unarchive chats when new messages arrive
 */
const useAutoUnarchive = (userId: string, userType: string) => {
  useEffect(() => {
    if (!userId || !userType) return;

    // Create a subscription to listen for new messages
    const channel = supabase
      .channel("auto-unarchive-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ChatMessages",
        },
        async (payload) => {
          const chatConnectionId = payload.new.chat_connection_id;
          const isMessageSender = payload.new.sender_id === userId;

          // If the current user is the sender, no need to unarchive as they are already
          // interacting with the chat. Only unarchive when receiving a new message.
          if (!isMessageSender && chatConnectionId) {
            try {
              if (userType === "farmer") {
                await unarchiveChatConnectionForFarmer(chatConnectionId);
              } else if (userType === "technician") {
                await unarchiveChatConnectionForTechnician(chatConnectionId);
              }
              // We could add a refresh function here, but the existing subscription in
              // useChatHeaders should already handle refreshing the UI
            } catch (error) {
              console.error("Error unarchiving chat:", error);
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userType]);

  // No return values needed - this hook just handles side effects
  return null;
};

export default useAutoUnarchive;
