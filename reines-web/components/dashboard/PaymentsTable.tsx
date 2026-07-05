"use client";

import Link from "next/link";
import { PAYMENT_STATUS_META, fmtPaymentAmount } from "@/lib/paychangu";
import { Receipt, ArrowRight, CreditCard, Banknote } from "lucide-react";

export interface PaymentRow {
  id:          string;
  txRef:       string;
  amount:      number;
  currency:    string;
  status:      string;
  method?:     string;
  description: string | null;
  paidAt:      string | null;
  createdAt:   string;
  project:     { id: string; title: string };
  user?:       { id: string; name: string; email: string };
}

interface PaymentsTableProps {
  payments:  PaymentRow[];
  showUser?: boolean;  // Admins see the paying user; clients don't
}

function StatusBadge({ status }: { status: string }) {
  const meta = PAYMENT_STATUS_META[status] ?? PAYMENT_STATUS_META.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function MethodBadge({ method }: { method?: string }) {
  if (method === "CASH") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
        <Banknote size={10} /> Cash
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
      <CreditCard size={10} /> Online
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function PaymentsTable({ payments, showUser = false }: PaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-16 text-center">
        <Receipt size={36} className="text-zinc-200" />
        <h3 className="mt-3 text-sm font-semibold text-zinc-700">No payments yet</h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-xs">
          Payments made through the portal will appear here with their status and receipts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-2.5 py-2 font-semibold sm:px-4 sm:py-3">Reference</th>
              <th className="px-2.5 py-2 font-semibold sm:px-4 sm:py-3">Project</th>
              {showUser && <th className="hidden px-2.5 py-2 font-semibold sm:table-cell sm:px-4 sm:py-3">Client</th>}
              <th className="hidden px-2.5 py-2 font-semibold md:table-cell sm:px-4 sm:py-3">Description</th>
              <th className="px-2.5 py-2 font-semibold sm:px-4 sm:py-3">Amount</th>
              <th className="hidden px-2.5 py-2 font-semibold md:table-cell sm:px-4 sm:py-3">Method</th>
              <th className="px-2.5 py-2 font-semibold sm:px-4 sm:py-3">Status</th>
              <th className="hidden px-2.5 py-2 font-semibold lg:table-cell sm:px-4 sm:py-3">Date</th>
              <th className="px-2.5 py-2 font-semibold sm:px-4 sm:py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                  <span className="block max-w-[100px] truncate font-mono text-xs text-zinc-500 sm:max-w-none">{p.txRef}</span>
                </td>
                <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                  <Link
                    href={`/dashboard/projects/${p.project.id}`}
                    className="font-medium text-zinc-800 hover:text-[#8fb9e8] transition-colors text-xs"
                  >
                    {p.project.title}
                  </Link>
                </td>
                {showUser && p.user && (
                  <td className="hidden px-2.5 py-2 text-xs text-zinc-600 sm:table-cell sm:px-4 sm:py-3">{p.user.name}</td>
                )}
                <td className="hidden px-2.5 py-2 text-xs text-zinc-500 md:table-cell sm:px-4 sm:py-3 max-w-[180px] truncate">
                  {p.description ?? "—"}
                </td>
                <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                  <span className="block min-w-0 break-words font-semibold tabular-nums text-[#2d4a6b]">
                    {fmtPaymentAmount(p.amount, p.currency)}
                  </span>
                </td>
                <td className="hidden px-2.5 py-2 md:table-cell sm:px-4 sm:py-3">
                  <MethodBadge method={p.method} />
                </td>
                <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="hidden px-2.5 py-2 text-xs text-zinc-500 lg:table-cell sm:px-4 sm:py-3">
                  {fmtDate(p.paidAt ?? p.createdAt)}
                </td>
                <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                  <Link
                    href={`/dashboard/payments/${p.txRef}`}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-[#2d4a6b] transition-colors"
                  >
                    Receipt <ArrowRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-xs text-zinc-400">
        <p className="break-words">
          {payments.length} payment{payments.length !== 1 ? "s" : ""} total ·{" "}
          {payments.filter((p) => p.status === "SUCCESS").length} successful ·{" "}
          <span className="font-semibold tabular-nums text-[#2d4a6b]">
            {fmtPaymentAmount(
              payments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0)
            )}
          </span>{" "}
          collected
        </p>
      </div>
    </div>
  );
}
