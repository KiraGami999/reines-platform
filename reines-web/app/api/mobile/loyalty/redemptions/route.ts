import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";

/**
 * GET /api/mobile/loyalty/redemptions
 *
 * Returns the authenticated client's full redemption history,
 * newest first.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function GET(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  const clientId = payload.id;

  try {
    const redemptions = await prisma.rewardRedemption.findMany({
      where:   { clientId },
      include: { reward: { select: { id: true, name: true, category: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      redemptions: redemptions.map((r) => ({
        id:         r.id,
        pointsUsed: r.pointsUsed,
        notes:      r.notes,
        status:     r.status,
        createdAt:  r.createdAt.toISOString(),
        reward:     r.reward,
      })),
    });
  } catch (err) {
    console.error("[GET /api/mobile/loyalty/redemptions]", err);
    return NextResponse.json({ error: "Failed to load redemption history." }, { status: 500 });
  }
}
