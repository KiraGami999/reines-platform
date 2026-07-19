import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PaymentsTable, { type PaymentRow } from "@/components/dashboard/PaymentsTable";
import { fmtPaymentAmount } from "@/lib/paychangu";
import { CheckCircle2, Clock, XCircle, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

async function getPayments(userId: string, role: string): Promise<PaymentRow[]> {
  try {
    const where = role === "CLIENT" ? { userId } : {};
    const rows = await prisma.payment.findMany({
      where,
      include: {
        project: { select: { id: true, title: true } },
        user:    { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((p) => ({
      id:          p.id,
      txRef:       p.txRef,
      amount:      Number(p.amount),
      currency:    p.currency,
      status:      p.status,
      method:      p.method,
      description: p.description,
      paidAt:      p.paidAt?.toISOString() ?? null,
      createdAt:   p.createdAt.toISOString(),
      project:     p.project,
      user:        p.user ?? undefined,
    }));
  } catch {
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export const metadata = { title: "Payments – Reines Portal" };

export default async function PaymentsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id: userId } = session.user;
  const params   = await searchParams;
  const payments = await getPayments(userId!, role!);

  const total     = payments.reduce((s, p) => p.status === "SUCCESS" ? s + p.amount : s, 0);
  const pending   = payments.filter((p) => p.status === "PENDING").length;
  const succeeded = payments.filter((p) => p.status === "SUCCESS").length;
  const failed    = payments.filter((p) => p.status === "FAILED" || p.status === "CANCELLED").length;

  const showUser = role !== "CLIENT";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Status flash */}
      {params.status === "cancelled" && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 text-sm text-blue-800">
          <XCircle size={16} className="shrink-0" />
          Payment was cancelled. No charge was made.
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2d4a6b]">Payments</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {role === "CLIENT"
            ? "Your project payment history and receipts."
            : "All payment transactions across projects."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-4 sm:gap-4">
        {[
          {
            label: "Total Collected",
            value: fmtPaymentAmount(total),
            icon:  <Wallet size={18} />,
            bg:    "bg-[#2d4a6b] text-white",
            iconBg: "bg-white/15 text-zinc-300",
          },
          {
            label: "Successful",
            value: succeeded,
            icon:  <CheckCircle2 size={18} />,
            bg:    "bg-white border border-zinc-200",
            iconBg: "bg-zinc-100 text-zinc-500",
          },
          {
            label: "Pending",
            value: pending,
            icon:  <Clock size={18} />,
            bg:    "bg-white border border-zinc-200",
            iconBg: "bg-zinc-100 text-zinc-500",
          },
          {
            label: "Failed / Cancelled",
            value: failed,
            icon:  <XCircle size={18} />,
            bg:    "bg-white border border-zinc-200",
            iconBg: "bg-zinc-100 text-zinc-500",
          },
        ].map((s) => (
          <div key={s.label} className={`min-w-0 rounded-xl p-3 flex items-center gap-3 sm:p-5 sm:gap-4 ${s.bg}`}>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${s.iconBg}`}>
              {s.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`min-w-0 break-words text-base font-bold tabular-nums leading-tight sm:text-lg lg:text-xl ${s.bg.includes("[#2d4a6b]") ? "text-white" : "text-zinc-900"}`}>
                {s.value}
              </p>
              <p className={`text-[10px] sm:text-xs ${s.bg.includes("[#2d4a6b]") ? "text-zinc-300" : "text-zinc-500"}`}>
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Info banner for clients */}
      {role === "CLIENT" && (
        <div className="rounded-xl border border-[#8fb9e8]/30 bg-[#8fb9e8]/5 px-5 py-4 space-y-1.5">
          <p className="text-sm text-zinc-700">
            <span className="font-semibold text-[#2d4a6b]">How to pay:</span> Open any project, scroll to the Budget section, and click{" "}
            <strong>Make a Payment</strong>. You can pay online via Paychangu (Mobile Money, bank transfer, card) or submit a cash payment with a receipt photo.
          </p>
          <p className="text-xs text-zinc-500">
            Cash payments require admin approval before being counted towards your project balance. Online payments are confirmed automatically.
          </p>
        </div>
      )}

      {/* Payments table */}
      <PaymentsTable payments={payments} showUser={showUser} />

      {role === "CLIENT" && payments.length === 0 && (
        <div className="text-center pt-2">
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#2d4a6b] hover:underline"
          >
            Go to My Projects to make a payment →
          </Link>
        </div>
      )}
    </div>
  );
}
