"use client";

import { IoChevronBack } from "react-icons/io5";
import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <Button
      color="secondary"
      variant="ghost"
      startContent={<IoChevronBack />}
      className="absolute top-5 left-5"
      onClick={() => router.push("/")}
    >
      back
    </Button>
  );
}
