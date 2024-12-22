import { supabase } from "@/utils/supabase";

// export const checkChatConnection = async (chat_connection_id: string) => {
//   try {
//     const response = await supabase
//       .from("ChatConnections")
//       .select("recipient_technician_id")
//       .eq("chat_connection_id", chat_connection_id)
//       .not("recipient_technician_id", "is", null);

//     if (response.error) {
//       throw response.error;
//     }

//     return response.data;
//   } catch (error: any) {
//     console.error("Error checking chat connection:", error);
//     return null;
//   }
// };

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

// Update receiver_technician_id in a chat connection
export const updateChatConnection = async (
  chat_connection_id: string,
  recipient_technician_id: string
) => {
  try {
    const response = await supabase
      .from("ChatConnections")
      .update({ recipient_technician_id })
      .eq("chat_connection_id", chat_connection_id);

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error updating chat connection:", error);
    return null;
  }
};

// Delete a chat connection
export const deleteChatConnection = async (
  user1Id: string,
  user2Id: string
) => {
  try {
    const response = await supabase
      .from("ChatConnections")
      .delete()
      .or(`sender_id.eq.${user1Id},receiver_id.eq.${user1Id}`)
      .or(`sender_id.eq.${user2Id},receiver_id.eq.${user2Id}`);

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting chat connection:", error);
    return null;
  }
};
