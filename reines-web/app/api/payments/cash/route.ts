import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTxRef } from "@/lib/paychangu";
import { created, forbidden, validationError, serverError } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  projectId:   z.string().min(1, "Project ID is required"),
  amount:      z.number().positive("Amount must be greater than 0"),
  currency:    z.enum(["MWK", "USD"] as const).default("MWK"),
  description: z.string().min(3, "Please describe what this payment covers"),
  receiptUrl:  z.string().optional(),
});

/**
 * POST /api/payments/cash
 * Creates a PENDING cash payment record that requires admin approval.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return forbidden("Authentication required.");

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { projectId, amount, currency, description, receiptUrl } = parsed.data;
  const user = session.user;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(user.role === "CLIENT"          ? { clientId: user.id }  : {}),
        ...(user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {}),
      },
    });

    if (!project) return forbidden("You do not have access to this project.");

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
        userId:     user.id!,
      },
    });

    return created({ txRef: payment.txRef, paymentId: payment.id });
  } catch (err) {
    console.error("[/api/payments/cash]", err);
    return serverError("Failed to record cash payment. Please try again.");
  }
}
