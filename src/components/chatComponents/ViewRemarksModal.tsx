"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { formatMessageDate } from "@/utils/compUtils";
import RemarksModal from "./RemarksModal";
import { useHelpPrompts } from "@/hooks/useHelpPrompts";
import usePromptCategory from "@/hooks/usePromptCategory";

interface ViewRemarksModalProps {
  openModal: boolean;
  setOpenModal: (open: boolean) => void;
  userId: string;
}

interface Remark {
  chat_connection_id: string;
  remarks: string;
  status: string;
  first_created_at: string;
  first_message: string;
  farmer_first_name: string;
  farmer_last_name: string;
  technician_first_name: string;
  technician_last_name: string;
  category?: string;
  parent_chat_connection_id?: string;
}

const ViewRemarksModal: React.FC<ViewRemarksModalProps> = ({
  openModal,
  setOpenModal,
  userId,
}) => {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState<Remark | null>(null);

  // Fetch help prompts to identify categories
  const { helpPrompts, isLoadingHelpPrompts } = useHelpPrompts();
  const { category: promptCategories, isLoadingCategory } = usePromptCategory();

  const fetchRemarks = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch solved chats directly from the updated view, including the category
      const { data: solvedChats, error: chatError } = await supabase
        .from("ViewLatestChatHeaders")
        .select(
          `
          chat_connection_id,
          remarks,
          status,
          first_created_at,
          first_message,
          farmer_first_name,
          farmer_last_name,
          technician_first_name,
          technician_last_name,
          parent_chat_connection_id,
          category 
        `
        )
        .eq("recipient_technician_id", userId)
        .eq("status", "solved")
        .order("first_created_at", { ascending: false });

      if (chatError) throw chatError;

      // Process each chat to determine the initial message if it's a shared conversation
      const processedRemarks = await Promise.all(
        (solvedChats || []).map(async (chat) => {
          let initialMessage = chat.first_message;
          // Use the category directly from the view, default to 'Others' if null/undefined
          let category = chat.category || "Others";

          // If this is a shared conversation, get the parent conversation's first message
          if (chat.parent_chat_connection_id) {
            const { data: parentFirstMessage, error: parentError } =
              await supabase
                .from("ChatMessages")
                .select("message")
                .eq("chat_connection_id", chat.parent_chat_connection_id)
                .order("created_at", { ascending: true })
                .limit(1)
                .single();

            if (!parentError && parentFirstMessage) {
              initialMessage = parentFirstMessage.message;
            }
          }

          // Return the data fetched from the view, plus the processed initial message and the direct category
          return {
            ...chat,
            first_message: initialMessage,
            category, // Use the category fetched from the view
          };
        })
      );

      setRemarks(processedRemarks);
    } catch (err) {
      console.error("Error fetching remarks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (openModal) {
      fetchRemarks();
    }
  }, [openModal, userId]);

  const viewRemarkDetail = (remark: Remark) => {
    setSelectedRemark(remark);
    setOpenDetailModal(true);
  };

  const getCategoryChipColor = (category: string) => {
    switch (category) {
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
    <>
      <Modal
        size="3xl"
        backdrop="blur"
        isOpen={openModal}
        onOpenChange={setOpenModal}
        hideCloseButton={true}
        scrollBehavior="inside"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Solved Conversations
              </ModalHeader>
              <ModalBody>
                {loading || isLoadingCategory ? ( // Changed from isLoadingHelpPrompts
                  <div className="flex justify-center items-center h-40">
                    <Spinner color="success" />
                  </div>
                ) : remarks.length === 0 ? (
                  <p className="text-center py-10">
                    No solved conversations found.
                  </p>
                ) : (
                  <Table aria-label="Remarks table">
                    <TableHeader>
                      <TableColumn>DATE</TableColumn>
                      <TableColumn>FARMER</TableColumn>
                      <TableColumn>CATEGORY</TableColumn>
                      <TableColumn>INITIAL MESSAGE</TableColumn>
                      <TableColumn width={100}>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {remarks.map((remark) => (
                        <TableRow key={remark.chat_connection_id}>
                          <TableCell>
                            {formatMessageDate(remark.first_created_at)}
                          </TableCell>
                          <TableCell>{`${remark.farmer_first_name} ${remark.farmer_last_name}`}</TableCell>
                          <TableCell>
                            <Chip
                              color={getCategoryChipColor(
                                remark.category || "Others"
                              )}
                              size="sm"
                            >
                              {remark.category}{" "}
                              {/* Display the direct category */}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[12rem] truncate">
                              {remark.first_message}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              color="success"
                              onClick={() => viewRemarkDetail(remark)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" onPress={() => setOpenModal(false)}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {selectedRemark && (
        <RemarksModal
          openModal={openDetailModal}
          setOpenModal={setOpenDetailModal}
          chatConnectionId={selectedRemark.chat_connection_id}
          onSolveChat={fetchRemarks} // Ensure fetchRemarks is called on solve
          existingRemarks={selectedRemark.remarks}
          category={selectedRemark.category} // Pass the direct category
          initialMessage={selectedRemark.first_message} // Pass the potentially derived initial message
        />
      )}
    </>
  );
};

export default ViewRemarksModal;
