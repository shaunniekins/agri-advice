"use client";

import { supabase } from "@/utils/supabase";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Button, Spinner } from "@nextui-org/react";
import { use, useEffect, useState } from "react";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import { IoAddCircleOutline, IoAddSharp } from "react-icons/io5";
import { IoMdAdd } from "react-icons/io";
import { useHandleLogout } from "@/utils/authUtils";
import useChatMessages from "@/hooks/useChatMessages";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import useChatHeaders from "@/hooks/useChatHeaders";
import { getIdFromPathname } from "@/utils/compUtils";

export default function FarmerChatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(false);
  const [childrenIsLoading, setChildrenIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;
  const router = useRouter();
  const pathname = usePathname();
  const handleLogout = useHandleLogout();

  const chatId = getIdFromPathname(pathname);

  const user = useSelector((state: RootState) => state.user.user);
  const {
    chatHeaders,
    totalChatHeaders,
    loadingChatHeaders,
    errorChatHeaders,
  } = useChatHeaders(rowsPerPage, page, user.id);

  // Handle sidebar open/close on small screens
  const handleContentClick = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Handle resizing behavior for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check and event listener for window resize
    handleResize();
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Logout logic
  const onLogoutClick = () => {
    setIsLoading(true);
    handleLogout();
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
          className={`h-[100svh] w-screen font-body grid ${
            isSidebarOpen
              ? "lg:grid-cols-[1fr_3fr] xl:grid-cols-[1fr_5fr]"
              : "lg:grid-cols-1 xl:grid-cols-1"
          }`}
        >
          <div
            className={`${
              isSidebarOpen ? "z-10 flex lg:block" : "hidden lg:hidden"
            } fixed inset-y-0 left-0 w-4/5 bg-white lg:relative lg:w-auto lg:bg-transparent`}
          >
            <div className="bg-[#007057] text-white h-full w-80 flex flex-col justify-center select-none relative">
              <button
                className={`${
                  !isSidebarOpen && "hidden"
                } absolute flex items-center top-3 right-5 text-xl cursor-pointer`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <FaBars />
              </button>
              <div>
                <Button
                  radius="full"
                  startContent={<IoAddSharp />}
                  className="mt-16 py-5 mx-3 inline-flex"
                  onClick={() => {
                    if (pathname !== "/farmer/chat") {
                      setIsLoading(true);
                      router.push("/farmer/chat");
                      setIsLoading(false);
                    }
                  }}
                >
                  New Chat
                </Button>
              </div>
              <ul className="h-full mt-2 mb-20 flex flex-col pt-3 pb-5">
                {chatHeaders.map((message, index) => (
                  <li
                    key={message.chat_connection_id} // Using chat_message_id as the key
                    className={`${
                      chatId === message.chat_connection_id &&
                      // ||
                      // (index === 0 && "bg-[#005c4d]")
                      "bg-[#005c4d]"
                    } flex flex-col items-start py-2 px-3 rounded-md hover:bg-[#005c4d] cursor-pointer w-full`}
                    onClick={() => {
                      router.push(`/farmer/chat/${message.chat_connection_id}`);
                    }}
                  >
                    <span className="truncate w-full">{message.message}</span>
                    {/* <span className="text-xs truncate w-full">{message.sender_id}</span> */}
                  </li>
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
          </div>
          <div className="h-full w-full flex flex-col relative overflow-hidden">
            <div className="flex">
              <div className="w-full bg-[#007057] text-white flex justify-between items-center px-5">
                <div className="flex h-11 items-center gap-2">
                  <button
                    className={`${isSidebarOpen && "hidden"}`}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  >
                    <FaBars className="text-xl" />
                  </button>
                  <button
                    className={`${isSidebarOpen && "hidden"}`}
                    onClick={() => router.push("/farmer/chat")}
                  >
                    <IoAddCircleOutline size={25} />
                  </button>
                  <div>AgriAdvice</div>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar
                    size="sm"
                    name="SN"
                    showFallback
                    // src="https://images.unsplash.com/broken"
                  />
                  {/* <h4 className="text-sm">Hey, Junior</h4> */}
                </div>
              </div>
            </div>

            <div
              className="h-full w-full flex flex-1 bg-[#F4FFFC] px-4 lg:px-72 pt-5 lg:pt-10 justify-center items-center"
              onClick={handleContentClick}
            >
              {childrenIsLoading ? <Spinner color="success" /> : children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
