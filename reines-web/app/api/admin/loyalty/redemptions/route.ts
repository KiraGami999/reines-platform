import type { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, forbidden } from "@/lib/api-response";

type RedemptionRow = Prisma.RewardRedemptionGetPayload<{
  include: {
    reward: { select: { id: true; name: true; category: true } };
    client: { select: { id: true; name: true; email: true } };
  };
}>;

// GET /api/admin/loyalty/redemptions — all redemptions (admin only)
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return forbidden();

  try {
    const rows: RedemptionRow[] = await prisma.rewardRedemption.findMany({
      include: {
        reward:  { select: { id: true, name: true, category: true } },
        client:  { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(rows.map((r) => ({
      id:         r.id,
      pointsUsed: r.pointsUsed,
      notes:      r.notes,
      status:     r.status,
      createdAt:  r.createdAt.toISOString(),
      reward:     r.reward,
      client:     r.client,
    })));
  } catch {
    return ok([]);
  }
}
