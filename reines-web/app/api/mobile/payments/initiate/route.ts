import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";
import { initiatePayment, generateTxRef } from "@/lib/paychangu";
import { z } from "zod";

const schema = z.object({
  projectId:   z.string().min(1, "Project ID is required."),
  amount:      z.number().positive("Amount must be greater than 0."),
  currency:    z.enum(["MWK", "USD"]).default("MWK"),
  description: z.string().min(3, "Please describe what this payment covers."),
});

/**
 * POST /api/mobile/payments/initiate
 *
 * Creates a pending PAYCHANGU payment record and calls the Paychangu API
 * to generate a checkout URL. Returns { txRef, checkoutUrl } so the
 * mobile app can open the URL in an in-app browser.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function POST(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  const userId = payload.id;

  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { projectId, amount, currency, description } = parsed.data;

  try {
    const project = await prisma.project.findFirst({
      where:   { id: projectId, clientId: userId },
      include: { client: { select: { name: true, email: true } } },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
    }

    const txRef = generateTxRef("REI");

    const payment = await prisma.payment.create({
      data: {
        txRef, amount, currency, description,
        status: "PENDING", method: "PAYCHANGU",
        projectId, userId,
      },
    });

    const [firstName, ...rest] = project.client.name.split(" ");
    const lastName = rest.join(" ") || firstName;

    const payRes = await initiatePayment({
      txRef, amount, currency,
      email:       project.client.email!,
      firstName,
      lastName,
      title:       `Reines – ${project.title}`,
      description,
      meta: { projectId, paymentId: payment.id, platform: "reines-mobile" },
    });

    if (payRes.status !== "success") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      return NextResponse.json({ error: "Payment gateway error. Please try again." }, { status: 502 });
    }

    const checkoutUrl = payRes.data.checkout_url;
    await prisma.payment.update({ where: { id: payment.id }, data: { checkoutUrl } });

    return NextResponse.json({ txRef, checkoutUrl, paymentId: payment.id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("PAYCHANGU_SECRET_KEY")) {
      return NextResponse.json({
        error: "Paychangu is not configured. Add PAYCHANGU_SECRET_KEY to your .env file.",
      }, { status: 503 });
    }
    console.error("[POST /api/mobile/payments/initiate]", err);
    return NextResponse.json({ error: "Failed to initiate payment." }, { status: 500 });
  }
}
