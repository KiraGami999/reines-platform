import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";

/**
 * GET /api/mobile/payments
 *
 * Returns all payments for the authenticated client, ordered newest-first.
 * Each payment includes the associated project title for display purposes.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function GET(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  const userId = payload.id;

  try {
    const payments = await prisma.payment.findMany({
      where:   { userId },
      include: { project: { select: { id: true, title: true, status: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      payments: payments.map((p) => ({
        ...p,
        amount: p.amount.toString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/mobile/payments]", err);
    return NextResponse.json({ error: "Failed to load payments." }, { status: 500 });
  }
}
