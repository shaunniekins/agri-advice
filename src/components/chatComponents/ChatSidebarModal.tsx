"use client";

import { supabase, supabaseAdmin } from "@/utils/supabase";
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
import { useEffect, useState } from "react";
import {
  MdCancel,
  MdClose,
  MdDeleteOutline,
  MdModeEditOutline,
  MdSave,
} from "react-icons/md";
import { EyeSlashFilledIcon } from "../../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../../public/icons/EyeFilledIcon";
import { useHandleLogout } from "@/utils/authUtils";
import { useDispatch } from "react-redux";
import { setUser } from "@/app/reduxUtils/userSlice";

interface ChatSidebarModalProps {
  openUserInfo: boolean;
  setOpenUserInfo: (open: boolean) => void;
  user: any;
  displayImage: {
    profile_picture: string;
  };
  setDisplayImage: React.Dispatch<
    React.SetStateAction<{
      profile_picture: string;
    }>
  >;
  initials: string;
  setInitials: React.Dispatch<React.SetStateAction<string>>;
  userType: string;
  setUserType: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatSidebarModal: React.FC<ChatSidebarModalProps> = ({
  openUserInfo,
  setOpenUserInfo,
  user,
  displayImage,
  setDisplayImage,
  initials,
  setInitials,
  userType,
  setUserType,
  setIsLoading,
}) => {
  const BUCKET_NAME = "profile-pictures";

  const [isEditing, setIsEditing] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  const dispatch = useDispatch();
  const handleLogout = useHandleLogout();

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
    complete_address: "",
  });
  const [tempUserInfo, setTempUserInfo] = useState(userInfo);

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

  const [displayImageOpen, setDisplayImageOpen] = useState(false);

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
        complete_address,
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
        complete_address: "",
      };

      if (user_type === "farmer") {
        setUserInfo({
          ...commonUserInfo,
          num_heads: num_heads || "",
          experience_years: experience_years || "",
          operations: operations || "",
          complete_address: complete_address || "",
        });

        setTempUserInfo({
          ...commonUserInfo,
          num_heads: num_heads || "",
          experience_years: experience_years || "",
          operations: operations || "",
          complete_address: complete_address || "",
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

  const reloadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    dispatch(setUser(user));
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
                    label="Birth Date"
                    name="birth_date"
                    value={tempUserInfo.birth_date}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
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
                    label="Complete Address"
                    name="complete_address"
                    value={tempUserInfo.complete_address}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className="col-span-3"
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
    </>
  );
};

export default ChatSidebarModal;
