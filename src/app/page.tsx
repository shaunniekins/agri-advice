"use client";

import React from "react";
import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

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
      <div className="relative min-h-[100svh] w-screen flex justify-center items-center overflow-y-auto">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/pig-farming.jpg"
            alt="Pig farming background"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#007057]/70 to-black/50" />
        </div>

        {/* Welcome Text */}
        <div className="absolute top-0 pt-5 sm:pt-8 z-10 text-center flex flex-col items-center w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 relative">
            <Image
              src="/agri-advice-logo.png"
              alt="Agri-Advice Logo"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md">
            AgriAdvice
          </h1>
          <p className="text-white/90 mt-1 sm:mt-2 max-w-md mx-auto text-xs sm:text-base px-4">
            Combining Manual Expertise and AI Translator for Optimal Piggery
            Consultancy
          </p>
        </div>

        {/* Modern Card Design - Added margin top for mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-28 sm:mt-0"
        >
          <Card className="w-[30rem] max-w-[90vw] backdrop-blur-sm bg-white/90 z-10 shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#007057] to-[#009970] p-5">
              <h2 className="text-center text-white text-xl font-semibold w-full">
                Select User Type
              </h2>
            </CardHeader>

            <CardBody className="px-6 py-8">
              <div className="flex flex-col gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 
                    ${
                      selectedUserType === "administrator"
                        ? "bg-[#007057]/10 border-l-4 border-[#007057]"
                        : "bg-white/80 hover:bg-gray-50 border border-gray-200"
                    }`}
                  onClick={() => handleSelect("administrator")}
                >
                  <div
                    className={`p-3 rounded-full ${
                      selectedUserType === "administrator"
                        ? "bg-[#007057]"
                        : "bg-gray-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 ${
                        selectedUserType === "administrator"
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold">Administrator</p>
                    <p className="text-sm text-gray-600">
                      Oversee and manage system operations
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 
                    ${
                      selectedUserType === "technician"
                        ? "bg-[#007057]/10 border-l-4 border-[#007057]"
                        : "bg-white/80 hover:bg-gray-50 border border-gray-200"
                    }`}
                  onClick={() => handleSelect("technician")}
                >
                  <div
                    className={`p-3 rounded-full ${
                      selectedUserType === "technician"
                        ? "bg-[#007057]"
                        : "bg-gray-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 ${
                        selectedUserType === "technician"
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold">Technician</p>
                    <p className="text-sm text-gray-600">
                      Provide technical support and advice
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 
                    ${
                      selectedUserType === "farmer"
                        ? "bg-[#007057]/10 border-l-4 border-[#007057]"
                        : "bg-white/80 hover:bg-gray-50 border border-gray-200"
                    }`}
                  onClick={() => handleSelect("farmer")}
                >
                  <div
                    className={`p-3 rounded-full ${
                      selectedUserType === "farmer"
                        ? "bg-[#007057]"
                        : "bg-gray-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 ${
                        selectedUserType === "farmer"
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold">Farmer</p>
                    <p className="text-sm text-gray-600">
                      Manage your pig farm
                    </p>
                  </div>
                </motion.div>
              </div>
            </CardBody>

            <CardFooter className="flex justify-center items-center p-5 bg-gray-50">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  radius="full"
                  size="lg"
                  isDisabled={!selectedUserType}
                  className={`text-white font-medium shadow-md px-8 ${
                    selectedUserType
                      ? "bg-gradient-to-r from-[#007057] to-[#009970] hover:opacity-90"
                      : "bg-gray-400"
                  }`}
                  onClick={handleChoose}
                >
                  Continue
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Footer */}
        <div className="absolute bottom-4 z-10 text-white/80 text-sm">
          © {new Date().getFullYear()} AgriAdvice
        </div>
      </div>
    </>
  );
}
