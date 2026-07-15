import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days — matches Auth.js default

/**
 * GET /mobile-bridge?token=...&callbackUrl=/dashboard
 *
 * Exchanges a short-lived mobile bridge token for a real Auth.js session cookie,
 * then redirects into the portal.
 *
 * We set the cookie ourselves (instead of client/server Credentials signIn) because:
 *   1. WebViews + LAN IP hosts trip Auth.js CSRF/host checks (infinite
 *      "Opening your portal…" loops).
 *   2. Set-Cookie on the same 302 response is the most reliable way for
 *      react-native-webview to pick up the session.
 */
export async function GET(req: NextRequest) {
  const bridgeToken = req.nextUrl.searchParams.get("token")?.trim();
  const rawCallback = req.nextUrl.searchParams.get("callbackUrl")?.trim() || "/dashboard";

  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/dashboard";

  if (!bridgeToken) {
    return NextResponse.redirect(new URL("/login?error=bridge", req.url));
  }

  const payload = await verifyToken(bridgeToken);
  if (!payload || payload.purpose !== "web-bridge" || !payload.id) {
    return NextResponse.redirect(new URL("/login?error=bridge", req.url));
  }

  const user = await prisma.user.findUnique({
    where:  { id: payload.id },
    select: { id: true, name: true, email: true, role: true, image: true },
  });

  if (!user?.email) {
    return NextResponse.redirect(new URL("/login?error=bridge", req.url));
  }

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("[GET /mobile-bridge] AUTH_SECRET is not set");
    return NextResponse.redirect(new URL("/login?error=bridge", req.url));
  }

  // Match Auth.js cookie naming: secure prefix only on HTTPS.
  // Phone hits http://192.168.x.x — must NOT use __Secure- cookies.
  const isHttps =
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";
  const cookieName = isHttps
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const sessionJwt = await encode({
    token: {
      id:      user.id,
      name:    user.name,
      email:   user.email,
      role:    user.role,
      picture: user.image,
      sub:     user.id,
    },
    secret,
    salt:   cookieName,
    maxAge: SESSION_MAX_AGE,
  });

  const res = NextResponse.redirect(new URL(callbackUrl, req.url));
  res.cookies.set(cookieName, sessionJwt, {
    httpOnly: true,
    sameSite: "lax",
    path:     "/",
    secure:   isHttps,
    maxAge:   SESSION_MAX_AGE,
  });

  return res;
}
