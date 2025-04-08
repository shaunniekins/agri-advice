import { supabase } from "@/utils/supabase";

// Insert a new chat message
export const insertChatMessage = async (newMessage: any) => {
  try {
    const response = await supabase
      .from("ChatMessages")
      .insert(newMessage)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error inserting chat message:", error);
    return null;
  }
};

// Update an existing chat message
export const updateChatMessage = async (
  chatMessageId: number,
  updatedMessage: any
) => {
  try {
    const response = await supabase
      .from("ChatMessages")
      .update(updatedMessage)
      .eq("chat_message_id", chatMessageId)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error updating chat message:", error);
    return null;
  }
};

// Delete a chat message
export const deleteChatMessage = async (user1Id: string, user2Id: string) => {
  try {
    const response = await supabase
      .from("ChatMessages")
      .delete()
      .or(`sender_id.eq.${user1Id},receiver_id.eq.${user1Id}`)
      .or(`sender_id.eq.${user2Id},receiver_id.eq.${user2Id}`);

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting chat message:", error);
    return null;
  }
};

export const deleteSpecificChatMessage = async (chatMessageId: number) => {
  try {
    const response = await supabase
      .from("ChatMessages")
      .delete()
      .eq("chat_message_id", chatMessageId);

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting chat message:", error);
    return null;
  }
};

export const deleteSpecificChatMessagesBasedOnSenderIdAndNonAiChat = async (
  technicianSenderId: string
) => {
  try {
    const response = await supabase
      .from("ChatMessages")
      .delete()
      .eq("sender_id", technicianSenderId)
      .eq("is_ai", false);

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting chat message:", error);
    return null;
  }
};

export const updateSenderMessagesReadStatus = async (
  chatConnectionId: string
) => {
  try {
    const { data, error } = await supabase
      .from("ChatMessages")
      .update({ is_sender_read: true })
      .eq("chat_connection_id", chatConnectionId)
      .not("is_sender_read", "eq", true); // Only update unread messages

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error("Error updating messages read status:", error);
    return null;
  }
};

export const updateReceiverMessagesReadStatus = async (
  chatConnectionId: string,
  receiverId: string // Add receiverId parameter
) => {
  try {
    const { data, error } = await supabase
      .from("ChatMessages")
      .update({ is_receiver_read: true })
      .eq("chat_connection_id", chatConnectionId)
      .eq("receiver_id", receiverId) // Only mark messages where this user is the receiver
      .not("is_receiver_read", "eq", true); // Only update unread messages

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error("Error updating messages read status:", error);
    return null;
  }
};

// New function to mark specific message as read
export const markSingleMessageAsRead = async (
  messageId: number,
  isReceiver: boolean
) => {
  try {
    const updateField = isReceiver
      ? { is_receiver_read: true }
      : { is_sender_read: true };

    const { data, error } = await supabase
      .from("ChatMessages")
      .update(updateField)
      .eq("chat_message_id", messageId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error("Error updating message read status:", error);
    return null;
  }
};
