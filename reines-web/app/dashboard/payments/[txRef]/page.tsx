import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PAYMENT_STATUS_META, fmtPaymentAmount } from "@/lib/paychangu";
import { PrintReceiptButton } from "@/components/dashboard/PrintReceiptButton";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Receipt, ExternalLink } from "lucide-react";

// Always fetch fresh data so the payment status and paid-at are never stale.
export const dynamic = "force-dynamic";

async function getPayment(txRef: string, userId: string, role: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { txRef },
      include: {
        project: { select: { id: true, title: true, status: true } },
        user:    { select: { id: true, name: true, email: true } },
      },
    });
    if (!payment) return null;
    if (role === "CLIENT" && payment.userId !== userId) return null;
    return payment;
  } catch (err) {
    console.error("[getPayment]", err);
    return null;
  }
}

function fmtDate(d: Date | string | null, withTime = false) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

interface PageProps {
  params:       Promise<{ txRef: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function PaymentReceiptPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { txRef } = await params;
  const sp = await searchParams;

  const payment = await getPayment(txRef, session.user.id!, session.user.role!);
  if (!payment) notFound();

  const meta        = PAYMENT_STATUS_META[payment.status] ?? PAYMENT_STATUS_META.PENDING;
  const isSuccess   = payment.status === "SUCCESS";
  const isCancelled = payment.status === "CANCELLED";
  const isPending   = payment.status === "PENDING";

  const StatusIcon = isSuccess
    ? CheckCircle2
    : isCancelled || payment.status === "FAILED"
      ? XCircle
      : Clock;

  const flashStatus = sp.status;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/payments"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Payments
      </Link>

      {/* Flash banners from callback redirect */}
      {flashStatus === "success" && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 text-sm text-blue-800 font-medium">
          <CheckCircle2 size={16} /> Payment completed successfully! Your receipt is below.
        </div>
      )}
      {(flashStatus === "failed" || flashStatus === "cancelled") && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 text-sm text-blue-800">
          <XCircle size={16} /> Payment was {flashStatus}. No charge was made. You can try again from your project page.
        </div>
      )}

      {/* Receipt card */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">

        {/* Status header */}
        <div className={`px-8 py-8 text-center border-b border-zinc-100 ${
          isSuccess ? "bg-blue-50" : isPending ? "bg-zinc-50" : "bg-zinc-50"
        }`}>
          <StatusIcon
            size={48}
            className={`mx-auto mb-3 ${
              isSuccess ? "text-blue-500" : isPending ? "text-zinc-400" : "text-zinc-400"
            }`}
          />
          <h1 className="text-2xl font-bold text-zinc-900">{meta.label}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isSuccess
              ? `Payment of ${fmtPaymentAmount(Number(payment.amount), payment.currency)} received`
              : isPending
                ? "This payment is awaiting confirmation from Paychangu"
                : "This payment did not complete successfully"}
          </p>
        </div>

        {/* Receipt rows */}
        <div className="px-8 py-6 divide-y divide-zinc-100">
          {[
            {
              label: "Reference",
              value: <span className="font-mono text-xs">{payment.txRef}</span>,
            },
            {
              label: "Project",
              value: (
                <Link
                  href={`/dashboard/projects/${payment.project.id}`}
                  className="text-[#8fb9e8] hover:underline flex items-center gap-1"
                >
                  {payment.project.title} <ExternalLink size={11} />
                </Link>
              ),
            },
            { label: "Description", value: payment.description ?? "—" },
            {
              label: "Amount",
              value: (
                <span className="font-bold text-lg">
                  {fmtPaymentAmount(Number(payment.amount), payment.currency)}
                </span>
              ),
            },
            { label: "Currency", value: payment.currency },
            {
              label: "Status",
              value: (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.classes}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              ),
            },
            { label: "Paid at",   value: payment.paidAt ? fmtDate(payment.paidAt, true) : "—" },
            { label: "Initiated", value: fmtDate(payment.createdAt, true) },
            ...(payment.paychanguId
              ? [{ label: "Paychangu ID", value: <span className="font-mono text-xs">{payment.paychanguId}</span> }]
              : []),
            { label: "Billed to", value: payment.user?.name ?? "—" },
          ].map((row, i) => (
            <div key={i} className="flex items-start justify-between py-3.5 gap-4">
              <span className="text-sm text-zinc-500 shrink-0 w-32">{row.label}</span>
              <span className="text-sm text-zinc-900 text-right">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="px-8 py-5 bg-zinc-50 border-t border-zinc-100 flex flex-wrap gap-3">
          {!isSuccess && !isCancelled && (
            <Link
              href={`/dashboard/projects/${payment.project.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2d4a6b] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2f4a] transition-colors"
            >
              Try Payment Again
            </Link>
          )}
          <Link
            href="/dashboard/payments"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <Receipt size={13} /> All Payments
          </Link>

          {/* Print button must be a Client Component (uses window.print) */}
          <PrintReceiptButton />
        </div>
      </div>

      {isSuccess && (
        <p className="text-xs text-zinc-400 text-center">
          A payment confirmation email has been sent to your email address by Paychangu. Keep this page as your reference.
        </p>
      )}
    </div>
  );
}
