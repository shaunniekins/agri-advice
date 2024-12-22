import { supabase } from "@/utils/supabase";

export const insertCategory = async (newCategory: any) => {
  try {
    const response = await supabase
      .from("PromptCategory")
      .insert(newCategory)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error inserting category:", error);
    return null;
  }
};

export const deleteCategory = async (category_name: string) => {
  try {
    const response = await supabase
      .from("PromptCategory")
      .delete()
      .eq("category_name", category_name)
      .select();

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return null;
  }
};
