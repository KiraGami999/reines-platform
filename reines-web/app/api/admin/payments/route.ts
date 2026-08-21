import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTxRef } from "@/lib/paychangu";
import { created, forbidden, validationError, serverError, notFound } from "@/lib/api-response";
import { autoAwardPointsForPayment } from "@/lib/loyalty";
import { notifyPaymentApproved } from "@/lib/push";
import { z } from "zod";

const schema = z.object({
  projectId:   z.string().min(1, "Project is required"),
  amount:      z.number().positive("Amount must be greater than 0"),
  currency:    z.enum(["MWK", "USD"] as const).default("MWK"),
  description: z.string().min(3, "Please describe what this payment covers"),
  receiptUrl:  z.string().optional().nullable(),
  paidAt:      z.string().optional().nullable(),
  notes:       z.string().optional().nullable(),
});

/**
 * POST /api/admin/payments
 * Allows an admin to issue/record a manual payment (e.g. client paid in cash at the office).
 * This payment is created with SUCCESS status immediately and awards loyalty points.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return forbidden("Only administrators can record manual payments.");
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { projectId, amount, currency, description, receiptUrl, paidAt, notes } = parsed.data;

  try {
    // Verify the project exists and resolve client details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, clientId: true },
    });

    if (!project) return notFound("Project");

    const txRef = generateTxRef("CASH");
    const parsedPaidAt = paidAt ? new Date(paidAt) : new Date();

    // Create the successful payment record
    const payment = await prisma.payment.create({
      data: {
        txRef,
        amount,
        currency,
        status:          "SUCCESS",
        method:          "CASH",
        description,
        receiptUrl:      receiptUrl || null,
        paidAt:          parsedPaidAt,
        adminApprovedBy: session.user.id,
        adminApprovedAt: new Date(),
        adminNotes:      notes || "Manually recorded cash payment at office",
        projectId,
        userId:          project.clientId, // Assigned to the client of the project
      },
    });

    // Award loyalty points to the client
    const pointsAwarded = await autoAwardPointsForPayment(
      payment.userId,
      payment.projectId,
      payment.id,
      Number(payment.amount),
      payment.description,
      session.user.id
    ).catch((err) => {
      console.error("[manualPayment:autoAwardPoints]", err);
      return 0;
    });

    // Notify the client of payment approval
    notifyPaymentApproved({
      clientId:     payment.userId,
      projectTitle: project.title,
      projectId:    payment.projectId,
      paymentId:    payment.id,
      amount:       Number(payment.amount).toLocaleString(),
    }).catch((err) => {
      console.warn("[manualPayment:notifyPaymentApproved]", err);
    });

    return created({
      id:            payment.id,
      txRef:         payment.txRef,
      pointsAwarded: pointsAwarded > 0 ? pointsAwarded : undefined,
    });
  } catch (err) {
    console.error("[/api/admin/payments POST]", err);
    return serverError("Failed to record manual payment. Please try again.");
  }
}
