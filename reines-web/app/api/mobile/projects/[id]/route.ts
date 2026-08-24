import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStorageUrl } from "@/lib/storage";
import { checkMobileVerification } from "@/lib/api-guards";

/**
 * GET /api/mobile/projects/:id
 *
 * Returns full project detail for the mobile app:
 *   - Core project fields
 *   - Assigned manager info
 *   - All progress updates (used as the project timeline / milestone feed)
 *   - Payment summary: total budget, total paid, total pending
 *
 * Access control:
 *   CLIENT → may only access projects where clientId === userId
 *   PROJECT_MANAGER → may only access projects where managerId === userId
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse, payload } = await checkMobileVerification(req);
  if (errorResponse) return errorResponse;

  const { id: userId, role } = payload!;
  const { id } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true, image: true } },
        client:  { select: { id: true, name: true, email: true, image: true } },
        updates: { orderBy: { createdAt: "desc" } },
        payments: {
          select: { id: true, amount: true, status: true, currency: true,
                    method: true, description: true, paidAt: true, createdAt: true, txRef: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Scope enforcement
    if (role === "CLIENT" && project.clientId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (role === "PROJECT_MANAGER" && project.managerId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // Payment summary aggregates
    const paidTotal = project.payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingTotal = project.payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const latestProgress = project.updates[0]?.progressPercent ?? null;

    // Resolve stored media paths (private blobs → /api/media proxy) so the
    // mobile client can load images/documents with its bearer token.
    const updates = project.updates.map((u) => ({
      ...u,
      imageUrl:    resolveStorageUrl(u.imageUrl),
      documentUrl: resolveStorageUrl(u.documentUrl),
    }));

    return NextResponse.json({
      project: {
        ...project,
        updates,
        budget: project.budget?.toString() ?? null,
        paymentSummary: {
          totalBudget:   project.budget?.toString() ?? null,
          paidTotal:     paidTotal.toString(),
          pendingTotal:  pendingTotal.toString(),
          paymentCount:  project.payments.length,
        },
        latestProgress,
      },
    });
  } catch (err) {
    console.error("[GET /api/mobile/projects/:id]", err);
    return NextResponse.json({ error: "Failed to load project." }, { status: 500 });
  }
}
