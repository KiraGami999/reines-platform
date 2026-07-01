"use client";

export function PrintReceiptButton() {
  return (
    <button
      onClick={() => window.print()}
      className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
    >
      Print Receipt
    </button>
  );
}
