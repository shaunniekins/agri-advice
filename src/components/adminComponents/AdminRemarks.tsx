"use client";

import React, { useState, useEffect } from "react";
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
  Chip,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { MdClose } from "react-icons/md";
import { supabase } from "@/utils/supabase";
import { formatMessageDate } from "@/utils/compUtils";
import { useHelpPrompts } from "@/hooks/useHelpPrompts";
import { IoTrash } from "react-icons/io5"; // Import delete icon

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
  category: string;
  initial_message?: string;
}

const AdminRemarks = () => {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [filteredRemarks, setFilteredRemarks] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState<Remark | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for delete confirmation modal
  const [remarkToDelete, setRemarkToDelete] = useState<Remark | null>(null); // State for remark to delete
  const [isDeleting, setIsDeleting] = useState(false); // State for delete loading indicator

  // Fetch help prompts to identify categories
  const { helpPrompts, isLoadingHelpPrompts } = useHelpPrompts();
  const [promptCategories, setPromptCategories] = useState<Map<string, string>>(
    new Map()
  );
  const [categories, setCategories] = useState<string[]>([]);

  // Process help prompts to create a map of prompts to categories
  useEffect(() => {
    if (!helpPrompts) return;

    const categoryMap = new Map<string, string>();
    const uniqueCategories = new Set<string>();

    const fetchPremadePrompts = async () => {
      try {
        const { data, error } = await supabase
          .from("PremadePrompts")
          .select("prompt_message, category");

        if (error) throw error;

        // Add premade prompts to the category map
        if (data) {
          data.forEach((item) => {
            categoryMap.set(
              item.prompt_message.toLowerCase().trim(),
              item.category
            );
            uniqueCategories.add(item.category);
          });
        }

        // Also add helpPrompts based mappings
        helpPrompts.forEach((category) => {
          uniqueCategories.add(category.category);
          if (category.prompts) {
            category.prompts.forEach((prompt) => {
              categoryMap.set(prompt.toLowerCase().trim(), category.category);
            });
          }
        });

        setPromptCategories(categoryMap);
        setCategories(Array.from(uniqueCategories));
      } catch (err) {
        console.error("Error fetching premade prompts:", err);
      }
    };

    fetchPremadePrompts();
  }, [helpPrompts]);

  // Get message category based on the first message
  const getMessageCategory = (message: string): string => {
    if (!message) return "Others";

    const lowerMessage = message.toLowerCase().trim();

    // First check for exact matches with premade prompts
    if (promptCategories.has(lowerMessage)) {
      return promptCategories.get(lowerMessage)!;
    }

    // Then check if the message contains any known prompt keywords
    for (const [prompt, category] of Array.from(promptCategories)) {
      if (lowerMessage.includes(prompt)) {
        return category;
      }
    }

    // Check common keywords for each category if no direct match found
    const categoryKeywords = {
      "Health Issues": [
        "disease",
        "sick",
        "health",
        "medicine",
        "symptoms",
        "treat",
        "infection",
      ],
      "Feeding Management": [
        "feed",
        "nutrition",
        "diet",
        "eat",
        "food",
        "feeding",
        "appetite",
      ],
      "Housing Management": [
        "house",
        "pen",
        "shelter",
        "building",
        "structure",
        "facility",
      ],
      Reproduction: [
        "breed",
        "mating",
        "pregnant",
        "birth",
        "piglet",
        "farrow",
        "reproduction",
      ],
      "Management Practices": [
        "manage",
        "practice",
        "operation",
        "routine",
        "schedule",
        "procedure",
      ],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        return category;
      }
    }

    return "Others";
  };

  const fetchRemarks = async () => {
    setLoading(true);
    try {
      // First get the count for pagination
      const { count, error: countError } = await supabase
        .from("ChatConnections")
        .select("*", { count: "exact", head: true })
        .eq("status", "solved");

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Get the solved conversations directly from the updated view
      const { data, error } = await supabase
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
          parent_chat_connection_id
        `
        )
        .eq("status", "solved")
        .order("first_created_at", { ascending: false })
        .range((page - 1) * rowsPerPage, page * rowsPerPage - 1);

      if (error) throw error;

      // Process each remark to get the correct initial message and category
      const remarksWithDetails = await Promise.all(
        data.map(async (item) => {
          let initialMessage = item.first_message;
          let category = "Others";

          // If this is a shared conversation, get the parent's first message
          if (item.parent_chat_connection_id) {
            const { data: parentMsg } = await supabase
              .from("ChatMessages")
              .select("message")
              .eq("chat_connection_id", item.parent_chat_connection_id)
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle();

            if (parentMsg) {
              initialMessage = parentMsg.message;
            }
          }

          // Try to find the category from PremadePrompts or keywords
          const { data: categoryData } = await supabase
            .from("PremadePrompts")
            .select("category")
            .eq("prompt_message", initialMessage)
            .maybeSingle();

          if (categoryData) {
            category = categoryData.category;
          } else {
            category = getMessageCategory(initialMessage);
          }

          // Return the data fetched from the view, plus the processed initial message and category
          return {
            ...item,
            category: category,
            initial_message: initialMessage,
          };
        })
      );

      setRemarks(remarksWithDetails);
      setFilteredRemarks(remarksWithDetails);
    } catch (err) {
      console.error("Error fetching remarks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter remarks by selected category
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredRemarks(remarks);
    } else {
      setFilteredRemarks(
        remarks.filter((remark) => remark.category === selectedCategory)
      );
    }
  }, [selectedCategory, remarks]);

  useEffect(() => {
    fetchRemarks();
  }, [page]); // Re-fetch when page changes

  const viewRemarkDetail = (remark: Remark) => {
    setSelectedRemark(remark);
    setOpenDetailModal(true);
  };

  // Function to open delete confirmation modal
  const handleDeleteClick = (remark: Remark) => {
    setRemarkToDelete(remark);
    setIsDeleteModalOpen(true);
  };

  // Function to handle the actual deletion
  const confirmDelete = async () => {
    if (!remarkToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("ChatConnections")
        .delete()
        .eq("chat_connection_id", remarkToDelete.chat_connection_id);

      if (error) throw error;

      // Close modal and refresh list
      setIsDeleteModalOpen(false);
      setRemarkToDelete(null);
      fetchRemarks(); // Refresh the list
    } catch (err) {
      console.error("Error deleting remark:", err);
      // Optionally show an error message to the user
    } finally {
      setIsDeleting(false);
    }
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

  const columns = [
    { key: "date", label: "DATE" },
    { key: "technician", label: "TECHNICIAN" },
    { key: "farmer", label: "FARMER" },
    { key: "category", label: "CATEGORY" },
    { key: "actions", label: "ACTIONS" },
  ];

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // Prepare categories for the Select component's items prop
  const categoryItems = categories.map((category) => ({
    key: category,
    label: category,
  }));

  return (
    <>
      {/* Detail Modal */}
      <Modal
        size="2xl"
        backdrop="blur"
        isOpen={openDetailModal}
        onOpenChange={setOpenDetailModal}
        hideCloseButton={true}
        scrollBehavior="inside"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Remark Details
              </ModalHeader>
              <ModalBody>
                {selectedRemark && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Date"
                        value={formatMessageDate(
                          selectedRemark.first_created_at
                        )}
                        readOnly
                      />
                      <Input
                        label="Category"
                        value={selectedRemark.category}
                        readOnly
                      />
                      <Input
                        label="Farmer"
                        value={`${selectedRemark.farmer_first_name} ${selectedRemark.farmer_last_name}`}
                        readOnly
                      />
                      <Input
                        label="Technician"
                        value={`${selectedRemark.technician_first_name} ${selectedRemark.technician_last_name}`}
                        readOnly
                      />
                    </div>

                    <Textarea
                      label="Initial Message"
                      value={selectedRemark.initial_message || ""}
                      readOnly
                      minRows={2}
                    />

                    <Textarea
                      label="Technician's Remarks"
                      value={selectedRemark.remarks}
                      readOnly
                      minRows={4}
                      color="success"
                      className="bg-green-50"
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  startContent={<MdClose />}
                  color="danger"
                  onPress={() => setOpenDetailModal(false)}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        size="md"
        backdrop="blur"
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        hideCloseButton={true}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirm Deletion
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to permanently delete the conversation
                  with{" "}
                  <strong>
                    {remarkToDelete?.farmer_first_name}{" "}
                    {remarkToDelete?.farmer_last_name}
                  </strong>{" "}
                  handled by{" "}
                  <strong>
                    {remarkToDelete?.technician_first_name}{" "}
                    {remarkToDelete?.technician_last_name}
                  </strong>
                  ?
                </p>
                <p className="text-sm text-danger">
                  This action cannot be undone.
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
                  startContent={!isDeleting && <IoTrash />}
                  onPress={confirmDelete}
                  isLoading={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className="h-full w-full flex flex-col gap-2 overflow-hidden">
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex gap-4 items-center">
            <Select
              label="Filter by Category"
              className="w-64"
              selectedKeys={
                selectedCategory === "all" ? [] : [selectedCategory]
              } // Handle 'all' selection
              items={[
                // Combine static and dynamic items
                { key: "all", label: "All Categories" },
                ...categoryItems,
                { key: "Others", label: "Others" },
              ]}
              onChange={(e) => setSelectedCategory(e.target.value || "all")} // Ensure 'all' if empty
            >
              {(item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              )}
            </Select>
          </div>
          <div className="flex gap-2 items-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="success"
              page={page}
              total={totalPages}
              onChange={(newPage) => setPage(newPage)}
            />
            <span className="text-sm text-gray-500">
              Total: {totalCount} solved conversations
            </span>
          </div>
        </div>
        <div className="h-full w-full flex flex-grow overflow-x-auto">
          <Table
            fullWidth
            aria-label="Remarks table"
            classNames={{
              wrapper: "w-full h-full",
            }}
            isHeaderSticky={true}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  className="bg-[#007057] text-white text-center"
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={filteredRemarks}
              emptyContent={"No solved conversations found"}
              loadingContent={<Spinner color="success" />}
              isLoading={loading}
            >
              {(remark) => (
                <TableRow key={remark.chat_connection_id}>
                  {(columnKey) => {
                    switch (columnKey) {
                      case "date":
                        return (
                          <TableCell className="text-center">
                            {formatMessageDate(remark.first_created_at)}
                          </TableCell>
                        );
                      case "technician":
                        return (
                          <TableCell className="text-center">{`${remark.technician_first_name} ${remark.technician_last_name}`}</TableCell>
                        );
                      case "farmer":
                        return (
                          <TableCell className="text-center">{`${remark.farmer_first_name} ${remark.farmer_last_name}`}</TableCell>
                        );
                      case "category":
                        return (
                          <TableCell className="text-center">
                            <Chip
                              color={getCategoryChipColor(remark.category)}
                              size="sm"
                            >
                              {remark.category}
                            </Chip>
                          </TableCell>
                        );
                      case "actions":
                        return (
                          <TableCell className="text-center flex justify-center gap-2">
                            <Button
                              size="sm"
                              color="success"
                              onClick={() => viewRemarkDetail(remark)}
                            >
                              View Details
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              variant="light"
                              onClick={() => handleDeleteClick(remark)} // Add delete handler
                            >
                              <IoTrash size={18} />
                            </Button>
                          </TableCell>
                        );
                      default:
                        return (
                          <TableCell className="text-center">
                            {remark[columnKey as keyof Remark]}
                          </TableCell>
                        );
                    }
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

export default AdminRemarks;
