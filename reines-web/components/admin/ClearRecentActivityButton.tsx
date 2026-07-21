"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export function ClearRecentActivityButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function clearActivity() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/recent-activity/clear", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Could not clear activity.");
        return;
      }

      router.refresh();
    } catch {
      setError("Could not clear activity. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={clearActivity}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        Clear
      </button>
      {error && <p className="max-w-44 text-right text-[11px] text-blue-700">{error}</p>}
    </div>
  );
}
