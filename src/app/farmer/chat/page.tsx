"use client";

import useTechnicianUsers from "@/hooks/useTechnicianUsers";
import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
} from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { FaPiggyBank } from "react-icons/fa";
import { GiChoice } from "react-icons/gi";
import { IoAddSharp, IoSendOutline } from "react-icons/io5";

const FarmerChatPage = () => {
  const {
    technicianUsers,
    isLoadingTechnicianUsers,
    totalTechnicianEntries,
    fetchAndSubscribeTechnicianUsers,
    updateTechnicianUser,
  } = useTechnicianUsers();

  const [page, setPage] = useState(1);
  const rowsPerPage = 9;

  const [messageInput, setMessageInput] = useState("");
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [chosenTechnicianId, setChosenTechnicianId] = useState<string | null>(
    null
  );
  const [openTechnicianModal, setOpenTechnicianModal] = useState(false);

  // plan to use pagination (not yet implemented)
  useEffect(() => {
    fetchAndSubscribeTechnicianUsers(rowsPerPage, page);
  }, [fetchAndSubscribeTechnicianUsers]);

  const totalPages = Math.ceil(totalTechnicianEntries / rowsPerPage);

  useEffect(() => {
    // Fetch suggested prompts
    setSuggestedPrompts([
      "Unsaon nako pagsugod og pagbuhi og baboy?",
      "Unsa ang mga maayo nga pamaagi sa pagbuhi og baboy?",
      "Unsaon pagpakana og baboy para sa hapsay nga pagtubo?",
      "Unsa ang kasagarang sakit sa baboy ug unsaon kini malikayan?",
      "Unsaon pagpatambok og baboy?",
    ]);
  }, []);

  if (isLoadingTechnicianUsers) {
    return <div className="h-full w-full">Loading...</div>;
  }

  return (
    <>
      <Modal
        backdrop="blur"
        // isDismissable={!chosenTechnicianId}
        isOpen={openTechnicianModal}
        hideCloseButton={true}
        // onOpenChange ? !onclose : onClose
        onOpenChange={setOpenTechnicianModal}
        // onClose={() => {
        //   if (chosenTechnicianId) {
        //     const confirmClose = window.confirm(
        //       "You have selected a technician. Do you want to close and remove the selection?"
        //     );
        //     if (confirmClose) {
        //       setChosenTechnicianId(null);
        //       setOpenTechnicianModal(false);
        //     }
        //   } else {
        //     setOpenTechnicianModal(false);
        //   }
        // }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Choose Technician to Answer Your Question
              </ModalHeader>
              <ModalBody>
                <div className="w-full grid grid-cols-3">
                  {technicianUsers.map((item, index) => {
                    const initials = `${item.first_name[0].toUpperCase()}${item.last_name[0].toUpperCase()}`;
                    return (
                      <button
                        key={index}
                        className={`${
                          chosenTechnicianId === item.user_id
                            ? "border-[#007057]"
                            : ""
                        } border flex flex-col items-center rounded-lg p-2 gap-1`}
                        onClick={() => {
                          setChosenTechnicianId(
                            chosenTechnicianId === item.user_id
                              ? null
                              : item.user_id
                          );
                        }}
                      >
                        <Avatar size="sm" name={initials} showFallback />
                        <p className="text-xs">
                          {item.first_name} {item.last_name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="w-full flex justify-between items-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    size="sm"
                    color="success"
                    page={page}
                    total={totalPages}
                    onChange={(newPage) => setPage(newPage)}
                  />
                  <Button
                    isDisabled={!chosenTechnicianId}
                    className="bg-[#007057] text-white self-center"
                    onClick={() => {
                      setOpenTechnicianModal(false);
                    }}
                  >
                    Choose
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="h-full w-full overflow-auto relative">
        <div className="mt-6 mb-8 flex flex-col gap-2">
          <h1 className="text-4xl lg:text-5xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-[#007057] to-yellow-300">
            Kamusta, User
          </h1>
          <h1 className="text-4xl lg:text-5xl font-semibold">
            Unsa imong pangutana?
          </h1>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            radius="full"
            size="sm"
            variant={!chosenTechnicianId ? "ghost" : "flat"}
            color="success"
            startContent={<GiChoice />}
            className="self-end "
            onClick={() => setOpenTechnicianModal(true)}
          >
            {!chosenTechnicianId
              ? "Choose Technician"
              : "You chose a technician"}
          </Button>
          <div className="w-full flex overflow-x-auto custom-scrollbar">
            <div className="flex flex-nowrap gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="relative h-44 w-44 bg-[#007057] text-white text-start px-4 py-2 rounded-xl flex items-start justify-center"
                  onClick={() => setMessageInput(prompt)}
                >
                  {prompt}
                  <FaPiggyBank className="absolute bottom-4 right-4 text-white text-2xl" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full absolute bottom-0 pb-6">
          <Input
            size="lg"
            radius="full"
            endContent={
              <div className="flex gap-4 text-2xl">
                <IoSendOutline
                  className={`${
                    (!messageInput || !chosenTechnicianId) && "hidden"
                  }`}
                />
              </div>
            }
            placeholder="Enter message here"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
        </div>
      </div>
    </>
  );
};

export default FarmerChatPage;
