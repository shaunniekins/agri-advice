// src/app/signin/page.tsx

"use client";

import SigninComponent from "@/components/Signin";
import { useSearchParams } from "next/navigation";

export default function SigninPage() {
  const searchParams = useSearchParams();
  const userType = searchParams.get("usertype") || "defaultUserType"; // Provide a default value

  return <SigninComponent userType={userType} />;
}
