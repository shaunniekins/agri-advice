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
  Select, // Import Select
  SelectItem, // Import SelectItem
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { MdSave } from "react-icons/md";
import { supabase } from "@/utils/supabase";

interface RemarksModalProps {
  openModal: boolean;
  setOpenModal: (open: boolean) => void;
  chatConnectionId: string;
  onSolveChat: () => void;
  existingRemarks?: string;
  category?: string;
}

const RemarksModal: React.FC<RemarksModalProps> = ({
  openModal,
  setOpenModal,
  chatConnectionId,
  onSolveChat,
  existingRemarks = "",
  category = "Others", // Keep category prop for viewing existing remarks
}) => {
  const [remarks, setRemarks] = useState(existingRemarks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    existingRemarks ? category : "" // Initialize with existing category if viewing, else empty
  );
  const [technicianInfo, setTechnicianInfo] = useState({ id: "", name: "" });

  // Define categories
  const categories = [
    "Health Issues",
    "Feeding Management",
    "Housing Management",
    "Reproduction",
    "Management Practices",
    "Others",
  ];

  // Fetch only technician info if needed (optional, can be removed if not used elsewhere)
  useEffect(() => {
    if (openModal && chatConnectionId && !existingRemarks) {
      // Simplified fetch, only if needed for other purposes
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
    // Reset selectedCategory when modal opens for adding new remarks
    if (openModal && !existingRemarks) {
      setSelectedCategory("");
      setRemarks(""); // Also clear remarks if opening for new entry
    } else if (openModal && existingRemarks) {
      setSelectedCategory(category); // Set category from prop when viewing
      setRemarks(existingRemarks); // Set remarks from prop when viewing
    }
  }, [openModal, chatConnectionId, existingRemarks, category]);

  const handleSaveRemarks = async () => {
    if (!chatConnectionId || !selectedCategory) return; // Ensure category is selected

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("ChatConnections")
        .update({
          status: "solved",
          remarks: remarks,
          category: selectedCategory, // Save the selected category
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
              {/* Display Category Chip when viewing existing remarks */}
              {existingRemarks && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm font-medium">Category:</span>
                  <Chip
                    color={getCategoryChipColor(selectedCategory)} // Use selectedCategory (set from prop)
                    size="sm"
                  >
                    {selectedCategory}
                  </Chip>
                </div>
              )}

              {/* Show Select component only when adding new remarks */}
              {!existingRemarks && (
                <Select
                  label="Select Category"
                  placeholder="Choose a category"
                  className="mb-4"
                  selectedKeys={selectedCategory ? [selectedCategory] : []}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  isRequired // Make selection mandatory
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </Select>
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
                isRequired={!existingRemarks} // Make remarks mandatory when adding
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
                  isDisabled={!remarks.trim() || !selectedCategory} // Disable if remarks or category is empty
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
