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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  ModalFooter,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@nextui-org/react";
import useUsers from "@/hooks/useUsers";
import { useState, useEffect } from "react";
import { supabaseAdmin } from "@/utils/supabase";
import { FaCheckCircle, FaEllipsisH, FaTrash } from "react-icons/fa";
import { IoAdd, IoAddOutline, IoRemoveCircle } from "react-icons/io5";
import { EyeSlashFilledIcon } from "../../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../../public/icons/EyeFilledIcon";
import UserProfile from "../chatComponents/UserProfile";
import useBarangay from "@/hooks/useBarangay";
import { deleteBarangay, insertBarangay } from "@/app/api/barangayIUD";

const UserComponent = () => {
  const [page, setPage] = useState(1);
  const [userType, setUserType] = useState("technician");
  const rowsPerPage = 10;

  const [isAddNewTechnicianModalOpen, setIsAddNewTechnicianModalOpen] =
    useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isInputUserPasswordVisible, setIsInputUserPasswordVisible] =
    useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialization, setSpecialization] = useState("");

  const [openUserInfo, setOpenUserInfo] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<any>({});
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserType, setCurrentUserType] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [technician_support, setTechnician_support] = useState<
    "false" | "true"
  >("true");

  const { usersData, totalUserEntries, fetchAndSubscribeUsers } = useUsers(
    rowsPerPage,
    page,
    userType,
    statusFilter,
    technician_support
  );

  useEffect(() => {
    setPage(1); // Reset the page when userType changes
  }, [userType]);

  const totalPages = Math.ceil(totalUserEntries / rowsPerPage);

  const { barangay } = useBarangay();

  const handleDeleteBarangay = async (barangayName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${barangayName}?`
    );
    if (confirmed) {
      setAddress("");
      await deleteBarangay(barangayName);
    }
  };

  const handleBarangayChange = async (value: string) => {
    if (value === "Add Barangay") {
      const newBarangay = window.prompt("Enter new barangay name:");
      if (newBarangay) {
        const result = await insertBarangay({ barangay_name: newBarangay });
        if (result && result.length > 0) {
          setAddress(result[0].barangay_name);
        }
      } else {
        setAddress("");
      }
      return;
    }
    setAddress(value);
  }; // const handleAction = async (
  //   user_id: string,
  //   action: string,
  //   item_data: any
  // ) => {
  //   try {
  //     const { data: user, error } =
  //       await supabaseAdmin.auth.admin.updateUserById(user_id, {
  //         user_metadata: { account_status: action },
  //       });

  //     if (error) throw error;

  //     //       if (action === "active" && user) {
  //     //         const emailData = {
  //     //           email: item_data.email,
  //     //           recipient_name: `${item_data.first_name} ${item_data.last_name}`,
  //     //           subject: "Account Approved",
  //     //           message: `
  //     // Greetings!
  //     // We are pleased to inform you that your account associated with the email ${item_data.email} has been approved. You can now sign in and access your account.
  //     // Thank you!
  //     // Best regards,
  //     // Agri Advice Team`,
  //     //         };

  //     //         try {
  //     //           const response = await fetch("/api/send-email", {
  //     //             method: "POST",
  //     //             headers: { "Content-Type": "application/json" },
  //     //             body: JSON.stringify(emailData),
  //     //           });

  //     //           const data = await response.json();

  //     //           if (response.ok) {
  //     //             console.log("Email sent successfully!");
  //     //           } else {
  //     //             console.log(
  //     //               `Failed to send email: ${data?.error || "Unknown error"}`
  //     //             );
  //     //           }
  //     //         } catch (error) {
  //     //           console.error("Error sending email:", error);
  //     //         }
  //     //       }

  //     fetchAndSubscribeUsers();
  //   } catch (error) {
  //     console.error("Error updating user:", error);
  //   }
  // };

  const columns = [
    { key: "first_name", label: "FIRST NAME" },
    { key: "last_name", label: "LAST NAME" },
    { key: "address", label: "ADDRESS" },
    { key: "mobile_number", label: "MOBILE" },
    { key: "email", label: "EMAIL" },
    { key: "password", label: "PASSWORD" },
    { key: "actions", label: "ACTIONS" },
  ];

  const data = usersData;

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits and limit to 11 characters
    if (/^\d{0,11}$/.test(value)) {
      setMobileNumber(value);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <Modal
        size="xl"
        isOpen={isAddNewTechnicianModalOpen}
        onOpenChange={setIsAddNewTechnicianModalOpen}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>New Technician</ModalHeader>
              <ModalBody className="grid grid-cols-2">
                <Input
                  label="First Name"
                  variant="bordered"
                  color="success"
                  isRequired
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Middle Name"
                  variant="bordered"
                  color="success"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                />
                <Input
                  label="Last Name"
                  variant="bordered"
                  color="success"
                  isRequired
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <Input
                  type="email"
                  label="Email"
                  variant="bordered"
                  color="success"
                  isRequired
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type={isInputUserPasswordVisible ? "text" : "password"}
                  label="Password"
                  variant="bordered"
                  color="success"
                  isRequired
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={() =>
                        setIsInputUserPasswordVisible(
                          !isInputUserPasswordVisible
                        )
                      }
                    >
                      {isInputUserPasswordVisible ? (
                        <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      ) : (
                        <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                />
                <Input
                  type="text"
                  label="Mobile Number"
                  variant="bordered"
                  color="success"
                  isRequired
                  value={mobileNumber}
                  onChange={handleMobileNumberChange}
                />
                <Input
                  type="text"
                  label="Birth Date"
                  placeholder="YYYY-MM-DD"
                  variant="bordered"
                  color="success"
                  isRequired
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
                <div className="flex gap-2 items-center">
                  <Select
                    label="Area Assigned"
                    color="success"
                    variant="bordered"
                    isRequired
                    defaultSelectedKeys={[address]}
                    disabledKeys={["Add Barangay"]}
                    value={address}
                    onChange={(e) => handleBarangayChange(e.target.value)}
                  >
                    {barangay &&
                      barangay.map((item) => (
                        <SelectItem
                          key={item.barangay_name}
                          selectedIcon={
                            item.barangay_name === "Add Barangay" ? null : (
                              <IoRemoveCircle
                                size={18}
                                color="red"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteBarangay(item.barangay_name);
                                }}
                                style={{ cursor: "pointer" }}
                              />
                            )
                          }
                        >
                          {item.barangay_name}
                        </SelectItem>
                      ))}
                  </Select>
                  <Button
                    isIconOnly
                    color="success"
                    size="lg"
                    startContent={<IoAdd />}
                    onClick={() => handleBarangayChange("Add Barangay")}
                  />
                </div>
                <Input
                  type="text"
                  label="License Number"
                  variant="bordered"
                  color="success"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
                <Input
                  type="text"
                  label="Specialization"
                  variant="bordered"
                  color="success"
                  isRequired
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="success"
                  className="text-white"
                  onClick={async () => {
                    const { error } = await supabaseAdmin.auth.admin.createUser(
                      {
                        email,
                        password,
                        email_confirm: true,
                        user_metadata: {
                          account_status: "active",
                          profile_picture: "",
                          email: email,
                          password: password,
                          first_name: firstName,
                          last_name: lastName,
                          middle_name: middleName,
                          mobile_number: mobileNumber,
                          birth_date: birthDate,
                          address: address,
                          license_number: licenseNumber,
                          specialization: specialization,
                          experiences: "",
                          user_type: "technician",
                        },
                      }
                    );
                    if (error) {
                      alert(error.message);
                      return;
                    }
                    setIsAddNewTechnicianModalOpen(false);
                    fetchAndSubscribeUsers();
                  }}
                  isDisabled={
                    !email ||
                    !password ||
                    !firstName ||
                    !lastName ||
                    !mobileNumber ||
                    !birthDate ||
                    !address ||
                    !specialization
                  }
                >
                  Add
                </Button>
                <Button color="warning" onClick={onClose}>
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <UserProfile
        openUserInfo={openUserInfo}
        setOpenUserInfo={setOpenUserInfo}
        currentUserInfo={currentUserInfo}
        setCurrentUserInfo={setCurrentUserInfo}
        userId={currentUserId}
        userType={currentUserType}
      />
      <div className="flex flex-col lg:flex-row justify-between gap-2">
        {/* Pagination of the table */}
        <div className="w-full flex justify-start">
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
        <div className="w-full flex justify-end items-center gap-2">
          <Button
            color="success"
            startContent={<IoAddOutline />}
            className={`${userType !== "technician" && "hidden"} text-white`}
            onClick={() => setIsAddNewTechnicianModalOpen(true)}
          >
            Add New
          </Button>
          {/* Technician support filter shown only for farmer */}
          <Select
            label="Technician Support"
            disallowEmptySelection={true}
            size="sm"
            className={`${userType !== "farmer" && "hidden"} max-w-48`}
            defaultSelectedKeys={["true"]}
            value={technician_support.toString()}
            onChange={(e) =>
              setTechnician_support(e.target.value as "false" | "true")
            }
          >
            <SelectItem key="true" value={"true"}>
              Yes
            </SelectItem>
            <SelectItem key="false" value={"false"}>
              No
            </SelectItem>
          </Select>

          {/* Status filter shown only for farmer */}
          <Select
            label="Filter by Status"
            disallowEmptySelection={true}
            size="sm"
            className={`${userType !== "farmer" && "hidden"} max-w-48`}
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
      </div>

      {/* Table to display users */}
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
          items={data}
          emptyContent={"No rows to display."}
          loadingContent={<Spinner color="success" />}
        >
          {(item) => {
            return (
              <TableRow key={item.id} className="text-center">
                {(columnKey) => {
                  if (columnKey === "actions") {
                    return (
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          {/* <Button
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
                        </Button> */}{" "}
                          <Button
                            color="success"
                            size="sm"
                            startContent=<FaEllipsisH />
                            className="text-white"
                            onClick={() => {
                              setCurrentUserId(item.id);
                              setCurrentUserType(item.user_type);
                              setCurrentUserInfo(item);
                              setOpenUserInfo(true);
                            }}
                          >
                            View
                          </Button>
                          {userType === "farmer" &&
                            statusFilter === "pending" && (
                              <Button
                                color="secondary"
                                size="sm"
                                startContent={<FaCheckCircle />}
                                onClick={async () => {
                                  await supabaseAdmin.auth.admin.updateUserById(
                                    item.id,
                                    {
                                      user_metadata: {
                                        account_status: "active",
                                      },
                                    }
                                  );
                                  fetchAndSubscribeUsers();
                                }}
                              >
                                Accept
                              </Button>
                            )}
                          <Button
                            color="danger"
                            size="sm"
                            startContent=<FaTrash />
                            onClick={async () => {
                              const confirmed = window.confirm(
                                "Are you sure you want to delete this user?"
                              );
                              if (confirmed) {
                                await supabaseAdmin.auth.admin.deleteUser(
                                  item.id
                                );
                              }
                              fetchAndSubscribeUsers();
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    );
                  }

                  if (columnKey === "password") {
                    return (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Popover placement="top">
                            <PopoverTrigger>
                              <div className="flex items-center cursor-pointer">
                                <span className="text-gray-500">••••••••</span>
                                <Button variant="light" isIconOnly>
                                  <EyeFilledIcon className="text-xl text-default-400" />
                                </Button>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent>
                              <div className="p-4">
                                <div className="mb-2 text-sm text-gray-500">
                                  Password:
                                </div>
                                <div className="font-bold text-blue-600 bg-gray-50 p-2 rounded border">
                                  {item.password || "[Not Set]"}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
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
            );
          }}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserComponent;
