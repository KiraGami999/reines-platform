import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, forbidden, notFound } from "@/lib/api-response";

/**
 * GET /api/payments/verify/[txRef]
 *
 * Returns the current status of a payment from our database.
 * Can be polled by the client after being redirected from the callback URL.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ txRef: string }> }) {
  const session = await auth();
  if (!session?.user) return forbidden();

  const { txRef } = await params;

  try {
    const payment = await prisma.payment.findUnique({
      where: { txRef },
      include: {
        project: { select: { id: true, title: true } },
        user:    { select: { id: true, name: true } },
      },
    });

    if (!payment) return notFound("Payment");

    // Clients can only see their own payments; managers/admins can see all
    if (
      session.user.role === "CLIENT" &&
      payment.userId !== session.user.id
    ) {
      return forbidden();
    }

    return ok({
      id:          payment.id,
      txRef:       payment.txRef,
      amount:      Number(payment.amount),
      currency:    payment.currency,
      status:      payment.status,
      description: payment.description,
      paidAt:      payment.paidAt,
      createdAt:   payment.createdAt,
      project:     payment.project,
      user:        payment.user,
    });
  } catch {
    return notFound("Payment");
  }
}
