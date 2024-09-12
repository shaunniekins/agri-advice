"use client";

import { useHandleLogout } from "@/utils/authUtils";

const AdminHeaderComponent = () => {
  const handleLogout = useHandleLogout();

  return (
    <div className="bg-red-300 custom-w-padding flex justify-between">
      <div>admin header</div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default AdminHeaderComponent;
