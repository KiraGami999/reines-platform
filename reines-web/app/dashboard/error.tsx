"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 mb-5">
        <AlertCircle className="h-7 w-7 text-zinc-500" />
      </div>
      <h2 className="text-lg font-bold text-zinc-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-zinc-500 max-w-sm">
        This page failed to load. This is usually a temporary issue — try refreshing.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-zinc-400 font-mono">Ref: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <button
          onClick={reset}
          className="[#2d4a6b] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2f4a] transition-colors"
        >
          <RefreshCw size={13} /> Retry
        </button>
        <Link
          href="/dashboard"
          className=" px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <LayoutDashboard size={13} /> Dashboard
        </Link>
      </div>
    </div>
  );
}
