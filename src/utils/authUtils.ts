// src/utils/authUtils.ts

import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

export const useHandleLogout = () => {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      router.push("/signin");
    }
  };

  return handleLogout;
};
