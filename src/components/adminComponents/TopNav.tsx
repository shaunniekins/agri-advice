"use client";

import { usePathname, useRouter } from "next/navigation";
import classNames from "classnames";

const NavItem = ({ path, label }: { path: string; label: string }) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = () => {
    router.push(path);
  };

  const isActive = pathname.startsWith(path);

  return (
    <li
      onClick={handleNavigation}
      className={classNames({
        "text-purple-800 font-semibold": isActive,
      })}
    >
      {label}
    </li>
  );
};

const TopNavComponent = () => {
  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/chats", label: "Chats" },
    { path: "/admin/users", label: "Users" },
    { path: "/admin/settings", label: "Settings" },
    { path: "/admin/report", label: "Report" },
  ];

  return (
    <div className="bg-blue-300 custom-w-padding">
      <ul className="flex gap-3">
        {navItems.map((item) => (
          <NavItem key={item.path} path={item.path} label={item.label} />
        ))}
      </ul>
    </div>
  );
};

export default TopNavComponent;
