import { supabase } from "@/utils/supabase";

export const insertFeedback = async (newFeedback: any) => {
  try {
    const response = await supabase
      .from("Feedback")
      .insert(newFeedback)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error inserting feedback:", error);
    return null;
  }
};

export const updateFeedback = async (
  feedbackId: string,
  updatedFeedback: any
) => {
  try {
    const response = await supabase
      .from("Feedback")
      .update(updatedFeedback)
      .eq("feedback_id", feedbackId);

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error updating feedback:", error);
    return null;
  }
};

export const deleteFeedback = async (feedbackId: string) => {
  try {
    const response = await supabase
      .from("Feedback")
      .delete()
      .eq("feedback_id", feedbackId);

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error deleting feedback:", error);
    return null;
  }
};
