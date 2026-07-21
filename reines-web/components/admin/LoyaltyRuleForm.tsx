"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Loader2, CheckCircle2 } from "lucide-react";

interface LoyaltyRuleFormProps {
  initial: {
    pointsPerUnit:  number;
    unitAmount:     number;
    minSpendToEarn: number;
  };
}

const FIELD = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8fb9e8]";
const LABEL = "block text-xs font-semibold text-zinc-600 mb-1";

export function LoyaltyRuleForm({ initial }: LoyaltyRuleFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    pointsPerUnit:  String(initial.pointsPerUnit),
    unitAmount:     String(initial.unitAmount),
    minSpendToEarn: String(initial.minSpendToEarn),
  });
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  function set(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setSaved(false);
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const body = {
      pointsPerUnit:  Number(form.pointsPerUnit),
      unitAmount:     Number(form.unitAmount),
      minSpendToEarn: Number(form.minSpendToEarn),
    };

    if (!body.pointsPerUnit || !body.unitAmount) {
      setError("All fields are required and must be valid numbers.");
      setSaving(false);
      return;
    }

    try {
      const res  = await fetch("/api/admin/loyalty/rules", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to save rule.");
        setSaving(false);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const preview = Number(form.pointsPerUnit) > 0 && Number(form.unitAmount) > 0
    ? `MK ${Number(form.unitAmount).toLocaleString("en-MW")} spent = ${form.pointsPerUnit} pt${Number(form.pointsPerUnit) !== 1 ? "s" : ""}`
    : "";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 size={15} className="text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-900">Points Earn Rule</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>Points per unit</label>
          <input
            type="number"
            min="1"
            value={form.pointsPerUnit}
            onChange={(e) => set("pointsPerUnit", e.target.value)}
            className={FIELD}
          />
          <p className="mt-1 text-xs text-zinc-400">Points awarded per unit of spend</p>
        </div>
        <div>
          <label className={LABEL}>Unit amount (MWK)</label>
          <input
            type="number"
            min="1000"
            step="10000"
            value={form.unitAmount}
            onChange={(e) => set("unitAmount", e.target.value)}
            className={FIELD}
          />
          <p className="mt-1 text-xs text-zinc-400">MWK per point unit (e.g. 100,000)</p>
        </div>
        <div>
          <label className={LABEL}>Min. lifetime spend (MWK)</label>
          <input
            type="number"
            min="0"
            step="100000"
            value={form.minSpendToEarn}
            onChange={(e) => set("minSpendToEarn", e.target.value)}
            className={FIELD}
          />
          <p className="mt-1 text-xs text-zinc-400">Threshold before earning starts (0 = always)</p>
        </div>
      </div>

      {preview && (
        <div className="rounded-xl border border-[#8fb9e8]/30 bg-[#8fb9e8]/10 px-4 py-2 text-sm text-[#2d4a6b] font-medium">
          Rule preview: {preview}{Number(form.minSpendToEarn) > 0 ? ` · only after MK ${Number(form.minSpendToEarn).toLocaleString("en-MW")} total spend` : ""}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2f4a] transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Settings2 size={13} />}
          Save Rule
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 size={13} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
