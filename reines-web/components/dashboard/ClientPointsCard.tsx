"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2, PlusCircle, Star } from "lucide-react";
import type { ClientPointSummary } from "@/lib/client-points";
import { fmtDate } from "@/lib/mock-data";

export function ClientPointsCard({
  clientId,
  projectId,
  summary,
  canAward,
}: {
  clientId: string;
  projectId?: string;
  summary: ClientPointSummary;
  canAward: boolean;
}) {
  const router = useRouter();
  const [points, setPoints] = useState("100");
  const [reason, setReason] = useState("");
  const [rewardType, setRewardType] = useState("PROJECT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function awardPoints(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const parsedPoints = Number(points);
    if (!Number.isInteger(parsedPoints) || parsedPoints === 0) {
      setError("Enter a whole number of points. Use a negative number for corrections or redemptions.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/client-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          projectId: projectId ?? null,
          points: parsedPoints,
          reason: reason.trim(),
          rewardType,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Could not save points.");
        return;
      }

      setMessage("Client points updated.");
      setReason("");
      setPoints("100");
      router.refresh();
    } catch {
      setError("Could not save points. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-900">Client Rewards</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-400">Track loyalty points for Reines projects, investments, promotions, and member exclusives.</p>
      </div>

      <div className="p-5">
        <div className="rounded-xl bg-[#2d4a6b] p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Current balance</p>
          <p className="mt-2 text-3xl font-extrabold">{summary.totalPoints.toLocaleString("en-MW")} pts</p>
          <p className="mt-1 text-xs text-zinc-400">Can later be used for discounts, free promotions, or member exclusives.</p>
        </div>

        {canAward && (
          <form onSubmit={awardPoints} className="mt-4 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Points</label>
                <input
                  type="number"
                  step={1}
                  value={points}
                  onChange={(event) => setPoints(event.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Type</label>
                <select
                  value={rewardType}
                  onChange={(event) => setRewardType(event.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                >
                  <option value="PROJECT">Project</option>
                  <option value="INVESTMENT">Investment</option>
                  <option value="PROMOTION">Promotion</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                  <option value="REDEMPTION">Redemption</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Reason</label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Example: Awarded for completing project milestone payment"
                className="min-h-20 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2f4a] disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <PlusCircle size={15} />}
              Save points
            </button>
            {error && <p className="text-xs text-blue-700">{error}</p>}
            {message && <p className="text-xs text-blue-700">{message}</p>}
          </form>
        )}

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">Recent point history</p>
          {summary.entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
              <Gift size={22} className="mx-auto text-zinc-300" />
              <p className="mt-2 text-xs text-zinc-400">No points recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
              {summary.entries.map((entry) => (
                <div key={entry.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-800">{entry.reason}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {entry.rewardType} {entry.projectTitle ? `· ${entry.projectTitle}` : ""} · {fmtDate(entry.createdAt)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${entry.points >= 0 ? "text-blue-700" : "text-zinc-500"}`}>
                      {entry.points >= 0 ? "+" : ""}{entry.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
