import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, forbidden, notFound, serverError, badRequest } from "@/lib/api-response";
import { autoAwardPointsForPayment } from "@/lib/loyalty";
import { notifyPaymentApproved } from "@/lib/push";
import { recordAdminAction } from "@/lib/audit-log";
import { z } from "zod";

const schema = z.object({
  notes: z.string().optional(),
});

/**
 * PATCH /api/admin/payments/[id]/approve
 * Admin approves a pending cash payment, setting status to SUCCESS.
 * This causes the amount to be counted in the project budget paid total.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request.");

  try {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return notFound("Payment");
    if (payment.method !== "CASH" && payment.method !== "BANK_TRANSFER") {
      return badRequest("Only cash or bank transfer payments can be manually approved.");
    }
    if (payment.status !== "PENDING") return badRequest("Only pending payments can be approved.");

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status:         "SUCCESS",
        paidAt:         new Date(),
        adminApprovedBy: session.user.id,
        adminApprovedAt: new Date(),
        adminNotes:     parsed.data.notes ?? null,
      },
      include: {
        project: { select: { id: true, title: true } },
        user:    { select: { id: true, name: true, email: true } },
      },
    });

    // Loyalty + push only for account clients with a project (skip walk-ins / product sales).
    let pointsAwarded = 0;
    if (updated.userId && updated.projectId && updated.project) {
      pointsAwarded = await autoAwardPointsForPayment(
        updated.userId,
        updated.projectId,
        updated.id,
        Number(updated.amount),
        updated.description,
        session.user.id,
      );

      notifyPaymentApproved({
        clientId:     updated.userId,
        projectTitle: updated.project.title,
        projectId:    updated.projectId,
        paymentId:    updated.id,
        amount:       Number(updated.amount).toLocaleString(),
      }).catch(console.warn);
    }

    recordAdminAction({
      actor: session.user,
      action: "payment.approve",
      entityType: "Payment",
      entityId: updated.id,
      summary: `Approved ${updated.method.toLowerCase().replace("_", " ")} payment ${updated.txRef} (${Number(updated.amount).toLocaleString()} ${updated.currency})`,
      metadata: {
        txRef: updated.txRef,
        amount: Number(updated.amount),
        currency: updated.currency,
        projectId: updated.projectId,
      },
    });

    return ok({
      id:            updated.id,
      txRef:         updated.txRef,
      status:        updated.status,
      paidAt:        updated.paidAt,
      project:       updated.project,
      user:          updated.user,
      pointsAwarded: pointsAwarded > 0 ? pointsAwarded : undefined,
    });
  } catch (err) {
    console.error("[/api/admin/payments/[id]/approve]", err);
    return serverError("Failed to approve payment.");
  }
}
