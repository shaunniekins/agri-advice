"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
} from "@nextui-org/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { MdFormatAlignJustify } from "react-icons/md";
import { EyeSlashFilledIcon } from "../../../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../../../public/icons/EyeFilledIcon";
import { supabase } from "@/utils/supabase";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isInputUserPasswordVisible, setIsInputUserPasswordVisible] =
    useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleSubmit = async () => {
    if (newPassword.length < 8) {
      alert("Passwords must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match");
      return;
    }

    const token = searchParams.get("token"); // Assuming "token" is the query parameter name

    if (!token) {
      alert("No token found in the URL");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        password: newPassword,
      },
    });

    if (error) {
      alert("Error updating password: " + error.message);
    } else {
      alert("Password updated successfully");
      router.push("/ident/signin");
    }
  };

  return (
    <div className="h-full w-full px-5 flex justify-center items-center">
      <Card className="pt-5 px-5">
        <CardHeader>
          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-xl text-center">
              Change Password
            </h1>

            <p className="text-sm invisible">
              You will receive an email notification with instructions on how to
              reset your password.
            </p>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <Input
            type={isInputUserPasswordVisible ? "text" : "password"}
            label="New Password"
            variant="bordered"
            color="success"
            isRequired
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            endContent={
              <button
                className="focus:outline-none"
                type="button"
                onClick={() =>
                  setIsInputUserPasswordVisible(!isInputUserPasswordVisible)
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
            type={isInputUserPasswordVisible ? "text" : "password"}
            label="Confirm New Password"
            variant="bordered"
            color="success"
            isRequired
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            endContent={
              <button
                className="focus:outline-none"
                type="button"
                onClick={() =>
                  setIsInputUserPasswordVisible(!isInputUserPasswordVisible)
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
        </CardBody>
        <CardFooter>
          <div className="w-full flex gap-2 justify-end items-center">
            <Button
              color="success"
              variant="light"
              startContent={<IoChevronBack />}
              onPress={() => router.push("/ident/signin")}
            >
              Go to sign-in
            </Button>
            <Button
              color="success"
              startContent={<MdFormatAlignJustify />}
              isDisabled={!newPassword || !confirmNewPassword}
              className="text-white"
              onPress={handleSubmit}
            >
              Submit
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
