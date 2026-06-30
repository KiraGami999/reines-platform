import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";
import { generateTxRef } from "@/lib/paychangu";
import { z } from "zod";

const schema = z.object({
  projectId:   z.string().min(1, "Project ID is required."),
  amount:      z.number().positive("Amount must be greater than 0."),
  currency:    z.enum(["MWK", "USD"]).default("MWK"),
  description: z.string().min(3, "Please describe what this payment covers."),
  receiptUrl:  z.string().url("Invalid receipt URL.").optional(),
});

/**
 * POST /api/mobile/payments/cash
 *
 * Creates a PENDING cash payment record that requires admin approval.
 * The optional receiptUrl is a URL to an uploaded image of the payment slip.
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

  const { projectId, amount, currency, description, receiptUrl } = parsed.data;

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, clientId: userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
    }

    const txRef = generateTxRef("CASH");

    const payment = await prisma.payment.create({
      data: {
        txRef, amount, currency, description,
        status: "PENDING", method: "CASH",
        receiptUrl: receiptUrl ?? null,
        projectId, userId,
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      txRef:     payment.txRef,
      status:    payment.status,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/payments/cash]", err);
    return NextResponse.json({ error: "Failed to record cash payment." }, { status: 500 });
  }
}
