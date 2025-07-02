"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import { Spinner } from "@nextui-org/react";

interface ClientRouteGuardProps {
  children: React.ReactNode;
}

export default function ClientRouteGuard({ children }: ClientRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.user.user);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkRouteAccess = () => {
      // Handle basic redirects first
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

      // If user is logged in
      if (user) {
        const user_type = user.user_metadata?.user_type;
        const user_status = user.user_metadata?.account_status;

        // Check technician status
        if (user_type === "technician" && user_status !== "active") {
          router.replace("/ident/confirmation");
          return;
        }

        // Redirect from home page to appropriate dashboard
        if (pathname === "/") {
          if (user_type === "farmer" || user_type === "technician") {
            router.replace(`/${user_type}/chat`);
          } else {
            router.replace("/admin/dashboard");
          }
          return;
        }

        // Redirect from auth pages if already logged in
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

        // If we reach here, user is authorized for this route
        setIsAuthorized(true);
      } else {
        // User is not logged in
        if (
          pathname.startsWith("/admin") ||
          pathname.startsWith("/technician") ||
          pathname.startsWith("/farmer")
        ) {
          router.replace("/");
          return;
        }

        // User can access public routes
        setIsAuthorized(true);
      }

      setIsLoading(false);
    };

    checkRouteAccess();
  }, [pathname, user, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner color="success" size="lg" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner color="success" size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
