import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";

/**
 * GET /api/mobile/projects
 *
 * Returns all projects scoped to the authenticated user's role:
 *   CLIENT          → own projects only
 *   PROJECT_MANAGER → projects they manage
 *
 * Each project includes manager info, the latest update (for progress %),
 * and the count of updates and payments.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function GET(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  const { id: userId, role } = payload;

  try {
    const where =
      role === "CLIENT"          ? { clientId:  userId } :
      role === "PROJECT_MANAGER" ? { managerId: userId } :
      {};

    const projects = await prisma.project.findMany({
      where,
      include: {
        manager: { select: { id: true, name: true, email: true, image: true } },
        client:  { select: { id: true, name: true, email: true, image: true } },
        updates: {
          orderBy: { createdAt: "desc" },
          take:    1,
          select:  { id: true, progressPercent: true, createdAt: true, note: true },
        },
        _count: {
          select: { updates: true, payments: true, messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (err) {
    console.error("[GET /api/mobile/projects]", err);
    return NextResponse.json({ error: "Failed to load projects." }, { status: 500 });
  }
}
