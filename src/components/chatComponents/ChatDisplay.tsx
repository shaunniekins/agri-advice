"use client";

import {
  deleteSpecificChatMessage,
  insertChatMessage,
  updateChatMessage,
} from "@/app/api/chatMessagesIUD";
import { RootState } from "@/app/reduxUtils/store";
import useChatMessages from "@/hooks/useChatMessages";
import { getIdFromPathname } from "@/utils/compUtils";
import { Avatar, Button, Spinner, Textarea } from "@nextui-org/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { use, useRef } from "react";
import { useEffect, useState } from "react";
import {
  IoCloseCircleOutline,
  IoCloseOutline,
  IoCloseSharp,
  IoImage,
  IoImageOutline,
  IoSendOutline,
} from "react-icons/io5";
import { useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/utils/supabase";

export default function ChatDisplayComponent() {
  const user = useSelector((state: RootState) => state.user.user);
  const pathname = usePathname();
  const router = useRouter();
  const [messageInput, setMessageInput] = useState("");
  const [isTextareaDisabled, setIsTextareaDisabled] = useState(false);
  const [isLastMessageFromTechnician, setIsLastMessageFromTechnician] =
    useState(false);

  const [userType, setUserType] = useState("");
  const partnerId = getIdFromPathname(pathname);
  const rowsPerPage = 1000;
  const [currentPage, setCurrentPage] = useState(1);
  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState("");

  const searchParams = useSearchParams();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    setSenderId(searchParams.get("sender") || "");
    setReceiverId(searchParams.get("receiver") || "");
  }, [searchParams]);

  const { chatMessages, loadingChatMessages, errorChatMessages } =
    useChatMessages(rowsPerPage, currentPage, senderId || "", receiverId || "");

  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      setIsLastMessageFromTechnician(lastMessage.sender_id === user?.id);
    }
  }, [chatMessages]);

  useEffect(() => {
    if (user && user.user_metadata) {
      setUserType(user.user_metadata.user_type);
    }
  }, [user]);

  const BUCKET_NAME = "chat-images";
  const imageUrlPattern =
    /"https:\/\/vgckngozsjzlzkrntaoq\.supabase\.co\/storage\/v1\/object\/public\/chat-images\/[^"]+"/;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = async (message: string, isActive: boolean) => {
    if (!user) return;

    let partnerId;
    if (user.id === senderId) {
      partnerId = receiverId;
    } else {
      partnerId = senderId;
    }

    const file = selectedImage;

    if (file) {
      const filePath =
        userType === "farmer"
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
          is_active: isActive,
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
        is_active: isActive,
      });

      setMessageInput("");
    }
  };

  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const handleGenerateDraftReply = async () => {
    if (userType !== "technician" || chatMessages.length === 0) return;

    setIsGeneratingDraft(true);
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
        const errorBody = await response.text();
        throw new Error("Failed to generate draft reply");
      }

      const data = await response.json();
      const draftReply = data.draftReply;

      // Automatically send the draft reply
      await handleSubmit(draftReply, false);
    } catch (error) {
      console.error("Error generating draft reply:", error);
    } finally {
      setIsGeneratingDraft(false);
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
      is_active: userType === "technician" ? false : true,
    };

    const result = await updateChatMessage(editMessageId, updatedMessage);
    if (result) {
      setEditMessageId(null);
      setEditMessageInput("");
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this message?"
    );
    if (!isConfirmed) {
      return;
    }

    const result = await deleteSpecificChatMessage(messageId);
    if (result) {
      setEditMessageId(null);
      setEditMessageInput("");
    }
  };

  const handleSendMessage = async (messageId: number) => {
    const updatedMessage = {
      is_active: true,
    };

    const result = await updateChatMessage(messageId, updatedMessage);
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
                          } ${
                            userType === "technician" &&
                            isSender &&
                            !message.is_active
                              ? "w-full"
                              : ""
                          }`}
                          style={{
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                            maxWidth: "100%",
                          }}
                        >
                          {message.is_active === false && (
                            <div className="text-gray-500 text-xs flex justify-between items-center">
                              <span>[Draft]</span>
                              {userType === "technician" && (
                                <div className="flex gap-3">
                                  <button
                                    className={`${
                                      editMessageId ===
                                        message.chat_message_id && "hidden"
                                    } text-blue-500 text-xs`}
                                    onClick={() =>
                                      handleEditClick(
                                        message.chat_message_id,
                                        message.message
                                      )
                                    }
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="text-red-500 text-xs"
                                    onClick={() =>
                                      handleDeleteMessage(
                                        message.chat_message_id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                  <button
                                    className="text-green-500 text-xs"
                                    onClick={() =>
                                      handleSendMessage(message.chat_message_id)
                                    }
                                  >
                                    Send
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {editMessageId === message.chat_message_id ? (
                            <div className="w-full">
                              <Textarea
                                fullWidth
                                height={100}
                                maxRows={15}
                                value={editMessageInput}
                                onChange={(e) =>
                                  setEditMessageInput(e.target.value)
                                }
                              />
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" onClick={handleUpdateMessage}>
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  color="secondary"
                                  onClick={() => {
                                    setEditMessageId(null);
                                    setEditMessageInput("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {renderMessage(message.message)}
                              <div ref={bottomRef} />
                            </>
                          )}
                        </div>
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
                isDisabled={isGeneratingDraft || isLastMessageFromTechnician}
              >
                {isGeneratingDraft ? "Generating..." : "Generate AI Draft"}
              </Button>
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
                    onClick={() => handleSubmit(messageInput, true)}
                    disabled={isTextareaDisabled}
                  >
                    <IoSendOutline />
                  </button>

                  <button
                    className={`${messageInput && "hidden"}`}
                    onClick={() => fileInputRef.current?.click()}
                    // disabled={isTextareaDisabled}
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
                      <button
                        onClick={() => setSelectedImage(null)}
                        // disabled={isTextareaDisabled}
                      >
                        <IoCloseCircleOutline />
                      </button>
                      <button
                        onClick={() => handleSubmit("", true)}
                        // disabled={isTextareaDisabled}
                      >
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
              isDisabled={isTextareaDisabled || isGeneratingDraft}
            />
            {/* <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isTextareaDisabled}
            />
            {selectedImage && (
              <div>
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Selected"
                  style={{ maxWidth: "10px", maxHeight: "10px" }}
                />
              </div>
            )} */}
          </div>
        </div>
      </div>
    </>
  );
}
