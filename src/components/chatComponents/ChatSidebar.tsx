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
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from "@nextui-org/react";
import React from "react";
import { useEffect, useState } from "react";
import { FaBars, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
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
import { EyeSlashFilledIcon } from "../../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../../public/icons/EyeFilledIcon";
import PartnerViewProfile from "./PartnerViewProfile";
import { FiHelpCircle } from "react-icons/fi";

export default function ChatSidebarComponent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(false);
  const [childrenIsLoading, setChildrenIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 9;
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();
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
    first_name: "",
    last_name: "",
    middle_name: "",
    mobile_number: "",
    num_heads: "",
    experience_years: "",
    operations: "",
    experiences: "",
    license_number: "",
    specialization: "",
  });
  const [tempUserInfo, setTempUserInfo] = useState(userInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  // Login info state
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });

  const [tempLoginInfo, setTempLoginInfo] = useState(loginInfo);
  const [isLoginEditing, setIsLoginEditing] = useState(false);
  const [isInputUserPasswordVisible, setIsInputUserPasswordVisible] =
    useState(false);
  const [isLoginChanged, setIsLoginChanged] = useState(false);

  // Image state
  const [displayImage, setDisplayImage] = useState({
    profile_picture: "",
  });
  const [displayImageOpen, setDisplayImageOpen] = useState(false);
  const BUCKET_NAME = "profile-pictures";

  useEffect(() => {
    if (user && user.user_metadata) {
      const {
        profile_picture,
        email,
        password,
        address,
        birth_date,
        first_name,
        last_name,
        middle_name,
        mobile_number,
        user_type,
        num_heads,
        experience_years,
        operations,
        experiences,
        license_number,
        specialization,
      } = user.user_metadata;

      const commonUserInfo = {
        profile_picture: profile_picture || "",
        address: address || "",
        birth_date: birth_date || "",
        first_name: first_name || "",
        last_name: last_name || "",
        middle_name: middle_name || "",
        mobile_number: mobile_number || "",
        num_heads: "",
        experience_years: "",
        operations: "",
        experiences: "",
        license_number: "",
        specialization: "",
      };

      if (user_type === "farmer") {
        setUserInfo({
          ...commonUserInfo,
          num_heads: num_heads || "",
          experience_years: experience_years || "",
          operations: operations || "",
        });

        setTempUserInfo({
          ...commonUserInfo,
          num_heads: num_heads || "",
          experience_years: experience_years || "",
          operations: operations || "",
        });
      } else if (user_type === "technician") {
        setUserInfo({
          ...commonUserInfo,
          experiences: experiences || "",
          license_number: license_number || "",
          specialization: specialization || "",
        });

        setTempUserInfo({
          ...commonUserInfo,
          experiences: experiences || "",
          license_number: license_number || "",
          specialization: specialization || "",
        });
      } else {
        setUserInfo(commonUserInfo);
        setTempUserInfo(commonUserInfo);
      }

      setLoginInfo({
        email: email || user.email || "",
        password: password || "",
      });

      setTempLoginInfo({
        email: email || user.email || "",
        password: password || "",
      });

      setDisplayImage({
        profile_picture: profile_picture || "",
      });

      const initials = `${first_name[0].toUpperCase()}${last_name[0].toUpperCase()}`;
      setInitials(initials);
      setUserType(user_type);
    }
  }, [user]);

  const {
    chatHeaders,
    totalChatHeaders,
    loadingChatHeaders,
    errorChatHeaders,
  } = useChatHeaders(rowsPerPage, page, user ? user.id : "");

  const totalPages = Math.ceil(totalChatHeaders / rowsPerPage);

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

  const handleDeleteToggle = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (error) throw error;

      if (displayImage.profile_picture) {
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([`public/${user.id}`]);

        if (error) throw error;
      }

      if (userType === "farmer") {
        const filePath = `public/${user.id}`;

        const { data: list } = await supabase.storage
          .from("chat-images")
          .list(filePath);
        const filesToRemove = list?.map((x) => `${filePath}/${x.name}`);

        if (filesToRemove && filesToRemove.length > 0) {
          const { error } = await supabase.storage
            .from("chat-images")
            .remove(filesToRemove);

          if (error) {
            console.error("Error deleting image:", error.message);
            return;
          }
        }
      }

      setIsLoading(true);
      handleLogout();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // handlers for user info
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setTempUserInfo((prevState) => ({ ...prevState, [name]: value }));
    setIsChanged(true);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling, revert to tempUserInfo
      setTempUserInfo(userInfo);
      setTempLoginInfo(loginInfo);

      setIsChanged(false);
      setIsLoginChanged(false);
    } else {
      // If starting to edit, save current userInfo to tempUserInfo
      setTempUserInfo(userInfo);
      setTempLoginInfo(loginInfo);
    }
    setIsEditing(!isEditing);
    setIsLoading(false);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...tempUserInfo,
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

  // Handlers for login info
  const handleLoginInputChange = (e: any) => {
    const { name, value } = e.target;
    setTempLoginInfo((prevState) => ({ ...prevState, [name]: value }));
    setIsLoginChanged(true);
  };

  const handleLoginEditToggle = () => {
    if (isLoginEditing) {
      // If canceling, revert to tempUserInfo
      setTempLoginInfo(loginInfo);
      setIsLoginChanged(false);
    } else {
      // If starting to edit, save current userInfo to tempUserInfo
      setTempLoginInfo(loginInfo);
    }
    setIsLoginEditing(!isLoginEditing);
  };

  const handleLoginSave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: tempLoginInfo.email,
        password: tempLoginInfo.password,
        data: {
          email: tempLoginInfo.email,
          password: tempLoginInfo.password,
        },
      });
      if (error) throw error;

      reloadUser();
      setIsLoginEditing(false);
      setIsLoginChanged(false);

      setIsEditing(false);
      setIsChanged(false);
    } catch (error) {
      console.error("Error updating login information:", error);
    }
  };

  // Handlers for image
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayImageOpen(false);

    const files = e.target.files;

    if (files && files[0]) {
      setDisplayImage((prevState) => ({
        ...prevState,
        profile_picture: "",
      }));

      setDisplayImage((prevState) => ({
        ...prevState,
        profile_picture: "",
      }));

      if (displayImage.profile_picture) {
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([`public/${user.id}`]);

        if (error) {
          console.error("Error deleting image:", error.message);
          return;
        }
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`public/${user.id}`, files[0]);

      if (data && !error) {
        const { publicUrl } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path).data;

        const { error } = await supabase.auth.updateUser({
          data: {
            profile_picture: publicUrl,
          },
        });

        setDisplayImage((prevState) => ({
          ...prevState,
          profile_picture: publicUrl,
        }));

        setDisplayImage((prevState) => ({
          ...prevState,
          profile_picture: publicUrl,
        }));

        reloadUser();

        if (error) throw error;
      }
    }
  };

  const handleImageDelete = async () => {
    setDisplayImageOpen(false);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([`public/${user.id}`]);

    if (error) {
      console.error("Error deleting image:", error.message);
      return;
    }

    await supabase.auth.updateUser({
      data: {
        profile_picture: "",
      },
    });

    setDisplayImage((prevState) => ({
      ...prevState,
      profile_picture: "",
    }));

    reloadUser();
  };

  const isTechnicianPathBase = pathname === "/technician/chat";
  // console.log("isTechnicianPathBase", isTechnicianPathBase);

  const [openPartnerInfo, setOpenPartnerInfo] = useState(false);
  const [partnerUserInfo, setPartnerUserInfo] = useState<any[]>([]);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  return (
    <>
      <Modal
        // size="xl"
        backdrop="blur"
        isOpen={openUserInfo}
        hideCloseButton={true}
        onOpenChange={setOpenUserInfo}
        className="h-full lg:h-auto"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Personal Information
              </ModalHeader>
              <ModalBody className="h-full overflow-y-auto">
                <div className="w-full h-full flex flex-col lg:grid lg:grid-cols-3 gap-4 overflow-y-auto">
                  <div className="lg:col-span-3 flex flex-col items-center">
                    <Popover
                      showArrow
                      placement="right"
                      isOpen={displayImageOpen}
                      onOpenChange={(open) =>
                        isEditing && setDisplayImageOpen(open)
                      }
                    >
                      <PopoverTrigger>
                        {/* {displayImage.profile_picture ? ( */}
                        <Avatar
                          src={displayImage.profile_picture}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover cursor-pointer"
                        />
                        {/* ) : (
                          <FaUserCircle size="8rem" className="text-gray-500" />
                        )} */}
                      </PopoverTrigger>
                      <PopoverContent className="p-3 flex flex-col items-start gap-3">
                        <input
                          id="profile-picture-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="profile-picture-upload"
                          className="flex items-center gap-2 text-md cursor-pointer"
                        >
                          <MdSave className="text-lg" />
                          <span>
                            {!displayImage ? "Upload an image" : "Change image"}
                          </span>
                        </label>

                        {displayImage.profile_picture && (
                          <button
                            className="flex items-center gap-2 text-md cursor-pointer"
                            onClick={handleImageDelete}
                          >
                            <MdDeleteOutline className="text-lg" />
                            <span>Delete</span>
                          </button>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* info */}
                  <Input
                    label="First Name"
                    name="first_name"
                    value={tempUserInfo.first_name}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                  <Input
                    label="Last Name"
                    name="last_name"
                    value={tempUserInfo.last_name}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                  <Input
                    label="Middle Name"
                    name="middle_name"
                    value={tempUserInfo.middle_name}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                  <Input
                    label="Mobile Number"
                    name="mobile_number"
                    value={tempUserInfo.mobile_number}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    // className="col-span-2"
                  />
                  <Input
                    label="Address"
                    name="address"
                    value={tempUserInfo.address}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    // className="col-span-2"
                  />
                  <Input
                    label="Birth Date"
                    name="birth_date"
                    value={tempUserInfo.birth_date}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />

                  <hr className="lg:col-span-3" />
                  {/* technician specific */}
                  {userType === "technician" && (
                    <>
                      <Input
                        label="License Number"
                        name="license_number"
                        value={tempUserInfo.license_number}
                        onChange={handleInputChange}
                        className="lg:col-span-3"
                        readOnly={!isEditing}
                      />

                      <Input
                        label="Specialization"
                        name="specialization"
                        value={tempUserInfo.specialization}
                        onChange={handleInputChange}
                        className="lg:col-span-3"
                        readOnly={!isEditing}
                      />

                      <Input
                        label="Experiences"
                        name="experiences"
                        value={tempUserInfo.experiences}
                        onChange={handleInputChange}
                        className="lg:col-span-3"
                        readOnly={!isEditing}
                      />
                    </>
                  )}

                  {/* pig farmer specific */}
                  {userType === "farmer" && (
                    <>
                      <Input
                        label="Number of Heads"
                        name="num_heads"
                        value={tempUserInfo.num_heads}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                      />
                      <Input
                        label="Experience Years"
                        name="experience_years"
                        value={tempUserInfo.experience_years}
                        onChange={handleInputChange}
                        className="col-span-2"
                        readOnly={!isEditing}
                      />
                      <Input
                        label="Operations"
                        name="operations"
                        value={tempUserInfo.operations}
                        onChange={handleInputChange}
                        className="lg:col-span-3"
                        readOnly={!isEditing}
                      />
                    </>
                  )}

                  <hr className="lg:col-span-3" />
                  <h1 className="text-sm font-semibold lg:col-span-3">
                    Account Login Information
                  </h1>
                  <Input
                    label="Email"
                    name="email"
                    color="success"
                    variant="bordered"
                    value={tempLoginInfo.email}
                    onChange={handleLoginInputChange}
                    readOnly={!isLoginEditing}
                  />
                  <Input
                    type={isInputUserPasswordVisible ? "text" : "password"}
                    label="Password"
                    name="password"
                    color="success"
                    variant="bordered"
                    value={tempLoginInfo.password}
                    onChange={handleLoginInputChange}
                    readOnly={!isLoginEditing}
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
                  <div
                    className={`${
                      !isEditing && "hidden"
                    } flex justify-center items-center gap-2`}
                  >
                    <Button
                      fullWidth
                      variant="bordered"
                      startContent={
                        isLoginEditing ? <MdCancel /> : <MdModeEditOutline />
                      }
                      color="secondary"
                      onClick={handleLoginEditToggle}
                    >
                      {isLoginEditing ? "Cancel" : "Edit Login Info"}
                    </Button>
                    <Button
                      fullWidth
                      variant="bordered"
                      startContent={<MdSave />}
                      className={`${!isLoginChanged && "hidden"} `}
                      color="success"
                      onClick={handleLoginSave}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="w-full flex justify-between gap-2">
                  <Button
                    startContent={<MdDeleteOutline />}
                    color="danger"
                    variant="bordered"
                    onClick={handleDeleteToggle}
                  >
                    Delete Account
                  </Button>
                  <div className="flex justify-end items-center gap-2">
                    <Button
                      startContent={
                        isEditing ? <MdCancel /> : <MdModeEditOutline />
                      }
                      color="secondary"
                      onClick={handleEditToggle}
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                    <Button
                      startContent={isChanged ? <MdSave /> : <MdClose />}
                      className="bg-[#007057] text-white self-center"
                      onClick={() => {
                        if (isChanged) {
                          handleSave();
                        } else {
                          setOpenUserInfo(false);
                          setTempUserInfo(userInfo);
                          setTempLoginInfo(loginInfo);
                          setIsEditing(false);
                          setIsLoginEditing(false);
                          setIsChanged(false);
                          setIsLoginChanged(false);
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

      <PartnerViewProfile
        openPartnerInfo={openPartnerInfo}
        setOpenPartnerInfo={setOpenPartnerInfo}
        partnerUserInfo={partnerUserInfo}
        setPartnerUserInfo={setPartnerUserInfo}
        userId={user?.id}
        userType={userType}
      />

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
            <div className="bg-[#007057] text-white h-full w-80 flex flex-col justify-start select-none relative">
              <button
                className={`${
                  !isSidebarOpen && "hidden"
                } flex self-end items-center py-3 pr-5 text-xl cursor-pointer`}
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
              <ul className="h-full w-full self-start mt-2 mb-20 flex flex-col pt-3 pb-5">
                {chatHeaders.length === 0 ? (
                  <li className="flex justify-center items-center h-full w-full">
                    No chat history
                  </li>
                ) : (
                  chatHeaders.map((message) => {
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
                            router.push(
                              `/${userType}/chat/id?sender=${message.sender_id}&receiver=${message.receiver_id}`
                            );
                          } else {
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
                        <Popover
                          showArrow
                          isOpen={openPopoverId === message.chat_message_id}
                          onOpenChange={(open) => {
                            if (open) {
                              setOpenPopoverId(message.chat_message_id);
                            } else {
                              setOpenPopoverId(null);
                            }
                          }}
                          placement="bottom"
                        >
                          <PopoverTrigger>
                            <div
                              className="absolute top-1/2 right-3 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full p-2 hover:bg-green-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenPopoverId(message.chat_message_id);
                              }}
                            >
                              <BsThreeDotsVertical />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="flex gap-2 p-2">
                            <Button
                              fullWidth
                              size="sm"
                              startContent={<FaUserCircle />}
                              onClick={() => {
                                setOpenPartnerInfo(true);
                                setPartnerUserInfo(message);
                                setOpenPopoverId(null);
                              }}
                            >
                              View
                            </Button>
                            <Button
                              fullWidth
                              size="sm"
                              className={` ${
                                userType === "technician" && "hidden"
                              }`}
                              startContent={<IoMdTrash />}
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  "Are you sure you want to delete this message?"
                                );
                                if (confirmed) {
                                  // deleteChatMessage(
                                  //   message.sender_id,
                                  //   message.receiver_id
                                  // );
                                  // deleteChatConnection(
                                  //   message.sender_id,
                                  //   message.receiver_id
                                  // );

                                  if (userType === "farmer") {
                                    const partnerId =
                                      user.id === message.sender_id
                                        ? message.receiver_id
                                        : message.sender_id;
                                    const filePath = `public/${user.id}/${partnerId}`;

                                    const { data: list } =
                                      await supabase.storage
                                        .from("chat-images")
                                        .list(filePath);
                                    const filesToRemove = list?.map(
                                      (x) => `${filePath}/${x.name}`
                                    );

                                    if (
                                      filesToRemove &&
                                      filesToRemove.length > 0
                                    ) {
                                      const { error } = await supabase.storage
                                        .from("chat-images")
                                        .remove(filesToRemove);

                                      if (error) {
                                        console.error(
                                          "Error deleting image:",
                                          error.message
                                        );
                                        return;
                                      }
                                    }
                                  }

                                  setOpenPopoverId(null);
                                }
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
              <div
                className={`
                ${totalPages <= 1 && "hidden"}
                w-full flex justify-center my-2`}
              >
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
              <div className="px-20 w-full flex flex-col items-center justify-center gap-4 mt-2 mb-4">
                <Button
                  fullWidth
                  // size="sm"
                  color={"secondary"}
                  startContent={<FiHelpCircle />}
                  className={`${userType === "technician" && "hidden"}`}
                  // onClick={onLogoutClick}
                >
                  Help
                </Button>
                <Button
                  fullWidth
                  // size="sm"
                  color={"danger"}
                  startContent={<FaSignOutAlt />}
                  onClick={onLogoutClick}
                >
                  Logout
                </Button>
              </div>
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
                  {!displayImage.profile_picture ? (
                    <Avatar size="sm" name={initials} showFallback />
                  ) : (
                    <Avatar
                      size="sm"
                      src={displayImage.profile_picture}
                      alt="Profile"
                      showFallback
                      className="rounded-full object-cover cursor-pointer"
                    />
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <div
                className={`${
                  isTechnicianPathBase && userType === "technician"
                    ? "lg:px-10"
                    : "lg:px-72"
                } h-full w-full flex flex-col bg-[#F4FFFC] px-4 pt-5 lg:pt-10`}
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
