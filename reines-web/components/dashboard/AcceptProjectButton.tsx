"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export function AcceptProjectButton({
  projectId,
  onAccepted,
  className = "",
}: {
  projectId: string;
  onAccepted?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function acceptProject() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/accept`, { method: "PATCH" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Could not accept project.");
        return;
      }

      onAccepted?.();
      router.refresh();
    } catch {
      setError("Could not accept project. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={acceptProject}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2  px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f4a] disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
        Accept project
      </button>
      {error && <p className="mt-2 text-xs text-blue-700">{error}</p>}
    </div>
  );
}
