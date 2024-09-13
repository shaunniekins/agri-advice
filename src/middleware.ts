// src/middleware.ts

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

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
  if (request.nextUrl.pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
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
      new URL("/ident/signin?usertype=Farmer", request.url)
    );
  }

  if (user) {
    const userRole = user.user_metadata.role;

    // Redirect users to their respective dashboards based on role
    if (request.nextUrl.pathname === "/") {
      if (userRole === "farmer" || userRole === "technician") {
        return NextResponse.redirect(new URL(`/${userRole}`, request.url));
      } else {
        // Assuming any other role (like admin) should go to /admin/dashboard
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }

    // Redirect logged-in users from /signin or /signup to their respective dashboards
    if (request.nextUrl.pathname.startsWith("/ident")) {
      if (userRole === "farmer" || userRole === "technician") {
        return NextResponse.redirect(new URL(`/${userRole}`, request.url));
      } else {
        // Assuming any other role (like admin) should go to /admin/dashboard
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }

    // Redirect users to their respective dashboards based on role
    if (
      request.nextUrl.pathname.startsWith("/admin") &&
      (userRole === "farmer" || userRole === "technician")
    ) {
      return NextResponse.redirect(new URL(`/${userRole}`, request.url));
    }

    // Redirect non-technicians to / if trying to access /technician
    if (
      request.nextUrl.pathname.startsWith("/technician") &&
      userRole !== "technician"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Redirect non-farmers to / if trying to access /farmer
    if (
      request.nextUrl.pathname.startsWith("/farmer") &&
      userRole !== "farmer"
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
    "/admin/:path*",
    "/technician/:path*",
    "/farmer/:path*",
    "/signin",
    "/signup",
  ],
};
