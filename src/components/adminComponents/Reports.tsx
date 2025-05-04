"use client";

import useFeedback from "@/hooks/useFeedback";
import React from "react";
import { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Button,
  Spinner,
  Textarea,
  Input,
} from "@nextui-org/react";
import { MdClose } from "react-icons/md";
import { IoTrash } from "react-icons/io5";
import StarRating from "../chatComponents/StarRating";
import { deleteFeedback } from "@/app/api/feedbackIUD";

const AdminReportsComponent = () => {
  const rowsPerPage = 16;
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>({});

  // New states for delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { feedbackData, totalFeedbackEntries, refetchFeedback } = useFeedback(
    rowsPerPage,
    page
  );

  const totalPages = Math.ceil(totalFeedbackEntries / rowsPerPage);

  // Handle opening delete confirmation modal
  const handleDeleteClick = (feedbackId: string) => {
    setFeedbackToDelete(feedbackId);
    setIsDeleteModalOpen(true);
  };

  // Handle the actual deletion
  const confirmDelete = async () => {
    if (!feedbackToDelete) return;

    setIsDeleting(true);
    try {
      await deleteFeedback(feedbackToDelete);
      // After successful deletion, close the modal and refetch data
      setIsDeleteModalOpen(false);
      setFeedbackToDelete(null);

      // Refetch the feedback data to update the table
      if (refetchFeedback) {
        refetchFeedback();
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("Failed to delete feedback. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { key: "responder", label: "Responder" },
    { key: "from", label: "Farmer" },
    // { key: "initial_message", label: "Initial Message" },
    // { key: "feedback_message", label: "Feedback" },
    { key: "ratings", label: "Rating" },
    { key: "feedback_created_at", label: "Date" },
    { key: "option", label: "Option" },
  ];

  const truncateText = (text: string, charLimit: number) => {
    if (text.length <= charLimit) {
      return text;
    }
    return text.slice(0, charLimit) + "...";
  };
  return (
    <>
      {/* Existing feedback detail modal */}
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
                Feedback
              </ModalHeader>
              <ModalBody>
                <div className="w-full flex gap-3">
                  <Input
                    label="Responder"
                    color="success"
                    value={`${
                      selectedFeedback.parent_chat_connection_id
                        ? selectedFeedback.technician_first_name +
                          " " +
                          selectedFeedback.technician_last_name
                        : "AI"
                    }`}
                    readOnly
                    fullWidth
                  />
                  <Input
                    label="Message From"
                    color="success"
                    value={`${selectedFeedback.is_ai ? "(AI)" : ""} ${
                      selectedFeedback.farmer_first_name
                    } ${selectedFeedback.farmer_last_name}`}
                    readOnly
                    fullWidth
                  />
                </div>
                <div className="w-full my-3">
                  <StarRating rating={selectedFeedback.ratings} isReadOnly />
                </div>
                <Textarea
                  label="First Message Sent"
                  color="success"
                  value={selectedFeedback.initial_message}
                  readOnly
                  fullWidth
                />
                <Textarea
                  label="Feedback Message"
                  color="success"
                  placeholder="Enter your feedback here..."
                  value={selectedFeedback.feedback_message}
                  readOnly
                  fullWidth
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  startContent={<MdClose />}
                  className="bg-[#007057] text-white self-center"
                  onClick={() => setOpenModal(false)}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* New delete confirmation modal */}
      <Modal
        size="sm"
        backdrop="blur"
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        hideCloseButton={true}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirm Delete
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to delete this feedback? This action
                  cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  variant="light"
                  onPress={() => setIsDeleteModalOpen(false)}
                  isDisabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={confirmDelete}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className="h-full w-full flex flex-col gap-2 overflow-hidden">
        <div className="w-full flex justify-start gap-2">
          <Pagination
            isCompact
            showControls
            showShadow
            color="success"
            page={page}
            total={totalPages}
            onChange={(newPage) => setPage(newPage)}
          />
        </div>
        <div className="h-full w-full flex flex-grow overflow-x-auto">
          <Table
            fullWidth
            layout="auto"
            isHeaderSticky={true}
            aria-label="Users Table with Pagination"
            classNames={{
              wrapper: "w-full h-full",
            }}
            className="h-full w-full flex items-center justify-center overflow-x-auto"
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  className="bg-[#007057] text-white text-center whitespace-nowrap flex-nowrap"
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={feedbackData}
              emptyContent={"No rows to display."}
              loadingContent={<Spinner color="success" />}
            >
              {(item) => (
                <TableRow key={item.feedback_id} className="text-center">
                  {(columnKey) => {
                    if (columnKey === "responder") {
                      return (
                        <TableCell className="text-center">
                          {item?.parent_chat_connection_id
                            ? item?.technician_first_name +
                              " " +
                              item?.technician_last_name
                            : "AI"}
                        </TableCell>
                      );
                    }

                    if (columnKey === "from") {
                      return (
                        <TableCell className="text-center">
                          {item?.farmer_first_name} {item?.farmer_last_name}
                        </TableCell>
                      );
                    }

                    if (columnKey === "initial_message") {
                      return (
                        <TableCell className="text-center truncate">
                          {truncateText(
                            item?.initial_message || "No message",
                            15
                          )}
                        </TableCell>
                      );
                    }

                    if (columnKey === "feedback_message") {
                      return (
                        <TableCell className="text-center truncate">
                          {truncateText(item?.feedback_message, 15)}
                        </TableCell>
                      );
                    }

                    if (columnKey === "ratings") {
                      return (
                        <TableCell className="text-center">
                          <StarRating rating={item?.ratings} isReadOnly />
                        </TableCell>
                      );
                    }

                    if (columnKey === "feedback_created_at") {
                      return (
                        <TableCell className="text-center">
                          {new Date(
                            item?.feedback_created_at
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                      );
                    }

                    if (columnKey === "option") {
                      return (
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            <Button
                              color="success"
                              className="text-white"
                              onClick={() => {
                                setSelectedFeedback(item);
                                setOpenModal(true);
                              }}
                            >
                              Show
                            </Button>
                            <Button
                              color="danger"
                              startContent={<IoTrash />}
                              onClick={() =>
                                handleDeleteClick(item.feedback_id)
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell className="text-center">
                        {item[columnKey as keyof typeof item]}
                      </TableCell>
                    );
                  }}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default AdminReportsComponent;
