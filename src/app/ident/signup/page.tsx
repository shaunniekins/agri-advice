// src/app/signup/page.tsx

"use client";

import SignupComponent from "@/components/Signup";
import { useSearchParams } from "next/navigation";

export default function SigninPage() {
  const searchParams = useSearchParams();
  const userType = searchParams.get("usertype") || "defaultUserType"; // Provide a default value

  return <SignupComponent userType={userType} />;
}
