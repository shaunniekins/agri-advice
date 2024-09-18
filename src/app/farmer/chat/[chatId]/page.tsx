// src/app/farmer/chat/[chatId]/page.tsx

"use client";

import { insertChatMessage } from "@/app/api/chatMessagesIUD";
import { RootState } from "@/app/reduxUtils/store";
import useChatMessages from "@/hooks/useChatMessages";
import useChatSessionChecker from "@/hooks/useChatSessionChecker";
import useTechnicianUsers from "@/hooks/useTechnicianUsers";
import { getIdFromPathname } from "@/utils/compUtils";
import { Avatar, Textarea } from "@nextui-org/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoSendOutline } from "react-icons/io5";
import { useSelector } from "react-redux";

export default function FarmerChatSlugPage() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.user);
  // const [initials, setInitials] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isTextareaDisabled, setIsTextareaDisabled] = useState(false);

  // useEffect(() => {
  //   if (user && user.user_metadata) {
  //     const { first_name, last_name } = user.user_metadata;
  //     const initials = `${first_name[0].toUpperCase()}${last_name[0].toUpperCase()}`;
  //     setInitials(initials);
  //   }
  // }, [user]);

  // chatId === chatSessionId
  const chatId = getIdFromPathname(pathname);

  const { exists, loading, error } = useChatSessionChecker(chatId);
  const {
    technicianUsers,
    isLoadingTechnicianUsers,
    totalTechnicianEntries,
    fetchAndSubscribeTechnicianUsers,
    updateTechnicianUser,
  } = useTechnicianUsers();

  const {
    chatMessages,
    totalChatMessages,
    loadingChatMessages,
    errorChatMessages,
  } = useChatMessages(100, 1, chatId);

  // useEffect(() => {
  //   console.log("chatMessages", chatMessages);
  // }, [chatMessages]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.sender_id === user.id) {
        setIsTextareaDisabled(true);
        // setTimeout(() => {
        //   setIsTextareaDisabled(false);
        // }, 5000); // Disable for 5 seconds
      }
    }
  }, [chatMessages, user.id]);

  const handleSubmit = async () => {
    await insertChatMessage({
      chat_connection_id: chatId,
      message: messageInput,
      sender_id: user.id,
    });
    setMessageInput("");
  };

  return (
    <>
      {!exists ? (
        "Chat session no longer exists"
      ) : (
        <div className="h-full w-full overflow-y-auto relative">
          <div className="flex flex-col gap-3">
            {chatMessages.map((message) => {
              const isSender = message.sender_id === user.id;
              const isFarmer = message.sender_id === message.farmer_id;

              const senderFirstName = isFarmer
                ? message.farmer_first_name
                : message.technician_first_name;
              const senderLastName = isFarmer
                ? message.farmer_last_name
                : message.technician_last_name;

              // Provide default values if senderFirstName or senderLastName is undefined
              const initials = `${(senderFirstName
                ? senderFirstName[0]
                : "A"
              ).toUpperCase()}${(senderLastName
                ? senderLastName[0]
                : "A"
              ).toUpperCase()}`;

              return (
                <div
                  key={message.chat_message_id}
                  className={`flex gap-4 items-start ${
                    isSender ? "justify-end" : ""
                  }`}
                >
                  {!isSender && <Avatar name={initials} showFallback />}
                  <div
                    className={`message py-2 ${
                      isSender
                        ? "text-right px-3 rounded-2xl bg-gray-300"
                        : "text-left"
                    }`}
                    style={{ whiteSpace: "pre-wrap" }} // Preserve newlines
                  >
                    {message.message}
                  </div>
                  {isSender && <Avatar name={initials} showFallback />}
                </div>
              );
            })}
          </div>
          <div className="w-full absolute bottom-0 pb-6">
            <Textarea
              size="lg"
              radius="lg"
              maxRows={3}
              minRows={1}
              color="success"
              endContent={
                <div className="flex gap-4 text-2xl">
                  <button
                    className={`${!messageInput && "hidden"}`}
                    onClick={handleSubmit}
                    disabled={isTextareaDisabled}
                  >
                    <IoSendOutline />
                  </button>
                </div>
              }
              placeholder="Enter message here"
              value={
                !isTextareaDisabled
                  ? messageInput
                  : "Please wait for the technician to respond..."
              }
              onChange={(e) => setMessageInput(e.target.value)}
              isDisabled={isTextareaDisabled}
            />
          </div>
        </div>
      )}
    </>
  );
}
