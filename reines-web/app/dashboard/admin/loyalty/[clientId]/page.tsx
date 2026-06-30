import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClientPointSummary } from "@/lib/client-points";
import { getPointRule, getRedemptions } from "@/lib/loyalty";
import { fmtPaymentAmount } from "@/lib/paychangu";
import { ClientPointsCard } from "@/components/dashboard/ClientPointsCard";
import { ArrowLeft, Wallet, Star, Gift, FolderKanban } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { clientId } = await params;
  const user = await prisma.user.findUnique({ where: { id: clientId }, select: { name: true } });
  return { title: `${user?.name ?? "Client"} Loyalty – Reines Admin` };
}

export default async function ClientLoyaltyPage({ params }: PageProps) {
  const { clientId } = await params;

  const [client, summary, rule, redemptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: clientId, role: "CLIENT" },
      select: {
        id:    true,
        name:  true,
        email: true,
        payments: {
          where: { status: "SUCCESS" },
          select: { amount: true, description: true, createdAt: true, project: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
        },
        projectsAsClient: { select: { id: true, title: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    getClientPointSummary(clientId),
    getPointRule(),
    getRedemptions(clientId),
  ]);

  if (!client) notFound();

  const lifetimeSpend = client.payments.reduce((s, p) => s + Number(p.amount), 0);
  const meetsMin = lifetimeSpend >= rule.minSpendToEarn;

  function fmtDate(d: Date) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/admin/loyalty"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-[#2d4a6b] transition-colors"
      >
        <ArrowLeft size={14} /> Back to Loyalty Overview
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2d4a6b]">{client.name}</h1>
          <p className="text-sm text-zinc-500">{client.email}</p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${meetsMin ? "border-green-200 bg-green-50 text-green-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>
          <Star size={14} />
          {meetsMin ? "Earning points" : `MK ${(rule.minSpendToEarn - lifetimeSpend).toLocaleString("en-MW")} to unlock earning`}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Lifetime Spend",  value: fmtPaymentAmount(lifetimeSpend),             icon: <Wallet   size={16} /> },
          { label: "Point Balance",   value: `${summary.totalPoints.toLocaleString()} pts`, icon: <Star     size={16} /> },
          { label: "Total Projects",  value: client.projectsAsClient.length,               icon: <FolderKanban size={16} /> },
          { label: "Redemptions",     value: redemptions.length,                            icon: <Gift     size={16} /> },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
              {s.icon}
            </div>
            <div>
              <p className="text-lg font-bold text-zinc-900">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points management card */}
        <ClientPointsCard
          clientId={client.id}
          summary={summary}
          canAward={true}
        />

        {/* Payment history */}
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <div className="border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Wallet size={15} className="text-[#8fb9e8]" />
              <h2 className="text-sm font-semibold text-zinc-900">Payment History</h2>
            </div>
          </div>
          <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
            {client.payments.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-zinc-400">No payments yet.</div>
            ) : (
              client.payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{p.description ?? p.project?.title ?? "Payment"}</p>
                    <p className="text-xs text-zinc-400">{p.project?.title ?? ""} · {fmtDate(p.createdAt)}</p>
                  </div>
                  <p className="text-sm font-bold text-zinc-900">{fmtPaymentAmount(Number(p.amount))}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Redemptions */}
      {redemptions.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <div className="border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Gift size={15} className="text-[#8fb9e8]" />
              <h2 className="text-sm font-semibold text-zinc-900">Redemption History</h2>
            </div>
          </div>
          <div className="divide-y divide-zinc-100">
            {redemptions.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{r.reward.name}</p>
                  <p className="text-xs text-zinc-400">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-[#2d4a6b]">-{r.pointsUsed} pts</p>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    r.status === "FULFILLED" ? "bg-green-50 border-green-200 text-green-700" :
                    r.status === "CANCELLED" ? "bg-zinc-100 border-zinc-200 text-zinc-500" :
                    "bg-amber-50 border-amber-200 text-amber-700"
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
