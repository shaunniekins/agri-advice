// src/app/technician/page.tsx

"use client";

import { useHandleLogout } from "@/utils/authUtils";

export default function TechnicianPage() {
  const handleLogout = useHandleLogout();

  return (
    <>
      <div>Technician Page</div>
      <button onClick={handleLogout}>Logout</button>
    </>
  );
}
