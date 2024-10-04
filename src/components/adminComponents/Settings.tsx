"use client";

import React, { useState } from "react";
import { FaPiggyBank } from "react-icons/fa";
import { IoAdd } from "react-icons/io5";
import usePremadePrompts from "@/hooks/usePremadePrompts";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@nextui-org/react";
import {
  insertPremadePrompt,
  updatePremadePrompt,
  deletePremadePrompt,
} from "@/app/api/premadePromptsIUD";

const AdminSettings = () => {
  const { premadePrompts, isLoadingPrompts, lastOrderValue } =
    usePremadePrompts();
  const [isModalSuggestedPromptOpen, setIsModalSuggestedPromptOpen] =
    useState(false);
  const [isSuggestedPromptEditMode, setIsSuggestedPromptEditMode] =
    useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [selectedSuggstedPrompt, setSelectedSuggstedPrompt] =
    useState<any>(null);

  const handleAddPrompt = async () => {
    const newPrompt = {
      prompt_message: newMsg,
      prompt_order: lastOrderValue ? lastOrderValue + 1 : 1,
    };

    const response = await insertPremadePrompt(newPrompt);
    if (response) {
      setIsModalSuggestedPromptOpen(false);
      setNewMsg("");
    }
  };

  const handleEditPrompt = async () => {
    if (!selectedSuggstedPrompt) return;

    const updatedPrompt = {
      prompt_message: newMsg,
    };

    const response = await updatePremadePrompt(
      selectedSuggstedPrompt.prompt_id,
      updatedPrompt
    );
    if (response) {
      setIsModalSuggestedPromptOpen(false);
      setIsSuggestedPromptEditMode(false);
      setSelectedSuggstedPrompt(null);
      setNewMsg("");
    }
  };

  const handleDeletePrompt = async () => {
    if (!selectedSuggstedPrompt) return;

    const response = await deletePremadePrompt(
      selectedSuggstedPrompt.prompt_id
    );
    if (response) {
      setIsModalSuggestedPromptOpen(false);
      setIsSuggestedPromptEditMode(false);
      setSelectedSuggstedPrompt(null);
      setNewMsg("");
    }
  };

  return (
    <>
      <Modal
        isOpen={isModalSuggestedPromptOpen}
        onOpenChange={setIsModalSuggestedPromptOpen}
        onClose={() => {
          setIsSuggestedPromptEditMode(false);
          setSelectedSuggstedPrompt(null);
          setNewMsg("");
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {isSuggestedPromptEditMode ? "Edit Prompt" : "Add New Prompt"}
              </ModalHeader>
              <ModalBody>
                <Input
                  fullWidth
                  label="Prompt"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                />
              </ModalBody>
              <ModalFooter
                className={`flex ${
                  isSuggestedPromptEditMode ? "justify-between" : "justify-end"
                }`}
              >
                <Button
                  color="danger"
                  variant="flat"
                  className={`${
                    isSuggestedPromptEditMode && selectedSuggstedPrompt
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={handleDeletePrompt}
                >
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button
                    color="warning"
                    variant="flat"
                    onClick={() => {
                      setIsModalSuggestedPromptOpen(false);
                      setIsSuggestedPromptEditMode(false);
                      setSelectedSuggstedPrompt(null);
                      setNewMsg("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    variant="flat"
                    onClick={() =>
                      isSuggestedPromptEditMode && selectedSuggstedPrompt
                        ? handleEditPrompt()
                        : handleAddPrompt()
                    }
                  >
                    {isSuggestedPromptEditMode ? "Save" : "Add"}
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className="h-full w-full flex flex-col gap-2">
        <div className="flex justify-between gap-2">
          <h2 className="text-lg font-semibold">Suggested Prompts</h2>
          <Button
            color="success"
            className="text-white"
            startContent={<IoAdd />}
            onClick={() => setIsModalSuggestedPromptOpen(true)}
          >
            Add New Prompt
          </Button>
        </div>

        <div className="w-full flex overflow-x-auto custom-scrollbar">
          <div className="flex flex-nowrap gap-2">
            {isLoadingPrompts && (
              <div className="h-52 w-52 flex justify-center items-center">
                <Spinner color="success" />
              </div>
            )}
            {!isLoadingPrompts &&
              premadePrompts.length > 0 &&
              premadePrompts.map((prompt, index) => (
                <div
                  key={index}
                  className="relative h-52 w-52 bg-[#007057] text-white text-start p-4 rounded-xl flex items-start justify-center"
                  onClick={() => {
                    setIsSuggestedPromptEditMode(true);
                    setSelectedSuggstedPrompt(prompt);
                    setNewMsg(prompt.prompt_message);
                    setIsModalSuggestedPromptOpen(true);
                  }}
                >
                  {prompt.prompt_message}
                  <FaPiggyBank className="absolute bottom-4 right-4 text-white text-2xl" />
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSettings;
