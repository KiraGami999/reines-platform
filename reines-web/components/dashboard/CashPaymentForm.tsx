"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  Banknote,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Loader2,
} from "lucide-react";

interface CashPaymentFormProps {
  projectId:    string;
  projectTitle: string;
  amount:       number;
  currency?:    "MWK" | "USD";
  description:  string;
  onCancel:     () => void;
}

const FIELD =
  "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8fb9e8] focus:border-transparent";
const LABEL = "block text-sm font-medium text-zinc-700 mb-1";

export function CashPaymentForm({
  projectId,
  projectTitle,
  amount,
  currency = "MWK",
  description,
  onCancel,
}: CashPaymentFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editAmount, setEditAmount] = useState(String(amount));
  const [editDesc,   setEditDesc]   = useState(description);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  const fmt = (n: number) =>
    currency === "MWK" ? `MK ${n.toLocaleString("en-MW")}` : `$${n.toFixed(2)}`;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const blob = await upload(
        `uploads/receipts/${file.name}`,
        file,
        {
          access: "private",
          handleUploadUrl: "/api/upload/client",
        },
      );
      setReceiptUrl(blob.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(msg);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function removeReceipt() {
    setReceiptUrl(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    const numAmount = Number(editAmount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }
    if (!editDesc.trim()) {
      setError("Please describe what this payment covers.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/payments/cash", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          amount:      numAmount,
          currency,
          description: editDesc.trim(),
          receiptUrl:  receiptUrl ?? undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to submit payment.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm text-center">
        <div className="flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <CheckCircle2 size={28} className="text-zinc-500" />
          </div>
        </div>
        <h3 className="text-base font-semibold text-zinc-900">Cash Payment Submitted</h3>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto">
          Your payment has been recorded and is awaiting admin confirmation. You will be
          notified once it is approved.
        </p>
        <button
          onClick={onCancel}
          className="mt-2 border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Banknote size={16} className="text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-900">Cash Payment</h3>
      </div>

      <p className="text-xs text-zinc-500">
        Submit your cash payment details and optionally upload a photo of your receipt. An admin
        will review and confirm the payment.
      </p>

      {/* Amount */}
      <div>
        <label className={LABEL}>Amount ({currency})</label>
        <input
          type="number"
          min="1"
          step="1000"
          value={editAmount}
          onChange={(e) => { setEditAmount(e.target.value); setError(""); }}
          className={FIELD}
          disabled={submitting}
        />
      </div>

      {/* Description */}
      <div>
        <label className={LABEL}>Description</label>
        <input
          type="text"
          value={editDesc}
          onChange={(e) => { setEditDesc(e.target.value); setError(""); }}
          placeholder="e.g. Foundation milestone cash payment"
          className={FIELD}
          disabled={submitting}
        />
      </div>

      {/* Project */}
      <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
        Project: <span className="font-medium text-zinc-700">{projectTitle}</span>
      </div>

      {/* Receipt Upload */}
      <div>
        <label className={LABEL}>Receipt / Proof of Payment (optional)</label>

        {preview ? (
          <div className="relative mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Receipt preview" className="h-40 w-full object-contain p-2" />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 size={20} className="animate-spin text-zinc-500" />
              </div>
            )}
            {!uploading && (
              <button
                type="button"
                onClick={removeReceipt}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800/70 text-white hover:bg-zinc-800 transition-colors"
                title="Remove receipt"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || submitting}
            className="mt-1 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-4 py-5 text-sm text-zinc-400 transition-colors hover:border-[#8fb9e8] hover:text-[#8fb9e8] disabled:opacity-50"
          >
            <ImageIcon size={22} />
            <span>Click to upload receipt image</span>
            <span className="text-xs">JPEG, PNG, WEBP · Max 5 MB</span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
          disabled={submitting}
        />

        {uploading && !preview && (
          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
            <Loader2 size={11} className="animate-spin" /> Uploading…
          </p>
        )}
        {receiptUrl && !uploading && (
          <p className="mt-1 flex items-center gap-1 text-xs text-blue-600">
            <CheckCircle2 size={11} /> Receipt uploaded
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={submitting || uploading}
          className="flex-1 bg-[#2d4a6b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1a2f4a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <><Loader2 size={13} className="animate-spin" /> Submitting…</>
          ) : (
            <><Upload size={13} /> Submit Cash Payment</>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <p className="text-[11px] text-zinc-400">
        Cash payments require admin approval before being counted towards your project balance.
      </p>
    </div>
  );
}
