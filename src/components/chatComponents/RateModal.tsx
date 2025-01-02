"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Button,
  Textarea,
  Input,
} from "@nextui-org/react";
import StarRating from "./StarRating";
import { MdClose, MdEdit } from "react-icons/md";
import { useEffect, useState } from "react";
import {
  fetchFeedback,
  insertFeedback,
  updateFeedback,
} from "@/app/api/feedbackIUD";

interface RateModalProps {
  openModal: boolean;
  setOpenModal: (open: boolean) => void;
  chatConnectionId: string;
}

const RateModal: React.FC<RateModalProps> = ({
  openModal,
  setOpenModal,
  chatConnectionId,
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [rating, setRating] = useState(0);

  const hasFeedback = Boolean(selectedFeedback?.feedback_id);

  // Reset states when chatConnectionId changes
  useEffect(() => {
    setSelectedFeedback({});
    setFeedbackMsg("");
    setRating(0);
    setIsEditing(false);
  }, [chatConnectionId]);

  // Reset states when modal closes
  useEffect(() => {
    if (!openModal) {
      setSelectedFeedback({});
      setFeedbackMsg("");
      setRating(0);
      setIsEditing(false);
    }
  }, [openModal]);

  // Modify the useEffect to also run when openModal changes
  useEffect(() => {
    if (!chatConnectionId || !openModal) return;

    const getFeedback = async () => {
      const response = await fetchFeedback(chatConnectionId);
      if (response) {
        setSelectedFeedback(response);
        setFeedbackMsg(response.feedback_message);
        setRating(response.ratings);
      }
    };

    getFeedback();
  }, [chatConnectionId, openModal]); // Add openModal as dependency

  const handleSaveFeedback = async () => {
    if (!feedbackMsg || !rating) return;

    try {
      if (selectedFeedback?.feedback_id) {
        // Update existing feedback
        await updateFeedback(selectedFeedback.feedback_id, {
          feedback_message: feedbackMsg,
          ratings: rating,
        });
      } else {
        // Insert new feedback
        await insertFeedback({
          chat_connection_id: chatConnectionId,
          feedback_message: feedbackMsg,
          ratings: rating,
        });
      }

      // Fetch updated feedback data after successful save
      const updatedFeedback = await fetchFeedback(chatConnectionId);
      if (updatedFeedback) {
        setSelectedFeedback(updatedFeedback);
        setFeedbackMsg(updatedFeedback.feedback_message);
        setRating(updatedFeedback.ratings);
      }

      setIsEditing(false);
      setOpenModal(false);
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  return (
    <>
      <Modal
        size="lg"
        backdrop="blur"
        isOpen={openModal}
        hideCloseButton={true}
        onOpenChange={setOpenModal}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {hasFeedback && isEditing ? "Edit Feedback" : "Feedback"}
              </ModalHeader>
              <ModalBody>
                <div className="w-full my-3">
                  <StarRating
                    rating={rating}
                    isReadOnly={hasFeedback && !isEditing}
                    setRating={setRating}
                  />
                </div>
                <Textarea
                  label="Feedback Message"
                  color="success"
                  placeholder="Enter your feedback here..."
                  value={feedbackMsg}
                  readOnly={hasFeedback && !isEditing}
                  onValueChange={setFeedbackMsg}
                  fullWidth
                />
              </ModalBody>
              <ModalFooter>
                {!hasFeedback ? (
                  <Button
                    color="primary"
                    isDisabled={!feedbackMsg || !rating}
                    onClick={handleSaveFeedback}
                  >
                    Save
                  </Button>
                ) : isEditing ? (
                  <>
                    <Button
                      color="danger"
                      variant="light"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button color="primary" onClick={handleSaveFeedback}>
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      startContent={<MdEdit />}
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    <Button
                      startContent={<MdClose />}
                      className="bg-[#007057] text-white self-center"
                      onClick={() => setOpenModal(false)}
                    >
                      Close
                    </Button>
                  </>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default RateModal;
