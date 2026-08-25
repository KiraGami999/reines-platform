import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTxRef } from "@/lib/paychangu";
import { created, forbidden, validationError, serverError } from "@/lib/api-response";
import { z } from "zod";
import { checkVerification } from "@/lib/api-guards";

const OFFLINE_METHODS = ["CASH", "BANK_TRANSFER"] as const;

const schema = z.object({
  projectId:   z.string().min(1, "Project ID is required"),
  amount:      z.number().positive("Amount must be greater than 0"),
  currency:    z.enum(["MWK", "USD"] as const).default("MWK"),
  description: z.string().min(3, "Please describe what this payment covers"),
  receiptUrl:  z.string().optional(),
  method:      z.enum(OFFLINE_METHODS).default("CASH"),
});

/**
 * POST /api/payments/cash
 * Staff (PM / admin) records an offline payment (cash or direct bank transfer)
 * for a project client. PENDING until an admin approves.
 * Clients cannot record offline payments — they use Paychangu for self-serve.
 */
export async function POST(req: NextRequest) {
  const { errorResponse, session } = await checkVerification();
  if (errorResponse) return errorResponse;

  const user = session!.user;
  if (user.role === "CLIENT") {
    return forbidden(
      "Offline payments are recorded by your project manager or at the Reines office. You can pay online via Paychangu."
    );
  }
  if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
    return forbidden("Only project managers and admins can record offline payments.");
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { projectId, amount, currency, description, receiptUrl, method } = parsed.data;
  const methodLabel = method === "BANK_TRANSFER" ? "bank transfer" : "cash";

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

    const txRef = generateTxRef(method === "BANK_TRANSFER" ? "BNK" : "CASH");

    const payment = await prisma.payment.create({
      data: {
        txRef,
        amount,
        currency,
        description,
        status:     "PENDING",
        method,
        receiptUrl: receiptUrl ?? null,
        projectId,
        userId:     project.clientId,
        adminNotes: user.role === "PROJECT_MANAGER"
          ? `Recorded ${methodLabel} by project manager (${user.email ?? user.id})`
          : `Recorded ${methodLabel} by admin (${user.email ?? user.id}) — awaiting confirmation`,
      },
    });

    return created({ txRef: payment.txRef, paymentId: payment.id, method: payment.method });
  } catch (err) {
    console.error("[/api/payments/cash]", err);
    return serverError(`Failed to record ${methodLabel} payment. Please try again.`);
  }
}
