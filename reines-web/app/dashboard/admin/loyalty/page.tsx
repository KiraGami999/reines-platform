import { prisma } from "@/lib/prisma";
import {
  getAllClientLoyaltySummaries,
  getAllRewards,
  getPointRule,
  getRedemptions,
} from "@/lib/loyalty";
import { getClientPointSummary } from "@/lib/client-points";
import { fmtPaymentAmount } from "@/lib/paychangu";
import { LoyaltyRuleForm } from "@/components/admin/LoyaltyRuleForm";
import { RewardCatalogueManager } from "@/components/admin/RewardCatalogueManager";
import { ClientPointsCard } from "@/components/dashboard/ClientPointsCard";
import {
  Star,
  Wallet,
  Users,
  Gift,
  Trophy,
  History,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Loyalty Management – Reines Admin" };

function fmt(n: number) {
  return `MK ${n.toLocaleString("en-MW")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const TIER_LABELS = [
  { label: "Bronze",   min: 0,    color: "text-amber-600  bg-amber-50  border-amber-200"  },
  { label: "Silver",   min: 20,   color: "text-zinc-500   bg-zinc-100  border-zinc-300"   },
  { label: "Gold",     min: 50,   color: "text-yellow-600 bg-yellow-50 border-yellow-300" },
  { label: "Platinum", min: 100,  color: "text-sky-600    bg-sky-50    border-sky-300"    },
];

function getTier(points: number) {
  return [...TIER_LABELS].reverse().find((t) => points >= t.min) ?? TIER_LABELS[0];
}

export default async function AdminLoyaltyPage() {
  const [rule, clients, rewards, redemptions] = await Promise.all([
    getPointRule(),
    getAllClientLoyaltySummaries(),
    getAllRewards(),
    getRedemptions(),
  ]);

  const totalSpend    = clients.reduce((s, c) => s + c.lifetimeSpend, 0);
  const totalPoints   = clients.reduce((s, c) => s + c.totalPoints, 0);
  const totalRedeemd  = redemptions.filter((r) => r.status !== "CANCELLED").reduce((s, r) => s + r.pointsUsed, 0);
  const pendingRedeem = redemptions.filter((r) => r.status === "PENDING").length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2d4a6b]">Loyalty Management</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure point rules, manage rewards, track client spend and allocate points.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Client Spend",    value: fmtPaymentAmount(totalSpend),    icon: <Wallet  size={18} />, dark: true  },
          { label: "Points in Circulation", value: `${totalPoints.toLocaleString()} pts`, icon: <Star    size={18} />, dark: false },
          { label: "Points Redeemed",       value: `${totalRedeemd.toLocaleString()} pts`, icon: <Gift    size={18} />, dark: false },
          { label: "Pending Redemptions",   value: pendingRedeem,                    icon: <Trophy  size={18} />, dark: false },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl p-5 flex items-center gap-4 ${s.dark ? "bg-[#2d4a6b] text-white" : "bg-white border border-zinc-200"}`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.dark ? "bg-[#8fb9e8]/20 text-[#8fb9e8]" : "bg-blue-50 text-blue-600"}`}>
              {s.icon}
            </div>
            <div>
              <p className={`text-xl font-bold ${s.dark ? "text-white" : "text-zinc-900"}`}>{s.value}</p>
              <p className={`text-xs ${s.dark ? "text-zinc-300" : "text-zinc-500"}`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Points Rule */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-800">Points Earn Configuration</h2>
        <LoyaltyRuleForm initial={rule} />
      </section>

      {/* Client Spend + Points Table */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-800">Client Spend &amp; Points Overview</h2>
        <p className="text-xs text-zinc-400">
          Min. spend to earn: <strong className="text-zinc-600">{fmt(rule.minSpendToEarn)}</strong> ·
          Rate: <strong className="text-zinc-600">{rule.pointsPerUnit} pt per {fmt(rule.unitAmount)}</strong>
        </p>

        {clients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
            <Users size={28} className="mx-auto text-zinc-200" />
            <p className="mt-2 text-sm text-zinc-400">No clients registered yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Projects</th>
                    <th className="px-4 py-3 font-semibold">Lifetime Spend</th>
                    <th className="px-4 py-3 font-semibold">Tier</th>
                    <th className="px-4 py-3 font-semibold">Points Balance</th>
                    <th className="px-4 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {clients.map((c) => {
                    const tier = getTier(c.totalPoints);
                    const meetsMin = c.lifetimeSpend >= rule.minSpendToEarn;
                    return (
                      <tr key={c.clientId} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-zinc-800">{c.clientName}</p>
                          <p className="text-xs text-zinc-400">{c.clientEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{c.projectCount}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-zinc-900">{fmt(c.lifetimeSpend)}</p>
                          {!meetsMin && (
                            <p className="text-xs text-zinc-400">
                              {fmt(rule.minSpendToEarn - c.lifetimeSpend)} to earn
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tier.color}`}>
                            {tier.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-[#2d4a6b]">
                          {c.totalPoints.toLocaleString()} pts
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/admin/loyalty/${c.clientId}`}
                            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-[#2d4a6b] transition-colors"
                          >
                            Manage <ChevronRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Reward Catalogue */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-800">Reward Catalogue</h2>
        <RewardCatalogueManager rewards={rewards} />
      </section>

      {/* Redemption History */}
      {redemptions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <History size={15} className="text-zinc-400" />
            <h2 className="text-base font-semibold text-zinc-800">Recent Redemptions</h2>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Reward</th>
                    <th className="px-4 py-3 font-semibold">Points Used</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {redemptions.slice(0, 20).map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-800">{r.client.name}</p>
                        <p className="text-xs text-zinc-400">{r.client.email}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{r.reward.name}</td>
                      <td className="px-4 py-3 font-semibold text-[#2d4a6b]">{r.pointsUsed} pts</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          r.status === "FULFILLED"  ? "bg-green-50 border-green-200 text-green-700" :
                          r.status === "CANCELLED"  ? "bg-zinc-100 border-zinc-200 text-zinc-500"  :
                          "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
