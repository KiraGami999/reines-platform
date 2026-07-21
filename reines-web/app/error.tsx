"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 mb-5">
          <AlertCircle className="h-7 w-7 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-zinc-500">
          An unexpected error occurred. Please try again, or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-zinc-400 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#2d4a6b] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1a2f4a] transition-colors"
          >
            <RefreshCw size={14} /> Try again
          </button>
          <Link
            href="/"
            className="border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
