"use client";

import AdminHeaderComponent from "@/components/adminComponents/Header";
import AdminSidebarComponent from "@/components/adminComponents/Sidebar";
import { Spinner } from "@nextui-org/react";
import { Suspense, useState } from "react";

export default function AdminSlugLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleContentClick = () => {
    if (window.innerWidth < 1024) {
      // 1024px is the breakpoint for 'lg' in Tailwind CSS
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Spinner color="success" />
        </div>
      )}
      {!isLoading && (
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
              setIsLoading={setIsLoading}
            />
          </div>
          <div className="h-full flex flex-col w-full relative">
            <div className="flex">
              <AdminHeaderComponent
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
              />
            </div>
            <Suspense
              fallback={
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Spinner color="success" />
                </div>
              }
            >
              <div
                className="h-full flex flex-1 bg-[#F4FFFC] justify-center items-center p-5 lg:p-10"
                onClick={handleContentClick}
              >
                {children}
              </div>
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
