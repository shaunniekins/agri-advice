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

// Mark a chat connection as deleted for the farmer
export const markChatConnectionAsDeletedForFarmer = async (
  chat_connection_id: string
) => {
  try {
    const response = await supabase
      .from("ChatConnections")
      .update({ farmer_deleted: true })
      .eq("chat_connection_id", chat_connection_id);

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error(
      "Error marking chat connection as deleted for farmer:",
      error
    );
    return null;
  }
};

// Mark a chat connection as deleted for the technician
export const markChatConnectionAsDeletedForTechnician = async (
  chat_connection_id: string
) => {
  try {
    const response = await supabase
      .from("ChatConnections")
      .update({ technician_deleted: true })
      .eq("chat_connection_id", chat_connection_id);

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error(
      "Error marking chat connection as deleted for technician:",
      error
    );
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

// Clean up fully deleted chat connections (deleted by both parties)
export const cleanupFullyDeletedChats = async () => {
  try {
    // First get AI chats that have been deleted by farmers and have no active shared conversations
    const { data: deletedAIChats, error: findError } = await supabase
      .from("ChatConnections")
      .select("chat_connection_id")
      .eq("farmer_deleted", true)
      .is("parent_chat_connection_id", null)
      .is("recipient_technician_id", null);

    if (findError) {
      console.error("Error finding deleted AI chats:", findError);
      return null;
    }

    if (deletedAIChats && deletedAIChats.length > 0) {
      // For each deleted AI chat, check if it has any active shared conversations
      for (const chat of deletedAIChats) {
        const { data: sharedConvos, error: checkError } = await supabase
          .from("ChatConnections")
          .select("chat_connection_id, farmer_deleted, technician_deleted")
          .eq("parent_chat_connection_id", chat.chat_connection_id);

        if (checkError) {
          console.error("Error checking shared conversations:", checkError);
          continue;
        }

        // If all shared conversations are deleted by both parties, or there are no shared conversations
        const allSharedDeleted =
          !sharedConvos?.length ||
          sharedConvos.every(
            (convo) => convo.farmer_deleted && convo.technician_deleted
          );

        if (allSharedDeleted) {
          // Permanently delete the AI chat
          const { error: deleteError } = await supabase
            .from("ChatConnections")
            .delete()
            .eq("chat_connection_id", chat.chat_connection_id);

          if (deleteError) {
            console.error("Error deleting chat connection:", deleteError);
          }
        }
      }
    }

    // Check for shared chats that are deleted by both parties
    const { data: fullyDeletedShared, error: sharedError } = await supabase
      .from("ChatConnections")
      .select("chat_connection_id")
      .eq("farmer_deleted", true)
      .eq("technician_deleted", true)
      .not("parent_chat_connection_id", "is", null);

    if (sharedError) {
      console.error("Error finding fully deleted shared chats:", sharedError);
      return null;
    }

    if (fullyDeletedShared && fullyDeletedShared.length > 0) {
      // Delete these fully deleted shared chats
      const chatIds = fullyDeletedShared.map((chat) => chat.chat_connection_id);
      const { error: deleteError } = await supabase
        .from("ChatConnections")
        .delete()
        .in("chat_connection_id", chatIds);

      if (deleteError) {
        console.error(
          "Error deleting fully deleted shared chats:",
          deleteError
        );
      }
    }

    return true;
  } catch (error: any) {
    console.error("Error cleaning up fully deleted chats:", error);
    return null;
  }
};

// Check if a chat can be permanently deleted
export const canDeleteParentChat = async (chatConnectionId: string) => {
  try {
    // Check if this is a parent chat
    const { data: chat, error: chatError } = await supabase
      .from("ChatConnections")
      .select("parent_chat_connection_id")
      .eq("chat_connection_id", chatConnectionId)
      .single();

    if (chatError) {
      console.error("Error checking chat:", chatError);
      return false;
    }

    // If this is not a parent chat (has a parent itself), can always be deleted
    if (chat.parent_chat_connection_id) {
      return true;
    }

    // Check for child chats
    const { data: childChats, error: childError } = await supabase
      .from("ChatConnections")
      .select("chat_connection_id, farmer_deleted, technician_deleted")
      .eq("parent_chat_connection_id", chatConnectionId);

    if (childError) {
      console.error("Error checking child chats:", childError);
      return false;
    }

    // Can delete if there are no child chats or all child chats are deleted by both parties
    return (
      !childChats?.length ||
      childChats.every(
        (child) => child.farmer_deleted && child.technician_deleted
      )
    );
  } catch (error: any) {
    console.error("Error checking if chat can be deleted:", error);
    return false;
  }
};

// Mark chat as archived for farmer
export async function markChatConnectionAsArchivedForFarmer(
  chatConnectionId: string
) {
  try {
    const { data, error } = await supabase
      .from("ChatConnections")
      .update({ farmer_archived: true })
      .eq("chat_connection_id", chatConnectionId);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error archiving chat for farmer:", error);
    return { data: null, error };
  }
}

// Mark chat as archived for technician
export async function markChatConnectionAsArchivedForTechnician(
  chatConnectionId: string
) {
  try {
    const { data, error } = await supabase
      .from("ChatConnections")
      .update({ technician_archived: true })
      .eq("chat_connection_id", chatConnectionId);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error archiving chat for technician:", error);
    return { data: null, error };
  }
}

// Unarchive chat for farmer
export async function unarchiveChatConnectionForFarmer(
  chatConnectionId: string
) {
  try {
    const { data, error } = await supabase
      .from("ChatConnections")
      .update({ farmer_archived: false })
      .eq("chat_connection_id", chatConnectionId);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error unarchiving chat for farmer:", error);
    return { data: null, error };
  }
}

// Unarchive chat for technician
export async function unarchiveChatConnectionForTechnician(
  chatConnectionId: string
) {
  try {
    const { data, error } = await supabase
      .from("ChatConnections")
      .update({ technician_archived: false })
      .eq("chat_connection_id", chatConnectionId);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error unarchiving chat for technician:", error);
    return { data: null, error };
  }
}
