import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";
import { z } from "zod";

const schema = z.object({
  rewardId: z.string().min(1, "Reward ID is required."),
  notes:    z.string().optional(),
});

/**
 * POST /api/mobile/loyalty/redeem
 *
 * Redeems a reward for the authenticated client.
 * Deducts points atomically via a Prisma transaction:
 *   1. Creates a RewardRedemption record (PENDING)
 *   2. Creates a negative ClientPointEntry to deduct the cost
 *
 * Returns { redemptionId, rewardName, pointsUsed, newBalance, status }.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function POST(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  if (payload.role !== "CLIENT") {
    return NextResponse.json({ error: "Only clients can redeem rewards." }, { status: 403 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 422 });
  }

  const { rewardId, notes } = parsed.data;
  const clientId = payload.id;

  try {
    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.active) {
      return NextResponse.json({ error: "Reward not found or no longer available." }, { status: 404 });
    }

    // Current balance
    const agg     = await prisma.clientPointEntry.aggregate({ where: { clientId }, _sum: { points: true } });
    const balance = agg._sum.points ?? 0;

    if (balance < reward.pointsCost) {
      return NextResponse.json({
        error: `Insufficient points. You have ${balance} pts but this reward costs ${reward.pointsCost} pts.`,
      }, { status: 400 });
    }

    // Atomically create redemption + deduct points
    const [redemption] = await prisma.$transaction([
      prisma.rewardRedemption.create({
        data: {
          clientId,
          rewardId,
          pointsUsed: reward.pointsCost,
          notes:      notes ?? null,
          status:     "PENDING",
        },
        include: { reward: { select: { name: true, category: true } } },
      }),
      prisma.clientPointEntry.create({
        data: {
          clientId,
          points:     -reward.pointsCost,
          reason:     `Redeemed: ${reward.name}`,
          rewardType: "REDEMPTION",
        },
      }),
    ]);

    return NextResponse.json({
      redemptionId: redemption.id,
      rewardName:   redemption.reward.name,
      pointsUsed:   redemption.pointsUsed,
      newBalance:   balance - reward.pointsCost,
      status:       redemption.status,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/loyalty/redeem]", err);
    return NextResponse.json({ error: "Failed to redeem reward. Please try again." }, { status: 500 });
  }
}
