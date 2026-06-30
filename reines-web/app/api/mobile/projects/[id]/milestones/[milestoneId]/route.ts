import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string; milestoneId: string }> };

const updateSchema = z.object({
  title:       z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  status:      z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  dueDate:     z.string().datetime({ offset: true }).optional().nullable(),
  sortOrder:   z.number().int().min(0).optional(),
});

/**
 * PATCH /api/mobile/projects/:id/milestones/:milestoneId
 *
 * Updates one or more fields on a milestone.
 * When status is set to COMPLETED, completedAt is auto-set to now.
 * When status is changed away from COMPLETED, completedAt is cleared.
 * PROJECT_MANAGER only.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  if (payload.role !== "PROJECT_MANAGER" && payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Only project managers may update milestones." }, { status: 403 });
  }

  const { id: projectId, milestoneId } = await params;

  const body   = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const milestone = await prisma.milestone.findUnique({
      where:  { id: milestoneId },
      select: { id: true, projectId: true, project: { select: { managerId: true } } },
    });
    if (!milestone || milestone.projectId !== projectId)
      return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
    if (payload.role === "PROJECT_MANAGER" && milestone.project.managerId !== payload.id)
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { status, ...rest } = parsed.data;

    const completedAt =
      status === "COMPLETED"     ? new Date()     :
      status !== undefined       ? null           :
      undefined;

    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data:  {
        ...rest,
        ...(status      !== undefined && { status }),
        ...(completedAt !== undefined && { completedAt }),
        ...(rest.dueDate !== undefined && {
          dueDate: rest.dueDate ? new Date(rest.dueDate as string) : null,
        }),
      },
    });

    return NextResponse.json({
      milestone: {
        ...updated,
        dueDate:     updated.dueDate     ? updated.dueDate.toISOString()     : null,
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
        createdAt:   updated.createdAt.toISOString(),
        updatedAt:   updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[PATCH /api/mobile/projects/:id/milestones/:milestoneId]", err);
    return NextResponse.json({ error: "Failed to update milestone." }, { status: 500 });
  }
}

/**
 * DELETE /api/mobile/projects/:id/milestones/:milestoneId
 *
 * Permanently removes a milestone.
 * PROJECT_MANAGER only.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  if (payload.role !== "PROJECT_MANAGER" && payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Only project managers may delete milestones." }, { status: 403 });
  }

  const { id: projectId, milestoneId } = await params;

  try {
    const milestone = await prisma.milestone.findUnique({
      where:  { id: milestoneId },
      select: { id: true, projectId: true, project: { select: { managerId: true } } },
    });
    if (!milestone || milestone.projectId !== projectId)
      return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
    if (payload.role === "PROJECT_MANAGER" && milestone.project.managerId !== payload.id)
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    await prisma.milestone.delete({ where: { id: milestoneId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/mobile/projects/:id/milestones/:milestoneId]", err);
    return NextResponse.json({ error: "Failed to delete milestone." }, { status: 500 });
  }
}
