"use client";

import { useState } from "react";
import { CreditCard, Banknote, AlertCircle, ExternalLink, ChevronRight } from "lucide-react";
import { CashPaymentForm } from "@/components/dashboard/CashPaymentForm";

interface PaymentButtonProps {
  projectId:    string;
  projectTitle: string;
  amount:       number;
  currency?:    "MWK" | "USD";
  description:  string;
  disabled?:    boolean;
  className?:   string;
}

const FIELD = "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8fb9e8] focus:border-transparent";
const LABEL = "block text-sm font-medium text-zinc-700 mb-1";

type Step = "idle" | "choose" | "online-confirm" | "online-loading" | "online-error" | "cash";

export default function PaymentButton({
  projectId,
  projectTitle,
  amount,
  currency = "MWK",
  description,
  disabled = false,
  className = "",
}: PaymentButtonProps) {
  const [step,       setStep]       = useState<Step>("idle");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [editAmount, setEditAmount] = useState(String(amount));
  const [editDesc,   setEditDesc]   = useState(description);

  const fmt = (n: number) =>
    currency === "MWK" ? `MK ${n.toLocaleString("en-MW")}` : `$${n.toFixed(2)}`;

  function reset() {
    setStep("idle");
    setErrorMsg("");
    setEditAmount(String(amount));
    setEditDesc(description);
  }

  async function handleOnlinePay() {
    const numAmount = Number(editAmount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg("Please enter a valid payment amount.");
      return;
    }
    if (!editDesc.trim()) {
      setErrorMsg("Please describe what this payment covers.");
      return;
    }

    setStep("online-loading");
    setErrorMsg("");

    try {
      const res  = await fetch("/api/payments/initiate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          projectId,
          amount:      numAmount,
          currency,
          description: editDesc.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Failed to create payment session.");
        setStep("online-error");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStep("online-error");
    }
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("choose")}
        disabled={disabled}
        className={`[#2d4a6b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1a2f4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <CreditCard size={15} />
        Make a Payment
      </button>
    );
  }

  // ── Choose payment method ──────────────────────────────────────────────────
  if (step === "choose") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">How would you like to pay?</h3>
        </div>

        <p className="text-xs text-zinc-500">
          Choose your preferred payment method for{" "}
          <span className="font-medium text-zinc-700">{projectTitle}</span>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Online */}
          <button
            onClick={() => setStep("online-confirm")}
            className="group flex items-center gap-3 rounded-xl border-2 border-zinc-200 p-4 text-left transition-all hover:border-[#8fb9e8] hover:bg-[#8fb9e8]/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2d4a6b] text-white group-hover:bg-[#1a2f4a] transition-colors">
              <CreditCard size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">Pay Online</p>
              <p className="text-xs text-zinc-400">Mobile Money, Bank Transfer, Card</p>
            </div>
            <ChevronRight size={14} className="ml-auto shrink-0 text-zinc-300 group-hover:text-zinc-500" />
          </button>

          {/* Cash */}
          <button
            onClick={() => setStep("cash")}
            className="group flex items-center gap-3 rounded-xl border-2 border-zinc-200 p-4 text-left transition-all hover:border-[#8fb9e8] hover:bg-[#8fb9e8]/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 group-hover:bg-[#8fb9e8]/20 group-hover:text-[#2d4a6b] transition-colors">
              <Banknote size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">Pay in Cash</p>
              <p className="text-xs text-zinc-400">Upload receipt · Admin confirms</p>
            </div>
            <ChevronRight size={14} className="ml-auto shrink-0 text-zinc-300 group-hover:text-zinc-500" />
          </button>
        </div>

        <button
          onClick={reset}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          ← Cancel
        </button>
      </div>
    );
  }

  // ── Online payment confirm ─────────────────────────────────────────────────
  if (step === "online-confirm" || step === "online-error") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Pay Online via Paychangu</h3>
        </div>
        <p className="text-xs text-zinc-500">
          You will be redirected to Paychangu&apos;s secure checkout to complete your payment
          via Mobile Money, bank transfer, or card.
        </p>

        <div>
          <label className={LABEL}>Amount ({currency})</label>
          <input
            type="number"
            min="1"
            step="1000"
            value={editAmount}
            onChange={(e) => { setEditAmount(e.target.value); setErrorMsg(""); }}
            className={FIELD}
          />
        </div>

        <div>
          <label className={LABEL}>Description</label>
          <input
            type="text"
            value={editDesc}
            onChange={(e) => { setEditDesc(e.target.value); setErrorMsg(""); }}
            placeholder="e.g. Foundation milestone payment"
            className={FIELD}
          />
        </div>

        <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          Project: <span className="font-medium text-zinc-700">{projectTitle}</span>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleOnlinePay}
            className="flex-1 bg-[#2d4a6b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1a2f4a] transition-colors"
          >
            <ExternalLink size={13} />
            {editAmount && Number(editAmount) > 0 ? `Pay ${fmt(Number(editAmount))}` : "Pay Now"}
          </button>
          <button
            onClick={() => setStep("choose")}
            className="px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Back
          </button>
        </div>

        <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <CreditCard size={11} />
          Secured by Paychangu · Mobile Money · Bank Transfer · Card
        </p>
      </div>
    );
  }

  // ── Cash payment ───────────────────────────────────────────────────────────
  if (step === "cash") {
    return (
      <CashPaymentForm
        projectId={projectId}
        projectTitle={projectTitle}
        amount={Number(editAmount) || amount}
        currency={currency}
        description={editDesc}
        onCancel={reset}
      />
    );
  }

  // ── Online loading redirect ─────────────────────────────────────────────────
  return (
    <div className="border border-zinc-200 bg-white px-6 py-5 text-sm text-zinc-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-[#8fb9e8]" />
      Redirecting to Paychangu checkout…
    </div>
  );
}
