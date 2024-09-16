"use client";

import UserComponent from "@/components/adminComponents/Users";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdminSlugPage() {
  const pathname = usePathname();
  const [display, setDisplay] = useState<string | JSX.Element>("");

  useEffect(() => {
    if (pathname.startsWith("/admin/monitor")) {
      setDisplay("Chats");
    } else if (pathname.startsWith("/admin/dashboard")) {
      setDisplay("Hello user");
    } else if (pathname.startsWith("/admin/users")) {
      setDisplay(<UserComponent />);
    } else {
      setDisplay("No page found");
    }
  }, [pathname]);

  return <div className="h-full w-full">{display}</div>;
}

// "use client";

// import { usePathname } from "next/navigation";

// const ChatsComponent = () => <div>Chats</div>;
// const DashboardComponent = () => <div>Hello user</div>;
// const NotFoundComponent = () => <div>No page found</div>;

// export default function AdminSlugPage() {
//   const pathname = usePathname();

//   let ComponentToRender;

//   if (pathname.startsWith("/admin/chat")) {
//     ComponentToRender = ChatsComponent;
//   } else if (pathname.startsWith("/admin/dashboard")) {
//     ComponentToRender = DashboardComponent;
//   } else {
//     ComponentToRender = NotFoundComponent;
//   }

//   return <ComponentToRender />;
// }
