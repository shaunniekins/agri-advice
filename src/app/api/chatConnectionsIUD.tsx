import { supabase } from "@/utils/supabase";

// Insert a new chat message
export const insertChatConnection = async (newChat: any) => {
  try {
    const response = await supabase
      .from("ChatConnections")
      .insert(newChat)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error inserting chat connection:", error);
    return null;
  }
};

// Delete a chat connection
export const deleteChatConnection = async (chatConnectionDd: any) => {
  try {
    const response = await supabase
      .from("ChatConnections")
      .delete()
      .eq("chat_connection_id", chatConnectionDd);

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting chat connection:", error);
    return null;
  }
};
