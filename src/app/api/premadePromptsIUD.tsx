import { supabase } from "@/utils/supabase";

// suggested prompt structure
export const insertPremadePrompt = async (newPrompt: any) => {
  try {
    const response = await supabase
      .from("PremadePrompts")
      .insert(newPrompt)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error inserting premade prompt:", error);
    return null;
  }
};

export const updatePremadePrompt = async (
  promptId: string,
  updatedQuery: any
) => {
  try {
    const response = await supabase
      .from("PremadePrompts")
      .update(updatedQuery)
      .eq("prompt_id", promptId);

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error updating prompt:", error);
    return null;
  }
};

export const deletePremadePrompt = async (promptId: string) => {
  try {
    const response = await supabase
      .from("PremadePrompts")
      .delete()
      .eq("prompt_id", promptId);

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error deleting prompt:", error);
    return null;
  }
};
