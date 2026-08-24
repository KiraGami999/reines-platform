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
 * Staff (PM / admin) records cash for a project client → PENDING until admin approves.
 * Clients cannot record payments.
 */
export async function POST(req: NextRequest) {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  if (payload.role === "CLIENT") {
    return NextResponse.json({
      error: "Clients cannot record payments. Your project manager or admin will record them.",
    }, { status: 403 });
  }
  if (payload.role !== "ADMIN" && payload.role !== "PROJECT_MANAGER") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

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
      where: {
        id: projectId,
        ...(payload.role === "PROJECT_MANAGER" ? { managerId: payload.id } : {}),
      },
      select: { id: true, clientId: true },
    });
    if (!project?.clientId) {
      return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
    }

    const txRef = generateTxRef("CASH");

    const payment = await prisma.payment.create({
      data: {
        txRef, amount, currency, description,
        status: "PENDING", method: "CASH",
        receiptUrl: receiptUrl ?? null,
        projectId,
        userId: project.clientId,
        adminNotes: `Recorded via mobile by ${payload.role} (${payload.id})`,
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
