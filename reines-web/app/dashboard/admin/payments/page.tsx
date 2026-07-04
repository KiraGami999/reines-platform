import { prisma } from "@/lib/prisma";
import { resolveStorageUrl } from "@/lib/storage";
import PaymentsTable, { type PaymentRow } from "@/components/dashboard/PaymentsTable";
import { fmtPaymentAmount } from "@/lib/paychangu";
import { Wallet, CheckCircle2, Clock, XCircle, Banknote } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import { CashApprovalPanel } from "@/components/admin/CashApprovalPanel";

interface CashPendingPayment {
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

async function getAllPayments(): Promise<PaymentRow[]> {
  try {
    const rows = await prisma.payment.findMany({
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

async function getPendingCashPayments(): Promise<CashPendingPayment[]> {
  try {
    const rows = await prisma.payment.findMany({
      where: { method: "CASH", status: "PENDING" },
      include: {
        project: { select: { id: true, title: true } },
        user:    { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((p) => ({
      id:          p.id,
      txRef:       p.txRef,
      amount:      Number(p.amount),
      currency:    p.currency,
      description: p.description,
      receiptUrl:  resolveStorageUrl(p.receiptUrl),
      createdAt:   p.createdAt.toISOString(),
      project:     p.project,
      user:        p.user!,
    }));
  } catch {
    return [];
  }
}

export const metadata = { title: "Payments – Reines Admin" };

export default async function AdminPaymentsPage() {
  const [payments, pendingCash] = await Promise.all([
    getAllPayments(),
    getPendingCashPayments(),
  ]);

  const totalCollected = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((s, p) => s + p.amount, 0);
  const succeeded    = payments.filter((p) => p.status === "SUCCESS").length;
  const pending      = payments.filter((p) => p.status === "PENDING").length;
  const failed       = payments.filter((p) => p.status === "FAILED" || p.status === "CANCELLED").length;
  const cashApproval = pendingCash.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2d4a6b]">Payment Transactions</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage all payments across projects — online and cash.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="Total Collected"
          value={fmtPaymentAmount(totalCollected)}
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          label="Successful"
          value={succeeded}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Pending"
          value={pending}
          icon={<Clock className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Failed / Cancelled"
          value={failed}
          icon={<XCircle className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Cash Approval Section */}
      {cashApproval > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-amber-200">
            <Banknote size={18} className="text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Cash Payments Awaiting Approval ({cashApproval})
              </p>
              <p className="text-xs text-amber-700">
                Review and approve or reject each submission to update the project balance.
              </p>
            </div>
          </div>
          <div className="p-5">
            <CashApprovalPanel payments={pendingCash} />
          </div>
        </div>
      )}

      {/* Info callout */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 sm:px-5 sm:py-4 text-sm text-zinc-600 space-y-1 overflow-hidden">
        <p>
          <span className="font-semibold text-zinc-800">Online payments</span> are processed via Paychangu and confirmed
          automatically via webhooks. Set up your webhook URL in the{" "}
          <a
            href="https://in.paychangu.com/user/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8fb9e8] hover:underline"
          >
            Paychangu Dashboard
          </a>{" "}
          to: <code className="bg-zinc-200 px-1.5 py-0.5 rounded text-xs break-all">{`{YOUR_DOMAIN}/api/payments/webhook`}</code>
        </p>
        <p>
          <span className="font-semibold text-zinc-800">Cash payments</span> require manual admin approval above before
          they are counted towards a project&apos;s paid balance.
        </p>
      </div>

      <PaymentsTable payments={payments} showUser={true} />
    </div>
  );
}
