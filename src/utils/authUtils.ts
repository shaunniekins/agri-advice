// src/utils/authUtils.ts

import { persistor } from "@/app/reduxUtils/store";
import { clearUser } from "@/app/reduxUtils/userSlice";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

export const useHandleLogout = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      dispatch(clearUser());

      // Purge persisted state from local storage
      persistor.purge();
      router.push("/signin");
    }
  };

  return handleLogout;
};
