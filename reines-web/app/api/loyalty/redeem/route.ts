import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, forbidden, badRequest, notFound } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  rewardId: z.string().min(1, "Reward ID is required"),
  notes:    z.string().optional(),
});

/**
 * POST /api/loyalty/redeem
 * Client redeems a reward using their points.
 * Deducts points by creating a negative ClientPointEntry.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") return forbidden("Only clients can redeem rewards.");

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");

  const { rewardId, notes } = parsed.data;
  const clientId = session.user.id!;

  try {
    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.active) return notFound("Reward");

    // Calculate current point balance
    const agg = await prisma.clientPointEntry.aggregate({
      where: { clientId },
      _sum: { points: true },
    });
    const balance = agg._sum.points ?? 0;

    if (balance < reward.pointsCost) {
      return badRequest(
        `Insufficient points. You have ${balance} pts but this reward costs ${reward.pointsCost} pts.`
      );
    }

    // Create redemption record + deduct points in a transaction
    const [redemption] = await prisma.$transaction([
      prisma.rewardRedemption.create({
        data: {
          clientId,
          rewardId,
          pointsUsed: reward.pointsCost,
          notes: notes ?? null,
          status: "PENDING",
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

    return ok({
      redemptionId: redemption.id,
      rewardName:   redemption.reward.name,
      pointsUsed:   redemption.pointsUsed,
      newBalance:   balance - reward.pointsCost,
      status:       redemption.status,
    });
  } catch (err) {
    console.error("[/api/loyalty/redeem]", err);
    return badRequest("Failed to redeem reward. Please try again.");
  }
}
