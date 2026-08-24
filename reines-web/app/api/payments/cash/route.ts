import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTxRef } from "@/lib/paychangu";
import { created, forbidden, validationError, serverError } from "@/lib/api-response";
import { z } from "zod";
import { checkVerification } from "@/lib/api-guards";

const schema = z.object({
  projectId:   z.string().min(1, "Project ID is required"),
  amount:      z.number().positive("Amount must be greater than 0"),
  currency:    z.enum(["MWK", "USD"] as const).default("MWK"),
  description: z.string().min(3, "Please describe what this payment covers"),
  receiptUrl:  z.string().optional(),
});

/**
 * POST /api/payments/cash
 * Staff (project manager or admin) records a cash payment for a project client.
 * Creates PENDING status — admin must approve before it counts as paid.
 * Clients cannot record payments.
 */
export async function POST(req: NextRequest) {
  const { errorResponse, session } = await checkVerification();
  if (errorResponse) return errorResponse;

  const user = session!.user;
  if (user.role === "CLIENT") {
    return forbidden("Clients cannot record payments. Ask your project manager or visit the office.");
  }
  if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
    return forbidden("Only project managers and admins can record cash payments.");
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { projectId, amount, currency, description, receiptUrl } = parsed.data;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {}),
      },
      select: { id: true, clientId: true, title: true },
    });

    if (!project) return forbidden("You do not have access to this project.");
    if (!project.clientId) {
      return forbidden("This project has no assigned client to bill.");
    }

    const txRef = generateTxRef("CASH");

    const payment = await prisma.payment.create({
      data: {
        txRef,
        amount,
        currency,
        description,
        status:     "PENDING",
        method:     "CASH",
        receiptUrl: receiptUrl ?? null,
        projectId,
        // Always attribute the payment to the project client (not the staff member).
        userId:     project.clientId,
        adminNotes: user.role === "PROJECT_MANAGER"
          ? `Recorded by project manager (${user.email ?? user.id})`
          : `Recorded by admin (${user.email ?? user.id}) — awaiting confirmation`,
      },
    });

    return created({ txRef: payment.txRef, paymentId: payment.id });
  } catch (err) {
    console.error("[/api/payments/cash]", err);
    return serverError("Failed to record cash payment. Please try again.");
  }
}
