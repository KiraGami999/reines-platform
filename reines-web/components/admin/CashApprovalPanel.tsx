"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  ExternalLink,
  Banknote,
  User,
  FolderKanban,
  Calendar,
  MessageSquare,
  X,
} from "lucide-react";
import { fmtPaymentAmount } from "@/lib/paychangu";

interface CashPayment {
  id:          string;
  txRef:       string;
  amount:      number;
  currency:    string;
  description: string | null;
  receiptUrl:  string | null;
  createdAt:   string;
  project:     { id: string; title: string };
  user:        { id: string; name: string; email: string };
}

interface CashApprovalPanelProps {
  payments: CashPayment[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ReceiptModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-2xl w-full overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <p className="text-sm font-semibold text-zinc-800">Payment Receipt</p>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <ExternalLink size={12} /> Open full
            </a>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="relative max-h-[75vh] overflow-auto bg-zinc-100">
          <Image
            src={url}
            alt="Payment receipt"
            width={800}
            height={600}
            unoptimized={url.startsWith("/api/media")}
            className="h-auto w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

function CashPaymentCard({ payment }: { payment: CashPayment }) {
  const router = useRouter();
  const [loading,       setLoading]       = useState<"approve" | "reject" | null>(null);
  const [notes,         setNotes]         = useState("");
  const [showNotes,     setShowNotes]     = useState<"approve" | "reject" | null>(null);
  const [showReceipt,   setShowReceipt]   = useState(false);
  const [error,         setError]         = useState("");
  const [done,          setDone]          = useState<"approved" | "rejected" | null>(null);

  async function submit(action: "approve" | "reject") {
    if (action === "reject" && !notes.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }

    setLoading(action);
    setError("");

    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/${action}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ notes: notes.trim() || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Failed to ${action} payment.`);
        setLoading(null);
        return;
      }

      setDone(action === "approve" ? "approved" : "rejected");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(null);
    }
  }

  if (done) {
    return (
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${done === "approved" ? "border-green-200 bg-green-50" : "border-red-100 bg-red-50"}`}>
        {done === "approved"
          ? <CheckCircle2 size={18} className="text-green-600 shrink-0" />
          : <XCircle size={18} className="text-red-500 shrink-0" />
        }
        <p className="text-sm font-medium text-zinc-700">
          Payment <span className="font-semibold">{payment.txRef}</span> {done}.
          {done === "approved" && " The project balance has been updated."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <Banknote size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {fmtPaymentAmount(payment.amount, payment.currency)}
            </p>
            <p className="text-xs text-zinc-400 font-mono">{payment.txRef}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          <Banknote size={10} /> Awaiting Approval
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-3 text-xs text-zinc-600">
        <div className="flex items-start gap-2">
          <User size={13} className="mt-0.5 shrink-0 text-zinc-400" />
          <div>
            <p className="font-medium text-zinc-800">{payment.user.name}</p>
            <p className="text-zinc-400">{payment.user.email}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <FolderKanban size={13} className="mt-0.5 shrink-0 text-zinc-400" />
          <div>
            <Link
              href={`/dashboard/projects/${payment.project.id}`}
              className="font-medium text-zinc-800 hover:text-[#8fb9e8] transition-colors"
            >
              {payment.project.title}
            </Link>
          </div>
        </div>
        {payment.description && (
          <div className="flex items-start gap-2 sm:col-span-2">
            <MessageSquare size={13} className="mt-0.5 shrink-0 text-zinc-400" />
            <p>{payment.description}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar size={13} className="shrink-0 text-zinc-400" />
          <p>{fmtDate(payment.createdAt)}</p>
        </div>
      </div>

      {/* Receipt */}
      <div className="border-t border-zinc-100 px-4 py-3">
        {payment.receiptUrl ? (
          <div className="flex items-center justify-between">
            <div className="relative h-16 w-24 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
              <Image
                src={payment.receiptUrl}
                alt="Receipt"
                fill
                unoptimized={payment.receiptUrl.startsWith("/api/media")}
                className="object-cover"
              />
            </div>
            <button
              onClick={() => setShowReceipt(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <Eye size={13} /> View Receipt
            </button>
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic">No receipt uploaded by client.</p>
        )}
      </div>

      {/* Notes input */}
      {showNotes && (
        <div className="border-t border-zinc-100 px-4 py-3 space-y-2">
          <label className="block text-xs font-medium text-zinc-700">
            {showNotes === "reject" ? "Reason for rejection (required)" : "Admin notes (optional)"}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setError(""); }}
            placeholder={showNotes === "reject" ? "e.g. Receipt unclear, amount does not match…" : "e.g. Cash received at site office…"}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8fb9e8] resize-none"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 pb-3">
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            <XCircle size={13} className="mt-0.5 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-zinc-100 flex gap-2 px-4 py-3">
        {showNotes === "approve" ? (
          <>
            <button
              onClick={() => submit("approve")}
              disabled={!!loading}
              className="flex-1 bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {loading === "approve" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Confirm Approval
            </button>
            <button
              onClick={() => { setShowNotes(null); setNotes(""); }}
              disabled={!!loading}
              className="px-3 py-2 text-xs text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : showNotes === "reject" ? (
          <>
            <button
              onClick={() => submit("reject")}
              disabled={!!loading}
              className="flex-1 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {loading === "reject" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
              Confirm Rejection
            </button>
            <button
              onClick={() => { setShowNotes(null); setNotes(""); }}
              disabled={!!loading}
              className="px-3 py-2 text-xs text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowNotes("approve")}
              className="flex-1 bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              <CheckCircle2 size={14} /> Approve
            </button>
            <button
              onClick={() => setShowNotes("reject")}
              className="flex-1 border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              <XCircle size={14} /> Reject
            </button>
          </>
        )}
      </div>

      {showReceipt && payment.receiptUrl && (
        <ReceiptModal url={payment.receiptUrl} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}

export function CashApprovalPanel({ payments }: CashApprovalPanelProps) {
  if (payments.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {payments.map((p) => (
        <CashPaymentCard key={p.id} payment={p} />
      ))}
    </div>
  );
}
