"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

interface ClientRedirectGuardProps {
  children: React.ReactNode;
  requiredUserType?: "farmer" | "technician" | "admin";
  allowUnauthenticated?: boolean;
}

export default function ClientRedirectGuard({
  children,
  requiredUserType,
  allowUnauthenticated = false,
}: ClientRedirectGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          if (!allowUnauthenticated) {
            router.push("/");
          }
          return;
        }

        const userType = user.user_metadata.user_type;
        const userStatus = user.user_metadata.account_status;

        // Handle technician account status
        if (userType === "technician" && userStatus !== "active") {
          await supabase.auth.signOut();
          router.push("/ident/confirmation");
          return;
        }

        // Handle role-based access
        if (requiredUserType && userType !== requiredUserType) {
          // Redirect to appropriate dashboard based on user type
          if (userType === "farmer") {
            router.push("/farmer/chat");
          } else if (userType === "technician") {
            router.push("/technician/chat");
          } else {
            router.push("/admin/dashboard");
          }
          return;
        }

        // Handle root path redirects
        if (window.location.pathname === "/") {
          if (userType === "farmer") {
            router.push("/farmer/chat");
          } else if (userType === "technician") {
            router.push("/technician/chat");
          } else {
            router.push("/admin/dashboard");
          }
          return;
        }

        // Handle base role paths (redirect to chat for farmer/technician)
        if (window.location.pathname === "/farmer" && userType === "farmer") {
          router.push("/farmer/chat");
          return;
        }

        if (
          window.location.pathname === "/technician" &&
          userType === "technician"
        ) {
          router.push("/technician/chat");
          return;
        }

        // Handle admin redirects
        if (
          window.location.pathname === "/admin" ||
          window.location.pathname === "/administrator"
        ) {
          router.push("/admin/dashboard");
          return;
        }

        // Handle signin/signup redirects
        if (
          window.location.pathname.startsWith("/signin") ||
          window.location.pathname === "/ident"
        ) {
          router.push("/ident/signin?usertype=farmer");
          return;
        }

        // Handle authenticated users trying to access auth pages
        if (
          window.location.pathname.startsWith("/ident/signin") ||
          window.location.pathname.startsWith("/ident/signup")
        ) {
          if (userType === "farmer") {
            router.push("/farmer/chat");
          } else if (userType === "technician") {
            router.push("/technician/chat");
          } else {
            router.push("/admin/dashboard");
          }
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (!allowUnauthenticated) {
          router.push("/");
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_OUT") {
          router.push("/");
        } else if (event === "SIGNED_IN" && session?.user) {
          const userType = session.user.user_metadata.user_type;
          if (userType === "farmer") {
            router.push("/farmer/chat");
          } else if (userType === "technician") {
            router.push("/technician/chat");
          } else {
            router.push("/admin/dashboard");
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, requiredUserType, allowUnauthenticated]);

  return <>{children}</>;
}
