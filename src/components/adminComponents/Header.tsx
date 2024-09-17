"use client";

import { RootState } from "@/app/reduxUtils/store";
import { Avatar } from "@nextui-org/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBars } from "react-icons/fa";
import { useSelector } from "react-redux";

interface AdminHeaderComponentProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const AdminHeaderComponent = ({
  isSidebarOpen,
  setIsSidebarOpen,
}: AdminHeaderComponentProps) => {
  const pathname = usePathname();

  let display = "";
  if (pathname === "/admin/dashboard") {
    display = "Dashboard";
  } else if (pathname === "/admin/monitor") {
    display = "Monitor Chats";
  } else if (pathname === "/admin/users") {
    display = "Users";
  } else if (pathname === "/admin/settings") {
    display = "Settings";
  } else if (pathname === "/admin/report") {
    display = "Report";
  }

  const [initials, setInitials] = useState("");

  const user = useSelector((state: RootState) => state.user.user);

  useEffect(() => {
    if (user && user.user_metadata) {
      const { first_name, last_name } = user.user_metadata;
      const initials =
        first_name && last_name
          ? `${first_name[0].toUpperCase()}${last_name[0].toUpperCase()}`
          : "Admin";
      setInitials(initials);
    }
  }, [user]);

  return (
    <div className="w-full bg-[#007057] text-white flex justify-between items-center px-5">
      <button
        className="flex h-11 items-center gap-2"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <FaBars className="text-xl" />
        <div>{display}</div>
      </button>
      <div className="flex items-center gap-2">
        <Avatar
          size="sm"
          name={initials}
          showFallback
          // src="https://images.unsplash.com/broken"
        />
        <h4 className="text-sm">Hey, {initials}</h4>
      </div>
    </div>
  );
};

export default AdminHeaderComponent;
