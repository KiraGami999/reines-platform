import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { initiatePayment, generateTxRef } from "@/lib/paychangu";
import { created, forbidden, badRequest, serverError, validationError } from "@/lib/api-response";
import { z } from "zod";
import { checkVerification } from "@/lib/api-guards";

const schema = z.object({
  projectId:   z.string().min(1, "Project ID is required"),
  amount:      z.number().positive("Amount must be greater than 0"),
  currency:    z.enum(["MWK", "USD"] as const).default("MWK"),
  description: z.string().min(3, "Please describe what this payment covers"),
});

/**
 * POST /api/payments/initiate
 * Create a Paychangu checkout session.
 * - CLIENT: own projects only (billed to themselves)
 * - PROJECT_MANAGER / ADMIN: managed / any project (billed to the project client)
 */
export async function POST(req: NextRequest) {
  const { errorResponse, session } = await checkVerification();
  if (errorResponse) return errorResponse;

  const user = session!.user;
  const isClient = user.role === "CLIENT";
  const isStaff  = user.role === "ADMIN" || user.role === "PROJECT_MANAGER";

  if (!isClient && !isStaff) {
    return forbidden("You do not have permission to initiate payments.");
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { projectId, amount, currency, description } = parsed.data;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(isClient
          ? { clientId: user.id }
          : user.role === "PROJECT_MANAGER"
            ? { managerId: user.id }
            : {}),
      },
      include: { client: { select: { id: true, name: true, email: true } } },
    });

    if (!project) return forbidden("You do not have access to this project.");

    const billingUser = isClient
      ? { id: user.id, email: user.email, name: user.name }
      : project.client
        ? { id: project.client.id, email: project.client.email, name: project.client.name }
        : null;

    if (!billingUser?.email) {
      return badRequest("A valid email address is required for checkout.");
    }

    const txRef = generateTxRef("REI");
    const [firstName, ...rest] = billingUser.name.split(" ");
    const lastName = rest.join(" ") || firstName;

    const payment = await prisma.payment.create({
      data: {
        txRef,
        amount,
        currency,
        description,
        status: "PENDING",
        method: "PAYCHANGU",
        projectId,
        userId: billingUser.id,
      },
    });

    const payRes = await initiatePayment({
      txRef,
      amount,
      currency,
      email:       billingUser.email,
      firstName,
      lastName,
      title:       `Reines – ${project.title}`,
      description,
      meta: {
        projectId,
        paymentId: payment.id,
        platform:  "reines-portal",
      },
    });

    if (payRes.status !== "success") {
      await prisma.payment.update({
        where: { id: payment.id },
        data:  { status: "FAILED" },
      });
      return serverError("Paychangu did not return a checkout URL. Please try again.");
    }

    const checkoutUrl = payRes.data.checkout_url;

    await prisma.payment.update({
      where: { id: payment.id },
      data:  { checkoutUrl },
    });

    return created({ txRef, checkoutUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";

    if (msg.includes("PAYCHANGU_SECRET_KEY")) {
      return badRequest(
        "Paychangu is not yet configured. Please add your PAYCHANGU_SECRET_KEY to the .env file. " +
        "Get your keys at: https://in.paychangu.com/user/api"
      );
    }

    console.error("[/api/payments/initiate]", err);
    return serverError("Failed to create payment session. Please try again.");
  }
}
