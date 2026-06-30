import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, signToken, extractBearer } from "@/lib/jwt";

/**
 * POST /api/mobile/refresh
 *
 * Validates the current token and issues a fresh one with updated
 * user data from the database. This extends the session and picks
 * up any role or name changes made by an admin on the web portal.
 */
export async function POST(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "No token provided." }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where:  { id: payload.id },
    select: { id: true, name: true, email: true, role: true, image: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 401 });
  }

  const newToken = await signToken({
    id:    user.id,
    email: user.email,
    role:  user.role,
    name:  user.name,
  });

  return NextResponse.json({
    token: newToken,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      image: user.image,
    },
  });
}
