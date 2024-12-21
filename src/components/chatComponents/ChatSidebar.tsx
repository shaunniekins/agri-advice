"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from "@nextui-org/react";
import React from "react";
import { useEffect, useState } from "react";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import { IoAddCircleOutline, IoAddSharp } from "react-icons/io5";
import { IoMdTrash } from "react-icons/io";
import { useHandleLogout } from "@/utils/authUtils";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import useChatHeaders from "@/hooks/useChatHeaders";
import { getIdFromPathname } from "@/utils/compUtils";
import { BsThreeDotsVertical } from "react-icons/bs";
import { deleteChatMessage } from "@/app/api/chatMessagesIUD";
import { deleteChatConnection } from "@/app/api/chatConnectionsIUD";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { supabase } from "@/utils/supabase";
import { FiHelpCircle } from "react-icons/fi";
import ChatSidebarModal from "./ChatSidebarModal";

export default function ChatSidebarComponent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(false);
  const [childrenIsLoading, setChildrenIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 9;
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.user.user);
  const handleLogout = useHandleLogout();

  const chatId = getIdFromPathname(pathname);
  const [initials, setInitials] = useState("");
  const [userType, setUserType] = useState("");
  const [currentHeader, setCurrentHeader] = useState("");
  const [chatConnectionId, setChatCoonectionId] = useState("");

  const [displayImage, setDisplayImage] = useState({
    profile_picture: "",
  });

  const [openUserInfo, setOpenUserInfo] = useState(false);

  const { chatHeaders, totalChatHeaders } = useChatHeaders(
    rowsPerPage,
    page,
    user ? user.id : ""
  );

  // useEffect(() => {
  //   console.log("chatHeaders", chatHeaders);
  // }, [chatHeaders]);

  const totalPages = Math.ceil(totalChatHeaders / rowsPerPage);

  // Handle sidebar open/close on small screens
  const handleContentClick = () => {
    if (window.innerWidth < 1280) {
      setIsSidebarOpen(false);
    }
  };

  // Handle resizing behavior for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
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

  const isTechnicianPathBase = pathname === "/technician/chat";
  // console.log("isTechnicianPathBase", isTechnicianPathBase);

  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  return (
    <>
      <ChatSidebarModal
        openUserInfo={openUserInfo}
        setOpenUserInfo={setOpenUserInfo}
        user={user}
        displayImage={displayImage}
        setDisplayImage={setDisplayImage}
        initials={initials}
        setInitials={setInitials}
        userType={userType}
        setUserType={setUserType}
        setIsLoading={setIsLoading}
      />
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
            <div className="bg-[#007057] text-white h-full w-80 flex flex-col justify-start select-none relative">
              <button
                className={`${
                  !isSidebarOpen && "hidden"
                } flex self-end items-center py-3 pr-5 text-xl cursor-pointer`}
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
              <ul className="h-full w-full self-start mt-2 mb-20 flex flex-col pt-3 pb-5">
                {chatHeaders.length === 0 ? (
                  <li className="flex justify-center items-center h-full w-full">
                    No chat history
                  </li>
                ) : (
                  chatHeaders.map((message) => {
                    return (
                      <li
                        key={message.chat_message_id}
                        className={`${
                          chatId === message.chat_message_id ||
                          currentHeader === message.chat_message_id
                            ? "bg-[#005c4d]"
                            : ""
                        } flex items-center py-3 px-4 text-sm rounded-md hover:bg-[#005c4d] cursor-pointer w-full relative group`}
                        onClick={() => {
                          router.push(
                            `/${userType}/chat/${message.chat_connection_id}`
                          );
                        }}
                      >
                        <span className="w-full text-center truncate text-base">
                          {message.message}
                        </span>
                        {/* <Popover
                          showArrow
                          isOpen={openPopoverId === message.chat_message_id}
                          onOpenChange={(open) => {
                            if (open) {
                              setOpenPopoverId(message.chat_message_id);
                            } else {
                              setOpenPopoverId(null);
                            }
                          }}
                          placement="bottom"
                        >
                          <PopoverTrigger>
                            <div
                              className={`absolute top-1/2 right-3 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full p-2 hover:bg-green-900 ${
                                userType === "technician" && "hidden"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenPopoverId(message.chat_message_id);
                              }}
                            >
                              <BsThreeDotsVertical />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="flex gap-2 p-2">
                            <Button
                              fullWidth
                              size="sm"
                              startContent={<IoMdTrash />}
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  "Are you sure you want to delete this message?"
                                );
                                if (confirmed) {
                                  deleteChatMessage(
                                    message.sender_id,
                                    message.receiver_id
                                  );
                                  deleteChatConnection(
                                    message.sender_id,
                                    message.receiver_id
                                  );

                                  if (userType === "farmer") {
                                    const partnerId =
                                      user.id === message.sender_id
                                        ? message.receiver_id
                                        : message.sender_id;
                                    const filePath = `public/${user.id}/${partnerId}`;

                                    const { data: list } =
                                      await supabase.storage
                                        .from("chat-images")
                                        .list(filePath);
                                    const filesToRemove = list?.map(
                                      (x) => `${filePath}/${x.name}`
                                    );

                                    if (
                                      filesToRemove &&
                                      filesToRemove.length > 0
                                    ) {
                                      const { error } = await supabase.storage
                                        .from("chat-images")
                                        .remove(filesToRemove);

                                      if (error) {
                                        console.error(
                                          "Error deleting image:",
                                          error.message
                                        );
                                        return;
                                      }
                                    }
                                  }

                                  setOpenPopoverId(null);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </PopoverContent>
                        </Popover> */}
                      </li>
                    );
                  })
                )}
              </ul>
              <div
                className={`
                ${totalPages <= 1 && "hidden"}
                w-full flex justify-center my-2`}
              >
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="success"
                  page={page}
                  total={totalPages}
                  onChange={(newPage) => setPage(newPage)}
                />
              </div>
              <div className="px-20 w-full flex flex-col items-center justify-center gap-4 mt-2 mb-4">
                <Button
                  fullWidth
                  // size="sm"
                  color={"secondary"}
                  startContent={<FiHelpCircle />}
                  className={`${userType === "technician" && "hidden"}`}
                  onClick={() => router.push("/farmer/chat/help")}
                >
                  Help
                </Button>
                <Button
                  fullWidth
                  // size="sm"
                  color={"danger"}
                  startContent={<FaSignOutAlt />}
                  onClick={onLogoutClick}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* ----- HEADER ----- */}
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
                <button
                  className="flex items-center gap-2"
                  onClick={() => setOpenUserInfo(true)}
                >
                  {!displayImage.profile_picture ? (
                    <Avatar size="sm" name={initials} showFallback />
                  ) : (
                    <Avatar
                      size="sm"
                      src={displayImage.profile_picture}
                      alt="Profile"
                      showFallback
                      className="rounded-full object-cover cursor-pointer"
                    />
                  )}
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-hidden">
              <div
                className={`${
                  pathname === "/farmer/chat/help"
                    ? "lg:px-32"
                    : pathname === "/farmer/chat"
                    ? "lg:px-72"
                    : isTechnicianPathBase && userType === "technician"
                    ? "lg:px-10"
                    : "xl:pl-32 xl:pr-32"
                } h-full w-full flex flex-col bg-[#F4FFFC] px-4 pt-5 lg:pt-10`}
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
