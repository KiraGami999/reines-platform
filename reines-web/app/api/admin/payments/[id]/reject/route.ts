import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, forbidden, notFound, serverError, badRequest } from "@/lib/api-response";
import { notifyPaymentRejected } from "@/lib/push";
import { z } from "zod";

const schema = z.object({
  notes: z.string().min(1, "Please provide a reason for rejection."),
});

/**
 * PATCH /api/admin/payments/[id]/reject
 * Admin rejects a pending cash payment, setting status to FAILED.
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
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");

  try {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return notFound("Payment");
    if (payment.method !== "CASH") return badRequest("Only cash payments can be manually rejected.");
    if (payment.status !== "PENDING") return badRequest("Only pending payments can be rejected.");

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status:          "FAILED",
        adminApprovedBy: session.user.id,
        adminApprovedAt: new Date(),
        adminNotes:      parsed.data.notes,
      },
      include: {
        project: { select: { id: true, title: true } },
        user:    { select: { id: true, name: true, email: true } },
      },
    });

    // Notify the client (fire-and-forget)
    notifyPaymentRejected({
      clientId:     updated.userId,
      projectTitle: updated.project.title,
      projectId:    updated.projectId,
      paymentId:    updated.id,
      reason:       parsed.data.notes,
    }).catch(console.warn);

    return ok({
      id:      updated.id,
      txRef:   updated.txRef,
      status:  updated.status,
      project: updated.project,
      user:    updated.user,
    });
  } catch (err) {
    console.error("[/api/admin/payments/[id]/reject]", err);
    return serverError("Failed to reject payment.");
  }
}
