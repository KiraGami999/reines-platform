import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";

/**
 * POST /api/mobile/logout
 *
 * Removes the device's push token so the user no longer receives
 * push notifications after signing out. The JWT itself is stateless
 * — the app should delete it from SecureStore on logout.
 */
export async function POST(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  const payload = token ? await verifyToken(token) : null;

  if (payload) {
    const body = await req.json().catch(() => ({}));
    const pushToken = body?.pushToken as string | undefined;

    if (pushToken) {
      await prisma.pushDevice.deleteMany({
        where: { userId: payload.id, token: pushToken },
      }).catch(() => null);
    } else {
      // Remove all push devices for this user on logout without a specific token
      await prisma.pushDevice.deleteMany({
        where: { userId: payload.id },
      }).catch(() => null);
    }
  }

  return NextResponse.json({ success: true });
}
