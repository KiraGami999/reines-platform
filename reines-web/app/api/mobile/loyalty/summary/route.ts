import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";
import { getPointRule } from "@/lib/loyalty";

// ─── Tier definitions ──────────────────────────────────────────────────────────
// Tiers are based on lifetime spend (MWK of SUCCESS payments).
const TIERS = [
  { name: "BRONZE",   label: "Bronze",   minSpend: 0,          nextSpend: 2_000_000,  color: "#cd7f32" },
  { name: "SILVER",   label: "Silver",   minSpend: 2_000_000,  nextSpend: 5_000_000,  color: "#9ca3af" },
  { name: "GOLD",     label: "Gold",     minSpend: 5_000_000,  nextSpend: 10_000_000, color: "#ca8a04" },
  { name: "PLATINUM", label: "Platinum", minSpend: 10_000_000, nextSpend: null,       color: "#7c3aed" },
] as const;

function resolveTier(lifetimeSpend: number) {
  let tier: (typeof TIERS)[number] = TIERS[0];
  for (const t of TIERS) {
    if (lifetimeSpend >= t.minSpend) tier = t;
  }

  const nextTierSpend = tier.nextSpend ?? null;
  const progressPct   = nextTierSpend
    ? Math.min(100, Math.round(((lifetimeSpend - tier.minSpend) / (nextTierSpend - tier.minSpend)) * 100))
    : 100;

  return { ...tier, progressPct };
}

/**
 * GET /api/mobile/loyalty/summary
 *
 * Returns the authenticated client's full loyalty snapshot:
 * point balance, lifetime spend, current tier, progress to next tier,
 * earn rate config, and the 10 most recent point entries.
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
    const [pointAgg, spendAgg, recentEntries, earnRate] = await Promise.all([
      // Current point balance
      prisma.clientPointEntry.aggregate({
        where: { clientId },
        _sum:  { points: true },
      }),
      // Lifetime SUCCESS payment spend
      prisma.payment.aggregate({
        where: { userId: clientId, status: "SUCCESS" },
        _sum:  { amount: true },
      }),
      // 10 most recent point entries
      prisma.clientPointEntry.findMany({
        where:   { clientId },
        orderBy: { createdAt: "desc" },
        take:    10,
        include: { project: { select: { title: true } } },
      }),
      // Earn rate from admin-controlled rule
      getPointRule(),
    ]);

    const balance       = pointAgg._sum.points   ?? 0;
    const lifetimeSpend = Number(spendAgg._sum.amount ?? 0);
    const tier          = resolveTier(lifetimeSpend);

    return NextResponse.json({
      balance,
      lifetimeSpend,
      tier: {
        name:          tier.name,
        label:         tier.label,
        color:         tier.color,
        minSpend:      tier.minSpend,
        nextTierSpend: tier.nextSpend ?? null,
        progressPct:   tier.progressPct,
      },
      earnRate: {
        pointsPerUnit:  earnRate.pointsPerUnit,
        unitAmount:     earnRate.unitAmount,
        minSpendToEarn: earnRate.minSpendToEarn,
      },
      recentEntries: recentEntries.map((e) => ({
        id:           e.id,
        points:       e.points,
        reason:       e.reason,
        rewardType:   e.rewardType,
        createdAt:    e.createdAt.toISOString(),
        projectTitle: e.project?.title ?? null,
      })),
    });
  } catch (err) {
    console.error("[GET /api/mobile/loyalty/summary]", err);
    return NextResponse.json({ error: "Failed to load loyalty summary." }, { status: 500 });
  }
}
