import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";

/**
 * GET /api/mobile/me
 *
 * Returns the current authenticated user's profile.
 * Useful for hydrating the app on launch without a full re-login.
 */
export async function GET(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where:  { id: payload.id },
    select: {
      id:        true,
      name:      true,
      email:     true,
      role:      true,
      image:     true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}
