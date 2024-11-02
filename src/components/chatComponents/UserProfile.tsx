"use client";

import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import React from "react";
import { MdClose } from "react-icons/md";

interface UserProfileProps {
  openUserInfo: boolean;
  setOpenUserInfo: (value: boolean) => void;
  currentUserInfo: any;
  setCurrentUserInfo: (value: any) => void;
  userId: string;
  userType: string;
}

const UserProfile: React.FC<UserProfileProps> = ({
  openUserInfo,
  setOpenUserInfo,
  currentUserInfo,
  setCurrentUserInfo,
  userId,
  userType,
}) => {
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
                    <Avatar
                      src={currentUserInfo.profile_picture}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover cursor-pointer"
                    />
                  </div>
                  {/* info */}
                  <Input
                    label="First Name"
                    name="first_name"
                    value={currentUserInfo.first_name}
                    readOnly
                  />
                  <Input
                    label="Last Name"
                    name="last_name"
                    value={currentUserInfo.last_name}
                    readOnly
                  />
                  <Input
                    label="Middle Name"
                    name="middle_name"
                    value={currentUserInfo.middle_name}
                    readOnly
                  />
                  <Input
                    label="Mobile Number"
                    name="mobile_number"
                    value={currentUserInfo.mobile_number}
                    readOnly
                    // className="col-span-2"
                  />
                  <Input
                    label="Address"
                    name="address"
                    value={currentUserInfo.address}
                    readOnly
                    // className="col-span-2"
                  />
                  <Input
                    label="Birth Date"
                    name="birth_date"
                    value={currentUserInfo.birth_date}
                    readOnly
                  />
                  <hr className="col-span-3" />
                  {/* technician specific */}

                  {currentUserInfo.license_number && (
                    <Input
                      label="License Number"
                      name="license_number"
                      value={currentUserInfo.license_number}
                      className="col-span-3"
                      readOnly
                    />
                  )}
                  {currentUserInfo.specialization && (
                    <Input
                      label="Specialization"
                      name="specialization"
                      value={currentUserInfo.specialization}
                      className="col-span-3"
                      readOnly
                    />
                  )}
                  {currentUserInfo.experiences && (
                    <Input
                      label="Experiences"
                      name="experiences"
                      value={currentUserInfo.experiences}
                      className="col-span-3"
                      readOnly
                    />
                  )}
                  {/* pig farmer specific */}
                  {currentUserInfo.operations && (
                    <Input
                      label="Number of Heads"
                      name="num_heads"
                      value={currentUserInfo.num_heads}
                      readOnly
                    />
                  )}
                  {currentUserInfo.experience_years && (
                    <Input
                      label="Experience Years"
                      name="experience_years"
                      value={currentUserInfo.experience_years}
                      readOnly
                    />
                  )}
                  {currentUserInfo.operations && (
                    <Input
                      label="Operations"
                      name="operations"
                      value={currentUserInfo.operations}
                      className="col-span-3"
                      readOnly
                    />
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <div
                  className={`${
                    userType === "farmer" ? "justify-between" : "justify-end"
                  } w-full flex `}
                >
                  <Button
                    startContent={<MdClose />}
                    className="bg-[#007057] text-white self-center"
                    onClick={() => {
                      setOpenUserInfo(false);
                      setCurrentUserInfo([]);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default UserProfile;
