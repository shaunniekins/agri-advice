"use client";

import { insertChatConnection } from "@/app/api/chatConnectionsIUD";
import { insertChatMessage } from "@/app/api/chatMessagesIUD";
import { RootState } from "@/app/reduxUtils/store";
import { Spinner, Textarea } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import React, { useRef } from "react";
import { useEffect, useState } from "react";
import { FaPiggyBank } from "react-icons/fa";
import { IoOptionsOutline, IoSendOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import usePremadePrompts from "@/hooks/usePremadePrompts";
import HelpComponent from "./Help";

const ChatPageComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userType, setUserType] = useState("");
  const [messageInput, setMessageInput] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [showPremadePrompts, setShowPremadePrompts] = useState(false);

  const router = useRouter();
  const premadePromptsRef = useRef<HTMLDivElement>(null);

  const { premadePrompts, isLoadingPrompts } = usePremadePrompts();

  useEffect(() => {
    if (user && user.user_metadata) {
      setUserType(user.user_metadata.user_type);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        premadePromptsRef.current &&
        !premadePromptsRef.current.contains(event.target as Node)
      ) {
        setShowPremadePrompts(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async () => {
    // insert chat connection
    const response = await insertChatConnection({
      farmer_id: user.id,
    });

    if (!response) {
      console.error("Error inserting chat connection");
      return;
    }

    const chatConnectionId = response.data[0].chat_connection_id;

    // insert message
    insertChatMessage({
      chat_connection_id: chatConnectionId,
      sender_id: user.id,
      message: messageInput,
    });

    setIsLoading(true);
    setMessageInput("");

    router.push(`/${userType}/chat/view?id=${chatConnectionId}`);
  };

  if (userType === "technician") {
    return <HelpComponent setIsLoading={setIsLoading} />;
  }

  if (userType === "farmer") {
    return (
      <>
        {isLoading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Spinner color="success" />
          </div>
        )}
        {!isLoading && (
          <div className="h-full w-full overflow-auto flex flex-col justify-center -mt-20">
            <div className="mb-8 flex flex-col gap-2">
              <h1 className="text-4xl lg:text-5xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-[#007057] to-yellow-300">
                Kamusta, {""}
                <span className="truncate">
                  {user ? user.user_metadata.first_name : "User"}
                </span>
              </h1>
              <h1 className="text-2xl md:4xl lg:text-5xl font-semibold">
                Unsa imong pangutana?
              </h1>
            </div>
            <div
              ref={premadePromptsRef}
              className={`${
                showPremadePrompts
                  ? "h-[92svh] fixed right-0 top-0 z-10 p-3 flex flex-col w-60 mt-12 bg-white shadow-lg rounded-l-lg overflow-hidden"
                  : "hidden"
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="w-full flex-1 overflow-y-auto custom-scrollbar">
                  <div className="flex flex-col flex-nowrap gap-2">
                    {isLoadingPrompts && (
                      <div className="h-44 w-44 justify-center items-center">
                        <Spinner color="success" />
                      </div>
                    )}
                    <h2>Suggested Queries</h2>
                    {!isLoadingPrompts &&
                      premadePrompts.length > 0 &&
                      premadePrompts.map((prompt, index) => (
                        <button
                          key={index}
                          className="relative h-44 w-full bg-[#007057] text-white text-start px-4 py-2 rounded-xl flex items-start justify-center"
                          onClick={() => {
                            setMessageInput(prompt.prompt_message);
                            setShowPremadePrompts(false);
                          }}
                        >
                          {prompt.prompt_message}
                          <span className="absolute bottom-4 left-4 text-white text-xs font-semibold">
                            {prompt.category}
                          </span>
                          <FaPiggyBank className="absolute bottom-4 right-4 text-white text-2xl" />
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full">
              <Textarea
                size="lg"
                radius="lg"
                maxRows={3}
                minRows={1}
                color="success"
                endContent={
                  <div className="flex gap-4 text-2xl pb-10">
                    <button
                      className={`${!messageInput && "hidden"}`}
                      onClick={handleSubmit}
                    >
                      <IoSendOutline />
                    </button>
                    <button
                      className={`${messageInput && "hidden"}`}
                      onClick={() => setShowPremadePrompts(true)}
                    >
                      <IoOptionsOutline />
                    </button>
                  </div>
                }
                placeholder="Enter message here"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
            </div>
          </div>
        )}
      </>
    );
  }
};

export default ChatPageComponent;
