"use client";

import { useState } from "react";
import { ChevronDown, Banknote, Info } from "lucide-react";
import type { BudgetBreakdown } from "@/models/project";
import { fmtMWK } from "@/lib/mock-data";
import { CashPaymentForm } from "@/components/dashboard/CashPaymentForm";

interface BudgetPaymentSectionProps {
  projectId:    string;
  projectTitle: string;
  budget:       number;
  breakdown:    BudgetBreakdown[];
  role:         string;
}

export function BudgetPaymentSection({
  projectId,
  projectTitle,
  budget,
  breakdown,
  role,
}: BudgetPaymentSectionProps) {
  const totalPaid = breakdown.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0);
  const remaining = budget - totalPaid;
  const paidPct   = budget > 0 ? Math.round((totalPaid / budget) * 100) : 0;

  const isStaff   = role === "ADMIN" || role === "PROJECT_MANAGER";
  const canRecord = isStaff && remaining > 0;

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggleRecord(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div>
      {/* Stat grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Budget", value: fmtMWK(budget),    note: "Agreed contract value", colour: "text-zinc-900"  },
          { label: "Paid to Date", value: fmtMWK(totalPaid), note: `${paidPct}% of total`,  colour: "text-[#2d4a6b]" },
          { label: "Outstanding",  value: fmtMWK(remaining), note: `${100 - paidPct}% left`, colour: "text-zinc-700" },
        ].map((s) => (
          <div key={s.label} className="min-w-0 rounded-xl bg-zinc-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {s.label}
            </p>
            <p className={`mt-1.5 min-w-0 break-words text-base font-extrabold tabular-nums leading-snug sm:text-lg lg:text-xl ${s.colour}`}>
              {s.value}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-400">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Payment progress bar */}
      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs text-zinc-500">
          <span>Payment progress</span>
          <span className="font-semibold text-zinc-700">{paidPct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-[#2d4a6b] transition-all"
            style={{ width: `${paidPct}%` }}
          />
        </div>
      </div>

      {/* Client notice */}
      {role === "CLIENT" && remaining > 0 && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          <Info size={16} className="mt-0.5 shrink-0 text-[#2d4a6b]" />
          <p>
            Payments are recorded by your project manager or at the Reines office.
            Once an admin confirms a payment, it will appear here as paid.
          </p>
        </div>
      )}

      {/* Milestone breakdown */}
      {breakdown.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Payment Milestones
            </p>
            {canRecord && (
              <p className="text-[11px] font-medium text-[#2d4a6b]">
                Tap an outstanding item to record a cash payment
              </p>
            )}
          </div>

          {breakdown.map((b, i) => {
            const recordable = canRecord && !b.paid;
            const isOpen     = openIndex === i;

            if (!recordable) {
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                    b.paid
                      ? "border-[#8fb9e8]/25 bg-[#8fb9e8]/5"
                      : "border-zinc-100 bg-white"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        b.paid ? "bg-[#2d4a6b] text-white" : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {b.paid ? "✓" : i + 1}
                    </div>
                    <span className="min-w-0 text-sm font-medium text-zinc-700">{b.label}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-zinc-900">{fmtMWK(b.amount)}</p>
                    <p className={`text-[10px] font-semibold ${b.paid ? "text-[#2d4a6b]" : "text-zinc-400"}`}>
                      {b.paid ? "Paid" : "Outstanding"}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={i}
                className={`overflow-hidden rounded-xl border-2 transition-colors ${
                  isOpen
                    ? "border-[#2d4a6b] bg-white shadow-sm"
                    : "border-[#2d4a6b]/25 bg-[#2d4a6b]/[0.03] hover:border-[#2d4a6b]/50 hover:bg-[#2d4a6b]/[0.05]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleRecord(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2d4a6b] text-xs font-bold text-white">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-zinc-800">{b.label}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-[#2d4a6b]">
                        <Banknote size={11} />
                        {isOpen
                          ? "Enter cash details below — admin will approve"
                          : "Tap to record cash payment"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums text-zinc-900">{fmtMWK(b.amount)}</p>
                      <span className="inline-flex items-center rounded-full bg-[#2d4a6b] px-2 py-0.5 text-[10px] font-semibold text-white">
                        Record
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-[#2d4a6b] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-zinc-100 bg-zinc-50/80 px-3 py-3 sm:px-4">
                    <CashPaymentForm
                      projectId={projectId}
                      projectTitle={projectTitle}
                      amount={b.amount}
                      description={`${b.label} — ${projectTitle}`}
                      onCancel={() => setOpenIndex(null)}
                      staffMode
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback when no breakdown rows but balance remains */}
      {canRecord && breakdown.length === 0 && (
        <div className="mt-5 border-t border-zinc-100 pt-5">
          <CashPaymentForm
            projectId={projectId}
            projectTitle={projectTitle}
            amount={remaining}
            description={`Payment for ${projectTitle}`}
            onCancel={() => {}}
            staffMode
          />
        </div>
      )}

      {canRecord && (
        <p className="mt-3 text-center text-[11px] text-zinc-400">
          Recorded cash payments stay pending until an admin approves them.
        </p>
      )}
    </div>
  );
}
