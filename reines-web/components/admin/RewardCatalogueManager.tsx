"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Plus, Pencil, Trash2, Loader2, CheckCircle2, X, ToggleLeft, ToggleRight } from "lucide-react";
import type { RewardItem } from "@/lib/loyalty";

const FIELD = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8fb9e8]";
const LABEL = "block text-xs font-semibold text-zinc-600 mb-1";

const CATEGORIES = ["DISCOUNT", "PRODUCT", "SERVICE", "OTHER"];
const CATEGORY_LABELS: Record<string, string> = {
  DISCOUNT: "Discount",
  PRODUCT:  "Free Product",
  SERVICE:  "Free Service",
  OTHER:    "Other",
};

function RewardForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<RewardItem>;
  onSave: (data: Partial<RewardItem>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name:        initial?.name        ?? "",
    description: initial?.description ?? "",
    pointsCost:  String(initial?.pointsCost ?? ""),
    category:    initial?.category    ?? "DISCOUNT",
    active:      initial?.active      ?? true,
    sortOrder:   String(initial?.sortOrder ?? "0"),
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function set(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.description.trim() || !form.pointsCost) {
      setError("Name, description, and points cost are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name:        form.name.trim(),
        description: form.description.trim(),
        pointsCost:  Number(form.pointsCost),
        category:    form.category,
        active:      form.active,
        sortOrder:   Number(form.sortOrder),
      });
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#8fb9e8]/40 bg-[#8fb9e8]/5 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={LABEL}>Reward name</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={FIELD} placeholder="e.g. 5% Discount on next project" />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} className={FIELD} placeholder="What the client receives when they redeem this reward…" />
        </div>
        <div>
          <label className={LABEL}>Points cost</label>
          <input type="number" min="1" value={form.pointsCost} onChange={(e) => set("pointsCost", e.target.value)} className={FIELD} placeholder="e.g. 20" />
        </div>
        <div>
          <label className={LABEL}>Category</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={FIELD}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Sort order</label>
          <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className={FIELD} />
        </div>
        <div className="flex items-center gap-2 pt-4">
          <label className="text-xs font-semibold text-zinc-600">Active</label>
          <button type="button" onClick={() => set("active", !form.active)} className="text-zinc-400 hover:text-[#2d4a6b]">
            {form.active ? <ToggleRight size={22} className="text-[#2d4a6b]" /> : <ToggleLeft size={22} />}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving} className="[#2d4a6b] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2f4a] transition-colors disabled:opacity-60">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
          Save Reward
        </button>
        <button onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-300 hover:bg-zinc-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function RewardCatalogueManager({ rewards: initial }: { rewards: RewardItem[] }) {
  const router = useRouter();
  const [rewards,   setRewards]   = useState<RewardItem[]>(initial);
  const [adding,    setAdding]    = useState(false);
  const [editing,   setEditing]   = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [toggling,  setToggling]  = useState<string | null>(null);

  async function createReward(data: Partial<RewardItem>) {
    const res  = await fetch("/api/admin/loyalty/rewards", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) {
      setRewards((r) => [json.data ?? json, ...r]);
      setAdding(false);
      router.refresh();
    } else {
      throw new Error(json.error ?? "Failed");
    }
  }

  async function updateReward(id: string, data: Partial<RewardItem>) {
    const res  = await fetch(`/api/admin/loyalty/rewards/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) {
      const updated = json.data ?? json;
      setRewards((r) => r.map((rw) => rw.id === id ? { ...rw, ...updated } : rw));
      setEditing(null);
      router.refresh();
    } else {
      throw new Error(json.error ?? "Failed");
    }
  }

  async function toggleActive(id: string, active: boolean) {
    setToggling(id);
    try {
      await fetch(`/api/admin/loyalty/rewards/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ active }),
      });
      setRewards((r) => r.map((rw) => rw.id === id ? { ...rw, active } : rw));
      router.refresh();
    } finally {
      setToggling(null);
    }
  }

  async function deleteReward(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/admin/loyalty/rewards/${id}`, { method: "DELETE" });
      setRewards((r) => r.filter((rw) => rw.id !== id));
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift size={15} className="text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Reward Catalogue</h3>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">{rewards.length}</span>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5  px-3 py-2 text-xs font-medium text-white hover:bg-[#1a2f4a] transition-colors"
          >
            <Plus size={13} /> Add Reward
          </button>
        )}
      </div>

      {adding && (
        <RewardForm onSave={createReward} onCancel={() => setAdding(false)} />
      )}

      {rewards.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
          <Gift size={28} className="text-zinc-200" />
          <p className="mt-2 text-sm font-medium text-zinc-500">No rewards yet</p>
          <p className="text-xs text-zinc-400">Click &quot;Add Reward&quot; to create the first one.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Reward</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Points Cost</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rewards.map((rw) => (
                  <tr key={rw.id}>
                    {editing === rw.id ? (
                      <td colSpan={5} className="px-4 py-3">
                        <RewardForm
                          initial={rw}
                          onSave={(d) => updateReward(rw.id, d)}
                          onCancel={() => setEditing(null)}
                        />
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <p className="font-medium text-zinc-800">{rw.name}</p>
                          <p className="text-xs text-zinc-400 max-w-xs truncate">{rw.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                            {CATEGORY_LABELS[rw.category] ?? rw.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#2d4a6b]">{rw.pointsCost} pts</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(rw.id, !rw.active)}
                            disabled={toggling === rw.id}
                            className="flex items-center gap-1"
                          >
                            {toggling === rw.id
                              ? <Loader2 size={16} className="animate-spin text-zinc-400" />
                              : rw.active
                                ? <ToggleRight size={20} className="text-green-600" />
                                : <ToggleLeft size={20} className="text-zinc-300" />
                            }
                            <span className={`text-xs font-medium ${rw.active ? "text-green-700" : "text-zinc-400"}`}>
                              {rw.active ? "Active" : "Inactive"}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditing(rw.id)} className="text-zinc-400 hover:text-[#2d4a6b] transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deleteReward(rw.id)}
                              disabled={deleting === rw.id}
                              className="text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              {deleting === rw.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
