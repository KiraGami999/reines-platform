import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTxRef } from "@/lib/paychangu";
import { created, forbidden, validationError, serverError, notFound, badRequest } from "@/lib/api-response";
import { autoAwardPointsForPayment } from "@/lib/loyalty";
import { notifyPaymentApproved } from "@/lib/push";
import { recordAdminAction } from "@/lib/audit-log";
import { z } from "zod";

const schema = z.object({
  projectId:   z.string().min(1).optional(),
  clientId:    z.string().min(1).optional(),
  guestName:   z.string().min(2).max(120).optional(),
  guestEmail:  z.string().optional(),
  amount:      z.number().positive("Amount must be greater than 0"),
  currency:    z.enum(["MWK", "USD"] as const).default("MWK"),
  description: z.string().min(3, "Please describe what this payment covers"),
  receiptUrl:  z.string().optional().nullable(),
  paidAt:      z.string().optional().nullable(),
  notes:       z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.projectId) return;
  if (data.clientId) return;
  if (data.guestName?.trim()) {
    const email = data.guestEmail?.trim() ?? "";
    if (!email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required for walk-in customers",
        path: ["guestEmail"],
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid email address",
        path: ["guestEmail"],
      });
    }
    return;
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Select a project, an existing client, or enter walk-in name and email",
    path: ["projectId"],
  });
});

/**
 * POST /api/admin/payments
 * Admin issues a manual office receipt.
 * Product sales may bill an existing CLIENT account or a walk-in guest (name + email).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return forbidden("Only administrators can record manual payments.");
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const {
    projectId,
    clientId,
    guestName,
    guestEmail,
    amount,
    currency,
    description,
    receiptUrl,
    paidAt,
    notes,
  } = parsed.data;

  try {
    const project = projectId
      ? await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true, title: true, clientId: true },
        })
      : null;
    if (projectId && !project) return notFound("Project");

    const client = clientId
      ? await prisma.user.findFirst({
          where: { id: clientId, role: "CLIENT" },
          select: { id: true },
        })
      : null;
    if (clientId && !client) return notFound("Client");

    const billedClientId = project?.clientId ?? client?.id ?? null;
    const walkInName = guestName?.trim() || null;
    const walkInEmail = guestEmail?.trim().toLowerCase() || null;

    if (!billedClientId && !walkInName) {
      return badRequest("Select a project, an existing client, or enter a walk-in customer name and email.");
    }

    const txRef = generateTxRef("CASH");
    const parsedPaidAt = paidAt ? new Date(paidAt) : new Date();
    if (Number.isNaN(parsedPaidAt.getTime())) {
      return badRequest("Invalid payment date. Please pick a valid date and time.");
    }

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
        projectId:       project?.id ?? null,
        userId:          billedClientId,
        guestName:       billedClientId ? null : walkInName,
        guestEmail:      billedClientId ? null : walkInEmail,
      },
    });

    const pointsAwarded =
      payment.userId && payment.projectId
        ? await autoAwardPointsForPayment(
            payment.userId,
            payment.projectId,
            payment.id,
            Number(payment.amount),
            payment.description,
            session.user.id
          ).catch((err) => {
            console.error("[manualPayment:autoAwardPoints]", err);
            return 0;
          })
        : 0;

    if (payment.projectId && payment.userId && project) {
      notifyPaymentApproved({
        clientId:     payment.userId,
        projectTitle: project.title,
        projectId:    payment.projectId,
        paymentId:    payment.id,
        amount:       Number(payment.amount).toLocaleString(),
      }).catch((err) => {
        console.warn("[manualPayment:notifyPaymentApproved]", err);
      });
    }

    recordAdminAction({
      actor: session.user,
      action: "payment.record",
      entityType: "Payment",
      entityId: payment.id,
      summary: `Recorded manual payment ${payment.txRef} (${Number(payment.amount).toLocaleString()} ${payment.currency})`,
      metadata: {
        txRef: payment.txRef,
        amount: Number(payment.amount),
        currency: payment.currency,
        projectId: payment.projectId,
        description,
      },
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
