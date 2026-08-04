import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isProtectedPage = 
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/entries") ||
    pathname.startsWith("/friends") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/audit");

  // If user is not logged in and trying to access a protected page, redirect to /login
  if (!sessionCookie && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is logged in and trying to access auth pages, redirect to /dashboard
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
