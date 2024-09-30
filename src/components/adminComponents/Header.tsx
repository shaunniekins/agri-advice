"use client";

import React from "react";
import { RootState } from "@/app/reduxUtils/store";
import { setUser } from "@/app/reduxUtils/userSlice";
import { supabase } from "@/utils/supabase";
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
} from "@nextui-org/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBars } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  MdCancel,
  MdClose,
  MdDeleteOutline,
  MdModeEditOutline,
  MdSave,
} from "react-icons/md";
import { EyeSlashFilledIcon } from "../../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../../public/icons/EyeFilledIcon";

interface AdminHeaderComponentProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const AdminHeaderComponent = ({
  isSidebarOpen,
  setIsSidebarOpen,
}: AdminHeaderComponentProps) => {
  const pathname = usePathname();

  let display = "";
  if (pathname === "/admin/dashboard") {
    display = "Dashboard";
  } else if (pathname === "/admin/monitor") {
    display = "Monitor Chats";
  } else if (pathname === "/admin/users") {
    display = "Users";
  } else if (pathname === "/admin/settings") {
    display = "Settings";
  } else if (pathname === "/admin/report") {
    display = "Report";
  }

  const [initials, setInitials] = useState("");

  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();
  const [openUserInfo, setOpenUserInfo] = useState(false);

  const [userInfo, setUserInfo] = useState({
    profile_picture: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    address: "",
    mobile_number: "",
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
        first_name,
        last_name,
        middle_name,
        mobile_number,
      } = user.user_metadata;

      setUserInfo({
        profile_picture,
        address,
        first_name,
        last_name,
        middle_name,
        mobile_number,
      });

      setTempUserInfo({
        profile_picture,
        address,
        first_name,
        last_name,
        middle_name,
        mobile_number,
      });

      setLoginInfo({ email, password });
      setTempLoginInfo({ email, password });

      setDisplayImage({ profile_picture });

      const initials =
        first_name && last_name
          ? `${first_name[0].toUpperCase()}${last_name[0].toUpperCase()}`
          : "Admin";
      setInitials(initials);
    }
  }, [user]);

  const reloadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    dispatch(setUser(user));
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
    // setIsLoading(false);
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
                  <div className="col-span-3 flex flex-col items-center">
                    <Popover
                      showArrow
                      placement="right"
                      isOpen={displayImageOpen}
                      onOpenChange={(open) =>
                        isEditing && setDisplayImageOpen(open)
                      }
                    >
                      <PopoverTrigger>
                        <Avatar
                          src={displayImage.profile_picture}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover cursor-pointer"
                        />
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
                  <hr className="col-span-3" />
                  {/* <h1 className="text-sm font-semibold col-span-3">
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
                  </div> */}
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="w-full flex justify-end">
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
      <div className="w-full bg-[#007057] text-white flex justify-between items-center px-5">
        <button
          className="flex h-11 items-center gap-2"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <FaBars className="text-xl" />
          <div>{display}</div>
        </button>
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
          <h4 className="text-sm">Hey, {initials}</h4>
        </button>
      </div>
    </>
  );
};

export default AdminHeaderComponent;
