"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gift,
  History,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
} from "lucide-react";
import type { RewardItem, RedemptionView } from "@/lib/loyalty";
import type { ClientPointEntryView } from "@/lib/client-points";

const CATEGORY_LABELS: Record<string, string> = {
  DISCOUNT: "Discount",
  PRODUCT:  "Free Product",
  SERVICE:  "Free Service",
  OTHER:    "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  DISCOUNT: "bg-green-50 border-green-200 text-green-700",
  PRODUCT:  "bg-blue-50  border-blue-200  text-blue-700",
  SERVICE:  "bg-purple-50 border-purple-200 text-purple-700",
  OTHER:    "bg-zinc-100  border-zinc-200   text-zinc-600",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  rewards:       RewardItem[];
  redemptions:   RedemptionView[];
  pointsHistory: ClientPointEntryView[];
  currentBalance: number;
}

export function ClientRewardsView({ rewards, redemptions, pointsHistory, currentBalance }: Props) {
  const router  = useRouter();
  const [tab,         setTab]         = useState<"rewards" | "history" | "points">("rewards");
  const [redeeming,   setRedeeming]   = useState<string | null>(null);
  const [confirmed,   setConfirmed]   = useState<string | null>(null);
  const [success,     setSuccess]     = useState<string | null>(null);
  const [error,       setError]       = useState("");
  const [balance,     setBalance]     = useState(currentBalance);

  async function handleRedeem(reward: RewardItem) {
    if (confirmed !== reward.id) {
      setConfirmed(reward.id);
      setError("");
      return;
    }

    setRedeeming(reward.id);
    setError("");

    try {
      const res  = await fetch("/api/loyalty/redeem", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rewardId: reward.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to redeem. Please try again.");
        setRedeeming(null);
        setConfirmed(null);
        return;
      }

      setBalance(data.data?.newBalance ?? data.newBalance ?? balance - reward.pointsCost);
      setSuccess(reward.name);
      setConfirmed(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRedeeming(null);
    }
  }

  const TABS = [
    { id: "rewards",  label: "Available Rewards", icon: <Gift  size={14} /> },
    { id: "history",  label: "My Redemptions",    icon: <History size={14} /> },
    { id: "points",   label: "Points History",    icon: <Star  size={14} /> },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSuccess(null); setError(""); setConfirmed(null); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              tab === t.id
                ? "bg-white text-[#2d4a6b] shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>
            <strong>{success}</strong> has been redeemed! Our team will be in touch to fulfil your reward.
          </span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Available Rewards ── */}
      {tab === "rewards" && (
        <div>
          {rewards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
              <Gift size={32} className="text-zinc-200" />
              <p className="mt-3 text-sm font-semibold text-zinc-500">No rewards available yet</p>
              <p className="mt-1 text-xs text-zinc-400">Check back soon — rewards are managed by our team.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rewards.map((rw) => {
                const canAfford = balance >= rw.pointsCost;
                const isConfirming = confirmed === rw.id;
                const isRedeeming  = redeeming  === rw.id;

                return (
                  <div
                    key={rw.id}
                    className={`rounded-xl border bg-white p-5 space-y-3 transition-all ${canAfford ? "border-zinc-200" : "border-zinc-100 opacity-60"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2d4a6b]/10 text-[#2d4a6b]">
                        <Gift size={18} />
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[rw.category] ?? CATEGORY_COLORS.OTHER}`}>
                        <Tag size={9} /> {CATEGORY_LABELS[rw.category] ?? rw.category}
                      </span>
                    </div>

                    <div>
                      <p className="font-semibold text-zinc-900">{rw.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{rw.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-[#2d4a6b] font-bold text-sm">
                        <Star size={13} className="text-zinc-500" />
                        {rw.pointsCost} pts
                      </div>
                      {canAfford ? (
                        isConfirming ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRedeem(rw)}
                              disabled={isRedeeming}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#2d4a6b] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a2f4a] transition-colors disabled:opacity-60"
                            >
                              {isRedeeming ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmed(null)}
                              className="px-3 py-1.5 text-xs font-medium text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRedeem(rw)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2d4a6b] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a2f4a] transition-colors"
                          >
                            <Gift size={11} /> Redeem
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-zinc-400">
                          Need {rw.pointsCost - balance} more pts
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── My Redemptions ── */}
      {tab === "history" && (
        <div>
          {redemptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
              <History size={32} className="text-zinc-200" />
              <p className="mt-3 text-sm font-semibold text-zinc-500">No redemptions yet</p>
              <p className="mt-1 text-xs text-zinc-400">When you redeem a reward it will appear here.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
              {redemptions.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{r.reward.name}</p>
                    <p className="text-xs text-zinc-400">{fmtDate(r.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-[#2d4a6b]">-{r.pointsUsed} pts</p>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      r.status === "FULFILLED" ? "bg-green-50 border-green-200 text-green-700" :
                      r.status === "CANCELLED" ? "bg-zinc-100 border-zinc-200 text-zinc-500" :
                      "bg-amber-50 border-amber-200 text-amber-700"
                    }`}>
                      {r.status === "PENDING" ? "Awaiting Fulfilment" : r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Points History ── */}
      {tab === "points" && (
        <div>
          {pointsHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
              <Star size={32} className="text-zinc-200" />
              <p className="mt-3 text-sm font-semibold text-zinc-500">No points earned yet</p>
              <p className="mt-1 text-xs text-zinc-400">Make payments towards your projects to start earning.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
              {pointsHistory.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 truncate">{e.reason}</p>
                    <p className="text-xs text-zinc-400">
                      {e.rewardType}{e.projectTitle ? ` · ${e.projectTitle}` : ""} · {fmtDate(e.createdAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-bold ${e.points >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {e.points >= 0 ? "+" : ""}{e.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
