import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClientPointSummary } from "@/lib/client-points";
import { getActiveRewards, getRedemptions, getPointRule } from "@/lib/loyalty";
import { prisma } from "@/lib/prisma";
import { fmtPaymentAmount } from "@/lib/paychangu";
import { ClientRewardsView } from "@/components/dashboard/ClientRewardsView";
import { Star, Trophy, Wallet, Gift } from "lucide-react";

export const metadata = { title: "Rewards & Loyalty – Reines Portal" };

const TIER_LABELS = [
  { label: "Bronze",   min: 0,   color: "text-amber-600  bg-amber-50  border-amber-200",  next: 20  },
  { label: "Silver",   min: 20,  color: "text-zinc-500   bg-zinc-100  border-zinc-300",   next: 50  },
  { label: "Gold",     min: 50,  color: "text-yellow-600 bg-yellow-50 border-yellow-300", next: 100 },
  { label: "Platinum", min: 100, color: "text-sky-600    bg-sky-50    border-sky-300",    next: null },
];

function getTier(points: number) {
  return [...TIER_LABELS].reverse().find((t) => points >= t.min) ?? TIER_LABELS[0];
}

export default async function ClientLoyaltyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  const clientId = session.user.id!;

  const [summary, rewards, redemptions, rule, spendAgg] = await Promise.all([
    getClientPointSummary(clientId),
    getActiveRewards(),
    getRedemptions(clientId),
    getPointRule(),
    prisma.payment.aggregate({
      where: { userId: clientId, status: "SUCCESS" },
      _sum: { amount: true },
    }),
  ]);

  const lifetimeSpend = Number(spendAgg._sum.amount ?? 0);
  const meetsMin = lifetimeSpend >= rule.minSpendToEarn;
  const tier = getTier(summary.totalPoints);
  const nextTier = TIER_LABELS.find((t) => t.min > summary.totalPoints);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2d4a6b]">Rewards &amp; Loyalty</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Earn points with every payment and redeem them for exclusive rewards.
        </p>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl bg-[#2d4a6b] p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Your Balance</p>
            <p className="mt-2 text-5xl font-extrabold">{summary.totalPoints.toLocaleString()}</p>
            <p className="mt-1 text-sm text-zinc-300">points</p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${tier.color}`}>
            <Trophy size={15} />
            {tier.label} Member
          </div>
        </div>

        {nextTier && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
              <span>{tier.label}</span>
              <span>{nextTier.label} at {nextTier.min} pts</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[#8fb9e8] transition-all duration-500"
                style={{ width: `${Math.min(100, (summary.totalPoints / nextTier.min) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-zinc-400">
              {nextTier.min - summary.totalPoints} pts to {nextTier.label}
            </p>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Wallet size={16} />
          </div>
          <div>
            <p className="text-base font-bold text-zinc-900">{fmtPaymentAmount(lifetimeSpend)}</p>
            <p className="text-xs text-zinc-500">Total Spent</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Gift size={16} />
          </div>
          <div>
            <p className="text-base font-bold text-zinc-900">{redemptions.length}</p>
            <p className="text-xs text-zinc-500">Redemptions</p>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Star size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {meetsMin
                ? `1 pt per ${fmtPaymentAmount(rule.unitAmount)}`
                : `Spend ${fmtPaymentAmount(rule.minSpendToEarn - lifetimeSpend)} more to unlock`}
            </p>
            <p className="text-xs text-zinc-500">Earn rate</p>
          </div>
        </div>
      </div>

      {/* Interactive rewards section (client component) */}
      <ClientRewardsView
        rewards={rewards}
        redemptions={redemptions}
        pointsHistory={summary.entries}
        currentBalance={summary.totalPoints}
      />
    </div>
  );
}
