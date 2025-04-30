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
import usePromptCategory from "@/hooks/usePromptCategory"; // Import usePromptCategory
import { IoTrash } from "react-icons/io5";

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

  // Fetch categories for the filter dropdown
  const { category: fetchedCategories, isLoadingCategory } =
    usePromptCategory();

  // Remove the state and useEffect related to helpPrompts and promptCategories map
  // const { helpPrompts, isLoadingHelpPrompts } = useHelpPrompts();
  // const [promptCategories, setPromptCategories] = useState<Map<string, string>>(new Map());
  // const [categories, setCategories] = useState<string[]>([]);

  // useEffect(() => { ... removed ... });

  // Remove getMessageCategory function
  // const getMessageCategory = (message: string): string => { ... removed ... };

  const fetchRemarks = async () => {
    setLoading(true);
    try {
      // Define the base query
      let query = supabase
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
        `,
          { count: "exact" } // Request count
        )
        .eq("status", "solved");

      // Apply category filter if not 'all'
      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      // Apply ordering and pagination
      query = query
        .order("first_created_at", { ascending: false })
        .range((page - 1) * rowsPerPage, page * rowsPerPage - 1);

      // Execute the query
      const { data, error, count } = await query;

      if (error) throw error;
      setTotalCount(count || 0); // Update total count based on filtered result

      // Process each remark to get the correct initial message if needed
      const remarksWithDetails = await Promise.all(
        (data || []).map(async (item) => {
          let initialMessage = item.first_message;
          // Use the category directly from the view, default to 'Others' if null/undefined
          let category = item.category || "Others";

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

          // Return the data fetched from the view, plus the processed initial message and direct category
          return {
            ...item,
            category: category, // Use the direct category
            initial_message: initialMessage, // Use the potentially derived initial message
          };
        })
      );

      setRemarks(remarksWithDetails); // Set the main remarks state
      // Filtering is now handled by the query itself, so no need for setFilteredRemarks here
      // setFilteredRemarks(remarksWithDetails); // Remove this line
    } catch (err) {
      console.error("Error fetching remarks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemarks(); // Fetch remarks whenever page or selectedCategory changes
  }, [page, selectedCategory]); // Add selectedCategory to dependency array

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

  // Calculate total pages based on the potentially filtered totalCount
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // Prepare categories for the Select component's items prop using fetchedCategories
  const categoryItems = (fetchedCategories || []).map((cat: any) => ({
    key: cat.category_name,
    label: cat.category_name,
  }));

  return (
    <>
      {/* Detail Modal (no changes needed here, it uses selectedRemark which now has the correct category) */}
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

      {/* Delete Confirmation Modal (no changes needed) */}
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
              }
              items={[
                { key: "all", label: "All Categories" },
                ...categoryItems,
                // Consider if "Others" should be dynamically added or always present
                // { key: "Others", label: "Others" },
              ]}
              onChange={(e) => {
                setSelectedCategory(e.target.value || "all");
                setPage(1); // Reset to page 1 when category changes
              }}
              isLoading={isLoadingCategory} // Add loading state
              isDisabled={isLoadingCategory} // Disable while loading
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
              items={remarks} // Use the main remarks state directly
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
                              {remark.category} {/* Display direct category */}
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
                              onClick={() => handleDeleteClick(remark)}
                            >
                              <IoTrash size={18} />
                            </Button>
                          </TableCell>
                        );
                      default:
                        return (
                          <TableCell className="text-center">
                            {/* @ts-ignore */}
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
