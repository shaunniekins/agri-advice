"use client";

import { insertChatMessage } from "@/app/api/chatMessagesIUD";
import { RootState } from "@/app/reduxUtils/store";
import useChatMessages from "@/hooks/useChatMessages";
import { getIdFromPathname } from "@/utils/compUtils";
import { Avatar, Button, Spinner, Textarea } from "@nextui-org/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IoSendOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";

export default function ChatDisplayComponent() {
  const user = useSelector((state: RootState) => state.user.user);
  const pathname = usePathname();
  const router = useRouter();
  const [messageInput, setMessageInput] = useState("");
  const [isTextareaDisabled, setIsTextareaDisabled] = useState(false);

  const [userType, setUserType] = useState("");
  const partnerId = getIdFromPathname(pathname);
  const rowsPerPage = 1000;
  const [currentPage, setCurrentPage] = useState(1);
  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState("");

  const searchParams = useSearchParams();

  useEffect(() => {
    setSenderId(searchParams.get("sender") || "");
    setReceiverId(searchParams.get("receiver") || "");
  }, [searchParams]);

  const { chatMessages, loadingChatMessages, errorChatMessages } =
    useChatMessages(rowsPerPage, currentPage, senderId || "", receiverId || "");

  useEffect(() => {
    if (user && user.user_metadata) {
      setUserType(user.user_metadata.user_type);
    }
  }, [user]);

  const handleSubmit = async (message: string) => {
    if (!message) return;
    if (!user) return;

    let partnerId;
    if (user.id === senderId) {
      partnerId = receiverId;
    } else {
      partnerId = senderId;
    }

    await insertChatMessage({
      sender_id: user.id,
      receiver_id: partnerId,
      message: message,
    });
    setMessageInput("");
  };

  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const handleGenerateDraftReply = async () => {
    if (userType !== "technician" || chatMessages.length === 0) return;

    setIsGeneratingDraft(true);
    try {
      const conversation = chatMessages
        .map((msg) => `${msg.sender_first_name}: ${msg.message}`)
        .join("\n");
      const response = await fetch("/api/generate-ai-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversation }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate draft reply");
      }

      const data = await response.json();
      const draftReply = data.draftReply;
      console.log("Draft reply:", draftReply);

      // Automatically send the draft reply
      await handleSubmit(draftReply);
    } catch (error) {
      console.error("Error generating draft reply:", error);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

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
        <div className="flex-grow overflow-y-auto overflow-x-hidden">
          <div className="h-full w-full flex flex-col">
            <div className="flex-grow">
              <div className="flex flex-col gap-3">
                {chatMessages
                  .filter((message) => {
                    // Filter out messages if userType is "farmer" and message.is_active is FALSE
                    if (userType === "farmer" && !message.is_active) {
                      return false;
                    }
                    return true;
                  })
                  .map((message) => {
                    const isSender =
                      (message.sender_id || message.receiver_id) === user.id;

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

                    return (
                      <div
                        key={message.chat_message_id}
                        className={`w-full flex gap-4 py-2 ${
                          !isSender ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div className="flex">
                          {/* {!isSender && <Avatar name={initials} showFallback />} */}
                          {!isSender &&
                            (!senderProfilePicture ? (
                              <Avatar size="sm" name={initials} showFallback />
                            ) : (
                              <Avatar
                                size="sm"
                                src={senderProfilePicture}
                                alt="Profile"
                                showFallback
                                className="rounded-full object-cover cursor-pointer"
                              />
                            ))}
                        </div>
                        <div
                          className={`message text-sm py-2 max-w-full whitespace-pre-wrap flex-wrap text-wrap break-words ${
                            isSender ? "px-3 rounded-2xl bg-green-200" : ""
                          }`}
                          style={{
                            // whiteSpace: "pre-wrap",
                            // wordWrap: "break-word",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                            maxWidth: "100%",
                          }}
                        >
                          {message.is_active === false && (
                            <div className="text-gray-500 text-xs">[Draft]</div>
                          )}
                          <ReactMarkdown>{message.message}</ReactMarkdown>
                        </div>
                        {/* <div className="flex">
                          {isSender && <Avatar name={initials} showFallback />}
                        </div> */}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-none w-full pb-6">
          {userType === "technician" && (
            <div className="mb-2">
              <Button
                color="primary"
                onClick={handleGenerateDraftReply}
                disabled={isGeneratingDraft}
              >
                {isGeneratingDraft ? "Generating..." : "Generate AI Draft"}
              </Button>
            </div>
          )}
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
                  onClick={() => handleSubmit(messageInput)}
                  disabled={isTextareaDisabled}
                >
                  <IoSendOutline />
                </button>
              </div>
            }
            placeholder="Enter message here"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            isDisabled={isTextareaDisabled}
          />
        </div>
      </div>
    </>
  );
}
