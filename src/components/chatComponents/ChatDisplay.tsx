"use client";

import {
  insertChatMessage,
  updateChatMessage,
  updateReceiverMessagesReadStatus,
  updateSenderMessagesReadStatus,
} from "@/app/api/chatMessagesIUD";
import {
  unarchiveChatConnectionForFarmer,
  unarchiveChatConnectionForTechnician,
} from "@/app/api/chatConnectionsIUD";
import { RootState } from "@/app/reduxUtils/store";
import useChatMessages from "@/hooks/useChatMessages";
import { Avatar, Button, Spinner, Textarea } from "@nextui-org/react";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useRef, useCallback } from "react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  IoCloseCircleOutline,
  IoImageOutline,
  IoSendOutline,
} from "react-icons/io5";
import { useSelector } from "react-redux";
import { supabase } from "@/utils/supabase";
import { generateAIReply } from "@/utils/aiService";
import { GrRefresh } from "react-icons/gr";
import useChatConnectionForTechnicianRecipient from "@/hooks/useChatConnectionForTechnicianRecipient";
import {
  formatMessageDate,
  formatMessageTime,
  renderMessage,
} from "@/utils/compUtils";
import ChatDisplayExtensionComponent from "./ChatDisplayExtension";
import { FaBars, FaRobot, FaUser } from "react-icons/fa";

