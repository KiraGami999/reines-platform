import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";

/**
 * GET /api/mobile/loyalty/rewards
 *
 * Returns all active rewards available for redemption,
 * ordered by sortOrder then creation date.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function GET(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  try {
    const rewards = await prisma.reward.findMany({
      where:   { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ rewards });
  } catch (err) {
    console.error("[GET /api/mobile/loyalty/rewards]", err);
    return NextResponse.json({ error: "Failed to load rewards." }, { status: 500 });
  }
}
