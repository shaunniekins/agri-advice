"use client";

import { insertFeedback, updateFeedback } from "@/app/api/feedbackIUD";
import useFeedback from "@/hooks/useFeedback";
import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { MdArrowBack, MdClose, MdReport } from "react-icons/md";

interface PartnerViewProfileProps {
  openPartnerInfo: boolean;
  setOpenPartnerInfo: (value: boolean) => void;
  partnerUserInfo: any;
  setPartnerUserInfo: (value: any) => void;
  userId: string;
  userType: string;
}

const PartnerViewProfile: React.FC<PartnerViewProfileProps> = ({
  openPartnerInfo,
  setOpenPartnerInfo,
  partnerUserInfo,
  setPartnerUserInfo,
  userId,
  userType,
}) => {
  const [openFeedback, setOpenFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [ratings, setRatings] = useState(0);

  const userInfo =
    userId === partnerUserInfo.receiver_id
      ? partnerUserInfo.sender_raw_user_meta_data
      : partnerUserInfo.receiver_raw_user_meta_data;

  const farmerId =
    userId === partnerUserInfo.sender_id
      ? partnerUserInfo.sender_id
      : partnerUserInfo.receiver_id;

  const technicianId =
    userId !== partnerUserInfo.sender_id
      ? partnerUserInfo.sender_id
      : partnerUserInfo.receiver_id;

  const { feedbackData, isLoadingFeedback, totalFeedbackEntries } = useFeedback(
    undefined,
    undefined,
    farmerId,
    technicianId
  );

  useEffect(() => {
    if (feedbackData && feedbackData.length > 0) {
      const feedback = feedbackData[0];
      setFeedbackMessage(feedback.feedback_message);
      setRatings(feedback.ratings);
    }
  }, [feedbackData]);

  const handleSendFeedback = () => {
    setOpenPartnerInfo(false);
    setOpenFeedback(true);
  };

  const handleFeedbackSubmit = async () => {
    const newFeedbackData = {
      farmer_id: farmerId,
      technician_id: technicianId,
      feedback_message: feedbackMessage,
      ratings,
    };

    try {
      if (feedbackData && feedbackData.length > 0) {
        // Update existing feedback
        await updateFeedback(feedbackData[0].feedback_id, newFeedbackData);
      } else {
        // Insert new feedback
        await insertFeedback(newFeedbackData);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setOpenFeedback(false);
    }
  };

  return (
    <>
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
                <div
                  className={`${
                    userType === "farmer" ? "justify-between" : "justify-end"
                  } w-full flex `}
                >
                  <Button
                    color="warning"
                    startContent={<MdReport />}
                    className={`${userType !== "farmer" && "hidden"}`}
                    onClick={handleSendFeedback}
                  >
                    {feedbackData && feedbackData.length > 0
                      ? "Update Feedback"
                      : "Send Feedback"}
                  </Button>
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
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        size="lg"
        backdrop="blur"
        isOpen={openFeedback}
        hideCloseButton={true}
        onOpenChange={setOpenFeedback}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Send Feedback
              </ModalHeader>
              <ModalBody>
                <div className="w-full mb-3">
                  <StarRating rating={ratings} setRating={setRatings} />
                </div>
                <Textarea
                  label="Feedback Message"
                  placeholder="Enter your feedback here..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  fullWidth
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  startContent={<MdArrowBack />}
                  className="bg-[#007057] text-white self-center"
                  onClick={() => {
                    setOpenPartnerInfo(true);
                    setOpenFeedback(false);
                  }}
                >
                  Go back
                </Button>
                <Button color="primary" onClick={handleFeedbackSubmit}>
                  Submit Feedback
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default PartnerViewProfile;

export const StarRating: React.FC<{
  rating: number;
  setRating?: (rating: number) => void;
  isReadOnly?: boolean;
}> = ({ rating = 0, setRating, isReadOnly }) => {
  const [internalRating, setInternalRating] = useState(rating);

  const handleRating = (star: number) => {
    if (setRating) {
      setRating(star);
    } else {
      setInternalRating(star);
    }
  };

  return (
    <div className="w-full flex justify-around px-10">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={30}
          className={`cursor-pointer ${
            star <= (setRating ? rating : internalRating)
              ? "text-yellow-500"
              : "text-gray-300"
          }`}
          onClick={() => {
            if (!isReadOnly) handleRating(star);
          }}
        />
      ))}
    </div>
  );
};
