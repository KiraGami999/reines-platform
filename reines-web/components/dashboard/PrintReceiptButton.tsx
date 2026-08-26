"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";

export function PrintReceiptButton({ txRef }: { txRef: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function downloadPdf() {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/payments/${encodeURIComponent(txRef)}/receipt`);
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? "Could not generate PDF.");
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reines-receipt-${txRef}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        setError("Could not generate PDF.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={downloadPdf}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#35475D] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#283546] disabled:opacity-60"
      >
        <Download size={13} />
        {isPending ? "Preparing PDF…" : "Download PDF"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
      >
        Print Receipt
      </button>
      {error ? (
        <p className="basis-full text-sm text-red-600">{error}</p>
      ) : null}
    </>
  );
}
