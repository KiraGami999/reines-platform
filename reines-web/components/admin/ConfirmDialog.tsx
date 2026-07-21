"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open:      boolean;
  title:     string;
  message:   string;
  confirmLabel?: string;
  loading?:  boolean;
  onConfirm: () => void;
  onCancel:  () => void;
}

/**
 * Accessible inline confirmation dialog.
 * Replaces window.confirm() with a proper modal.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        {/* Header */}
        <div className="border-b border-zinc-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <AlertTriangle size={19} className="text-zinc-500" />
            </div>
            <div>
              <p id="confirm-title" className="text-sm font-semibold text-zinc-900">
                {title}
              </p>
              <p id="confirm-message" className="mt-0.5 text-xs text-zinc-500">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className=" py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Deleting…</>
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
