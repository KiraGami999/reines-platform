import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMilestoneSchema } from "@/lib/validations";
import { notifyMilestone } from "@/lib/push";
import { revalidatePath } from "next/cache";

type RouteContext = { params: Promise<{ id: string; milestoneId: string }> };

/**
 * PATCH /api/projects/:id/milestones/:milestoneId
 *
 * Updates one or more fields on a timeline checkpoint. Setting status to
 * COMPLETED auto-stamps completedAt; moving away from COMPLETED clears it.
 * Only the assigned PROJECT_MANAGER or an ADMIN may edit.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id: userId, role } = session.user;
  if (role === "CLIENT") {
    return NextResponse.json({ error: "Only project managers may update timeline checkpoints." }, { status: 403 });
  }

  const { id: projectId, milestoneId } = await params;

  const body   = await req.json().catch(() => null);
  const parsed = updateMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const milestone = await prisma.milestone.findUnique({
      where:  { id: milestoneId },
      select: {
        id: true,
        status: true,
        projectId: true,
        project: { select: { managerId: true, clientId: true, title: true } },
      },
    });
    if (!milestone || milestone.projectId !== projectId) {
      return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
    }
    if (role === "PROJECT_MANAGER" && milestone.project.managerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, dueDate, ...rest } = parsed.data;

    const completedAt =
      status === "COMPLETED" ? new Date() :
      status !== undefined   ? null       :
      undefined;

    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...rest,
        ...(status      !== undefined && { status }),
        ...(completedAt !== undefined && { completedAt }),
        ...(dueDate      !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    if (status !== undefined && status !== milestone.status && milestone.project.clientId) {
      notifyMilestone({
        clientId:       milestone.project.clientId,
        projectTitle:   milestone.project.title,
        projectId,
        milestoneId:    updated.id,
        milestoneTitle: updated.title,
        kind:           "status",
        newStatus:      status,
      }).catch(console.warn);
    }

    revalidatePath(`/dashboard/projects/${projectId}`);

    return NextResponse.json({ milestone: updated });
  } catch (err) {
    console.error("[PATCH /api/projects/[id]/milestones/[milestoneId]]", err);
    return NextResponse.json({ error: "Failed to update timeline checkpoint." }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/:id/milestones/:milestoneId
 *
 * Permanently removes a timeline checkpoint.
 * Only the assigned PROJECT_MANAGER or an ADMIN may delete.
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id: userId, role } = session.user;
  if (role === "CLIENT") {
    return NextResponse.json({ error: "Only project managers may delete timeline checkpoints." }, { status: 403 });
  }

  const { id: projectId, milestoneId } = await params;

  try {
    const milestone = await prisma.milestone.findUnique({
      where:  { id: milestoneId },
      select: { id: true, projectId: true, project: { select: { managerId: true } } },
    });
    if (!milestone || milestone.projectId !== projectId) {
      return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
    }
    if (role === "PROJECT_MANAGER" && milestone.project.managerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.milestone.delete({ where: { id: milestoneId } });

    revalidatePath(`/dashboard/projects/${projectId}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/projects/[id]/milestones/[milestoneId]]", err);
    return NextResponse.json({ error: "Failed to delete timeline checkpoint." }, { status: 500 });
  }
}
