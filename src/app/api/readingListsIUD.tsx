import { supabase } from "@/utils/supabase";

const formatFileName = (fileName: string): string => {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const insertReadingList = async (
  fileName: string,
  bucketName: string,
  listOrder: number,
  fileData: any
) => {
  try {
    const newFileName = formatFileName(fileName);
    let funcPublicUrl = "";
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`public/${newFileName}`, fileData);

    if (data && !error) {
      const { publicUrl } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path).data;

      funcPublicUrl = publicUrl;
    }

    if (error) {
      alert("Error uploading file: " + error.message);
      throw error;
    }

    const newReadingList = {
      file_name: fileName,
      file_url: funcPublicUrl,
      list_order: listOrder,
    };

    const response = await supabase
      .from("ReadingLists")
      .insert(newReadingList)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error inserting reading list:", error);
    return null;
  }
};

export const updateReadingList = async (
  listId: string,
  fileName: string,
  bucketName: string,
  updatedReadingList: any
) => {
  try {
    const newFileName = formatFileName(fileName);

    // Fetch the current file path
    const { data: currentData, error: currentError } = await supabase
      .from("ReadingLists")
      .select("file_url")
      .eq("list_id", listId)
      .single();

    if (currentError) {
      alert("Error fetching current file path: " + currentError.message);
      throw currentError;
    }

    const currentFilePath = currentData.file_url.split("/").pop();

    // Move the file to the new name
    const { data: moveData, error: moveError } = await supabase.storage
      .from(bucketName)
      .move(`public/${currentFilePath}`, `public/${newFileName}`);

    if (moveError) {
      alert("Error moving file: " + moveError.message);
      throw moveError;
    }

    // Get the new public URL
    const { publicUrl } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`public/${newFileName}`).data;

    // Update the reading list with the new file name and URL
    const updatedReadingListWithFile = {
      ...updatedReadingList,
      file_name: fileName,
      file_url: publicUrl,
    };

    const response = await supabase
      .from("ReadingLists")
      .update(updatedReadingListWithFile)
      .eq("list_id", listId)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response;
  } catch (error: any) {
    console.error("Error updating reading list:", error);
    return null;
  }
};

export const deleteReadingList = async (
  fileUrl: string,
  bucketName: string,
  listId: string
) => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([`public/${fileUrl}`]);

    if (error) {
      console.error("Error deleting image:", error.message);
      return;
    }

    const response = await supabase
      .from("ReadingLists")
      .delete()
      .eq("list_id", listId);

    if (response.error) {
      throw response.error;
    }

    // return response;
  } catch (error: any) {
    console.error("Error deleting reading list:", error);
    return null;
  }
};
