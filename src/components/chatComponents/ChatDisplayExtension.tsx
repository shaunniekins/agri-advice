"use client";

import { Avatar } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import useChatMessagesFotOtherPanel from "@/hooks/useChatMessagesFotOtherPanel";
import {
  formatMessageDate,
  formatMessageTime,
  renderMessage,
} from "@/utils/compUtils";
import { format } from "date-fns";

interface ChatDisplayExtensionProps {
  currentUserType: string;
  parentChatConnectionId: string;
  user: any;
}

const ChatDisplayExtensionComponent: React.FC<ChatDisplayExtensionProps> = ({
  currentUserType,
  parentChatConnectionId,
  user,
}) => {
  const rowsPerPage = 1000;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const { chatMessages: parentChatMessages } = useChatMessagesFotOtherPanel(
    rowsPerPage,
    currentPage,
    parentChatConnectionId
  );

  //   useEffect(() => {
  //     console.log("parentChatMessages", parentChatMessages);
  //   }, [parentChatMessages]);

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
          {parentChatMessages
            // .filter((message: any) => {
            //   return (
            //     message.chat_connection_id ===
            //     chatConnection[0]?.chat_connection_id
            //   );
            // })
            .map((message: any) => {
              const isFarmerSender = message.sender_id === user.id;
              const senderFirstName = message.sender_first_name;
              const senderLastName = message.sender_last_name;
              const senderProfilePicture = message.sender_profile_picture;
              const initials = `${(senderFirstName
                ? senderFirstName[0]
                : "A"
              ).toUpperCase()}${(senderLastName
                ? senderLastName[0]
                : "A"
              ).toUpperCase()}`;

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
                  className={`w-full flex flex-col py-2
                    // $
                    //   (currentUserType === "farmer" &&
                    //     (message.sender_id === currentUserId ||
                    //       message.sender_id !== currentUserId)) ||
                    //   (currentUserType === "technician" &&
                    //     (message.sender_id !== currentUserId ||
                    //       message.sender_id === currentUserId))
                    //     ? ""
                    //     : "hidden"
                    // }  
                    `}
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
                      !isFarmerSender ? "justify-start" : "justify-end"
                    }
                    
                    `}
                  >
                    <div className="flex">
                      {!isFarmerSender && !senderProfilePicture && (
                        <Avatar size="sm" name={initials} showFallback />
                      )}
                    </div>

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
                          isFarmerSender && "px-3 rounded-2xl bg-green-200"
                        }`}
                      >
                        {renderMessage(message.message)}
                        <div ref={bottomRef} />
                      </div>

                      {selectedMessageId === message.chat_message_id && (
                        <>
                          <span
                            className={`text-[0.7rem] ${
                              isFarmerSender ? "text-end" : "text-start"
                            }`}
                          >
                            {formatMessageTime(message.created_at)}
                          </span>
                          {/* {isFarmerSender &&
                              currentUserType === "technician" && (
                                <div className="z-10 absolute -top-6 right-3">
                                  <button
                                    className="p-1 rounded-full text-xs text-green-400 hover:text-green-600"
                                    onClick={() => {
                                      setMessageInput(message.message);
                                      setSelectedMessageToEdit(
                                        message.chat_message_id
                                      );
                                    }}
                                  >
                                    Edit
                                  </button>
                                </div>
                              )} */}
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
