"use client";

import AdminHeaderComponent from "@/components/adminComponents/Header";
import AdminSidebarComponent from "@/components/adminComponents/Sidebar";
import { Suspense, useEffect, useState } from "react";

export default function AdminSlugLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleContentClick = () => {
    if (window.innerWidth < 1024) {
      // 1024px is the breakpoint for 'lg' in Tailwind CSS
      setIsSidebarOpen(false);
    }
  };

  return (
    <body suppressHydrationWarning={true}>
      <div
        className={`h-[100svh] w-screen grid ${
          isSidebarOpen
            ? "lg:grid-cols-[1fr_3fr] xl:grid-cols-[1fr_4fr]"
            : "lg:grid-cols-1 xl:grid-cols-1"
        }`}
      >
        <div
          className={`${
            isSidebarOpen ? "z-10 flex lg:block" : "hidden lg:hidden"
          } fixed inset-y-0 left-0 w-4/5 bg-white lg:relative lg:w-auto lg:bg-transparent`}
        >
          <AdminSidebarComponent
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </div>
        <div className="h-full flex flex-col w-full">
          <div className="flex">
            <AdminHeaderComponent
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
            />
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <div
              className="h-full flex flex-1 bg-[#F4FFFC] justify-center items-center"
              onClick={handleContentClick}
            >
              {children}
            </div>
          </Suspense>
        </div>
      </div>
    </body>
  );
}
