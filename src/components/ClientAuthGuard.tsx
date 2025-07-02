"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import { Spinner } from "@nextui-org/react";

export default function ClientAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.user.user);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle redirects that were previously in middleware
    const handleRedirects = () => {
      // Basic path redirects
      if (pathname === "/admin" || pathname === "/administrator") {
        router.replace("/admin/dashboard");
        return;
      }

      if (pathname === "/farmer") {
        router.replace("/farmer/chat");
        return;
      }

      if (pathname === "/technician") {
        router.replace("/technician/chat");
        return;
      }

      if (pathname === "/signin") {
        router.replace("/ident/signin");
        return;
      }

      if (pathname === "/ident") {
        router.replace("/ident/signin");
        return;
      }

      // User-based redirects
      if (user) {
        const user_type = user.user_metadata?.user_type;
        const user_status = user.user_metadata?.account_status;

        // Redirect to respective dashboard from home
        if (pathname === "/") {
          if (user_type === "farmer" || user_type === "technician") {
            router.replace(`/${user_type}/chat`);
          } else {
            router.replace("/admin/dashboard");
          }
          return;
        }

        // Redirect from auth pages if logged in
        if (pathname.startsWith("/ident")) {
          if (user_type === "farmer" || user_type === "technician") {
            router.replace(`/${user_type}/chat`);
          } else {
            router.replace("/admin/dashboard");
          }
          return;
        }

        // Role-based access control
        if (
          pathname.startsWith("/admin") &&
          (user_type === "farmer" || user_type === "technician")
        ) {
          router.replace(`/${user_type}/chat`);
          return;
        }

        if (pathname.startsWith("/technician") && user_type !== "technician") {
          router.replace("/");
          return;
        }

        if (pathname.startsWith("/farmer") && user_type !== "farmer") {
          router.replace("/");
          return;
        }
      } else {
        // Redirect to home if not logged in and accessing protected routes
        if (
          pathname.startsWith("/admin") ||
          pathname.startsWith("/technician") ||
          pathname.startsWith("/farmer")
        ) {
          router.replace("/");
          return;
        }
      }

      setIsLoading(false);
    };

    handleRedirects();
  }, [pathname, user, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner color="success" size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
