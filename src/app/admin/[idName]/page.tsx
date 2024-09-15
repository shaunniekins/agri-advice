"use client";

import { usePathname } from "next/navigation";

export default function AdminSlugPage() {
  const pathname = usePathname();

  let display = `admin ${pathname} page`;

  if (pathname.startsWith("/admin/monitor")) {
    display = "Chats";
  } else if (pathname.startsWith("/admin/dashboard")) {
    display = "Hello user";
  } else {
    display = "No page found";
  }

  return <div>{display}</div>;
}

// "use client";

// import { usePathname } from "next/navigation";

// const ChatsComponent = () => <div>Chats</div>;
// const DashboardComponent = () => <div>Hello user</div>;
// const NotFoundComponent = () => <div>No page found</div>;

// export default function AdminSlugPage() {
//   const pathname = usePathname();

//   let ComponentToRender;

//   if (pathname.startsWith("/admin/chats")) {
//     ComponentToRender = ChatsComponent;
//   } else if (pathname.startsWith("/admin/dashboard")) {
//     ComponentToRender = DashboardComponent;
//   } else {
//     ComponentToRender = NotFoundComponent;
//   }

//   return <ComponentToRender />;
// }
