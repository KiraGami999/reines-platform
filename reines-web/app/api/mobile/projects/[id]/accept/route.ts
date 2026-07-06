import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/mobile/projects/:id/accept
 *
 * Marks a project assignment as accepted by the assigned project manager.
 * Mirrors the web route but uses Bearer JWT auth.
 */
export async function PATCH(_req: NextRequest, { params }: RouteContext) {
  const token = extractBearer(_req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  if (payload.role !== "PROJECT_MANAGER") {
    return NextResponse.json({ error: "Only project managers can accept assignments." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const project = await prisma.project.findFirst({
      where: { id, managerId: payload.id },
      select: { id: true, managerAccepted: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (project.managerAccepted) {
      return NextResponse.json({
        id:                project.id,
        managerAccepted:   true,
        managerAcceptedAt: null,
        alreadyAccepted:   true,
      });
    }

    const acceptedProject = await prisma.project.update({
      where: { id },
      data: {
        managerAccepted:   true,
        managerAcceptedAt: new Date(),
      },
      select: {
        id:                true,
        managerAccepted:   true,
        managerAcceptedAt: true,
      },
    });

    return NextResponse.json({
      id:                acceptedProject.id,
      managerAccepted:   acceptedProject.managerAccepted,
      managerAcceptedAt: acceptedProject.managerAcceptedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("[PATCH /api/mobile/projects/:id/accept]", err);
    return NextResponse.json({ error: "Failed to accept project. Please try again." }, { status: 500 });
  }
}
