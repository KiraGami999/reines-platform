/**
 * Loyalty system helpers — point rules, auto-award, client spend tracking.
 */

import { prisma } from "@/lib/prisma";

// ─── Point rule ───────────────────────────────────────────────────────────────

export interface PointRuleConfig {
  pointsPerUnit:  number; // points earned per unitAmount spent
  unitAmount:     number; // MWK per point (e.g. 100 000)
  minSpendToEarn: number; // lifetime MWK before earning starts
}

export async function getPointRule(): Promise<PointRuleConfig> {
  try {
    const rule = await prisma.pointRule.findUnique({ where: { id: "global" } });
    if (rule) {
      return {
        pointsPerUnit:  rule.pointsPerUnit,
        unitAmount:     rule.unitAmount,
        minSpendToEarn: rule.minSpendToEarn,
      };
    }
    // create default if missing
    await prisma.pointRule.create({
      data: { id: "global", pointsPerUnit: 1, unitAmount: 100000, minSpendToEarn: 2000000 },
    });
    return { pointsPerUnit: 1, unitAmount: 100000, minSpendToEarn: 2000000 };
  } catch {
    return { pointsPerUnit: 1, unitAmount: 100000, minSpendToEarn: 2000000 };
  }
}

// ─── Auto-award points for a payment ─────────────────────────────────────────

/**
 * Called after a payment transitions to SUCCESS.
 * Calculates earned points and creates a ClientPointEntry if > 0.
 */
export async function autoAwardPointsForPayment(
  clientId: string,
  projectId: string,
  paymentId: string,
  paymentAmount: number, // in MWK
  paymentDescription: string | null,
  awardedById?: string | null,
): Promise<number> {
  try {
    const rule = await getPointRule();

    // Total lifetime spend (all SUCCESS payments for this client)
    const agg = await prisma.payment.aggregate({
      where: { userId: clientId, status: "SUCCESS" },
      _sum: { amount: true },
    });
    const lifetimeSpend = Number(agg._sum.amount ?? 0);

    // Only award if lifetime spend meets the minimum threshold
    if (lifetimeSpend < rule.minSpendToEarn) return 0;

    const earnedPoints = Math.floor(paymentAmount / rule.unitAmount) * rule.pointsPerUnit;
    if (earnedPoints <= 0) return 0;

    await prisma.clientPointEntry.create({
      data: {
        clientId,
        projectId,
        points:     earnedPoints,
        reason:     `Auto-awarded for payment: ${paymentDescription ?? `Payment #${paymentId.slice(-6)}`}`,
        rewardType: "PAYMENT",
        awardedById: awardedById ?? null,
      },
    });

    return earnedPoints;
  } catch (err) {
    console.error("[autoAwardPointsForPayment]", err);
    return 0;
  }
}

// ─── Client lifetime spend ────────────────────────────────────────────────────

export interface ClientLoyaltySummary {
  clientId:       string;
  clientName:     string;
  clientEmail:    string;
  lifetimeSpend:  number;
  totalPoints:    number;
  projectCount:   number;
}

export async function getAllClientLoyaltySummaries(): Promise<ClientLoyaltySummary[]> {
  try {
    const clients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      select: {
        id:    true,
        name:  true,
        email: true,
        _count: { select: { projectsAsClient: true } },
        payments: {
          where: { status: "SUCCESS" },
          select: { amount: true },
        },
        clientPointEntries: {
          select: { points: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return clients.map((c) => ({
      clientId:      c.id,
      clientName:    c.name,
      clientEmail:   c.email,
      lifetimeSpend: c.payments.reduce((s, p) => s + Number(p.amount), 0),
      totalPoints:   c.clientPointEntries.reduce((s, e) => s + e.points, 0),
      projectCount:  c._count.projectsAsClient,
    }));
  } catch {
    return [];
  }
}

// ─── Reward catalogue ─────────────────────────────────────────────────────────

export interface RewardItem {
  id:          string;
  name:        string;
  description: string;
  pointsCost:  number;
  category:    string;
  active:      boolean;
  sortOrder:   number;
}

export async function getActiveRewards(): Promise<RewardItem[]> {
  try {
    return await prisma.reward.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  } catch {
    return [];
  }
}

export async function getAllRewards(): Promise<RewardItem[]> {
  try {
    return await prisma.reward.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  } catch {
    return [];
  }
}

// ─── Redemption history ───────────────────────────────────────────────────────

export interface RedemptionView {
  id:         string;
  pointsUsed: number;
  notes:      string | null;
  status:     string;
  createdAt:  string;
  reward:     { id: string; name: string; category: string };
  client:     { id: string; name: string; email: string };
}

export async function getRedemptions(clientId?: string): Promise<RedemptionView[]> {
  try {
    const rows = await prisma.rewardRedemption.findMany({
      where: clientId ? { clientId } : {},
      include: {
        reward:  { select: { id: true, name: true, category: true } },
        client:  { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id:         r.id,
      pointsUsed: r.pointsUsed,
      notes:      r.notes,
      status:     r.status,
      createdAt:  r.createdAt.toISOString(),
      reward:     r.reward,
      client:     r.client,
    }));
  } catch {
    return [];
  }
}