export default function ChatDisplayComponent() {
  const user = useSelector((state: RootState) => state.user.user);
  const [messageInput, setMessageInput] = useState("");
  const [isTextareaDisabled, setIsTextareaDisabled] = useState(false);
  const [isConversationEnded, setIsConversationEnded] = useState(false);
  const [isConversationSolved, setIsConversationSolved] = useState(false);
  const [connectionLoaded, setConnectionLoaded] = useState(false);

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserType, setCurrentUserType] = useState("");
  const rowsPerPage = 1000;
  const [currentPage, setCurrentPage] = useState(1);

  const pathName = usePathname();
  const searchParams = useSearchParams();

  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [parentChatConnectionId, setParentChatConnectionId] = useState("");

  const [selectedMessageToEdit, setSelectedMessageToEdit] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const [otherPanelOpen, setOtherPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [processingMessageId, setProcessingMessageId] = useState<number | null>(
    null
  );
  const hasGeneratedReplyRef = useRef(false);

  const [respondedMessageIds, setRespondedMessageIds] = useState<Set<number>>(
    new Set()
  );

  const [shouldGenerateReplyAfterSend, setShouldGenerateReplyAfterSend] =
    useState(false);
  const lastMessageRef = useRef<string | null>(null);
  const [manuallyTriggeredAI, setManuallyTriggeredAI] = useState(false);
  const justSentMessageRef = useRef<string | null>(null);

  // Handle resizing behavior for sidebar
  useEffect(() => {
    const handleResize = () => {
      const isMobileSize = window.innerWidth < 768;
      setIsMobile(isMobileSize);

      if (isMobileSize) {
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
    // Get chat ID from search params instead of URL path
    const chatId = searchParams?.get("id");
    if (chatId) {
      setChatConnectionId(chatId);
    }
  }, [searchParams]);

  const { chatConnection, isLoadingChatConnections } =
    useChatConnectionForTechnicianRecipient(chatConnectionId);

  useEffect(() => {
    if (chatConnection && chatConnection[0])
      setParentChatConnectionId(chatConnection[0]?.parent_chat_connection_id);
  }, [chatConnection]);

  useEffect(() => {
    if (chatConnection && chatConnection.length > 0) {
      console.log("Conversation status:", {
        connection: chatConnection[0],
        status: chatConnection[0]?.status,
        userType: currentUserType,
      });

      // Check if the conversation has been ended by the partner
      const isEnded =
        currentUserType === "farmer"
          ? chatConnection[0]?.technician_deleted
          : chatConnection[0]?.farmer_deleted;

      // Check if the conversation has been marked as solved
      const isSolved = chatConnection[0]?.status === "solved";

      setIsConversationEnded(!!isEnded);
      setIsConversationSolved(!!isSolved);
      setIsTextareaDisabled(!!isEnded || !!isSolved);
      setConnectionLoaded(true);
    }
  }, [chatConnection, currentUserType]);

  // current user messages
  const { chatMessages, loadingChatMessages } = useChatMessages(
    rowsPerPage,
    currentPage,
    chatConnectionId,
    currentUserType // Pass the user type to filter deleted conversations
  );

  const BUCKET_NAME = "chat-images";
  const imageUrlPattern =
    /"https:\/\/vgckngozsjzlzkrntaoq\.supabase\.co\/storage\/v1\/object\/public\/chat-images\/[^"]+"/;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const shouldGenerateReply = () => {
      // First check: Don't generate if not a farmer conversation
      if (currentUserType !== "farmer") return false;

      // Second check: STRICT check for ANY shared conversation (parent OR child)
      if (
        parentChatConnectionId ||
        chatConnection?.[0]?.recipient_technician_id
      )
        return false;

      // Don't auto-respond if we've just manually triggered a response
      if (manuallyTriggeredAI) return false;

      // Other existing checks
      if (!chatMessages.length || !currentUserId || !currentUserType)
        return false;
      if (aiIsGenerating || hasGeneratedReplyRef.current) return false;

      const lastMessage = chatMessages[chatMessages.length - 1];

      // Skip if this is the message we just sent and responded to
      if (justSentMessageRef.current === lastMessage.message) return false;

      // Check if we've already responded to this message
      if (respondedMessageIds.has(lastMessage.chat_message_id)) return false;

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
      // console.log("Auto-triggering AI reply for existing message");
      hasGeneratedReplyRef.current = true;

      // Add the message ID to the set of responded messages
      const lastMessageId =
        chatMessages[chatMessages.length - 1].chat_message_id;
      setRespondedMessageIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(lastMessageId);
        return newSet;
      });

      handleGenerateAiReply();
    }
  }, [
    currentUserType,
    chatMessages,
    currentUserId,
    chatConnectionId,
    parentChatConnectionId,
    chatConnection,
    respondedMessageIds,
    aiIsGenerating,
    processingMessageId,
    manuallyTriggeredAI,
  ]);

  const handleGenerateAiReply = async (
    chatMessageId?: number,
    directMessage?: string
  ) => {
    // Strict check: No AI generation in ANY shared conversation (parent or child)
    if (
      parentChatConnectionId ||
      chatConnection?.[0]?.recipient_technician_id
    ) {
      console.log("Prevented AI generation in shared conversation");
      return;
    }

    if (aiIsGenerating) return;
    if (chatMessages.length === 0 && !chatMessageId && !directMessage) return;

    setAiIsGenerating(true);
    setProcessingMessageId(chatMessageId || null);

    try {
      // Get relevant messages for context (last 10 messages)
      const relevantMessages = chatMessages
        .slice(-10)
        .filter((msg) => !imageUrlPattern.test(msg.message));

      // Add the direct message to context if provided
      let contextMessages = [...relevantMessages];
      if (directMessage) {
        // Add the new message to the context so AI has immediate access to it
        contextMessages.push({
          sender_user_type: "farmer",
          message: directMessage,
          created_at: new Date().toISOString(),
          is_ai: false,
        });
      }

      // If we're responding to a specific message ID, mark it as responded to
      if (chatMessageId) {
        setRespondedMessageIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(chatMessageId);
          return newSet;
        });
      }

      console.log(
        "Generating AI reply with context:",
        directMessage ? "Has direct message" : "No direct message"
      );

      // Use client-side AI service instead of API route
      const aiReply = await generateAIReply(
        contextMessages,
        directMessage || lastMessageRef.current
      );

      if (chatMessageId) {
        await updateChatMessage(chatMessageId, {
          message: aiReply,
          chat_connection_id: chatConnectionId,
        });
      } else {
        await insertChatMessage({
          message: aiReply,
          chat_connection_id: chatConnectionId,
          receiver_id: user.id,
        });
      }

      // Reset references and flags
      lastMessageRef.current = null;
      justSentMessageRef.current = null;

      // Set a flag to prevent duplicate responses
      setManuallyTriggeredAI(true);
      setTimeout(() => setManuallyTriggeredAI(false), 2000);

      // Reset states
      setMessageInput("");
    } catch (error) {
      console.error("Error generating AI reply:", error);
    } finally {
      setAiIsGenerating(false);
      setProcessingMessageId(null);
    }
  };

  useEffect(() => {
    hasGeneratedReplyRef.current = false;
    setRespondedMessageIds(new Set());
  }, [chatConnectionId]);

  const handleSubmit = async (message: string) => {
    if (!user || isConversationEnded) return; // Prevent sending if the conversation is ended
    const file = selectedImage;

    // First, unarchive the conversation for both parties when a new message is sent
    // This ensures archived conversations reappear when there's new activity
    if (currentUserType === "farmer") {
      await unarchiveChatConnectionForFarmer(chatConnectionId);
    } else if (currentUserType === "technician") {
      await unarchiveChatConnectionForTechnician(chatConnectionId);
    }

    // Store a copy of the message for AI context
    const messageCopy = message;
    justSentMessageRef.current = message;
    lastMessageRef.current = message;

    // Determine if this is an AI conversation
    const isAiConversation =
      currentUserType === "farmer" &&
      !parentChatConnectionId &&
      !chatConnection?.[0]?.recipient_technician_id;

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
      const messageResponse = await insertChatMessage({
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

      setMessageInput("");

      // Directly generate AI response with the exact message content
      if (isAiConversation && !aiIsGenerating) {
        console.log("Directly triggering AI reply for just-sent message");

        // Record this message ID to avoid double responses
        if (messageResponse && messageResponse[0]) {
          setRespondedMessageIds((prev) => {
            const newSet = new Set(prev);
            newSet.add(messageResponse[0].chat_message_id);
            return newSet;
          });
        }

        // Generate AI reply with direct message content - this bypasses any database delays
        handleGenerateAiReply(undefined, messageCopy);
      }
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

  // Add a function to mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!chatConnectionId || !currentUserId || !currentUserType) return;

    try {
      // Only mark messages as read where the current user is the RECEIVER
      // This prevents marking messages as read when the user isn't looking at them
      const { data, error } = await supabase
        .from("ChatMessages")
        .update({ is_receiver_read: true })
        .eq("chat_connection_id", chatConnectionId)
        .eq("receiver_id", currentUserId) // Only update messages where current user is the receiver
        .not("is_receiver_read", "eq", true);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [chatConnectionId, currentUserId, currentUserType]);

  // Mark messages as read when component mounts or chat changes
  useEffect(() => {
    // Only run marking messages as read if the component is mounted/visible
    const readInterval = setInterval(() => {
      markMessagesAsRead();
    }, 5000); // Check every 5 seconds

    // Initial mark as read
    markMessagesAsRead();

    return () => clearInterval(readInterval);
  }, [markMessagesAsRead, chatConnectionId]);

  // Add handler for subscription to mark new messages as read immediately
  useEffect(() => {
    if (!chatConnectionId) return;

    const channel = supabase
      .channel(`chat-read-status-${chatConnectionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ChatMessages",
          filter: `chat_connection_id=eq.${chatConnectionId}`,
        },
        () => {
          // When a new message arrives, mark it as read immediately
          markMessagesAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatConnectionId, markMessagesAsRead]);

  // Remove or replace the post-send effect since we're handling it directly
  useEffect(() => {
    if (shouldGenerateReplyAfterSend && !aiIsGenerating) {
      // We no longer need this mechanism since we call handleGenerateAiReply directly
      setShouldGenerateReplyAfterSend(false);
    }
  }, [shouldGenerateReplyAfterSend, aiIsGenerating]);

  // Don't render input field until we know the conversation status
  const showInput = connectionLoaded && !isLoadingChatConnections;

  // Check if input should be disabled when viewing AI conversation on mobile
  const isViewingAIOnMobile =
    isMobile && currentUserType !== "farmer" && otherPanelOpen;
  const shouldDisableInput =
    isTextareaDisabled ||
    aiIsGenerating ||
    isConversationEnded ||
    isConversationSolved ||
    isViewingAIOnMobile;

  if (loadingChatMessages || isLoadingChatConnections) {
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
          className={`h-full overflow-y-auto relative
            ${
              currentUserType !== "farmer"
                ? "md:grid md:grid-cols-[2fr_1fr] md:gap-10"
                : "grid grid-cols-1"
            }`}
        >
          {/* Chat view */}
          <div
            className={`
              h-full w-full overflow-y-auto bg-[#F4FFFC] md:bg-none rounded-tl-md md:rounded-none
              ${currentUserType !== "farmer" && !otherPanelOpen ? "block" : ""}
              ${
                currentUserType !== "farmer" && otherPanelOpen
                  ? "md:block hidden"
                  : ""
              }`}
          >
            <div className="h-full w-full">
              <div className="flex flex-col gap-3">
                {chatMessages.map((message: any, index: number) => {
                  // Ensure the sender check is correct - this determines the message positioning
                  const isSentByCurrentUser = message.sender_id === user.id;
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
                        className={`w-full flex flex-row gap-2 py-2 ${
                          isSentByCurrentUser ? "justify-end" : "justify-start"
                        }
                        
                        `}
                      >
                        {!isSentByCurrentUser && (
                          <div className="flex-shrink-0">
                            <Avatar
                              size="sm"
                              src={senderProfilePicture || undefined}
                              name={!message.sender_id ? "AI" : initials}
                              showFallback
                            />
                          </div>
                        )}

                        <div
                          className={`message flex flex-col max-w-[85%] whitespace-pre-wrap flex-wrap text-wrap break-words relative`}
                          style={{
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          <div
                            className={`max-w-full text-sm py-2 px-3 rounded-2xl relative ${
                              isSentByCurrentUser
                                ? "bg-green-200"
                                : "bg-gray-200"
                            }`}
                          >
                            {renderMessage(message.message)}
                            <div ref={bottomRef} />
                          </div>

                          {selectedMessageId === message.chat_message_id && (
                            <>
                              <span
                                className={`text-[0.7rem] ${
                                  isSentByCurrentUser
                                    ? "text-end"
                                    : "text-start"
                                }`}
                              >
                                {formatMessageTime(message.created_at)}
                              </span>
                              {isSentByCurrentUser &&
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

                          {!isSentByCurrentUser &&
                            !aiIsGenerating &&
                            !(
                              parentChatConnectionId ||
                              chatConnection?.[0]?.recipient_technician_id
                            ) &&
                            currentUserType === "farmer" &&
                            !message.sender_id && (
                              <div className="text-gray-500 text-xs flex justify-start items-center">
                                <Button
                                  size="sm"
                                  color="success"
                                  variant="light"
                                  isIconOnly
                                  className="md:-ml-3"
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

          {currentUserType !== "farmer" && (
            <div
              className={`
              ${otherPanelOpen ? "block" : "hidden"} 
              md:block 
              absolute md:relative 
              top-0 right-0 
              h-full w-full md:w-auto 
              bg-white md:bg-transparent 
              z-30 md:z-auto
            `}
            >
              <ChatDisplayExtensionComponent
                currentUserType={currentUserType}
                parentChatConnectionId={parentChatConnectionId}
              />
            </div>
          )}
        </div>
        <div
          className={`${
            currentUserType !== "farmer" && "md:grid md:grid-cols-[2fr_1fr]"
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

          {showInput && (
            <div className="flex flex-col gap-3">
              {isViewingAIOnMobile && (
                <div className="flex items-center gap-2 py-2">
                  <span className="text-sm text-blue-600 font-medium">
                    Viewing AI conversation. Switch to technician view to send
                    messages.
                  </span>
                </div>
              )}

              {isConversationEnded && (
                <div className="flex items-center gap-2 py-2">
                  <span className="text-sm text-gray-500 font-medium">
                    This conversation has been ended by the other user. You can
                    no longer send messages.
                  </span>
                </div>
              )}

              {isConversationSolved && (
                <div className="flex items-center gap-2 py-2">
                  <span className="text-sm text-green-600 font-medium">
                    This conversation has been marked as solved. No further
                    messages can be sent.
                  </span>
                </div>
              )}
              <Textarea
                size="lg"
                radius="lg"
                maxRows={6}
                minRows={1}
                className={shouldDisableInput ? "pointer-events-none" : ""}
                color={`${
                  selectedMessageToEdit
                    ? "secondary"
                    : isConversationEnded ||
                      isConversationSolved ||
                      isViewingAIOnMobile
                    ? "default"
                    : "success"
                }`}
                endContent={
                  <div className="flex gap-3 text-2xl pointer-events-auto">
                    <button
                      className={`${!messageInput && "hidden"} ${
                        (isConversationEnded ||
                          isConversationSolved ||
                          isViewingAIOnMobile) &&
                        "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={async () => {
                        if (
                          isConversationEnded ||
                          isConversationSolved ||
                          isViewingAIOnMobile
                        )
                          return;

                        if (selectedMessageToEdit) {
                          await handleEditAIMessage(
                            parseInt(selectedMessageToEdit)
                          );
                        } else {
                          await handleSubmit(messageInput);
                        }
                      }}
                      disabled={shouldDisableInput}
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
                      startContent={
                        otherPanelOpen ? (
                          <FaUser size={20} />
                        ) : (
                          <FaRobot size={20} />
                        )
                      }
                      className={`${
                        currentUserType === "farmer"
                          ? "hidden"
                          : "md:hidden md:z-auto z-20"
                      }`}
                      onPress={() => setOtherPanelOpen(!otherPanelOpen)}
                      aria-label={
                        otherPanelOpen
                          ? "switch to technician view"
                          : "switch to AI view"
                      }
                    />
                  </div>
                }
                placeholder={
                  isViewingAIOnMobile
                    ? "Switch to technician view to send messages"
                    : isConversationSolved
                    ? "This conversation has been marked as solved"
                    : isConversationEnded
                    ? "This conversation has ended"
                    : !selectedImage
                    ? "Enter message here"
                    : "You have selected an image"
                }
                value={messageInput}
                onChange={(e) => {
                  if (
                    selectedImage ||
                    isConversationEnded ||
                    isConversationSolved ||
                    isViewingAIOnMobile
                  )
                    return;
                  setMessageInput(e.target.value);

                  if (e.target.value === "") {
                    setSelectedMessageToEdit("");
                  }
                }}
                isDisabled={shouldDisableInput}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
