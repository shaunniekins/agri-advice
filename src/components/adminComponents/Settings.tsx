"use client";

import React, { useState } from "react";
import { FaPiggyBank } from "react-icons/fa";
import { IoAdd, IoRemoveCircle } from "react-icons/io5";
import usePremadePrompts from "@/hooks/usePremadePrompts";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
} from "@nextui-org/react";
import {
  insertPremadePrompt,
  updatePremadePrompt,
  deletePremadePrompt,
} from "@/app/api/premadePromptsIUD";
import useReadingLists from "@/hooks/useReadingLists";
import {
  deleteReadingList,
  insertReadingList,
  updateReadingList,
} from "@/app/api/readingListsIUD";
import useSuggestedLinks from "@/hooks/useSuggestedLinks";
import {
  deleteSuggestedLink,
  insertSuggestedLink,
  updateSuggestedLink,
} from "@/app/api/suggestedLinkIUD";
import usePromptCategory from "@/hooks/usePromptCategory";
import { deleteCategory, insertCategory } from "@/app/api/promptCategoryIUD";

const AdminSettings = () => {
  // suggested URL structure
  const { suggestedLinks, isLoadingLinks, lastLinkOrderValue } =
    useSuggestedLinks();
  const [isModalSuggestedLinkOpen, setIsModalSuggestedLinkOpen] =
    useState(false);
  const [isSuggestedLinkEditMode, setIsSuggestedLinkEditMode] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [selectedSuggestedLink, setSelectedSuggestedLink] = useState<any>(null);

  const { category } = usePromptCategory();

  const handleCloseLinkModal = () => {
    setIsModalSuggestedLinkOpen(false);
    setIsSuggestedLinkEditMode(false);
    setSelectedSuggestedLink(null);
    setNewLinkName("");
    setNewLinkUrl("");
  };

  const handleAddLink = async () => {
    const newLink = {
      link_name: newLinkName,
      link_url: newLinkUrl,
      link_order: lastLinkOrderValue ? lastLinkOrderValue + 1 : 1,
    };

    await insertSuggestedLink(newLink);

    handleCloseLinkModal();
  };

  const handleEditLink = async () => {
    if (!selectedSuggestedLink) return;

    const updatedLink = {
      link_name: newLinkName,
      link_url: newLinkUrl,
    };

    await updateSuggestedLink(selectedSuggestedLink.link_id, updatedLink);

    handleCloseLinkModal();
  };

  const handleDeleteLink = async () => {
    if (!selectedSuggestedLink) return;

    await deleteSuggestedLink(selectedSuggestedLink.link_id);

    handleCloseLinkModal();
  };

  // suggested prompt structure
  const { premadePrompts, isLoadingPrompts, lastOrderValue } =
    usePremadePrompts();
  const [isModalSuggestedPromptOpen, setIsModalSuggestedPromptOpen] =
    useState(false);
  const [isSuggestedPromptEditMode, setIsSuggestedPromptEditMode] =
    useState(false);
  const [searchMsg, setSearchMsg] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [newMsgCategory, setNewMsgCategory] = useState("");
  const [selectedSuggstedPrompt, setSelectedSuggestedPrompt] =
    useState<any>(null);

  const handleAddPrompt = async () => {
    const newPrompt = {
      prompt_message: newMsg,
      category: newMsgCategory,
      prompt_order: lastOrderValue ? lastOrderValue + 1 : 1,
    };

    const response = await insertPremadePrompt(newPrompt);
    if (response) {
      setIsModalSuggestedPromptOpen(false);
      setNewMsg("");
      setNewMsgCategory("");
    }
  };

  const handleEditPrompt = async () => {
    if (!selectedSuggstedPrompt) return;

    const updatedPrompt = {
      prompt_message: newMsg,
      category: newMsgCategory,
    };

    const response = await updatePremadePrompt(
      selectedSuggstedPrompt.prompt_id,
      updatedPrompt
    );
    if (response) {
      setIsModalSuggestedPromptOpen(false);
      setIsSuggestedPromptEditMode(false);
      setSelectedSuggestedPrompt(null);
      setNewMsg("");
      setNewMsgCategory("");
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
      setSelectedSuggestedPrompt(null);
      setNewMsg("");
      setNewMsgCategory("");
    }
  };

  // suggested reading lists
  const BUCKET_NAME = "reading-lists";

  const { readingLists, isLoadingLists, lastListOrderValue } =
    useReadingLists();
  const [isModalSuggestedListOpen, setIsModalSuggestedListOpen] =
    useState(false);
  const [isSuggestedListEditMode, setIsSuggestedListEditMode] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [selectedSuggestedList, setSelectedSuggestedList] = useState<any>(null);

  const handleCloseReadingListModal = () => {
    setIsModalSuggestedListOpen(false);
    setIsSuggestedListEditMode(false);
    setSelectedSuggestedList(null);
    setNewFileName("");
    setNewFile(null);
  };

  const handleAddReadingList = async () => {
    if (!newFile) return;

    await insertReadingList(
      newFileName,
      BUCKET_NAME,
      lastListOrderValue ? lastListOrderValue + 1 : 1,
      newFile
    );

    handleCloseReadingListModal();
  };

  const handleEditReadingList = async () => {
    if (!selectedSuggestedList) return;

    await updateReadingList(
      selectedSuggestedList.list_id,
      newFileName,
      BUCKET_NAME,
      selectedSuggestedList.list_id
    );

    handleCloseReadingListModal();
  };

  const handleDeleteReadingList = async () => {
    if (!selectedSuggestedList) return;

    await deleteReadingList(
      selectedSuggestedList.file_name,
      BUCKET_NAME,
      selectedSuggestedList.list_id
    );

    handleCloseReadingListModal();
  };

  return (
    <>
      <Modal
        isOpen={isModalSuggestedLinkOpen}
        onOpenChange={setIsModalSuggestedLinkOpen}
        onClose={handleCloseLinkModal}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {isSuggestedLinkEditMode ? "Edit URL" : "Add New URL"}
              </ModalHeader>
              <ModalBody className="flex flex-col gap-2">
                <Input
                  fullWidth
                  label="Name"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                />
                <Input
                  fullWidth
                  label="URL"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                />
              </ModalBody>
              <ModalFooter
                className={`flex ${
                  isSuggestedLinkEditMode ? "justify-between" : "justify-end"
                }`}
              >
                <Button
                  color="danger"
                  variant="flat"
                  className={`${
                    isSuggestedLinkEditMode && selectedSuggestedLink
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={handleDeleteLink}
                >
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button
                    color="warning"
                    variant="flat"
                    onClick={handleCloseLinkModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    variant="flat"
                    onClick={() =>
                      isSuggestedLinkEditMode && selectedSuggestedLink
                        ? handleEditLink()
                        : handleAddLink()
                    }
                  >
                    {isSuggestedLinkEditMode ? "Save" : "Add"}
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isModalSuggestedPromptOpen}
        onOpenChange={setIsModalSuggestedPromptOpen}
        onClose={() => {
          setIsSuggestedPromptEditMode(false);
          setSelectedSuggestedPrompt(null);
          setNewMsg("");
          setNewMsgCategory("");
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

                <Select
                  label="Category"
                  defaultSelectedKeys={[newMsgCategory]}
                  value={newMsgCategory}
                  onChange={(e) => setNewMsgCategory(e.target.value)}
                >
                  {category &&
                    category.map((item: any) => (
                      <SelectItem key={item.category_name}>
                        {item.category_name}
                      </SelectItem>
                    ))}
                </Select>
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
                      setSelectedSuggestedPrompt(null);
                      setNewMsg("");
                      setNewMsgCategory("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    variant="flat"
                    isDisabled={!newMsg || !newMsgCategory}
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

      <Modal
        isOpen={isModalSuggestedListOpen}
        onOpenChange={setIsModalSuggestedListOpen}
        onClose={() => handleCloseReadingListModal}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {isSuggestedListEditMode
                  ? "Edit Reading List"
                  : "Add New Reading List"}
              </ModalHeader>
              <ModalBody className="flex flex-col gap-2">
                <Input
                  fullWidth
                  label="File Name"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                />
                {isSuggestedListEditMode ? (
                  <iframe
                    src={selectedSuggestedList?.file_url}
                    className="w-full h-52"
                    title="Reading List"
                  />
                ) : (
                  <Input
                    fullWidth
                    color="success"
                    type="file"
                    // label="File"s
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setNewFile(e.target.files[0]);
                      }
                    }}
                  />
                )}
              </ModalBody>
              <ModalFooter
                className={`flex ${
                  isSuggestedListEditMode ? "justify-between" : "justify-end"
                }`}
              >
                <Button
                  color="danger"
                  variant="flat"
                  className={`${
                    isSuggestedListEditMode && selectedSuggestedList
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={handleDeleteReadingList}
                >
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button
                    color="warning"
                    variant="flat"
                    onClick={handleCloseReadingListModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    variant="flat"
                    onClick={() =>
                      isSuggestedListEditMode && selectedSuggestedList
                        ? handleEditReadingList()
                        : handleAddReadingList()
                    }
                  >
                    {isSuggestedListEditMode ? "Save" : "Add"}
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className="h-full w-full flex flex-col gap-20 pb-20 overflow-y-auto ">
        <div className="flex flex-col gap-2">
          {/* 1.1 suggested prompts header */}
          <div className="flex justify-between gap-2">
            <h2 className="text-lg font-semibold">Suggested Prompts</h2>
            <div className="flex flex-col md:flex-row items-center justify-end gap-2">
              <Button
                isIconOnly
                color="success"
                size="lg"
                startContent={<IoAdd />}
                onClick={async () => {
                  const newCategory = window.prompt("Enter new category name:");
                  if (newCategory) {
                    await insertCategory({
                      category_name: newCategory,
                    });
                  }
                }}
              />
              <Select
                fullWidth
                label="Filter Category"
                color="success"
                value={searchMsg}
                className="min-w-52"
                onChange={(e) => setSearchMsg(e.target.value)}
              >
                {category &&
                  category.map((item: any) => (
                    <SelectItem
                      key={item.category_name}
                      selectedIcon={
                        <IoRemoveCircle
                          size={18}
                          color="red"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            const confirmed = window.confirm(
                              `Are you sure you want to delete ${item.category_name}?`
                            );
                            if (confirmed) {
                              setSearchMsg("");
                              await deleteCategory(item.category_name);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        />
                      }
                    >
                      {item.category_name}
                    </SelectItem>
                  ))}
              </Select>
              <Button
                fullWidth
                color="success"
                className="text-white"
                startContent={<IoAdd />}
                onClick={() => setIsModalSuggestedPromptOpen(true)}
              >
                Add New Prompt
              </Button>
            </div>
          </div>

          {/* 1.2 suggested prompts data */}
          <div className="w-full flex overflow-x-auto custom-scrollbar">
            <div
              className={`${
                (isLoadingPrompts ||
                  (!isLoadingPrompts && premadePrompts.length === 0)) &&
                "w-full"
              } flex flex-nowrap gap-2`}
            >
              {isLoadingPrompts && (
                <div className="h-52 w-full flex justify-center items-center">
                  <Spinner color="success" />
                </div>
              )}
              {!isLoadingPrompts && premadePrompts.length === 0 && (
                <div className="h-52 w-full flex justify-center items-center text-gray-500">
                  No prompts yet
                </div>
              )}
              {!isLoadingPrompts &&
                premadePrompts.length > 0 &&
                premadePrompts
                  .filter(
                    (prompt) => !searchMsg || prompt.category === searchMsg
                  )
                  .map((prompt, index) => (
                    <div
                      key={index}
                      className="relative h-52 w-52 bg-[#007057] text-white text-start p-4 rounded-xl flex items-start justify-center"
                      onClick={() => {
                        setIsSuggestedPromptEditMode(true);
                        setSelectedSuggestedPrompt(prompt);
                        setNewMsg(prompt.prompt_message);
                        setNewMsgCategory(prompt.category);
                        setIsModalSuggestedPromptOpen(true);
                      }}
                    >
                      {prompt.prompt_message}
                      <span className="absolute bottom-4 left-4 text-white text-sm">
                        {prompt.category}
                      </span>
                      <FaPiggyBank className="absolute bottom-4 right-4 text-white text-2xl" />
                    </div>
                  ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* 2.1 suggested reading lists header */}
          <div className="flex justify-between gap-2">
            <h2 className="text-lg font-semibold">Reading Lists</h2>
            <Button
              color="success"
              className="text-white"
              startContent={<IoAdd />}
              onClick={() => setIsModalSuggestedListOpen(true)}
            >
              Add New File
            </Button>
          </div>

          {/* 2.2 suggested reading lists data */}
          <div className="w-full flex overflow-x-auto custom-scrollbar">
            <div
              className={`${
                (isLoadingLists ||
                  (!isLoadingLists && readingLists.length === 0)) &&
                "w-full"
              } flex flex-nowrap gap-2`}
            >
              {isLoadingLists && (
                <div className="h-52 w-full flex justify-center items-center">
                  <Spinner color="success" />
                </div>
              )}
              {!isLoadingLists && readingLists.length === 0 && (
                <div className="h-52 w-full flex justify-center items-center text-gray-500">
                  No reading lists yet
                </div>
              )}
              {!isLoadingLists &&
                readingLists.length > 0 &&
                readingLists.map((list, index) => (
                  <div
                    key={index}
                    className="w-72 border border-[#007057] text-[#007057] text-start p-4 rounded-xl flex items-start justify-start gap-2"
                    onClick={() => {
                      setIsSuggestedListEditMode(true);
                      setSelectedSuggestedList(list);
                      setNewFileName(list.file_name);
                      setIsModalSuggestedListOpen(true);
                    }}
                  >
                    <FaPiggyBank className="text-2xl flex-shrink-0" />
                    <div className="truncate flex-grow">{list.file_name}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* 3.1 suggested URL header */}
          <div className="flex justify-between gap-2">
            <h2 className="text-lg font-semibold">Suggested URLs</h2>
            <Button
              color="success"
              className="text-white"
              startContent={<IoAdd />}
              onClick={() => setIsModalSuggestedLinkOpen(true)}
            >
              Add New URL
            </Button>
          </div>

          {/* 3.2 suggested URL data */}
          <div className="w-full flex overflow-x-auto custom-scrollbar">
            <div
              className={`${
                (isLoadingLinks ||
                  (!isLoadingLinks && suggestedLinks.length === 0)) &&
                "w-full"
              } flex flex-nowrap gap-2`}
            >
              {isLoadingLinks && (
                <div className="h-52 w-full flex justify-center items-center">
                  <Spinner color="success" />
                </div>
              )}
              {!isLoadingLinks && suggestedLinks.length === 0 && (
                <div className="h-52 w-full flex justify-center items-center text-gray-500">
                  No links yet
                </div>
              )}
              {!isLoadingLinks &&
                suggestedLinks.length > 0 &&
                suggestedLinks.map((list, index) => (
                  <div
                    key={index}
                    className="w-72 border border-[#007057] text-[#007057] text-start p-4 rounded-xl flex items-start justify-start gap-2"
                    onClick={() => {
                      setIsSuggestedLinkEditMode(true);
                      setSelectedSuggestedLink(list);
                      setNewLinkName(list.link_name);
                      setNewLinkUrl(list.link_url);
                      setIsModalSuggestedLinkOpen(true);
                    }}
                  >
                    <FaPiggyBank className="text-2xl flex-shrink-0" />
                    <div className="truncate flex-grow">{list.link_name}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSettings;
