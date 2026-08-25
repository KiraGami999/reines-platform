"use client";

import { useState } from "react";
import {
  CreditCard,
  Banknote,
  Building2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { CashPaymentForm } from "@/components/dashboard/CashPaymentForm";

interface PaymentButtonProps {
  projectId:    string;
  projectTitle: string;
  amount:       number;
  currency?:    "MWK" | "USD";
  description:  string;
  disabled?:    boolean;
  className?:   string;
  /**
   * Client mode: show Paychangu + bank transfer + cash choices.
   * Offline methods explain that PM/admin records them.
   * Staff recording uses CashPaymentForm separately (not this prop).
   */
  clientMode?:  boolean;
  /** Start on a given step (e.g. "choose" when opened from a milestone accordion). */
  initialStep?: Step;
  /** Called when the user cancels back to idle (or closes an embedded chooser). */
  onDismiss?:   () => void;
}

const FIELD = "block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8fb9e8] focus:border-transparent";
const LABEL = "block text-sm font-medium text-zinc-700 mb-1";

type Step =
  | "idle"
  | "choose"
  | "online-confirm"
  | "online-loading"
  | "online-error"
  | "cash"
  | "bank-info"
  | "cash-info";

export default function PaymentButton({
  projectId,
  projectTitle,
  amount,
  currency = "MWK",
  description,
  disabled = false,
  className = "",
  clientMode = false,
  initialStep = "idle",
  onDismiss,
}: PaymentButtonProps) {
  const [step,          setStep]          = useState<Step>(initialStep);
  const [errorMsg,      setErrorMsg]      = useState("");
  const [editAmount,    setEditAmount]    = useState(String(amount));
  const [editDesc,      setEditDesc]      = useState(description);
  const [offlineMethod, setOfflineMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");

  const fmt = (n: number) =>
    currency === "MWK" ? `MK ${n.toLocaleString("en-MW")}` : `$${n.toFixed(2)}`;

  function reset() {
    setErrorMsg("");
    setEditAmount(String(amount));
    setEditDesc(description);
    if (onDismiss && initialStep === "choose") {
      onDismiss();
      return;
    }
    setStep("idle");
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

  if (step === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStep("choose")}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <CreditCard size={15} />
        Make a Payment
      </button>
    );
  }

  if (step === "choose") {
    return (
      <div className={`space-y-4 ${initialStep === "choose" ? "" : "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"}`}>
        {initialStep !== "choose" && (
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">How would you like to pay?</h3>
          </div>
        )}

        <p className="text-xs text-zinc-500">
          Choose your preferred payment method for{" "}
          <span className="font-medium text-zinc-700">{projectTitle}</span>.
        </p>

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => setStep("online-confirm")}
            className="group flex items-center gap-3 rounded-xl border-2 border-zinc-200 bg-white p-4 text-left transition-all hover:border-[#8fb9e8] hover:bg-[#8fb9e8]/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2d4a6b] text-white transition-colors group-hover:bg-[#1a2f4a]">
              <CreditCard size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">Pay Online (Paychangu)</p>
              <p className="text-xs text-zinc-400">Mobile Money, bank, or card — confirms automatically</p>
            </div>
            <ChevronRight size={14} className="ml-auto shrink-0 text-zinc-300 group-hover:text-zinc-500" />
          </button>

          <button
            type="button"
            onClick={() => {
              setOfflineMethod("BANK_TRANSFER");
              setStep(clientMode ? "bank-info" : "cash");
            }}
            className="group flex items-center gap-3 rounded-xl border-2 border-zinc-200 bg-white p-4 text-left transition-all hover:border-[#8fb9e8] hover:bg-[#8fb9e8]/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-[#8fb9e8]/20 group-hover:text-[#2d4a6b]">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">Direct Bank Transfer</p>
              <p className="text-xs text-zinc-400">
                {clientMode
                  ? "Transfer to Reines — PM / admin records it"
                  : "Record a received bank transfer"}
              </p>
            </div>
            <ChevronRight size={14} className="ml-auto shrink-0 text-zinc-300 group-hover:text-zinc-500" />
          </button>

          <button
            type="button"
            onClick={() => {
              setOfflineMethod("CASH");
              setStep(clientMode ? "cash-info" : "cash");
            }}
            className="group flex items-center gap-3 rounded-xl border-2 border-zinc-200 bg-white p-4 text-left transition-all hover:border-[#8fb9e8] hover:bg-[#8fb9e8]/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-[#8fb9e8]/20 group-hover:text-[#2d4a6b]">
              <Banknote size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">Cash</p>
              <p className="text-xs text-zinc-400">
                {clientMode
                  ? "Pay at the office — PM / admin records it"
                  : "Record cash received"}
              </p>
            </div>
            <ChevronRight size={14} className="ml-auto shrink-0 text-zinc-300 group-hover:text-zinc-500" />
          </button>
        </div>

        <button
          type="button"
          onClick={reset}
          className="text-xs text-zinc-400 transition-colors hover:text-zinc-600"
        >
          ← Cancel
        </button>
      </div>
    );
  }

  if (step === "bank-info" || step === "cash-info") {
    const isBank = step === "bank-info";
    return (
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          {isBank ? (
            <Building2 size={16} className="text-zinc-500" />
          ) : (
            <Banknote size={16} className="text-zinc-500" />
          )}
          <h3 className="text-sm font-semibold text-zinc-900">
            {isBank ? "Direct Bank Transfer" : "Cash Payment"}
          </h3>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl border border-[#8fb9e8]/30 bg-[#8fb9e8]/5 px-4 py-3 text-sm text-zinc-700">
          <Info size={16} className="mt-0.5 shrink-0 text-[#2d4a6b]" />
          <p>
            {isBank
              ? "Transfer funds directly to Reines using our bank details (ask your project manager if you need them). Once the transfer is received, your project manager or an admin will record it in the portal so your project balance stays accurate."
              : "Pay in cash at the Reines office or to your project manager. Once received, they will record it in the portal and an admin will confirm it against your project balance."}
          </p>
        </div>
        <p className="text-xs text-zinc-500">
          Prefer to pay now from your phone or card? Use{" "}
          <button
            type="button"
            onClick={() => setStep("online-confirm")}
            className="font-semibold text-[#2d4a6b] underline-offset-2 hover:underline"
          >
            Pay Online via Paychangu
          </button>
          .
        </p>
        <button
          type="button"
          onClick={() => setStep("choose")}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          Back
        </button>
      </div>
    );
  }

  if (step === "online-confirm" || step === "online-error") {
    return (
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
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
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleOnlinePay}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2d4a6b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a]"
          >
            <ExternalLink size={13} />
            {editAmount && Number(editAmount) > 0 ? `Pay ${fmt(Number(editAmount))}` : "Pay Now"}
          </button>
          <button
            type="button"
            onClick={() => setStep("choose")}
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
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

  if (step === "cash") {
    return (
      <CashPaymentForm
        key={offlineMethod}
        projectId={projectId}
        projectTitle={projectTitle}
        amount={Number(editAmount) || amount}
        currency={currency}
        description={editDesc}
        onCancel={reset}
        staffMode
        method={offlineMethod}
        allowMethodPicker
      />
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-5 text-sm text-zinc-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-[#8fb9e8]" />
      Redirecting to Paychangu checkout…
    </div>
  );
}
