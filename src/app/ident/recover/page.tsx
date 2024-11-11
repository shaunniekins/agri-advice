"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { MdOutlineEmail } from "react-icons/md";
import { supabase, supabaseAdmin } from "@/utils/supabase";

export default function RecoverPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSendEmail = async () => {
    if (!email) return;
    // const redirectTo =
    //   process.env.NODE_ENV === "production"
    //     ? "https://agri-advice-eight.vercel.app/ident/reset-password"
    //     : "http://localhost:3000/ident/reset-password";

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/ident/reset-password`,
        }
      );

      setEmail("");
      setDescription("Success! Check your email to reset your password.");
      console.log("data: ", data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-full w-full px-5 flex justify-center items-center">
      <Card className="pt-5 px-5">
        <CardHeader>
          <div className="flex flex-col gap-2">
            <h1 className="font-semibold text-xl text-center">
              Password Reset
            </h1>
            <p className="text-sm">
              You will receive an email notification with instructions on how to
              reset your password.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <Input
            type="email"
            label="Email"
            size="sm"
            color="success"
            isRequired
            value={email}
            description={description}
            onChange={(e) => {
              setEmail(e.target.value);
              setDescription("");
            }}
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
              Return to sign-in
            </Button>

            <Button
              color="success"
              startContent={<MdOutlineEmail />}
              isDisabled={!email || !emailRegex.test(email)}
              className="text-white"
              onPress={handleSendEmail}
            >
              Send Email
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
