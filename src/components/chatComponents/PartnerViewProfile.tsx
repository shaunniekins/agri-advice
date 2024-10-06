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

interface PartnerViewProfileProps {
  openPartnerInfo: boolean;
  setOpenPartnerInfo: (value: boolean) => void;
  partnerUserInfo: any;
  setPartnerUserInfo: (value: any) => void;
  userId: string;
}

const PartnerViewProfile: React.FC<PartnerViewProfileProps> = ({
  openPartnerInfo,
  setOpenPartnerInfo,
  partnerUserInfo,
  setPartnerUserInfo,
  userId,
}) => {
  const userInfo =
    userId === partnerUserInfo.receiver_id
      ? partnerUserInfo.sender_raw_user_meta_data
      : partnerUserInfo.receiver_raw_user_meta_data;

  return (
    <Modal
      size="xl"
      backdrop="blur"
      isOpen={openPartnerInfo}
      hideCloseButton={true}
      onOpenChange={setOpenPartnerInfo}
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
                    src={userInfo.profile_picture}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover cursor-pointer"
                  />
                </div>
                {/* info */}
                <Input
                  label="First Name"
                  name="first_name"
                  value={userInfo.first_name}
                  readOnly
                />
                <Input
                  label="Last Name"
                  name="last_name"
                  value={userInfo.last_name}
                  readOnly
                />
                <Input
                  label="Middle Name"
                  name="middle_name"
                  value={userInfo.middle_name}
                  readOnly
                />
                <Input
                  label="Mobile Number"
                  name="mobile_number"
                  value={userInfo.mobile_number}
                  readOnly
                  // className="col-span-2"
                />
                <Input
                  label="Address"
                  name="address"
                  value={userInfo.address}
                  readOnly
                  // className="col-span-2"
                />
                <Input
                  label="Birth Date"
                  name="birth_date"
                  value={userInfo.birth_date}
                  readOnly
                />
                <hr className="col-span-3" />
                {/* technician specific */}

                {userInfo.license_number && (
                  <Input
                    label="License Number"
                    name="license_number"
                    value={userInfo.license_number}
                    className="col-span-3"
                    readOnly
                  />
                )}
                {userInfo.specialization && (
                  <Input
                    label="Specialization"
                    name="specialization"
                    value={userInfo.specialization}
                    className="col-span-3"
                    readOnly
                  />
                )}
                {userInfo.experiences && (
                  <Input
                    label="Experiences"
                    name="experiences"
                    value={userInfo.experiences}
                    className="col-span-3"
                    readOnly
                  />
                )}
                {/* pig farmer specific */}
                {userInfo.operations && (
                  <Input
                    label="Number of Heads"
                    name="num_heads"
                    value={userInfo.num_heads}
                    readOnly
                  />
                )}
                {userInfo.experience_years && (
                  <Input
                    label="Experience Years"
                    name="experience_years"
                    value={userInfo.experience_years}
                    readOnly
                  />
                )}
                {userInfo.operations && (
                  <Input
                    label="Operations"
                    name="operations"
                    value={userInfo.operations}
                    className="col-span-3"
                    readOnly
                  />
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <div className="w-full flex justify-between">
                <div className="flex justify-end items-center gap-3">
                  <Button
                    startContent={<MdClose />}
                    className="bg-[#007057] text-white self-center"
                    onClick={() => {
                      setOpenPartnerInfo(false);
                      setPartnerUserInfo([]);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default PartnerViewProfile;
