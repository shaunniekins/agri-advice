import { supabase } from "@/utils/supabase";

export const insertSuggestedLink = async (newLink: any) => {
  try {
    const response = await supabase.from("SuggestedLinks").insert(newLink);

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error inserting suggested link:", error);
    return null;
  }
};

export const updateSuggestedLink = async (linkId: string, updatedLink: any) => {
  try {
    const response = await supabase
      .from("SuggestedLinks")
      .update(updatedLink)
      .eq("link_id", linkId);

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error updating suggested link:", error);
    return null;
  }
};

export const deleteSuggestedLink = async (linkId: string) => {
  try {
    const response = await supabase
      .from("SuggestedLinks")
      .delete()
      .eq("link_id", linkId);

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error deleting suggested link:", error);
    return null;
  }
};
