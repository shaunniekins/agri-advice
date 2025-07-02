"use client";

import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-24 h-24 relative mx-auto mb-8">
          <Image
            src="/agri-advice-logo.png"
            alt="Agri-Advice Logo"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="space-x-4">
          <Button
            color="success"
            className="text-white"
            onClick={() => router.push("/")}
          >
            Go Home
          </Button>
          <Button
            variant="bordered"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
