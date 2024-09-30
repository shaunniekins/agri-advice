"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import React from "react";
import { IoChevronBack } from "react-icons/io5";

export default function ConfirmationPage() {
  const router = useRouter();
  return (
    <div className="h-full w-full px-5 flex justify-center items-center">
      <Card>
        <CardHeader>
          <h1 className="font-semibold">
            Your account is currently pending approval by the administrator.
            Please await email confirmation.
          </h1>
        </CardHeader>
        <CardBody>
          <p className="text-sm">
            You will receive an email notification once your registration has
            been approved by the administrator.
          </p>
        </CardBody>
        <CardFooter>
          <Button
            color="success"
            startContent={<IoChevronBack />}
            onPress={() => router.push("/")}
          >
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
