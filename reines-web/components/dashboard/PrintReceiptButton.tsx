"use client";

export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className=" px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
    >
      Print Receipt
    </button>
  );
}
