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
        <div className="h-full flex flex-col gap-3">
          {parentChatMessages.map((message: any) => {
            const isSentByCurrentUser = message.sender_id === user?.id;

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
                className={`w-full flex flex-col py-2`}
                onClick={() => {
                  if (selectedMessageId === message.chat_message_id) {
                    setSelectedMessageId(null);
                  } else {
                    setSelectedMessageId(message.chat_message_id);
                  }
                }}
              >
                {showDate && (
                  <span className="text-[0.7rem] text-center">
                    {formatMessageDate(message.created_at)}
                  </span>
                )}
                <div
                  className={`w-full flex flex-col md:flex-row md:gap-4 py-2 ${
                    isSentByCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`message flex flex-col max-w-full whitespace-pre-wrap flex-wrap text-wrap break-words relative`}
                    style={{
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                      maxWidth: "100%",
                    }}
                  >
                    <div
                      className={`max-w-full text-sm py-2 relative ${
                        isSentByCurrentUser && "px-3 rounded-2xl bg-green-200"
                      }`}
                    >
                      {renderMessage(message.message)}
                      <div ref={bottomRef} />
                    </div>

                    {selectedMessageId === message.chat_message_id && (
                      <>
                        <span
                          className={`text-[0.7rem] ${
                            isSentByCurrentUser ? "text-end" : "text-start"
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </span>
                      </>
                    )}
                  </div>
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
