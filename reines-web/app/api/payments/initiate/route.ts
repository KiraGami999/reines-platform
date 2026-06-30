import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initiatePayment, generateTxRef } from "@/lib/paychangu";
import { created, forbidden, badRequest, serverError, validationError } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  projectId:   z.string().min(1, "Project ID is required"),
  amount:      z.number().positive("Amount must be greater than 0"),
  currency:    z.enum(["MWK", "USD"] as const).default("MWK"),
  description: z.string().min(3, "Please describe what this payment covers"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return forbidden("Authentication required.");

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { projectId, amount, currency, description } = parsed.data;
  const user = session.user;

  // Verify the user has access to this project
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(user.role === "CLIENT"          ? { clientId: user.id }  : {}),
        ...(user.role === "PROJECT_MANAGER" ? { managerId: user.id } : {}),
      },
      include: { client: { select: { name: true, email: true } } },
    });

    if (!project) return forbidden("You do not have access to this project.");

    const txRef = generateTxRef("REI");
    const billingUser = user.role === "CLIENT"
      ? { email: user.email!, name: user.name! }
      : { email: project.client.email!, name: project.client.name! };

    const [firstName, ...rest] = billingUser.name.split(" ");
    const lastName = rest.join(" ") || firstName;

    // Create a pending payment record before calling Paychangu
    const payment = await prisma.payment.create({
      data: {
        txRef,
        amount,
        currency,
        description,
        status:    "PENDING",
        projectId,
        userId:    user.id!,
      },
    });

    // Call Paychangu API
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
      // Mark payment as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data:  { status: "FAILED" },
      });
      return serverError("Paychangu did not return a checkout URL. Please try again.");
    }

    const checkoutUrl = payRes.data.checkout_url;

    // Save the checkout URL on the payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data:  { checkoutUrl },
    });

    return created({ txRef, checkoutUrl });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";

    // If the error is a config issue (no API key) return a friendly message
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
