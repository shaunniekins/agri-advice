"use client";

import {
  deleteSpecificChatMessage,
  insertChatMessage,
  updateChatMessage,
} from "@/app/api/chatMessagesIUD";
import { RootState } from "@/app/reduxUtils/store";
import useChatMessages from "@/hooks/useChatMessages";
import { Avatar, Button, Spinner, Textarea } from "@nextui-org/react";
import { useSearchParams } from "next/navigation";
import React, { useRef } from "react";
import { useEffect, useState } from "react";
import {
  IoCloseCircleOutline,
  IoImageOutline,
  IoRefreshOutline,
  IoSendOutline,
} from "react-icons/io5";
import { useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/utils/supabase";
import { GrRefresh } from "react-icons/gr";

export default function ChatDisplayComponent() {
  const user = useSelector((state: RootState) => state.user.user);
  const [messageInput, setMessageInput] = useState("");
  const [isTextareaDisabled, setIsTextareaDisabled] = useState(false);

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserType, setCurrentUserType] = useState("");
  const rowsPerPage = 1000;
  const [currentPage, setCurrentPage] = useState(1);

  // this is the conversation session (url)
  const [sessionFarmerId, setSessionFarmerId] = useState("");
  const [sessionTechnicianId, setSessionTechnicianId] = useState("");
  const [aiIsGenerating, setAiIsGenerating] = useState(false);

  const searchParams = useSearchParams();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    if (user && user.user_metadata) {
      setCurrentUserId(user.id);
      setCurrentUserType(user.user_metadata.user_type);
    }
  }, [user]);

  useEffect(() => {
    // senderId = sessionFarmerId
    // receiverId = sessionTechnicianId
    setSessionFarmerId(searchParams.get("sender") || "");
    setSessionTechnicianId(searchParams.get("receiver") || "");
  }, [searchParams]);

  const { chatMessages, loadingChatMessages, errorChatMessages } =
    useChatMessages(
      rowsPerPage,
      currentPage,
      sessionFarmerId || "",
      sessionTechnicianId || ""
    );

  useEffect(() => {
    if (chatMessages.length > 0 && currentUserId && currentUserType) {
      const lastMessage = chatMessages[chatMessages.length - 1];

      const isLastMessageFromCurrentUser =
        lastMessage.sender_id === currentUserId;
      const isCurrentUserTechnician = currentUserType === "technician";

      if (isLastMessageFromCurrentUser && !isCurrentUserTechnician) {
        handleGenerateAiReply();
      }
    }
  }, [chatMessages, currentUserId, currentUserType]);

  const BUCKET_NAME = "chat-images";
  const imageUrlPattern =
    /"https:\/\/vgckngozsjzlzkrntaoq\.supabase\.co\/storage\/v1\/object\/public\/chat-images\/[^"]+"/;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = async (message: string) => {
    if (!user) return;

    let partnerId;
    if (user.id === sessionFarmerId) {
      partnerId = sessionTechnicianId;
    } else {
      partnerId = sessionFarmerId;
    }

    const file = selectedImage;

    if (file) {
      const filePath =
        currentUserType === "farmer"
          ? `public/${user.id}/${partnerId}/${file.name}`
          : `public/${partnerId}/${user.id}/${file.name}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (data && !error) {
        const { publicUrl } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path).data;

        message = `"${publicUrl}"`;

        await insertChatMessage({
          sender_id: user.id,
          receiver_id: partnerId,
          message: message,
        });

        setMessageInput("");
        setSelectedImage(null);
      } else {
        console.error("Error uploading image:", error);
      }
    } else {
      await insertChatMessage({
        sender_id: user.id,
        receiver_id: partnerId,
        message: message,
      });

      setMessageInput("");
    }
  };

  const handleGenerateAiReply = async (chatMessageId?: number) => {
    if (chatMessages.length === 0) return;

    setAiIsGenerating(true);
    if (chatMessageId) {
      await updateChatMessage(chatMessageId, { message: "" });
    }

    try {
      // Limit to the last 30 messages or fewer
      const limitedMessages = chatMessages.slice(-30);

      // Map messages to "user" (farmer) and "model" (technician/AI), excluding URLs
      const conversationHistory = limitedMessages
        .filter((msg) => !imageUrlPattern.test(msg.message))
        .map((msg) => {
          return {
            role: msg.sender_id === user.id ? "model" : "user",
            parts: [{ text: msg.message }],
          };
        });

      const response = await fetch("/api/generate-ai-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationHistory }), // Pass the conversation history
      });

      if (!response.ok) {
        throw new Error("Failed to generate ai reply");
      }

      const data = await response.json();
      const aiReply = data.aiReply;

      if (chatMessageId) {
        // Update the existing chat message
        await updateChatMessage(chatMessageId, { message: aiReply });
      } else {
        // Insert a new chat message
        await insertChatMessage({
          sender_id: sessionTechnicianId,
          receiver_id: sessionFarmerId,
          is_ai: true,
          message: aiReply,
        });
      }

      setMessageInput("");
    } catch (error) {
      console.error("Error generating ai reply:", error);
    } finally {
      setAiIsGenerating(false);
    }
  };

  const [editMessageId, setEditMessageId] = useState<number | null>(null);
  const [editMessageInput, setEditMessageInput] = useState("");

  const handleEditClick = (messageId: number, message: string) => {
    setEditMessageId(messageId);
    setEditMessageInput(message);
  };

  const handleUpdateMessage = async () => {
    if (!editMessageInput || editMessageId === null) return;

    const updatedMessage = {
      message: editMessageInput,
    };

    const result = await updateChatMessage(editMessageId, updatedMessage);
    if (result) {
      setEditMessageId(null);
      setEditMessageInput("");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // to display as an image or plain text
  const renderMessage = (message: string) => {
    if (imageUrlPattern.test(message)) {
      const imageUrl = message.slice(1, -1); // Remove the surrounding quotation marks
      return (
        <img
          src={imageUrl}
          alt="Message Image"
          style={{ maxWidth: "100%", maxHeight: "200px" }}
        />
      );
    }
    return <ReactMarkdown>{message}</ReactMarkdown>;
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatMessages]);

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
                {chatMessages.map((message) => {
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
                      className={`w-full flex flex-col md:flex-row md:gap-4 py-2 ${
                        !isSender ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div className="flex">
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
                        } 
                            `}
                        style={{
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                          maxWidth: "100%",
                        }}
                      >
                        {renderMessage(message.message)}
                        {currentUserType === "farmer" &&
                          message.is_ai &&
                          !aiIsGenerating && (
                            <div className="text-gray-500 text-xs flex justify-between items-center">
                              <Button
                                // size="sm"
                                color="success"
                                variant="light"
                                isIconOnly
                                className="-ml-3"
                                onPress={() =>
                                  handleGenerateAiReply(message.chat_message_id)
                                }
                              >
                                <GrRefresh />
                              </Button>
                            </div>
                          )}
                        <div ref={bottomRef} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-none w-full pb-6">
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
              maxRows={3}
              minRows={1}
              color="success"
              endContent={
                <div className="flex gap-3 text-2xl">
                  <button
                    className={`${!messageInput && "hidden"}`}
                    onClick={async () => {
                      await handleSubmit(messageInput);
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
              }}
              isDisabled={isTextareaDisabled || aiIsGenerating}
            />
          </div>
        </div>
      </div>
    </>
  );
}
