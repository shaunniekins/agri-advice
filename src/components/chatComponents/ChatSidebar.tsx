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
import { IoAddCircleOutline, IoAddSharp, IoArrowBack } from "react-icons/io5";
import { IoMdShare, IoMdTrash } from "react-icons/io";
import { useHandleLogout } from "@/utils/authUtils";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import useChatHeaders from "@/hooks/useChatHeaders";
import {
  calculateAge,
  getIdFromPathname,
  getMessageDateGroup,
} from "@/utils/compUtils";
import { BsBack, BsThreeDotsVertical } from "react-icons/bs";
import {
  deleteChatMessage,
  insertChatMessage,
  updateReceiverMessagesReadStatus,
  updateSenderMessagesReadStatus,
} from "@/app/api/chatMessagesIUD";
import {
  deleteChatConnection,
  insertChatConnection,
  updateChatConnection,
} from "@/app/api/chatConnectionsIUD";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { supabase } from "@/utils/supabase";
import { FiHelpCircle } from "react-icons/fi";
import ChatSidebarModal from "./ChatSidebarModal";
import useTechnician from "@/hooks/useTechnician";
import useChatConnectionForTechnicianRecipient from "@/hooks/useChatConnectionForTechnicianRecipient";

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

  const { chatConnection } =
    useChatConnectionForTechnicianRecipient(chatConnectionId);

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

  // sidebar options
  const [isCurrentlySharing, setIsCurrentlySharing] = useState(false);
  const [userLocation, setUserLocation] = useState("");

  const [chosenTechnicianId, setChosenTechnicianId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (user && user.user_metadata) {
      setUserType(user.user_metadata.user_type);
      setUserLocation(user.user_metadata.address);
    }
  }, [user]);

  const { technicianData, isLoadingTechnician } = useTechnician(userLocation);

  const [sharingSates, setSharingStates] = useState<{ [key: string]: boolean }>(
    {}
  );

  const groupedChatHeaders = chatHeaders.reduce((acc, message) => {
    const dateGroup = getMessageDateGroup(new Date(message.latest_created_at));
    if (!acc[dateGroup]) {
      acc[dateGroup] = [];
    }
    acc[dateGroup].push(message);
    return acc;
  }, {} as Record<string, typeof chatHeaders>);

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
                {Object.keys(groupedChatHeaders).length === 0 ? (
                  <li className="flex justify-center items-center h-full w-full">
                    No chat history
                  </li>
                ) : (
                  Object.keys(groupedChatHeaders).map((dateGroup) => (
                    <React.Fragment key={dateGroup}>
                      <li className="text-center text-xs font-semibold py-2">
                        {dateGroup}
                      </li>
                      {groupedChatHeaders[dateGroup].map(
                        (message: any, index: any) => {
                          const isAi = !message.parent_chat_connection_id;
                          const isFarmer =
                            message.parent_chat_connection_id &&
                            userType === "farmer";

                          const isSender = user.id === message.first_sender_id;
                          const isReceiver =
                            user.id === message.first_receiver_id;

                          return (
                            <li
                              key={`${message.chat_message_id}-${index}`}
                              className={`${
                                chatId === message.chat_message_id ||
                                currentHeader === message.chat_message_id
                                  ? "bg-[#005c4d]"
                                  : ""
                              }
                            flex items-center py-3 px-4 text-sm rounded-md hover:bg-[#005c4d] cursor-pointer w-full relative group`}
                              onClick={() => {
                                isSender &&
                                  !isReceiver &&
                                  updateSenderMessagesReadStatus(
                                    message.chat_connection_id
                                  );
                                isReceiver &&
                                  !isSender &&
                                  updateReceiverMessagesReadStatus(
                                    message.chat_connection_id
                                  );
                                router.push(
                                  `/${userType}/chat/${message.chat_connection_id}`
                                );
                              }}
                            >
                              <span
                                className={`
                                ${
                                  isSender &&
                                  !isReceiver &&
                                  message.is_sender_read &&
                                  "font-semibold"
                                }
                                ${
                                  isReceiver &&
                                  !isSender &&
                                  message.is_receiver_read &&
                                  "font-semibold"
                                }

                              w-full text-left truncate text-base`}
                              >
                                {isAi
                                  ? message.first_message
                                  : isFarmer
                                  ? message.sender_first_name +
                                    " " +
                                    message.sender_last_name
                                  : message.receiver_first_name +
                                    " " +
                                    message.receiver_last_name}
                              </span>
                              <Popover
                                showArrow
                                isOpen={
                                  openPopoverId ===
                                  `${message.chat_connection_id}-${message.chat_message_id}`
                                }
                                onOpenChange={(open) => {
                                  if (open) {
                                    setOpenPopoverId(
                                      `${message.chat_connection_id}-${message.chat_message_id}`
                                    );
                                  } else {
                                    setOpenPopoverId(null);
                                    setSharingStates((prev) => ({
                                      ...prev,
                                      [`${message.chat_connection_id}-${message.chat_message_id}`]:
                                        false,
                                    }));
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
                                      setOpenPopoverId(
                                        `${message.chat_connection_id}-${message.chat_message_id}`
                                      );
                                      setChatCoonectionId(
                                        message.chat_connection_id
                                      );
                                    }}
                                  >
                                    <BsThreeDotsVertical />
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent className="flex gap-2 p-2">
                                  {!sharingSates[
                                    `${message.chat_connection_id}-${message.chat_message_id}`
                                  ] ? (
                                    <>
                                      <Button
                                        fullWidth
                                        size="sm"
                                        startContent={<IoMdShare />}
                                        className={`${
                                          chatConnection[0]
                                            ?.recipient_technician_id &&
                                          "hidden"
                                        }`}
                                        onClick={() =>
                                          setSharingStates((prev) => ({
                                            ...prev,
                                            [`${message.chat_connection_id}-${message.chat_message_id}`]:
                                              true,
                                          }))
                                        }
                                      >
                                        Share
                                      </Button>
                                    </>
                                  ) : (
                                    <div className="flex flex-col p-2 gap-4 w-full sm:w-96">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          fullWidth
                                          size="sm"
                                          isIconOnly
                                          startContent={<IoArrowBack />}
                                          onClick={() =>
                                            setSharingStates((prev) => ({
                                              ...prev,
                                              [`${message.chat_connection_id}-${message.chat_message_id}`]:
                                                false,
                                            }))
                                          }
                                        />

                                        <div className="flex flex-col">
                                          <h3 className="text-base font-semibold ">
                                            List of Technicians in{" "}
                                            {userLocation}
                                          </h3>
                                          <span className="text-xs text-red-500">
                                            *Only one technician in specific
                                            conversation
                                          </span>
                                        </div>
                                      </div>
                                      {/* map technicians */}
                                      <div>
                                        {technicianData.map((technician) => {
                                          return (
                                            <div
                                              key={technician.id}
                                              className="flex flex-col gap-2 hover:bg-green-100 rounded-lg p-2 cursor-pointer"
                                            >
                                              <div className="flex justify-between">
                                                <div className="flex items-center gap-2">
                                                  <Avatar
                                                    size="sm"
                                                    src={
                                                      technician.profile_picture
                                                    }
                                                    alt="Profile"
                                                    showFallback
                                                    className="rounded-full object-cover"
                                                  />
                                                  <span>
                                                    {technician.first_name}{" "}
                                                    {technician.last_name}
                                                  </span>
                                                </div>
                                                <Button
                                                  color="success"
                                                  size="sm"
                                                  className="text-white"
                                                  onClick={async () => {
                                                    const res = window.confirm(
                                                      "Are you sure? You can only share to one technician."
                                                    );
                                                    if (res) {
                                                      setChosenTechnicianId(
                                                        technician.id
                                                      );
                                                      // await updateChatConnection(
                                                      //   message.chat_connection_id,
                                                      //   technician.id
                                                      // );
                                                      const newSession: any =
                                                        await insertChatConnection(
                                                          {
                                                            parent_chat_connection_id:
                                                              message.chat_connection_id,
                                                            farmer_id:
                                                              message.farmer_id,
                                                            recipient_technician_id:
                                                              technician.id,
                                                          }
                                                        );

                                                      if (
                                                        newSession.data &&
                                                        newSession.data[0]
                                                      ) {
                                                        const newMsg =
                                                          await insertChatMessage(
                                                            {
                                                              chat_connection_id:
                                                                newSession
                                                                  .data[0]
                                                                  ?.chat_connection_id,
                                                              sender_id:
                                                                technician.id,
                                                              receiver_id:
                                                                message.farmer_id,
                                                              message:
                                                                "Hi! Please wait for the reply",
                                                            }
                                                          );

                                                        if (newMsg) {
                                                          setIsCurrentlySharing(
                                                            false
                                                          );
                                                          setOpenPopoverId(
                                                            null
                                                          );
                                                          router.push(
                                                            `/${userType}/chat/${newSession.data[0].chat_connection_id}`
                                                          );
                                                        }
                                                      }
                                                    }
                                                  }}
                                                >
                                                  Share
                                                </Button>
                                              </div>
                                              <div className="flex flex-col">
                                                <h2>
                                                  <span className="font-semibold">
                                                    Email:{" "}
                                                  </span>
                                                  {technician.email}
                                                </h2>
                                                <h2>
                                                  <span className="font-semibold">
                                                    Age:{" "}
                                                  </span>
                                                  {technician.birth_date
                                                    ? calculateAge(
                                                        technician.birth_date
                                                      ) + " years old"
                                                    : "N/A"}
                                                </h2>
                                                {technician.specialization && (
                                                  <h2>
                                                    <span className="font-semibold">
                                                      Specialization:{" "}
                                                    </span>
                                                    {technician.specialization}
                                                  </h2>
                                                )}
                                                {technician.experiences && (
                                                  <h2>
                                                    <span className="font-semibold">
                                                      Experiences:{" "}
                                                    </span>
                                                    <span className="text-justify">
                                                      {technician.experiences}
                                                    </span>
                                                  </h2>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </PopoverContent>
                              </Popover>
                            </li>
                          );
                        }
                      )}
                    </React.Fragment>
                  ))
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
