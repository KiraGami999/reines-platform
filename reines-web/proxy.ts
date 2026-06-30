import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-compatible proxy (formerly middleware).
 * Uses the Prisma-free authConfig so it runs safely in the Edge runtime.
 *
 * Route protection rules:
 *  /dashboard/*         → any authenticated user
 *  /login, /register    → redirect to /dashboard if already logged in
 *
 * Role-specific authorization stays in server layouts. This keeps the Edge
 * proxy from relying on stale JWT role values after admins update accounts.
 */
export default NextAuth(authConfig).auth(
  (req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
    const { nextUrl } = req;
    const session   = req.auth;
    const isLoggedIn = !!session?.user;

    const isDashboard    = nextUrl.pathname.startsWith("/dashboard");
    const isAuthPage     = ["/login", "/register"].includes(nextUrl.pathname);

    // Already logged in — bounce away from auth pages
    if (isLoggedIn && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Not logged in — redirect to login, preserving the intended URL
    if (!isLoggedIn && isDashboard) {
      const callbackUrl = encodeURIComponent(nextUrl.pathname);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
    }

    return NextResponse.next();
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
