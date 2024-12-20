// src/components/Signup.tsx

"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAdmin } from "@/utils/supabase";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
} from "@nextui-org/react";
import { EyeSlashFilledIcon } from "../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../public/icons/EyeFilledIcon";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FaCheck } from "react-icons/fa";
import useBarangay from "@/hooks/useBarangay";

interface SignupComponentProps {
  userType: string;
}

const SignupComponent = ({ userType }: SignupComponentProps) => {
  const [isInputUserPasswordVisible, setIsInputUserPasswordVisible] =
    useState(false);
  const [signupPending, setSignUpPending] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");

  // exclusive for farmer
  const [numHeads, setNumHeads] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [operations, setOperations] = useState("");
  const [completeAddress, setCompleteAddress] = useState("");

  // exclusive for technician
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experiences, setExperiences] = useState("");

  const [currentViewInput, setCurrentViewInput] = useState(1);
  const [isSignupConfirmationModalOpen, setIsSignupConfirmationModalOpen] =
    useState(false);

  const router = useRouter();
  const { barangay } = useBarangay();

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (currentViewInput === 1) {
      setCurrentViewInput(2);
      return;
    }

    setSignUpPending(true);

    try {
      let data, error;

      if (userType === "farmer") {
        ({ data, error } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            email: email,
            password: password,
            user_type: userType.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            mobile_number: mobileNumber,
            birth_date: "",
            address: address,
            complete_address: completeAddress,
            num_heads: numHeads,
            experience_years: experienceYears,
            operations: "",
            account_status: "pending",
          },
        }));

        if (error) {
          throw error;
        }

        // Redirect farmers to the sign-in page
        // router.push(`/ident/signin?usertype=${userType}`);
        setIsSignupConfirmationModalOpen(true);
      }
      // else if (userType === "technician") {
      //   ({ data, error } = await supabaseAdmin.auth.admin.createUser({
      //     email: email,
      //     password: password,
      //     email_confirm: true,
      //     user_metadata: {
      //       email: email,
      //       password: password,
      //       user_type: userType.toLowerCase(),
      //       first_name: firstName,
      //       last_name: lastName,
      //       middle_name: middleName,
      //       mobile_number: mobileNumber,
      //       birth_date: birthDate,
      //       address: address,
      //       license_number: licenseNumber,
      //       specialization: specialization,
      //       experiences: "",
      //       account_status: "pending",
      //     },
      //   }));

      //   if (error) {
      //     throw error;
      //   }

      //   // Open the signup confirmation modal for technicians
      //   setIsSignupConfirmationModalOpen(true);
      // }

      // Successful signup
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error signing up:", error.message);
        alert(error.message);
      } else {
        console.error("Error signing up:", error);
        alert("An unknown error occurred.");
      }
    } finally {
      setSignUpPending(false);
    }
  };

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits and limit to 11 characters
    if (/^\d{0,11}$/.test(value)) {
      setMobileNumber(value);
    }
  };

  return (
    <>
      <Modal
        backdrop="blur"
        isDismissable={false}
        hideCloseButton={true}
        isOpen={isSignupConfirmationModalOpen}
        onOpenChange={setIsSignupConfirmationModalOpen}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col">
                Awaiting administrator Approval
                <span className="text-xs font-normal">
                  Your account creation is currently under review.
                </span>
              </ModalHeader>
              <ModalBody>
                <div className="w-full flex flex-col items-center justify-center gap-4">
                  <div className="bg-[#007057] text-white p-5 rounded-full">
                    <FaCheck size={"2rem"} />
                  </div>
                  <p className="text-center">
                    You will receive an email notification once your
                    registration has been approved by the administrator.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  // color="danger"
                  className="bg-[#007057] text-white self-center"
                  onClick={() =>
                    router.push(`/ident/signin?usertype=${userType}`)
                  }
                >
                  Okay, thanks!
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="w-full h-full flex flex-col justify-center items-center relative">
        {signupPending && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Spinner color="success" />
          </div>
        )}
        {!signupPending && (
          <>
            <form
              className="animate-in h-full flex flex-col w-full justify-center items-center gap-2 px-3 md:px-12 2xl:px-80"
              onSubmit={handleSubmit}
            >
              <div className="w-full overflow-y-auto flex flex-col justify-center items-center rounded-md shadow-sm gap-3 ">
                <h4 className="absolute top-16 lg:top-32 self-center lg:self-start font-semibold text-xl">
                  {userType !== "administrator" && userType.toUpperCase()}{" "}
                  REGISTER
                </h4>
                {currentViewInput === 1 && (
                  <>
                    <div className="w-full flex flex-col lg:flex-row gap-2">
                      <Input
                        type="text"
                        label="First Name"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                      <Input
                        type="text"
                        label="Middle Name"
                        variant="bordered"
                        color="success"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                      />
                      <Input
                        type="text"
                        label="Last Name"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                    <div className="w-full flex flex-col lg:flex-row gap-2">
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
                    </div>
                  </>
                )}
                {currentViewInput === 2 && (
                  <>
                    <div className="w-full flex flex-col lg:flex-row gap-2">
                      <Input
                        type="text"
                        label="Mobile Number"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={mobileNumber}
                        onChange={handleMobileNumberChange}
                      />
                      {/* <Input
                        type="text"
                        label="Birth Date"
                        placeholder="YYYY-MM-DD"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      /> */}
                      <Input
                        type="number"
                        label="Number of Heads"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={numHeads}
                        onChange={(e) => setNumHeads(e.target.value)}
                      />
                    </div>
                    <div className="w-full flex flex-col lg:flex-row gap-2">
                      <Input
                        type="number"
                        label="Experience Years"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                      />
                      <Select
                        label="Select Barangay"
                        color="success"
                        variant="bordered"
                        isRequired
                        defaultSelectedKeys={[address]}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      >
                        {barangay &&
                          barangay.map((item) => (
                            <SelectItem key={item.barangay_name}>
                              {item.barangay_name}
                            </SelectItem>
                          ))}
                      </Select>
                      <Input
                        type="text"
                        label="Complete Address"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={completeAddress}
                        onChange={(e) => setCompleteAddress(e.target.value)}
                      />
                    </div>
                  </>
                )}
                {/* {userType === "technician" && currentViewInput === 2 && (
                  <div className="w-full flex flex-col lg:flex-row gap-2">
                    <Input
                      type="text"
                      label="License Number"
                      variant="bordered"
                      color="success"
                      isRequired
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
                  </div>
                )} */}

                <div className="w-full flex gap-2">
                  <Button
                    fullWidth
                    color="warning"
                    size="lg"
                    startContent={<IoIosArrowBack />}
                    onClick={() => {
                      setCurrentViewInput(1);
                    }}
                    className={`${
                      (currentViewInput === 1 || signupPending) && "hidden"
                    } text-white mt-3`}
                  >
                    Back
                  </Button>
                  <Button
                    fullWidth
                    type="submit"
                    color="success"
                    size="lg"
                    endContent={currentViewInput === 1 && <IoIosArrowForward />}
                    disabled={signupPending}
                    isDisabled={
                      currentViewInput === 1
                        ? !(
                            email &&
                            password.length >= 8 &&
                            firstName &&
                            lastName
                          )
                        : currentViewInput === 2
                        ? !(
                            email &&
                            password.length >= 8 &&
                            firstName &&
                            lastName &&
                            mobileNumber &&
                            // birthDate &&
                            address &&
                            (userType !== "technician" ||
                              (licenseNumber && specialization))
                          )
                        : true
                    }
                    className="text-white mt-3"
                  >
                    {signupPending
                      ? "Signing Up..."
                      : currentViewInput === 1
                      ? "Next"
                      : "Sign Up"}
                  </Button>
                </div>
              </div>
            </form>
            <Button
              type="submit"
              variant="ghost"
              isDisabled={userType === "administrator"}
              color="success"
              onClick={() => {
                return router.push(`/ident/signin?usertype=${userType}`);
              }}
              className="absolute bottom-5"
            >
              Already Have An Account
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default SignupComponent;
