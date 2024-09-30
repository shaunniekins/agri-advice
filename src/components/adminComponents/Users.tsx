"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  SelectItem,
  Select,
  Button,
  Spinner,
} from "@nextui-org/react";
import useUsers from "@/hooks/useUsers";
import { useState, useEffect } from "react";
import { supabaseAdmin } from "@/utils/supabase";

const UserComponent = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [userType, setUserType] = useState("technician");
  const rowsPerPage = 10;

  const {
    usersData,
    isLoadingUsers,
    totalUserEntries,
    fetchAndSubscribeUsers,
  } = useUsers(
    rowsPerPage,
    page,
    userType,
    userType === "technician" ? statusFilter : undefined
  );

  useEffect(() => {
    setPage(1); // Reset the page when userType changes
  }, [userType]);

  const totalPages = Math.ceil(totalUserEntries / rowsPerPage);

  if (isLoadingUsers) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        Loading...
      </div>
    );
  }

  const handleAction = async (
    user_id: string,
    action: string,
    item_data: any
  ) => {
    try {
      const { data: user, error } =
        await supabaseAdmin.auth.admin.updateUserById(user_id, {
          user_metadata: { account_status: action },
        });

      if (error) throw error;

      //       if (action === "active" && user) {
      //         const emailData = {
      //           email: item_data.email,
      //           recipient_name: `${item_data.first_name} ${item_data.last_name}`,
      //           subject: "Account Approved",
      //           message: `
      // Greetings!
      // We are pleased to inform you that your account associated with the email ${item_data.email} has been approved. You can now sign in and access your account.
      // Thank you!
      // Best regards,
      // Agri Advice Team`,
      //         };

      //         try {
      //           const response = await fetch("/api/send-email", {
      //             method: "POST",
      //             headers: { "Content-Type": "application/json" },
      //             body: JSON.stringify(emailData),
      //           });

      //           const data = await response.json();

      //           if (response.ok) {
      //             console.log("Email sent successfully!");
      //           } else {
      //             console.log(
      //               `Failed to send email: ${data?.error || "Unknown error"}`
      //             );
      //           }
      //         } catch (error) {
      //           console.error("Error sending email:", error);
      //         }
      //       }

      fetchAndSubscribeUsers();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const TechnicianColumns = [
    { key: "first_name", label: "FIRST NAME" },
    { key: "last_name", label: "LAST NAME" },
    { key: "mobile_number", label: "MOBILE" },
    { key: "email", label: "EMAIL" },
    { key: "license_number", label: "LICENSE NUMBER" },
    { key: "specialization", label: "SPECIALIZATION" },
    { key: "actions", label: "ACTIONS" },
  ];

  const FarmerColumns = [
    { key: "first_name", label: "FIRST NAME" },
    { key: "last_name", label: "LAST NAME" },
    { key: "mobile_number", label: "MOBILE" },
    { key: "email", label: "EMAIL" },
  ];

  const columns = userType === "technician" ? TechnicianColumns : FarmerColumns;
  const data = usersData;

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <div className="flex justify-end gap-2">
        {/* Status filter shown only for technician */}
        <Select
          label="Filter by Status"
          disallowEmptySelection={true}
          size="sm"
          className={`${userType !== "technician" && "hidden"} max-w-48`}
          defaultSelectedKeys={["pending"]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <SelectItem key="pending" value="pending">
            Pending
          </SelectItem>
          <SelectItem key="active" value="active">
            Accepted
          </SelectItem>
          <SelectItem key="rejected" value="rejected">
            Rejected
          </SelectItem>
        </Select>

        {/* User type switch */}
        <Select
          label="User Type"
          disallowEmptySelection={true}
          size="sm"
          className="max-w-48"
          defaultSelectedKeys={["technician"]}
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
        >
          <SelectItem key="technician" value="technician">
            Technician
          </SelectItem>
          <SelectItem key="farmer" value="farmer">
            Farmer
          </SelectItem>
        </Select>
      </div>

      {/* Table to display users */}
      <Table
        fullWidth
        layout="fixed"
        isHeaderSticky={true}
        aria-label="Users Table with Pagination"
        bottomContent={
          <div className="flex w-full justify-center">
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
        }
        classNames={{
          wrapper: "min-h-[222px] h-full",
        }}
        className="h-full w-full flex items-center justify-center"
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
          items={data}
          emptyContent={"No rows to display."}
          loadingContent={<Spinner color="success" />}
        >
          {(item) => (
            <TableRow key={item.user_id} className="text-center">
              {(columnKey) => {
                if (columnKey === "actions" && userType === "technician") {
                  return (
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          color="success"
                          isDisabled={item.account_status === "active"}
                          className="text-white"
                          onClick={() => handleAction(item.id, "active", item)}
                        >
                          {item.account_status === "active"
                            ? "Active"
                            : "Accept"}
                        </Button>
                        <Button
                          color="danger"
                          className={`${
                            item.account_status !== "pending" && "hidden"
                          }`}
                          onClick={() =>
                            handleAction(item.id, "rejected", item)
                          }
                        >
                          Reject
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
  );
};

export default UserComponent;
