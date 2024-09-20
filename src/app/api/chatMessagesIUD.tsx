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
export const deleteChatMessage = async (
  user1Id: string,
  user2Id: string
) => {
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
