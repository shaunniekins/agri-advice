"use client";

import { insertChatMessage } from "@/app/api/chatMessagesIUD";
import { RootState } from "@/app/reduxUtils/store";
import useChatMessages from "@/hooks/useChatMessages";
import { getIdFromPathname } from "@/utils/compUtils";
import { Avatar, Spinner, Textarea } from "@nextui-org/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoSendOutline } from "react-icons/io5";
import { useSelector } from "react-redux";

export default function ChatDisplayComponent() {
  const pathname = usePathname();
  const router = useRouter();
  const [messageInput, setMessageInput] = useState("");
  const [isTextareaDisabled, setIsTextareaDisabled] = useState(false);

  const user = useSelector((state: RootState) => state.user.user);
  const partnerId = getIdFromPathname(pathname);
  const rowsPerPage = 1000;
  const [currentPage, setCurrentPage] = useState(1);

  const { chatMessages, loadingChatMessages, errorChatMessages } =
    useChatMessages(
      rowsPerPage,
      currentPage,
      user ? user.id : "",
      partnerId || ""
    );

  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.sender_id === user.id) {
        setIsTextareaDisabled(true);
      }
    }
  }, [chatMessages, user.id]);

  const handleSubmit = async () => {
    await insertChatMessage({
      sender_id: user.id,
      receiver_id: partnerId,
      message: messageInput,
    });
    setMessageInput("");
  };

  useEffect(() => {
    console.log("chatMessages: ", chatMessages);
  }, [chatMessages]);

  if (loadingChatMessages) {
    return (
      <div className="h-full flex justify-center items-center">
        <Spinner color="success" />
      </div>
    );
  }

  if (chatMessages && chatMessages.length === 0) {
    return (
      <div className="h-full flex justify-center items-center">
        No messages to display
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-grow overflow-y-auto">
          <div className="h-full w-full flex flex-col">
            <div className="flex-grow">
              <div className="flex flex-col gap-3">
                {chatMessages.map((message) => {
                  const isSender = message.sender_id === user.id;

                  const senderFirstName = message.sender_first_name;
                  const senderLastName = message.sender_last_name;

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
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {message.message}
                      </div>
                      {isSender && <Avatar name={initials} showFallback />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-none w-full pb-6">
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
    </>
  );
}
