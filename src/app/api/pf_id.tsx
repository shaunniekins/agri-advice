import { supabase } from "@/utils/supabase";

const BUCKET_NAME = "pf_id_files";

export const insertPfIDFiles = async (userId: string, fileData: any) => {
  try {
    let funcPublicUrl = "";
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`public/${userId}`, fileData);

    if (error) console.error("Error inserting id:", error);
    if (data && !error) {
      const { publicUrl } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path).data;
      funcPublicUrl = publicUrl;
    }

    return funcPublicUrl;
  } catch (error: any) {
    console.error("Error inserting id:", error);
    return null;
  }
};
