import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

// Hook to check if a chat session ID exists and listen for real-time deletion
const useChatSessionChecker = (chatConnectionId: string) => {
  const [exists, setExists] = useState(true); // Start assuming the session exists
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Function to check if the chat session ID exists in the database
  const checkChatSessionId = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ChatMessages")
        .select("chat_connection_id")
        .eq("chat_connection_id", chatConnectionId);

      if (error) {
        throw error;
      }

      setExists(data?.length > 0);
    } catch (err) {
      setError("Error checking chat session ID");
      setExists(false);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription to detect when the chat session is deleted
  const subscribeToDeletions = () => {
    const channel = supabase
      .channel("chat_session_changes")
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "ChatMessages",
          //   filter: `chat_connection_id=eq.${chatConnectionId}`,  // doesn't work
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (
            (newRecord as any).chat_message_id !==
            (oldRecord as any).chat_message_id
          ) {
            setExists(false);
          }
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.error("Error subscribing to deletions:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    if (chatConnectionId) {
      checkChatSessionId(); // Initial check
      const unsubscribe = subscribeToDeletions(); // Set up real-time listener

      return () => {
        unsubscribe(); // Cleanup subscription on component unmount
      };
    }
  }, [chatConnectionId]);

  // If the chat session no longer exists, redirect the user
  useEffect(() => {
    if (!exists && !loading) {
      router.push("/farmer/chat");
    }
  }, [exists, loading, router]);

  return { exists, loading, error };
};

export default useChatSessionChecker;
