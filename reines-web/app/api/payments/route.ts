import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, forbidden } from "@/lib/api-response";

/**
 * GET /api/payments
 *
 * Returns payments scoped to the authenticated user's role.
 * Clients see their own payments; admins/managers see all (or filtered by project).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return forbidden();

  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");

  try {
    const where = {
      ...(session.user.role === "CLIENT" ? { userId: session.user.id } : {}),
      ...(projectId ? { projectId } : {}),
    };

    const payments = await prisma.payment.findMany({
      where,
      include: {
        project: { select: { id: true, title: true } },
        user:    { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(payments.map((p) => ({
      id:          p.id,
      txRef:       p.txRef,
      amount:      Number(p.amount),
      currency:    p.currency,
      status:      p.status,
      description: p.description,
      paidAt:      p.paidAt,
      createdAt:   p.createdAt,
      project:     p.project,
      user:        p.user,
    })));
  } catch (err) {
    console.error("[GET /api/payments]", err);
    return ok([]);
  }
}
