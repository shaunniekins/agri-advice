"use client";

import { Button } from "@nextui-org/react";
import { usePathname, useRouter } from "next/navigation";
import {
  FaTachometerAlt,
  FaComments,
  FaUsers,
  FaCog,
  FaChartBar,
  FaBars,
  FaSignOutAlt,
  FaClipboardCheck,
} from "react-icons/fa";
import classNames from "classnames";
import { useHandleLogout } from "@/utils/authUtils";
import { useEffect } from "react";

interface AdminSidebarComponentProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
}

const AdminSidebarComponent = ({
  isSidebarOpen,
  setIsSidebarOpen,
  setIsLoading,
}: AdminSidebarComponentProps) => {
  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    // { path: "/admin/monitor", label: "Monitor Chats", icon: <FaComments /> },
    { path: "/admin/users", label: "Users", icon: <FaUsers /> },
    { path: "/admin/remarks", label: "Remarks", icon: <FaClipboardCheck /> }, // Add remarks menu item
    { path: "/admin/settings", label: "Settings", icon: <FaCog /> },
    { path: "/admin/report", label: "Report", icon: <FaChartBar /> },
  ];

  const handleLogout = useHandleLogout();

  const onLogoutClick = () => {
    setIsLoading(true);
    handleLogout();
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setIsSidebarOpen]);

  return (
    <div className="bg-[#007057] text-white h-full w-full flex flex-col justify-center select-none relative">
      <h1 className="hidden lg:block absolute top-28 left-1/2 transform -translate-x-1/2 font-semibold text-3xl">
        AgriAdvice
      </h1>
      <h1 className="lg:hidden absolute top-3 left-5 text-xl font-semibold">
        AgriAdvice
      </h1>
      <button
        className="lg:hidden absolute top-3 right-5 text-xl"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <FaBars />
      </button>
      <ul className="flex flex-col py-5 pl-5">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            path={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </ul>
      <Button
        color={"danger"}
        startContent={<FaSignOutAlt />}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
        onClick={onLogoutClick}
      >
        Logout
      </Button>
    </div>
  );
};

export default AdminSidebarComponent;

const NavItem = ({
  path,
  label,
  icon,
}: {
  path: string;
  label: string;
  icon: JSX.Element;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = () => {
    router.push(path);
  };

  const isActive = pathname.startsWith(path);

  return (
    <li
      onClick={handleNavigation}
      className={classNames(
        "flex items-center gap-5 py-5 px-5 rounded-l-3xl lg:text-xl cursor-pointer",
        {
          // bg-green-900
          "bg-[#F4FFFC] text-black": isActive,
        }
      )}
    >
      <span className="text-xl lg:text-2xl">{icon}</span>
      <span>{label}</span>
    </li>
  );
};
