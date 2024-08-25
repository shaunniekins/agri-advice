// src/app/farmer/page.tsx

"use client";

import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

export default function FarmerPage() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      router.push("/signin");
    }
  };

  return (
    <>
      <div>Farmer Page</div>
      <button onClick={handleLogout}>Logout</button>
    </>
  );
}
