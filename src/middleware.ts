// src/middleware.ts

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { persistor } from "./app/reduxUtils/store";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect /admin to /admin/dashboard
  if (
    request.nextUrl.pathname === "/admin" ||
    request.nextUrl.pathname === "/administrator"
  ) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (request.nextUrl.pathname === "/farmer") {
    return NextResponse.redirect(new URL("/farmer/chat", request.url));
  }

  if (request.nextUrl.pathname === "/technician") {
    return NextResponse.redirect(new URL("/technician/chat", request.url));
  }

  if (request.nextUrl.pathname === "/signin") {
    return NextResponse.redirect(new URL("/ident/signin", request.url));
  }

  if (request.nextUrl.pathname === "/ident") {
    return NextResponse.redirect(new URL("/ident/signin", request.url));
  }

  if (
    request.nextUrl.pathname === "/ident/signin" &&
    !request.nextUrl.searchParams.has("usertype")
  ) {
    return NextResponse.redirect(
      new URL("/ident/signin?usertype=farmer", request.url)
    );
  }

  if (
    request.nextUrl.pathname === "/ident/signup" &&
    !request.nextUrl.searchParams.has("usertype")
  ) {
    return NextResponse.redirect(
      new URL("/ident/signup?usertype=farmer", request.url)
    );
  }

  if (user) {
    const user_type = user.user_metadata.user_type;
    const user_status = user.user_metadata.account_status;

    if (user_type === "technician" && user_status !== "active") {
      const { error } = await supabase.auth.signOut();

      if (!error) {
        persistor.purge();
      }
      return NextResponse.redirect(new URL("/ident/confirmation", request.url));
    }

    // Redirect users to their respective dashboards based on role
    if (request.nextUrl.pathname === "/") {
      if (user_type === "farmer" || user_type === "technician") {
        return NextResponse.redirect(new URL(`/${user_type}`, request.url));
      } else {
        // Assuming any other role (like admin) should go to /admin/dashboard
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }

    // Redirect logged-in users from /signin or /signup to their respective dashboards
    if (request.nextUrl.pathname.startsWith("/ident")) {
      if (user_type === "farmer" || user_type === "technician") {
        return NextResponse.redirect(new URL(`/${user_type}`, request.url));
      } else {
        // Assuming any other role (like admin) should go to /admin/dashboard
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }

    if (request.nextUrl.pathname.startsWith("/ident/confirmation")) {
      if (user_type === "technician" && user_status === "accepted") {
        return NextResponse.redirect(new URL("/technician", request.url));
      } else if (user_type === "farmer") {
        return NextResponse.redirect(new URL("/farmer", request.url));
      }
    }

    // Redirect users to their respective dashboards based on role
    if (
      request.nextUrl.pathname.startsWith("/admin") &&
      (user_type === "farmer" || user_type === "technician")
    ) {
      return NextResponse.redirect(new URL(`/${user_type}`, request.url));
    }

    // Redirect non-technicians to / if trying to access /technician
    if (
      request.nextUrl.pathname.startsWith("/technician") &&
      user_type !== "technician"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Redirect non-farmers to / if trying to access /farmer
    if (
      request.nextUrl.pathname.startsWith("/farmer") &&
      user_type !== "farmer"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } else {
    // If no user is logged in, redirect to home page for protected routes
    if (
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/technician") ||
      request.nextUrl.pathname.startsWith("/farmer")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

// Optionally, specify which routes the middleware should run on
export const config = {
  matcher: [
    "/",
    "/ident",
    "/ident/:path*",
    "/admin",
    "/administrator",
    "/admin/:path*",
    "/technician/:path*",
    "/farmer/:path*",
    "/signin",
    "/signup",
  ],
};
