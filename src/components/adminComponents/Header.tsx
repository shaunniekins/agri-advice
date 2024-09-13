"use client";

import { Avatar } from "@nextui-org/react";
import { usePathname } from "next/navigation";
import { FaBars } from "react-icons/fa";

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
  } else if (pathname === "/admin/chats") {
    display = "Chats";
  } else if (pathname === "/admin/users") {
    display = "Users";
  } else if (pathname === "/admin/settings") {
    display = "Settings";
  } else if (pathname === "/admin/report") {
    display = "Report";
  }

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
          showFallback
          src="https://images.unsplash.com/broken"
        />
        <h4 className="text-sm">Hey, Junior</h4>
      </div>
    </div>
  );
};

export default AdminHeaderComponent;
