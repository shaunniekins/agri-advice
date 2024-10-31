"use client";

import { insertChatConnection } from "@/app/api/chatConnectionsIUD";
import { insertChatMessage } from "@/app/api/chatMessagesIUD";
import { RootState } from "@/app/reduxUtils/store";
import { Spinner, Textarea } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useEffect, useState } from "react";
import { FaPiggyBank } from "react-icons/fa";
import { IoSendOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import usePremadePrompts from "@/hooks/usePremadePrompts";
import HelpComponent from "./Help";
import useTechnician from "@/hooks/useTechnician";

const ChatPageComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userType, setUserType] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [chosenTechnicianId, setChosenTechnicianId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    if (user && user.user_metadata) {
      setUserType(user.user_metadata.user_type);
      setUserLocation(user.user_metadata.address);
    }
  }, [user]);

  const { technicianData, isLoadingTechnician } = useTechnician(userLocation);

  useEffect(() => {
    if (!isLoadingTechnician) {
      setIsLoading(false);
    }
    setChosenTechnicianId(technicianData[0]?.id);
  }, [technicianData]);

  const { premadePrompts, isLoadingPrompts } = usePremadePrompts();

  const handleSubmit = async () => {
    if (!chosenTechnicianId) {
      alert(
        "There is currently no assigned technician in your area. Please contact the admin if this issue persists."
      );
      return;
    }

    // insert chat connection
    const response = await insertChatConnection({
      farmer_id: user.id,
      technician_id: chosenTechnicianId,
    });

    if (!response) {
      console.error("Error inserting chat connection");
      return;
    }

    insertChatMessage({
      sender_id: user.id,
      receiver_id: chosenTechnicianId,
      message: messageInput,
    });

    setIsLoading(true);
    setChosenTechnicianId(null);
    setMessageInput("");

    router.push(
      `/${userType}/chat/id?sender=${user.id}&receiver=${chosenTechnicianId}`
    );
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
          <div className="h-full w-full overflow-auto relative">
            <div className="mt-6 mb-8 flex flex-col gap-2">
              <h1 className="text-4xl lg:text-5xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-[#007057] to-yellow-300">
                Kamusta, {""}
                <span className="truncate">
                  {user ? user.user_metadata.first_name : "User"}
                </span>
              </h1>
              <h1 className="text-4xl lg:text-5xl font-semibold">
                Unsa imong pangutana?
              </h1>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-full flex overflow-x-auto custom-scrollbar">
                <div className="flex flex-nowrap gap-2">
                  {isLoadingPrompts && (
                    <div className="h-44 w-44 justify-center items-center">
                      <Spinner color="success" />
                    </div>
                  )}
                  {!isLoadingPrompts &&
                    premadePrompts.length > 0 &&
                    premadePrompts.map((prompt, index) => (
                      <button
                        key={index}
                        className="relative h-44 w-44 bg-[#007057] text-white text-start px-4 py-2 rounded-xl flex items-start justify-center"
                        onClick={() => setMessageInput(prompt.prompt_message)}
                      >
                        {prompt.prompt_message}
                        <FaPiggyBank className="absolute bottom-4 right-4 text-white text-2xl" />
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="w-full absolute bottom-0 pb-6">
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
                      onClick={handleSubmit}
                    >
                      <IoSendOutline />
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
