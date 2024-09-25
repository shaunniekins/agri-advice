"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import { IoAddCircleOutline, IoAddSharp } from "react-icons/io5";
import { IoMdTrash } from "react-icons/io";
import { useHandleLogout } from "@/utils/authUtils";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import useChatHeaders from "@/hooks/useChatHeaders";
import { getIdFromPathname } from "@/utils/compUtils";
import { BsThreeDotsVertical } from "react-icons/bs";
import { deleteChatMessage } from "@/app/api/chatMessagesIUD";
import { deleteChatConnection } from "@/app/api/chatConnectionsIUD";
import {
  MdCancel,
  MdClose,
  MdDeleteOutline,
  MdModeEditOutline,
  MdOutlineSpaceDashboard,
  MdSave,
} from "react-icons/md";
import { supabase, supabaseAdmin } from "@/utils/supabase";
import { setUser } from "@/app/reduxUtils/userSlice";

export default function ChatSidebarComponent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(false);
  const [childrenIsLoading, setChildrenIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;
  const router = useRouter();
  const pathname = usePathname();
  const handleLogout = useHandleLogout();

  const chatId = getIdFromPathname(pathname);
  const [initials, setInitials] = useState("");
  const [userType, setUserType] = useState("");
  const [currentHeader, setCurrentHeader] = useState("");

  const [openUserInfo, setOpenUserInfo] = useState(false);
  const [userInfo, setUserInfo] = useState({
    profile_picture: "",
    address: "",
    birth_date: "",
    email: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    mobile_number: "",
    password: "",
  });
  const [tempUserInfo, setTempUserInfo] = useState(userInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user && user.user_metadata) {
      const {
        profile_picture,
        address,
        birth_date,
        email,
        first_name,
        last_name,
        middle_name,
        mobile_number,
        user_type,
      } = user.user_metadata;

      setUserInfo({
        profile_picture: profile_picture || "",
        address: address || "",
        birth_date: birth_date || "",
        email: email || user.email || "",
        first_name: first_name || "",
        last_name: last_name || "",
        middle_name: middle_name || "",
        mobile_number: mobile_number || "",
        password: "", // Password should not be set from user data for security reasons
      });

      setTempUserInfo({
        profile_picture: profile_picture || "",
        address: address || "",
        birth_date: birth_date || "",
        email: email || user.email || "",
        first_name: first_name || "",
        last_name: last_name || "",
        middle_name: middle_name || "",
        mobile_number: mobile_number || "",
        password: "", // Password should not be set from user data for security reasons
      });

      const initials = `${first_name[0].toUpperCase()}${last_name[0].toUpperCase()}`;
      setInitials(initials);
      setUserType(user_type);
    }
  }, [user]);

  const { chatHeaders, loadingChatHeaders, errorChatHeaders } = useChatHeaders(
    user ? user.id : ""
  );

  // Handle sidebar open/close on small screens
  const handleContentClick = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Handle resizing behavior for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check and event listener for window resize
    handleResize();
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Logout logic
  const onLogoutClick = () => {
    setIsLoading(true);
    handleLogout();
  };

  const reloadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    dispatch(setUser(user));
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setTempUserInfo((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setIsChanged(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: tempUserInfo.email,
        data: {
          profile_picture: tempUserInfo.profile_picture,
          address: tempUserInfo.address,
          birth_date: tempUserInfo.birth_date,
          email: tempUserInfo.email,
          first_name: tempUserInfo.first_name,
          last_name: tempUserInfo.last_name,
          middle_name: tempUserInfo.middle_name,
          mobile_number: tempUserInfo.mobile_number,
        },
      });

      if (error) {
        throw error;
      }

      reloadUser();
      setIsEditing(false);
      setIsChanged(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling, revert to tempUserInfo
      setTempUserInfo(userInfo);
      setIsChanged(false);
    } else {
      // If starting to edit, save current userInfo to tempUserInfo
      setTempUserInfo(userInfo);
    }
    setIsEditing(!isEditing);
  };

  const handleDeleteToggle = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

      if (error) {
        throw error;
      }

      setIsLoading(true);
      handleLogout();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedImage(files[0]);
      setTempUserInfo((prevState) => ({
        ...prevState,
        profile_picture: URL.createObjectURL(files[0]),
      }));
      setIsChanged(true);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    const BUCKET_NAME = "profile-pictures";
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`public/${user.id}`, selectedImage);

    if (error) {
      console.error("Error uploading image:", error.message);
      return;
    }

    const { publicUrl } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path).data;

    setTempUserInfo((prevState) => ({
      ...prevState,
      profile_picture: publicUrl,
    }));
    setSelectedImage(null);
    setIsEditing(false);
    setIsChanged(false);
  };

  const handleImageDelete = async () => {
    const BUCKET_NAME = "profile-pictures";
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([`public/${user.id}`]);

    if (error) {
      console.error("Error deleting image:", error.message);
      return;
    }

    setTempUserInfo((prevState) => ({
      ...prevState,
      profile_picture: "",
    }));

    setSelectedImage(null);
    setIsEditing(false);
    setIsChanged(false);
  };

  return (
    <>
      <Modal
        size="xl"
        backdrop="blur"
        isOpen={openUserInfo}
        hideCloseButton={true}
        onOpenChange={setOpenUserInfo}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Personal Information
              </ModalHeader>
              <ModalBody>
                <div className="w-full grid grid-cols-3 gap-4">
                  <div className="col-span-3 flex justify-center">
                    <label htmlFor="profile-picture-upload">
                      <Avatar
                        src={
                          tempUserInfo.profile_picture ||
                          `https://fakeimg.pl/500x500?text=${initials}&font=bebas`
                        }
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover cursor-pointer"
                      />
                    </label>
                    <input
                      id="profile-picture-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                  <Input
                    label="First Name"
                    name="first_name"
                    value={tempUserInfo.first_name}
                    onChange={handleInputChange}
                    isDisabled={!isEditing}
                  />
                  <Input
                    label="Last Name"
                    name="last_name"
                    value={tempUserInfo.last_name}
                    onChange={handleInputChange}
                    isDisabled={!isEditing}
                  />
                  <Input
                    label="Middle Name"
                    name="middle_name"
                    value={tempUserInfo.middle_name}
                    onChange={handleInputChange}
                    isDisabled={!isEditing}
                  />
                  <div className="col-span-3 flex gap-4">
                    <Input
                      label="Email"
                      name="email"
                      value={tempUserInfo.email}
                      onChange={handleInputChange}
                      isDisabled={!isEditing}
                      // className="col-span-2"
                    />
                    <Input
                      label="Mobile Number"
                      name="mobile_number"
                      value={tempUserInfo.mobile_number}
                      onChange={handleInputChange}
                      isDisabled={!isEditing}
                      // className="col-span-2"
                    />
                  </div>
                  <Input
                    label="Address"
                    name="address"
                    value={tempUserInfo.address}
                    onChange={handleInputChange}
                    isDisabled={!isEditing}
                    className="col-span-2"
                  />
                  <Input
                    label="Birth Date"
                    name="birth_date"
                    value={tempUserInfo.birth_date}
                    onChange={handleInputChange}
                    isDisabled={!isEditing}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="w-full flex justify-between">
                  <Button
                    startContent={<MdDeleteOutline />}
                    color="danger"
                    onClick={handleDeleteToggle}
                  >
                    Delete Account
                  </Button>
                  <div className="flex justify-end items-center gap-3">
                    <Button
                      startContent={
                        isEditing ? <MdCancel /> : <MdModeEditOutline />
                      }
                      color="secondary"
                      onClick={handleEditToggle}
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>

                    {/* {isEditing && (
                      <Button
                        startContent={<MdDeleteOutline />}
                        color="danger"
                        onClick={handleImageDelete}
                      >
                        Delete Image
                      </Button>
                    )} */}

                    <Button
                      startContent={isChanged ? <MdSave /> : <MdClose />}
                      className="bg-[#007057] text-white self-center"
                      onClick={() => {
                        if (isChanged) {
                          handleSave();
                          handleImageUpload();
                        } else {
                          setOpenUserInfo(false);
                        }
                      }}
                    >
                      {isChanged ? "Save" : "Close"}
                    </Button>
                  </div>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Spinner color="success" />
        </div>
      )}
      {!isLoading && (
        <div
          className={`h-[100svh] w-screen font-body grid ${
            isSidebarOpen
              ? "lg:grid-cols-[1fr_3fr] xl:grid-cols-[1fr_5fr]"
              : "lg:grid-cols-1 xl:grid-cols-1"
          }`}
        >
          <div
            className={`${
              isSidebarOpen ? "z-10 flex lg:block" : "hidden lg:hidden"
            } fixed inset-y-0 left-0 w-4/5 lg:relative lg:w-auto lg:bg-transparent`}
          >
            <div className="bg-[#007057] text-white h-full w-80 flex flex-col justify-center select-none relative">
              <button
                className={`${
                  !isSidebarOpen && "hidden"
                } absolute flex items-center top-3 right-5 text-xl cursor-pointer`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <FaBars />
              </button>
              <div>
                <Button
                  radius="full"
                  startContent={
                    userType === "farmer" ? (
                      <IoAddSharp />
                    ) : (
                      <MdOutlineSpaceDashboard />
                    )
                  }
                  className="mt-16 py-5 mx-3 inline-flex"
                  onClick={() => {
                    if (pathname !== `/${userType}/chat`) {
                      // setIsLoading(true);
                      router.push(`/${userType}/chat`);
                    }
                  }}
                >
                  {userType === "farmer" ? "New Chat" : "Main"}
                </Button>
              </div>
              <ul className="h-full mt-2 mb-20 flex flex-col pt-3 pb-5">
                {chatHeaders.length === 0 ? (
                  <li className="flex justify-center items-center h-full">
                    No chat history
                  </li>
                ) : (
                  chatHeaders.map((message, index) => {
                    const displayName =
                      message.sender_id !== user.id
                        ? `${message.sender_raw_user_meta_data.first_name} ${message.sender_raw_user_meta_data.last_name}`
                        : message.receiver_id !== user.id
                        ? `${message.receiver_raw_user_meta_data.first_name} ${message.receiver_raw_user_meta_data.last_name}`
                        : "Unknown";

                    // Determine if the user is the latest messager
                    const isUserLatestMessager = message.sender_id === user.id;

                    return (
                      <li
                        key={message.chat_message_id}
                        className={`${
                          chatId === message.chat_message_id ||
                          currentHeader === message.chat_message_id
                            ? "bg-[#005c4d]"
                            : ""
                        } flex items-center py-2 px-3 text-sm rounded-md hover:bg-[#005c4d] cursor-pointer w-full relative group`}
                        onClick={() => {
                          if (user.id === message.sender_id) {
                            // alert("You are the sender");
                            router.push(
                              `/${userType}/chat/id?sender=${message.sender_id}&receiver=${message.receiver_id}`
                            );
                          } else {
                            // alert("You are the receiver");
                            router.push(
                              `/${userType}/chat/id?sender=${message.sender_id}&receiver=${message.receiver_id}`
                            );
                          }
                        }}
                      >
                        <span className="w-full flex items-center gap-2">
                          {/* <Avatar size="sm" name={displayName} showFallback /> */}
                          <div className="flex flex-col justify-center truncate">
                            <span className="truncate text-lg font-semibold">
                              {displayName}
                            </span>
                            <span className="text-xs truncate">
                              {isUserLatestMessager
                                ? `You: ${message.message}`
                                : message.message}
                            </span>
                          </div>
                        </span>
                        <Popover showArrow placement="bottom">
                          <PopoverTrigger>
                            <div
                              className={`${
                                userType === "technician" && "hidden"
                              } absolute top-1/2 right-3 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full p-2 hover:bg-green-900`}
                            >
                              <BsThreeDotsVertical />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="p-1">
                            <Button
                              size="sm"
                              startContent={<IoMdTrash />}
                              onClick={() => {
                                deleteChatMessage(
                                  message.sender_id,
                                  message.receiver_id
                                );

                                deleteChatConnection(
                                  message.sender_id,
                                  message.receiver_id
                                );
                              }}
                            >
                              Delete
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </li>
                    );
                  })
                )}
              </ul>
              <Button
                color={"danger"}
                startContent={<FaSignOutAlt />}
                className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
                onClick={onLogoutClick}
              >
                Logout
              </Button>
            </div>
          </div>
          {/* HEADER */}
          <div className="h-full w-full flex flex-col relative overflow-hidden">
            <div className="flex-none">
              <div className="w-full bg-[#007057] text-white flex justify-between items-center px-5">
                <div className="flex h-11 items-center gap-2">
                  <button
                    className={`${isSidebarOpen && "hidden"}`}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  >
                    <FaBars className="text-xl" />
                  </button>
                  <button
                    className={`${isSidebarOpen && "hidden"}`}
                    onClick={() => router.push(`/${userType}/chat`)}
                  >
                    <IoAddCircleOutline size={25} />
                  </button>
                  <div
                    className={`${
                      chatId !== "chat" ? "hidden md:block" : "block"
                    } `}
                  >
                    AgriAdvice
                  </div>
                </div>
                {/* <div
                  className={`${
                    chatId === "chat" ? "hidden" : "flex"
                  } flex-col items-center`}
                >
                  <span className="text-xs">You&apos;re talking to</span>
                  {chatConnectionData && (
                    <span>{`${
                      (chatConnectionData as any).technician_first_name || ""
                    } ${
                      (chatConnectionData as any).technician_last_name || ""
                    }`}</span>
                  )}
                </div> */}
                <button
                  className="flex items-center gap-2"
                  onClick={() => setOpenUserInfo(true)}
                >
                  <Avatar size="sm" name={initials} showFallback />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <div
                className="h-full w-full flex flex-col bg-[#F4FFFC] px-4 lg:px-72 pt-5 lg:pt-10"
                onClick={handleContentClick}
              >
                {childrenIsLoading ? <Spinner color="success" /> : children}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
