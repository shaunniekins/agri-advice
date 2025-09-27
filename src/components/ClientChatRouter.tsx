"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

interface ClientChatRouterProps {
  children: React.ReactNode;
  userType: "farmer" | "technician";
}

export default function ClientChatRouter({
  children,
  userType,
}: ClientChatRouterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateChatAccess = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.push("/");
          return;
        }

        const currentUserType = user.user_metadata.user_type;

        // Check if user has correct role
        if (currentUserType !== userType) {
          if (currentUserType === "farmer") {
            router.push("/farmer/chat");
          } else if (currentUserType === "technician") {
            router.push("/technician/chat");
          } else {
            router.push("/admin/dashboard");
          }
          return;
        }

        // If there's a chatId in search params, validate it exists and user has access
        const chatId = searchParams?.get("id");
        if (chatId) {
          // You can add additional validation here to check if the chat exists
          // and if the user has access to it

          setIsValid(true);
        } else {
          // No specific chat ID, just validate user access to chat section
          setIsValid(true);
        }
      } catch (error) {
        console.error("Chat access validation failed:", error);
        router.push("/");
      } finally {
        setIsValidating(false);
      }
    };

    validateChatAccess();
  }, [searchParams, router, userType]);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isValid) {
    return null; // Router will handle redirect
  }

  return <>{children}</>;
}
