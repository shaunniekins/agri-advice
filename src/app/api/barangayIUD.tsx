import { supabase } from "@/utils/supabase";

export const insertBarangay = async (newBarangay: any) => {
  try {
    const response = await supabase
      .from("Barangay")
      .insert(newBarangay)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error inserting barangay:", error);
    return null;
  }
};

export const deleteBarangay = async (barangay_name: string) => {
  try {
    const response = await supabase
      .from("Barangay")
      .delete()
      .eq("barangay_name", barangay_name)
      .select();

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting barangay:", error);
    return null;
  }
};
