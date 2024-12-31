"use client";

import {
  insertChatMessage,
  updateChatMessage,
} from "@/app/api/chatMessagesIUD";
import { RootState } from "@/app/reduxUtils/store";
import useChatMessages from "@/hooks/useChatMessages";
import { Avatar, Button, Spinner, Textarea } from "@nextui-org/react";
import { usePathname } from "next/navigation";
import React, { useRef } from "react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  IoCloseCircleOutline,
  IoImageOutline,
  IoSendOutline,
} from "react-icons/io5";
import { useSelector } from "react-redux";
import { supabase } from "@/utils/supabase";
import { GrRefresh } from "react-icons/gr";
import useChatConnectionForTechnicianRecipient from "@/hooks/useChatConnectionForTechnicianRecipient";
import {
  formatMessageDate,
  formatMessageTime,
  renderMessage,
} from "@/utils/compUtils";
import ChatDisplayExtensionComponent from "./ChatDisplayExtension";
import { FaBars } from "react-icons/fa";

export default function ChatDisplayComponent() {
  const user = useSelector((state: RootState) => state.user.user);
  const [messageInput, setMessageInput] = useState("");
  const [isTextareaDisabled, setIsTextareaDisabled] = useState(false);

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserType, setCurrentUserType] = useState("");
  // const [partnerId, setPartnerId] = useState("");
  const rowsPerPage = 1000;
  const [currentPage, setCurrentPage] = useState(1);

  const pathName = usePathname();

  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [parentChatConnectionId, setParentChatConnectionId] = useState("");

  const [selectedMessageToEdit, setSelectedMessageToEdit] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const [otherPanelOpen, setOtherPanelOpen] = useState(true);
  const [processingMessageId, setProcessingMessageId] = useState<number | null>(
    null
  );
  const hasGeneratedReplyRef = useRef(false);

  // Handle resizing behavior for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setOtherPanelOpen(false);
      } else {
        setOtherPanelOpen(true);
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

  useEffect(() => {
    if (user && user.user_metadata) {
      setCurrentUserId(user.id);
      setCurrentUserType(user.user_metadata.user_type);
    }
  }, [user]);

  const [chatConnectionId, setChatConnectionId] = useState("");

  useEffect(() => {
    setChatConnectionId(pathName.split("/")[3]);
  }, [pathName]);

  const { chatConnection } =
    useChatConnectionForTechnicianRecipient(chatConnectionId);

  useEffect(() => {
    if (chatConnection && chatConnection[0])
      // console.log("chatConnection: ", chatConnection[0]);

      setParentChatConnectionId(chatConnection[0]?.parent_chat_connection_id);
  }, [chatConnection]);

  // current user messages
  const { chatMessages, loadingChatMessages } = useChatMessages(
    rowsPerPage,
    currentPage,
    chatConnectionId
  );

  // useEffect(() => {
  //   console.log("chatConnectionId1: ", chatConnectionId);
  // }, [chatConnectionId]);

  // useEffect(() => {
  //   console.log("chatMessages: ", chatMessages);
  // }, [chatMessages]);

  // useEffect(() => {
  //   console.log("parentChatConnectionId: ", parentChatConnectionId);
  //   console.log("parentChatMessages: ", parentChatMessages);
  // }, [parentChatConnectionId, parentChatMessages]);

  // const [currentIndex, setCurrentIndex] = useState(0);
  // const [filteredMessages, setFilteredMessages] = useState([]);

  // Filter messages when chatMessages change
  // useEffect(() => {
  //   const filtered = chatMessages.filter((message) => {
  //     return (
  //       (currentUserType === "farmer" && message.sender_id !== currentUserId) ||
  //       (currentUserType === "technician" &&
  //         message.sender_id === currentUserId)
  //     );
  //   });

  //   setFilteredMessages(filtered as any);
  //   // Set default to the latest message (last item in the filtered array)
  //   setCurrentIndex(filtered.length - 1);
  // }, [chatMessages, currentUserType, currentUserId]);

  const BUCKET_NAME = "chat-images";
  const imageUrlPattern =
    /"https:\/\/vgckngozsjzlzkrntaoq\.supabase\.co\/storage\/v1\/object\/public\/chat-images\/[^"]+"/;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const shouldGenerateReply = () => {
      if (currentUserType !== "farmer") return false;
      if (parentChatConnectionId) return false; // prevent AI response if there's a parent connection
      if (!chatMessages.length || !currentUserId || !currentUserType)
        return false;
      if (aiIsGenerating || hasGeneratedReplyRef.current) return false;
      const lastMessage = chatMessages[chatMessages.length - 1];

      // Check if message is an image using imageUrlPattern
      const isImageMessage = imageUrlPattern.test(lastMessage.message);

      // Only generate reply if the last message is from the farmer and not an image
      return (
        lastMessage.sender_user_type === "farmer" &&
        !isImageMessage &&
        !processingMessageId
      );
    };

    if (shouldGenerateReply()) {
      hasGeneratedReplyRef.current = true;
      handleGenerateAiReply();
    }

    return () => {
      hasGeneratedReplyRef.current = false;
    };
  }, [
    currentUserType,
    chatMessages,
    currentUserId,
    chatConnectionId,
    parentChatConnectionId,
  ]);

  const handleGenerateAiReply = async (chatMessageId?: number) => {
    if (aiIsGenerating) return;
    if (chatMessages.length === 0) return;

    setAiIsGenerating(true);
    setProcessingMessageId(chatMessageId || null);

    try {
      // Get the message to respond to
      let messageToRespondTo;
      if (chatMessageId) {
        // If regenerating a specific message
        const messageIndex = chatMessages.findIndex(
          (message) => message.chat_message_id === chatMessageId
        );
        messageToRespondTo =
          messageIndex > 0 ? chatMessages[messageIndex - 1] : null;
      } else {
        // Get the last message from the farmer
        messageToRespondTo = chatMessages[chatMessages.length - 1];
      }

      if (!messageToRespondTo) return;

      // Filter out images from the message
      const filteredMessage = !imageUrlPattern.test(messageToRespondTo.message)
        ? messageToRespondTo.message
        : "";

      const response = await fetch("/api/generate-ai-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filteredMessage }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI reply");
      }

      const data = await response.json();
      const aiReply = data.aiReply;

      if (chatMessageId) {
        // Update existing AI message
        await updateChatMessage(chatMessageId, {
          message: aiReply,
          chat_connection_id: chatConnectionId,
        });
      } else {
        // Insert new AI message
        await insertChatMessage({
          message: aiReply,
          chat_connection_id: chatConnectionId,
          receiver_id: user.id,
        });
      }

      setMessageInput("");
    } catch (error) {
      console.error("Error generating AI reply:", error);
    } finally {
      setAiIsGenerating(false);
      setProcessingMessageId(null);
    }
  };

  const handleSubmit = async (message: string) => {
    if (!user) return;
    const file = selectedImage;

    if (file) {
      const filePath = `public/${chatConnectionId}/${file.name}`;

      if (currentUserType === "technician") {
        const { data: list, error: listError } = await supabase.storage
          .from("chat-images")
          .list(filePath);

        if (listError) {
          console.error("Error listing images:", listError.message);
          return;
        }

        const filesToRemove = list?.map((x) => `${filePath}/${x.name}`);

        if (filesToRemove && filesToRemove.length > 0) {
          const { error: removeError } = await supabase.storage
            .from("chat-images")
            .remove(filesToRemove);

          if (removeError) {
            console.error("Error deleting image:", removeError.message);
            return;
          }
        }
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (data && !error) {
        const { publicUrl } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path).data;

        message = publicUrl;

        const res1 = await insertChatMessage({
          message,
          chat_connection_id: chatConnectionId,
          sender_id: user.id,
          receiver_id:
            currentUserType !== "farmer"
              ? chatConnection[0]?.farmer_id
              : undefined,
        });

        setMessageInput("");
        setSelectedImage(null);
      } else {
        console.error("Error uploading image:", error);
      }
    } else {
      const res2 = await insertChatMessage({
        message,
        chat_connection_id: chatConnectionId,
        sender_id: user.id,
        receiver_id: parentChatConnectionId
          ? currentUserType === "farmer"
            ? chatConnection[0]?.recipient_technician_id
            : chatConnection[0]?.farmer_id
          : currentUserType !== "farmer"
          ? chatConnection[0]?.farmer_id
          : undefined,
      });
      // console.log("client: ", chatConnectionId);

      // console.log("res2: ", res2);

      setMessageInput("");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleEditAIMessage = async (messageId: number) => {
    const result = await updateChatMessage(messageId, {
      message: messageInput,
    });

    if (result) {
      setMessageInput("");
      setSelectedMessageToEdit("");
    }
  };

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const displayedDates = new Set();

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
      <div className="h-full flex flex-col overflow-hidden">
        <div
          className={`h-full overflow-y-auto grid grid-cols-1 md:gap-10 
            ${currentUserType !== "farmer" && "md:grid-cols-[2fr_1fr]"}
            
            `}
        >
          {/* Chat view */}
          <div
            className={`
              h-full w-full overflow-y-auto bg-[#F4FFFC] md:bg-none rounded-tl-md md:rounded-none`}
          >
            <div className="h-full w-full">
              <div className="flex flex-col gap-3">
                {chatMessages.map((message: any, index: number) => {
                  // Added index parameter
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
                      key={`${message.chat_message_id}-${index}`} // Modified key to include index
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
                              {isFarmerSender &&
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
                                )}
                            </>
                          )}

                          {!isFarmerSender &&
                            !aiIsGenerating &&
                            !parentChatConnectionId && (
                              <div className="text-gray-500 text-xs flex justify-start items-center">
                                <Button
                                  size="sm"
                                  color="success"
                                  variant="light"
                                  isIconOnly
                                  className={`${
                                    currentUserType !== "farmer" && "hidden"
                                  } md:-ml-3`}
                                  onPress={() =>
                                    handleGenerateAiReply(
                                      message.chat_message_id
                                    )
                                  }
                                >
                                  <GrRefresh size={15} />
                                </Button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ----- Extra side panel ----- */}
          {currentUserType !== "farmer" && (
            <ChatDisplayExtensionComponent
              currentUserType={currentUserType}
              parentChatConnectionId={parentChatConnectionId}
              user={user}
            />
          )}
        </div>
        <div
          className={`${
            currentUserType !== "farmer" && "grid md:grid-cols-[2fr_1fr]"
          } flex-none w-full pb-6`}
        >
          {aiIsGenerating && (
            <div className="flex items-center gap-2 py-2">
              <Spinner size="sm" color="success" />
              <span className="text-xs text-gray-500">
                Generating AI response...
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <Textarea
              size="lg"
              radius="lg"
              maxRows={6}
              minRows={1}
              color={`${selectedMessageToEdit ? "secondary" : "success"}`}
              endContent={
                <div className="flex gap-3 text-2xl">
                  <button
                    className={`${!messageInput && "hidden"}`}
                    onClick={async () => {
                      if (selectedMessageToEdit) {
                        await handleEditAIMessage(
                          parseInt(selectedMessageToEdit)
                        );
                      } else {
                        await handleSubmit(messageInput);
                      }
                    }}
                    disabled={isTextareaDisabled}
                  >
                    <IoSendOutline />
                  </button>

                  <button
                    className={`${messageInput && "hidden"}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IoImageOutline />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                  {selectedImage && (
                    <>
                      <button onClick={() => setSelectedImage(null)}>
                        <IoCloseCircleOutline />
                      </button>
                      <button onClick={() => handleSubmit("")}>
                        <IoSendOutline />
                      </button>
                    </>
                  )}
                  <Button
                    isIconOnly
                    size="lg"
                    color="success"
                    variant="light"
                    startContent={<FaBars size={20} />}
                    // className="md:hidden md:z-auto z-20"
                    className={`${
                      currentUserType === "farmer"
                        ? "hidden"
                        : "md:hidden md:z-auto z-20"
                    }`}
                    onPress={() => setOtherPanelOpen(!otherPanelOpen)}
                    aria-label="toggle side panel"
                  />
                </div>
              }
              placeholder={`${
                !selectedImage
                  ? "Enter message here"
                  : "You have selected an image"
              }`}
              value={messageInput}
              onChange={(e) => {
                if (selectedImage) return;
                setMessageInput(e.target.value);

                if (e.target.value === "") {
                  setSelectedMessageToEdit("");
                }
              }}
              isDisabled={isTextareaDisabled || aiIsGenerating}
            />
          </div>
        </div>
      </div>
    </>
  );
}
