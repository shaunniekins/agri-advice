"use client";

import { IoHome } from "react-icons/io5";
import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="solid"
      startContent={<IoHome className="text-[#007057]" />}
      className="bg-white text-[#007057] font-medium shadow-lg border-2 border-white hover:scale-105 transition-transform"
      onClick={() => router.push("/")}
    >
      Home
    </Button>
  );
}
