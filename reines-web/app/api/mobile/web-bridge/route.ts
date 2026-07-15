import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer, signBridgeToken } from "@/lib/jwt";

/**
 * POST /api/mobile/web-bridge
 *
 * Exchanges a valid mobile access token (Bearer) for a short-lived, single-
 * purpose "bridge token". The native app opens the web portal inside a WebView
 * and passes this bridge token to /mobile-bridge, which establishes a NextAuth
 * web session cookie — so the embedded web portal is already signed in without
 * the user re-entering credentials.
 *
 * The bridge token expires in 2 minutes and carries a purpose claim, so it can
 * only ever be used for this handoff.
 */
export async function POST(req: NextRequest) {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });
  }

  // Re-read the user to guarantee the account still exists / role is current.
  const user = await prisma.user.findUnique({
    where:  { id: payload.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user || !user.email) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const bridgeToken = await signBridgeToken({
    id:    user.id,
    email: user.email,
    role:  user.role,
    name:  user.name,
  });

  return NextResponse.json({ bridgeToken });
}
