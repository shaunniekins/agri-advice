"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  getKeyValue,
  SelectItem,
  Select,
  Button,
  Spinner,
} from "@nextui-org/react";
import useTechnicianUsers from "@/hooks/useTechnicianUsers";
import useFarmerUsers from "@/hooks/useFarmerUsers";
import { useState, useEffect } from "react";
import { supabaseAdmin } from "@/utils/supabase";

const UserComponent = () => {
  const {
    technicianUsers,
    isLoadingTechnicianUsers,
    totalTechnicianEntries,
    fetchAndSubscribeTechnicianUsers,
    updateTechnicianUser,
  } = useTechnicianUsers();

  const {
    farmerUsers,
    isLoadingFarmerUsers,
    totalFarmerEntries,
    fetchAndSubscribeFarmerUsers,
  } = useFarmerUsers();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const rowsPerPage = 10;

  const [userType, setUserType] = useState("technician");

  useEffect(() => {
    setPage(1);
  }, [userType]);

  useEffect(() => {
    if (userType === "farmer") {
      fetchAndSubscribeFarmerUsers(rowsPerPage, page);
    } else if (userType === "technician") {
      fetchAndSubscribeTechnicianUsers(rowsPerPage, page, statusFilter);
    }
  }, [
    userType,
    rowsPerPage,
    page,
    statusFilter,
    fetchAndSubscribeFarmerUsers,
    fetchAndSubscribeTechnicianUsers,
  ]);

  const totalPages =
    userType === "farmer"
      ? Math.ceil(totalFarmerEntries / rowsPerPage)
      : Math.ceil(totalTechnicianEntries / rowsPerPage);

  if (
    (userType === "farmer" && isLoadingFarmerUsers) ||
    (userType === "technician" && isLoadingTechnicianUsers)
  ) {
    return <div className="h-full w-full">Loading...</div>;
  }

  const handleAction = async (user_id: any, action: string, item_data: any) => {
    // console.log(item_data);
    if (action === "accepted") {
      const { data } = await supabaseAdmin.auth.admin.createUser({
        email: item_data.email,
        password: item_data.password,
        email_confirm: true,
        user_metadata: {
          email: item_data.email,
          password: item_data.password,
          user_type: "technician",
          first_name: item_data.first_name,
          last_name: item_data.last_name,
          middle_name: item_data.middle_name,
          mobile_number: item_data.mobile_number,
          birth_date: item_data.birth_date,
          address: item_data.address,
        },
      });

      if (data) {
        await updateTechnicianUser(user_id, {
          auth_user_id: data.user?.id,
          account_status: "accepted",
        });

        const email = item_data.email;
        const recipient_name = `${item_data.first_name} ${item_data.last_name}`;
        const subject = "Account Approved";
        const message = `
Greetings!
  
We are pleased to inform you that your account associated with the email ${email} has been approved. You can now sign in and access your account.
  
Thank you!
  
Best regards,
Agri Advice Team`;

        try {
          const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, recipient_name, subject, message }),
          });

          let data;
          try {
            data = await response.json();
          } catch (error) {
            data = null;
          }

          if (response.ok) {
            console.log("Email sent successfully!");
          } else {
            console.log(
              `Failed to send email: ${data?.error || "Unknown error"}`
            );
          }
        } catch (error) {
          console.error("Error sending email:", error);
        }
      }
      return;
    }

    await updateTechnicianUser(user_id, { account_status: action });
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
  const data = userType === "technician" ? technicianUsers : farmerUsers;

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <div className="flex justify-end gap-2">
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
          <SelectItem key="accepted" value="accepted">
            Accepted
          </SelectItem>
          <SelectItem key="rejected" value="rejected">
            Rejected
          </SelectItem>
        </Select>
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
                          isDisabled={item.account_status === "accepted"}
                          className="text-white"
                          onClick={() =>
                            handleAction(item.user_id, "accepted", item)
                          }
                        >
                          {item.account_status === "accepted"
                            ? "Active"
                            : "Accept"}
                        </Button>
                        <Button
                          color="danger"
                          className={`${
                            item.account_status !== "pending" && "hidden"
                          }`}
                          onClick={() =>
                            handleAction(item.user_id, "rejected", item)
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
