"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
  Chip,
  Select,
  SelectItem,
  Input,
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { MdSave } from "react-icons/md";
import { supabase } from "@/utils/supabase";
import usePromptCategory from "@/hooks/usePromptCategory";

interface RemarksModalProps {
  openModal: boolean;
  setOpenModal: (open: boolean) => void;
  chatConnectionId: string;
  onSolveChat: () => void;
  existingRemarks?: string;
  category?: string;
  initialMessage?: string;
}

const RemarksModal: React.FC<RemarksModalProps> = ({
  openModal,
  setOpenModal,
  chatConnectionId,
  onSolveChat,
  existingRemarks = "",
  category = "Others",
  initialMessage = "",
}) => {
  const [remarks, setRemarks] = useState(existingRemarks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    existingRemarks ? category : ""
  );
  const [technicianInfo, setTechnicianInfo] = useState({ id: "", name: "" });

  const { category: fetchedCategories, isLoadingCategory } =
    usePromptCategory();

  useEffect(() => {
    if (openModal && chatConnectionId && !existingRemarks) {
      const fetchTechInfo = async () => {
        try {
          const { data: chatData } = await supabase
            .from("ChatConnections")
            .select("recipient_technician_id")
            .eq("chat_connection_id", chatConnectionId)
            .single();

          if (chatData?.recipient_technician_id) {
            const { data: techData } = await supabase
              .from("profiles")
              .select("id, first_name, last_name")
              .eq("id", chatData.recipient_technician_id)
              .single();

            if (techData) {
              setTechnicianInfo({
                id: techData.id,
                name: `${techData.first_name} ${techData.last_name}`,
              });
            }
          }
        } catch (err) {
          console.error("Error fetching technician info:", err);
        }
      };
      fetchTechInfo();
    }

    if (openModal && !existingRemarks) {
      setSelectedCategory("");
      setRemarks("");
    } else if (openModal && existingRemarks) {
      setSelectedCategory(category);
      setRemarks(existingRemarks);
    }
  }, [openModal, chatConnectionId, existingRemarks, category]);

  const handleSaveRemarks = async () => {
    if (!chatConnectionId || !selectedCategory) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("ChatConnections")
        .update({
          status: "solved",
          remarks: remarks,
          category: selectedCategory,
          technician_archived: true,
        })
        .eq("chat_connection_id", chatConnectionId);

      if (error) throw error;

      await new Promise((resolve) => setTimeout(resolve, 500));

      onSolveChat();
      setOpenModal(false);
    } catch (err) {
      console.error("Error saving remarks:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryChipColor = (categoryName: string) => {
    switch (categoryName) {
      case "Health Issues":
        return "danger";
      case "Feeding Management":
        return "warning";
      case "Housing Management":
        return "success";
      case "Reproduction":
        return "primary";
      case "Management Practices":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Modal
      size="lg"
      backdrop="blur"
      isOpen={openModal}
      onOpenChange={setOpenModal}
      hideCloseButton={true}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {existingRemarks ? "View Remarks" : "Add Remarks"}
            </ModalHeader>
            <ModalBody>
              {existingRemarks && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium">Category:</span>
                  <Chip
                    color={getCategoryChipColor(selectedCategory)}
                    size="sm"
                  >
                    {selectedCategory}
                  </Chip>
                </div>
              )}

              {!existingRemarks && (
                <Select
                  label="Select Category"
                  placeholder="Choose a category"
                  className="mb-4"
                  selectedKeys={selectedCategory ? [selectedCategory] : []}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  isRequired
                  isLoading={isLoadingCategory}
                  isDisabled={isLoadingCategory}
                >
                  {fetchedCategories.map((cat: any) => (
                    <SelectItem
                      key={cat.category_name}
                      value={cat.category_name}
                    >
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </Select>
              )}

              {existingRemarks && initialMessage && (
                <Input
                  label="Initial Message"
                  value={initialMessage}
                  readOnly
                />
              )}

              <Textarea
                label="Remarks"
                placeholder={
                  existingRemarks
                    ? ""
                    : "Enter your remarks about how the issue was resolved..."
                }
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                minRows={5}
                maxRows={10}
                readOnly={!!existingRemarks}
                isRequired={!existingRemarks}
              />
              {!existingRemarks && (
                <p className="text-xs text-gray-500 mt-2">
                  Note: Marking this conversation as solved will archive it and
                  prevent further messages from being sent. Category and Remarks
                  are required.
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={() => setOpenModal(false)}
              >
                {existingRemarks ? "Close" : "Cancel"}
              </Button>
              {!existingRemarks && (
                <Button
                  color="success"
                  startContent={<MdSave />}
                  onPress={handleSaveRemarks}
                  isLoading={isSubmitting}
                  isDisabled={!remarks.trim() || !selectedCategory}
                >
                  Mark as Solved
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default RemarksModal;
