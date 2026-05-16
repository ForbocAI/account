import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const PROTECTED_ROUTES = ["/dashboard", "/keys"];
const AUTH_ROUTES = ["/", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Rate limiting for auth endpoints (simple in-memory for demo)
  // In production, use Upstash or Redis.
  pathname.startsWith("/api/auth") && (() => {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
    console.log(`[Rate Limit] Auth request from IP: ${ip}`);
  })();

  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  return (isProtected && !session)
    ? NextResponse.redirect(new URL("/", request.url))
    : (isAuthRoute && session)
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\.svg$).*)",
  ],
};
