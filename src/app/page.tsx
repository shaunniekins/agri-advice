"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);

  const handleSelect = (userType: string) => {
    setSelectedUserType(userType);
  };

  const handleChoose = () => {
    router.push(`/ident/signin?usertype=${selectedUserType}`);
  };

  return (
    <>
      <div className="bg-green-300 h-[100svh] w-screen flex justify-center items-center">
        <Card className="w-80 h-80 mx-3">
          <CardHeader className="bg-green-600 flex justify-center items-center">
            <p className="text-center text-white text-lg font-semibold">
              Select User Type
            </p>
          </CardHeader>
          <CardBody className="h-full flex flex-col justify-center">
            <div className="flex flex-col justify-around gap-2 px-2">
              <div
                className={`text-start border p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedUserType === "Administrator" ? "border-green-600" : ""
                }`}
                onClick={() => handleSelect("Administrator")}
              >
                <p className="font-semibold">Administrator</p>
                <p className="text-xs">Oversee and manage system operations</p>
              </div>
              <div
                className={`text-start border p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedUserType === "Technician" ? "border-green-600" : ""
                }`}
                onClick={() => handleSelect("Technician")}
              >
                <p className="font-semibold">Technician</p>
                <p className="text-xs">Provide technical support and advice</p>
              </div>
              <div
                className={`text-start border p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedUserType === "Farmer" ? "border-green-600" : ""
                }`}
                onClick={() => handleSelect("Farmer")}
              >
                <p className="font-semibold">Farmer</p>
                <p className="text-xs">Manage your farm and crops</p>
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-center items-center">
            <Button
              radius="full"
              color="success"
              size="sm"
              isDisabled={!selectedUserType}
              className="text-white self-center"
              onClick={handleChoose}
            >
              Choose
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
