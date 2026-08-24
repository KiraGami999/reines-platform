import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound, serverError, unauthorized } from "@/lib/api-response";
import { buildReceiptPdf } from "@/lib/receipt-pdf";

function safeFilenamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80) || "receipt";
}

/**
 * GET /api/payments/[txRef]/receipt
 * Authenticated PDF of a payment receipt (same access as the receipt page).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ txRef: string }> }
) {
  const sessionPromise = auth();
  const { txRef } = await params;
  const session = await sessionPromise;
  if (!session?.user) return unauthorized();

  try {
    const payment = await prisma.payment.findUnique({
      where: { txRef },
      include: {
        project: { select: { title: true } },
        user: { select: { name: true } },
      },
    });

    if (!payment) return notFound("Payment");

    if (session.user.role === "CLIENT" && payment.userId !== session.user.id) {
      return forbidden();
    }

    const bytes = await buildReceiptPdf({
      txRef: payment.txRef,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      description: payment.description,
      billedTo: payment.user?.name ?? "-",
      projectTitle: payment.project?.title ?? null,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      paychanguId: payment.paychanguId,
    });

    const filename = `reines-receipt-${safeFilenamePart(payment.txRef)}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[receipt-pdf]", err);
    return serverError("Could not generate the receipt PDF.");
  }
}
