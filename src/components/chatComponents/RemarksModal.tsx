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
  category = "Others",
}) => {
  const [remarks, setRemarks] = useState(existingRemarks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstMessage, setFirstMessage] = useState("");
  const [detectedCategory, setDetectedCategory] = useState(category);
  const [technicianInfo, setTechnicianInfo] = useState({ id: "", name: "" });

  // Fetch the first message when opening the modal
  useEffect(() => {
    if (openModal && chatConnectionId) {
      const fetchConversationDetails = async () => {
        try {
          // First get the conversation details
          const { data: chatData, error: chatError } = await supabase
            .from("ChatConnections")
            .select("parent_chat_connection_id, recipient_technician_id")
            .eq("chat_connection_id", chatConnectionId)
            .single();

          if (chatError) throw chatError;

          // Get technician info
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

          // Determine which chat_connection_id to use for first message
          let messageSourceId = chatConnectionId;

          // If this is a shared conversation, get the first message from the parent
          if (chatData?.parent_chat_connection_id) {
            messageSourceId = chatData.parent_chat_connection_id;
          }

          // Get the first message
          const { data: messageData, error: msgError } = await supabase
            .from("ChatMessages")
            .select("message")
            .eq("chat_connection_id", messageSourceId)
            .order("created_at", { ascending: true })
            .limit(1)
            .single();

          if (msgError) throw msgError;

          if (messageData) {
            setFirstMessage(messageData.message);

            // Look up category from PremadePrompts
            const { data: promptData } = await supabase
              .from("PremadePrompts")
              .select("category")
              .eq("prompt_message", messageData.message)
              .maybeSingle();

            if (promptData?.category) {
              setDetectedCategory(promptData.category);
            }
          }
        } catch (err) {
          console.error("Error fetching conversation details:", err);
        }
      };

      fetchConversationDetails();
    }
  }, [openModal, chatConnectionId, existingRemarks]);

  const handleSaveRemarks = async () => {
    if (!chatConnectionId) return;

    setIsSubmitting(true);

    try {
      // Using upsert to ensure we update multiple aspects of the chat connection
      const { error } = await supabase
        .from("ChatConnections")
        .update({
          status: "solved",
          remarks: remarks,
          technician_archived: true, // Auto-archive when marking as solved
        })
        .eq("chat_connection_id", chatConnectionId);

      if (error) throw error;

      // Make sure we wait before triggering callback to ensure DB is updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Call parent callback to refresh data
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
              {detectedCategory && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm">Category:</span>
                  <Chip
                    color={getCategoryChipColor(detectedCategory)}
                    size="sm"
                  >
                    {detectedCategory}
                  </Chip>
                </div>
              )}

              {firstMessage && !existingRemarks && (
                <Textarea
                  label="Initial Message"
                  value={firstMessage}
                  readOnly
                  minRows={2}
                  className="mb-4"
                />
              )}

              <Textarea
                label="Remarks"
                placeholder="Enter your remarks about how the issue was resolved..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                minRows={5}
                maxRows={10}
                readOnly={!!existingRemarks}
              />
              {!existingRemarks && (
                <p className="text-xs text-gray-500 mt-2">
                  Note: Marking this conversation as solved will archive it and
                  prevent further messages from being sent.
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
                  isDisabled={!remarks.trim()}
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
