"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import { IoAddCircleOutline, IoAddSharp } from "react-icons/io5";
import { IoMdAdd, IoMdMenu, IoMdTrash } from "react-icons/io";
import { useHandleLogout } from "@/utils/authUtils";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import useChatHeaders from "@/hooks/useChatHeaders";
import { getIdFromPathname } from "@/utils/compUtils";
import { BsThreeDotsVertical } from "react-icons/bs";
import { deleteChatMessage } from "@/app/api/chatMessagesIUD";
import { deleteChatConnection } from "@/app/api/chatConnectionsIUD";
import { MdOutlineSpaceDashboard } from "react-icons/md";

export default function ChatSidebarComponent({
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
  const [initials, setInitials] = useState("");
  const [userType, setUserType] = useState("");
  const [currentHeader, setCurrentHeader] = useState("");

  const user = useSelector((state: RootState) => state.user.user);

  useEffect(() => {
    if (user && user.user_metadata) {
      const { first_name, last_name } = user.user_metadata;
      const initials = `${first_name[0].toUpperCase()}${last_name[0].toUpperCase()}`;
      setInitials(initials);
      setUserType(user.user_metadata.user_type);
    }
  }, [user]);

  const { chatHeaders, loadingChatHeaders, errorChatHeaders } = useChatHeaders(
    user ? user.id : ""
  );

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
            } fixed inset-y-0 left-0 w-4/5 lg:relative lg:w-auto lg:bg-transparent`}
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
                  startContent={
                    userType === "farmer" ? (
                      <IoAddSharp />
                    ) : (
                      <MdOutlineSpaceDashboard />
                    )
                  }
                  className="mt-16 py-5 mx-3 inline-flex"
                  onClick={() => {
                    if (pathname !== `/${userType}/chat`) {
                      // setIsLoading(true);
                      router.push(`/${userType}/chat`);
                    }
                  }}
                >
                  {userType === "farmer" ? "New Chat" : "Main"}
                </Button>
              </div>
              <ul className="h-full mt-2 mb-20 flex flex-col pt-3 pb-5">
                {chatHeaders.length === 0 ? (
                  <li className="flex justify-center items-center h-full">
                    No chat history
                  </li>
                ) : (
                  chatHeaders.map((message, index) => {
                    const displayName =
                      message.sender_id !== user.id
                        ? `${message.sender_raw_user_meta_data.first_name} ${message.sender_raw_user_meta_data.last_name}`
                        : message.receiver_id !== user.id
                        ? `${message.receiver_raw_user_meta_data.first_name} ${message.receiver_raw_user_meta_data.last_name}`
                        : "Unknown";

                    // Determine if the user is the latest messager
                    const isUserLatestMessager = message.sender_id === user.id;

                    return (
                      <li
                        key={message.chat_message_id}
                        className={`${
                          chatId === message.chat_message_id ||
                          currentHeader === message.chat_message_id
                            ? "bg-[#005c4d]"
                            : ""
                        } flex items-center py-2 px-3 text-sm rounded-md hover:bg-[#005c4d] cursor-pointer w-full relative group`}
                        onClick={() => {
                          if (user.id === message.sender_id) {
                            // alert("You are the sender");
                            router.push(
                              `/${userType}/chat/id?sender=${message.sender_id}&receiver=${message.receiver_id}`
                            );
                          } else {
                            // alert("You are the receiver");
                            router.push(
                              `/${userType}/chat/id?sender=${message.sender_id}&receiver=${message.receiver_id}`
                            );
                          }
                        }}
                      >
                        <span className="w-full flex items-center gap-2">
                          {/* <Avatar size="sm" name={displayName} showFallback /> */}
                          <div className="flex flex-col justify-center truncate">
                            <span className="truncate text-lg font-semibold">
                              {displayName}
                            </span>
                            <span className="text-xs truncate">
                              {isUserLatestMessager
                                ? `You: ${message.message}`
                                : message.message}
                            </span>
                          </div>
                        </span>
                        <Popover showArrow placement="bottom">
                          <PopoverTrigger>
                            <div
                              className={`${
                                userType === "technician" && "hidden"
                              } absolute top-1/2 right-3 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full p-2 hover:bg-green-900`}
                            >
                              <BsThreeDotsVertical />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="p-1">
                            <Button
                              size="sm"
                              startContent={<IoMdTrash />}
                              onClick={() => {
                                deleteChatMessage(
                                  message.sender_id,
                                  message.receiver_id
                                );

                                deleteChatConnection(
                                  message.sender_id,
                                  message.receiver_id
                                );
                              }}
                            >
                              Delete
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </li>
                    );
                  })
                )}
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
          {/* HEADER */}
          <div className="h-full w-full flex flex-col relative overflow-hidden">
            <div className="flex-none">
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
                    onClick={() => router.push(`/${userType}/chat`)}
                  >
                    <IoAddCircleOutline size={25} />
                  </button>
                  <div
                    className={`${
                      chatId !== "chat" ? "hidden md:block" : "block"
                    } `}
                  >
                    AgriAdvice
                  </div>
                </div>
                {/* <div
                  className={`${
                    chatId === "chat" ? "hidden" : "flex"
                  } flex-col items-center`}
                >
                  <span className="text-xs">You&apos;re talking to</span>
                  {chatConnectionData && (
                    <span>{`${
                      (chatConnectionData as any).technician_first_name || ""
                    } ${
                      (chatConnectionData as any).technician_last_name || ""
                    }`}</span>
                  )}
                </div> */}
                <div className="flex items-center gap-2">
                  <Avatar size="sm" name={initials} showFallback />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <div
                className="h-full w-full flex flex-col bg-[#F4FFFC] px-4 lg:px-72 pt-5 lg:pt-10"
                onClick={handleContentClick}
              >
                {childrenIsLoading ? <Spinner color="success" /> : children}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
