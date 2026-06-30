import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/mobile/payments/:id
 *
 * Returns a single payment with full detail including project and admin notes.
 * Clients may only access their own payments.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  const { id } = await params;

  try {
    const payment = await prisma.payment.findUnique({
      where:   { id },
      include: { project: { select: { id: true, title: true, status: true } } },
    });

    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    if (payment.userId !== payload.id)
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    return NextResponse.json({
      payment: { ...payment, amount: payment.amount.toString() },
    });
  } catch (err) {
    console.error("[GET /api/mobile/payments/:id]", err);
    return NextResponse.json({ error: "Failed to load payment." }, { status: 500 });
  }
}
