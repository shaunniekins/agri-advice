"use client";

import { useEffect, useRef, useState } from "react";
import useChatMessagesFotOtherPanel from "@/hooks/useChatMessagesFotOtherPanel";
import {
  formatMessageDate,
  formatMessageTime,
  renderMessage,
} from "@/utils/compUtils";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import { Avatar } from "@nextui-org/react"; // Import Avatar

interface ChatDisplayExtensionProps {
  currentUserType: string;
  parentChatConnectionId: string;
}

const ChatDisplayExtensionComponent: React.FC<ChatDisplayExtensionProps> = ({
  currentUserType,
  parentChatConnectionId,
}) => {
  const user = useSelector((state: RootState) => state.user.user);
  const rowsPerPage = 1000;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const { chatMessages: parentChatMessages } = useChatMessagesFotOtherPanel(
    rowsPerPage,
    currentPage,
    parentChatConnectionId,
    currentUserType // Pass the user type to filter deleted conversations
  );

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [parentChatMessages]);

  const displayedDates = new Set();

  return (
    <div
      className={`
          h-full flex flex-col bg-[#F4FFFC] overflow-y-auto md:bg-none rounded-tl-md md:rounded-none
           ${currentUserType === "farmer" && "hidden"}
          `}
    >
      <div className="h-full w-full">
        <div className="h-full flex flex-col gap-3 px-2 md:px-0">
          {" "}
          {/* Added padding for mobile */}
          {parentChatMessages.map((message: any) => {
            // Determine if the message is from the AI or the Farmer in the parent chat
            const isFarmerMessage = message.sender_user_type === "farmer";
            const isAIMessage = !isFarmerMessage; // Assuming only AI and Farmer in parent chat

            const senderFirstName = message.sender_first_name;
            const senderLastName = message.sender_last_name;
            const initials = isFarmerMessage
              ? `${(senderFirstName
                  ? senderFirstName[0]
                  : "F"
                ).toUpperCase()}${(senderLastName
                  ? senderLastName[0]
                  : ""
                ).toUpperCase()}`
              : "AI";

            const messageDate = format(
              new Date(message.created_at),
              "yyyy-MM-dd"
            );

            const showDate = !displayedDates.has(messageDate);
            if (showDate) {
              displayedDates.add(messageDate);
            }

            return (
              <div
                key={message.chat_message_id}
                className={`w-full flex flex-col py-1`} // Reduced py
                onClick={() => {
                  if (selectedMessageId === message.chat_message_id) {
                    setSelectedMessageId(null);
                  } else {
                    setSelectedMessageId(message.chat_message_id);
                  }
                }}
              >
                {showDate && (
                  <span className="text-[0.7rem] text-center py-2">
                    {" "}
                    {/* Added py */}
                    {formatMessageDate(message.created_at)}
                  </span>
                )}
                {/* Message Row */}
                <div
                  className={`w-full flex items-end gap-2 ${
                    // Use items-end for avatar alignment
                    isFarmerMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar for AI */}
                  {isAIMessage && (
                    <Avatar size="sm" name="AI" className="flex-shrink-0" />
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`message flex flex-col max-w-[75%] whitespace-pre-wrap flex-wrap text-wrap break-words relative`}
                    style={{
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                    }}
                  >
                    <div
                      className={`max-w-full text-sm py-2 px-3 rounded-2xl relative ${
                        // Added px and rounded
                        isFarmerMessage
                          ? "bg-green-200" // Farmer message style
                          : "bg-gray-200" // AI message style
                      }`}
                    >
                      {renderMessage(message.message)}
                      <div ref={bottomRef} />
                    </div>

                    {/* Timestamp */}
                    {selectedMessageId === message.chat_message_id && (
                      <span
                        className={`text-[0.7rem] mt-1 ${
                          // Added mt
                          isFarmerMessage ? "text-end" : "text-start"
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </span>
                    )}
                  </div>

                  {/* Avatar for Farmer */}
                  {isFarmerMessage && (
                    <Avatar
                      size="sm"
                      name={initials}
                      showFallback
                      className="flex-shrink-0"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatDisplayExtensionComponent;
