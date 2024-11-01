"use client";

import {
  deleteSpecificChatMessagesBasedOnSenderIdAndNonAiChat,
  insertChatMessage,
  updateChatMessage,
} from "@/app/api/chatMessagesIUD";
import { RootState } from "@/app/reduxUtils/store";
import useChatMessages from "@/hooks/useChatMessages";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Textarea,
} from "@nextui-org/react";
import { useSearchParams } from "next/navigation";
import React, { useRef } from "react";
import { useEffect, useState } from "react";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  subDays,
  differenceInYears,
} from "date-fns";
import {
  IoCloseCircleOutline,
  IoImageOutline,
  IoSendOutline,
} from "react-icons/io5";
import { useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/utils/supabase";
import { GrRefresh } from "react-icons/gr";
import usePartnerInfo from "@/hooks/usePartnerInfo";
import { FaBars } from "react-icons/fa";

export default function ChatDisplayComponent() {
  const user = useSelector((state: RootState) => state.user.user);
  const [messageInput, setMessageInput] = useState("");
  const [isTextareaDisabled, setIsTextareaDisabled] = useState(false);

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserType, setCurrentUserType] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const rowsPerPage = 1000;
  const [currentPage, setCurrentPage] = useState(1);

  // this is the conversation session (url)
  const [sessionFarmerId, setSessionFarmerId] = useState("");
  const [sessionTechnicianId, setSessionTechnicianId] = useState("");
  const [aiIsGenerating, setAiIsGenerating] = useState(false);

  const searchParams = useSearchParams();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const [otherPanelOpen, setOtherPanelOpen] = useState(false);

  const handleContentClick = () => {
    if (window.innerWidth < 768) {
      setOtherPanelOpen(false);
    }
  };

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

  useEffect(() => {
    // senderId = sessionFarmerId
    // receiverId = sessionTechnicianId
    setSessionFarmerId(searchParams.get("sender") || "");
    setSessionTechnicianId(searchParams.get("receiver") || "");

    if (user) {
      if (user.id === searchParams.get("sender")) {
        setPartnerId(searchParams.get("receiver") || "");
      } else {
        setPartnerId(searchParams.get("sender") || "");
      }
    }
  }, [searchParams, user]);

  const { partnerData } = usePartnerInfo(partnerId);

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

    if (currentUserType === "technician") {
      await deleteSpecificChatMessagesBasedOnSenderIdAndNonAiChat(
        currentUserId
      );
    }

    const file = selectedImage;

    if (file) {
      const filePath =
        currentUserType === "farmer"
          ? `public/${user.id}/${partnerId}/${file.name}`
          : `public/${partnerId}/${user.id}/${file.name}`;

      if (currentUserType === "technician") {
        const { data: list } = await supabase.storage
          .from("chat-images")
          .list(filePath);
        const filesToRemove = list?.map((x) => `${filePath}/${x.name}`);

        if (filesToRemove && filesToRemove.length > 0) {
          const { error } = await supabase.storage
            .from("chat-images")
            .remove(filesToRemove);

          if (error) {
            console.error("Error deleting image:", error.message);
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

  const displayedDates = new Set();

  const formatMessageDate = (date: any) => {
    const parsedDate = new Date(date);
    const now = new Date();

    if (isToday(parsedDate)) {
      return `TODAY AT ${format(parsedDate, "h:mm a")}`;
    } else if (isYesterday(parsedDate)) {
      return `YESTERDAY AT ${format(parsedDate, "h:mm a")}`;
    } else if (isThisWeek(parsedDate)) {
      return `${format(parsedDate, "EEE")} AT ${format(parsedDate, "h:mm a")}`;
    } else if (parsedDate > subDays(now, 5)) {
      return `${format(parsedDate, "EEE")} AT ${format(parsedDate, "h:mm a")}`;
    } else {
      return `${format(parsedDate, "dd MMM")} AT ${format(
        parsedDate,
        "h:mm a"
      )}`;
    }
  };

  const formatMessageTime = (date: any) => {
    const parsedDate = new Date(date);
    return format(parsedDate, "h:mm a");
  };

  const calculateAge = (birthDate: string): number => {
    const birthDateObj = new Date(birthDate);
    const currentDate = new Date();
    return differenceInYears(currentDate, birthDateObj);
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
      <div className="h-full flex flex-col overflow-hidden">
        <div className="h-full overflow-y-auto grid grid-cols-1 md:grid-cols-[2fr_1fr] md:gap-10">
          {/* Chat view */}
          <div
            className="h-full overflow-y-auto"
            onClick={() => handleContentClick()}
          >
            <div className="h-full w-full">
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
                        ${
                          (currentUserType === "farmer" &&
                            (message.sender_id === currentUserId ||
                              (message.sender_id !== currentUserId &&
                                message.is_ai))) ||
                          (currentUserType === "technician" &&
                            (message.sender_id !== currentUserId ||
                              (message.sender_id === currentUserId &&
                                message.is_ai)))
                            ? ""
                            : "hidden"
                        }  
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
                          !isSender ? "justify-start" : "justify-end"
                        }
                        
                        `}
                      >
                        <div className="flex">
                          {!isSender &&
                            (!senderProfilePicture ? (
                              message.is_ai ? (
                                <Avatar size="sm" name="AI" showFallback />
                              ) : (
                                <Avatar
                                  size="sm"
                                  name={initials}
                                  showFallback
                                />
                              )
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
                          className={`message flex flex-col max-w-full whitespace-pre-wrap flex-wrap text-wrap break-words `}
                          style={{
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                            maxWidth: "100%",
                          }}
                        >
                          <div
                            className={`max-w-full text-sm py-2 
                          ${isSender && "px-3 rounded-2xl bg-green-200"}`}
                          >
                            {renderMessage(message.message)}
                          </div>
                          {selectedMessageId === message.chat_message_id && (
                            <span
                              className={`text-[0.7rem] ${
                                isSender ? "text-end" : "text-start"
                              }`}
                              //  ${message.is_ai && "hidden"}
                            >
                              {formatMessageTime(message.created_at)}
                            </span>
                          )}

                          {currentUserType === "farmer" &&
                            message.is_ai &&
                            !aiIsGenerating && (
                              <div className="text-gray-500 text-xs flex justify-between items-center">
                                <Button
                                  color="success"
                                  variant="light"
                                  isIconOnly
                                  className="-ml-3"
                                  onPress={() =>
                                    handleGenerateAiReply(
                                      message.chat_message_id
                                    )
                                  }
                                >
                                  <GrRefresh />
                                </Button>
                              </div>
                            )}
                          <div ref={bottomRef} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Extra side panel */}
          {/* <div className="h-full overflow-y-auto hidden md:block"> */}
          <div
            className={`h-full overflow-y-auto md:block bg-[#F4FFFC] md:bg-none rounded-tl-md md:rounded-none ${
              otherPanelOpen
                ? "fixed right-0 top-0 z-10 py-5 px-3 flex flex-col w-72 md:w-96 lg:w-auto md:static md:flex-none md:block md:p-0"
                : "hidden"
            }`}
          >
            {/* partners details */}
            <div className="flex flex-col gap-3">
              {partnerData && (
                <Card className="shadow-none">
                  <CardHeader className="flex justify-center">
                    <h1 className="font-bold">
                      {currentUserType === "farmer"
                        ? "Technician"
                        : "Pig Farmer"}
                      &apos;s Details
                    </h1>
                  </CardHeader>
                  <CardBody className="text-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex">
                        {!partnerData.profile_picture ? (
                          <Avatar
                            name={
                              partnerData.first_name[0] +
                              partnerData.last_name[0]
                            }
                            showFallback
                          />
                        ) : (
                          <Avatar
                            src={partnerData.profile_picture}
                            alt="Profile"
                            showFallback
                            className="rounded-full object-cover cursor-pointer"
                          />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {partnerData.first_name}
                        </span>
                        <span className="text-xs">{partnerData.email}</span>
                      </div>
                    </div>
                    <h2>
                      <span className="font-semibold">First Name: </span>
                      {partnerData.first_name}
                    </h2>
                    <h2>
                      <span className="font-semibold">Last Name: </span>
                      {partnerData.last_name}
                    </h2>
                    <h2>
                      <span className="font-semibold">Email: </span>
                      {partnerData.email}
                    </h2>
                    <h2>
                      <span className="font-semibold">Location: </span>
                      {partnerData.address}
                    </h2>
                    <h2>
                      <span className="font-semibold">Age: </span>
                      {partnerData.birth_date
                        ? calculateAge(partnerData.birth_date) + " years old"
                        : "N/A"}
                    </h2>
                    {currentUserType !== "farmer" && (
                      <>
                        <h2>
                          <span className="font-semibold">No. of Pigs: </span>
                          {partnerData.num_heads || "N/A"}
                        </h2>
                        <h2>
                          <span className="font-semibold">
                            Years of Experience:{" "}
                          </span>
                          {partnerData.experience_years || "N/A"}
                        </h2>
                        <h2>
                          <span className="font-semibold">Operations: </span>
                          {partnerData.operations || "N/A"}
                        </h2>
                      </>
                    )}
                    {currentUserType !== "technician" && (
                      <>
                        <h2>
                          <span className="font-semibold">
                            Specialization:{" "}
                          </span>
                          {partnerData.specialization || "N/A"}
                        </h2>
                        <h2>
                          <span className="font-semibold">Experiences: </span>
                          {partnerData.experiences || "N/A"}
                        </h2>
                      </>
                    )}
                  </CardBody>
                </Card>
              )}
            </div>
            {/* other chat */}
            <div className="flex flex-col gap-3 mt-5">
              {chatMessages.map((message) => {
                const messageDate = formatMessageDate(message.created_at);
                const showDate = !displayedDates.has(messageDate);

                if (showDate) {
                  displayedDates.add(messageDate);
                }

                const shouldShow =
                  (currentUserType === "farmer" &&
                    message.sender_id !== currentUserId &&
                    !message.is_ai) ||
                  (currentUserType === "technician" &&
                    message.sender_id === currentUserId &&
                    !message.is_ai);

                if (!shouldShow) return null;

                return (
                  <Card key={message.chat_message_id} className="shadow-none">
                    <CardHeader className="flex flex-col justify-center">
                      <h1 className="font-bold">
                        {currentUserType === "farmer"
                          ? "More Advice Here"
                          : "Your Advice"}
                      </h1>
                      <span className="text-[0.7rem]">
                        {formatMessageDate(message.created_at)}
                      </span>
                    </CardHeader>
                    <CardBody>
                      <div
                        className="w-full text-sm break-words"
                        style={{
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                          maxWidth: "100%",
                        }}
                      >
                        {renderMessage(message.message)}
                        <div ref={bottomRef} />
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
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
            <Button
              isIconOnly
              size="lg"
              color="success"
              variant="light"
              startContent={<FaBars size={20} />}
              className="md:hidden md:z-auto z-20"
              onPress={() => setOtherPanelOpen(!otherPanelOpen)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
