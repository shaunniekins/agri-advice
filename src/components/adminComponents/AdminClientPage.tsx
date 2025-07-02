"use client";

import AdminRemarks from "@/components/adminComponents/AdminRemarks";
import AdminDashboard from "@/components/adminComponents/Dashboard";
import AdminReportsComponent from "@/components/adminComponents/Reports";
import AdminSettings from "@/components/adminComponents/Settings";
import UserComponent from "@/components/adminComponents/Users";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdminClientPage() {
  const pathname = usePathname();
  const [display, setDisplay] = useState<string | JSX.Element>("");

  useEffect(() => {
    if (pathname.startsWith("/admin/monitor")) {
      setDisplay("Chats");
    } else if (pathname.startsWith("/admin/dashboard")) {
      setDisplay(<AdminDashboard />);
    } else if (pathname.startsWith("/admin/users")) {
      setDisplay(<UserComponent />);
    } else if (pathname.startsWith("/admin/settings")) {
      setDisplay(<AdminSettings />);
    } else if (pathname.startsWith("/admin/report")) {
      setDisplay(<AdminReportsComponent />);
    } else if (pathname.startsWith("/admin/remarks")) {
      setDisplay(<AdminRemarks />);
    } else {
      setDisplay("No page found");
    }
  }, [pathname]);

  return <div className="h-full w-full overflow-hidden">{display}</div>;
}
