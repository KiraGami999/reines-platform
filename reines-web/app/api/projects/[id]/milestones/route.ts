import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMilestoneSchema } from "@/lib/validations";
import { notifyMilestone } from "@/lib/push";
import { revalidatePath } from "next/cache";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/:id/milestones
 *
 * Returns all timeline checkpoints (milestones) for a project.
 * CLIENT, PROJECT_MANAGER and ADMIN may read (access scoped to their own
 * project membership).
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id: userId, role } = session.user;
  const { id: projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: { id: true, clientId: true, managerId: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (role === "CLIENT"          && project.clientId  !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (role === "PROJECT_MANAGER" && project.managerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const milestones = await prisma.milestone.findMany({
      where:   { projectId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ milestones });
  } catch (err) {
    console.error("[GET /api/projects/[id]/milestones]", err);
    return NextResponse.json({ error: "Failed to load timeline." }, { status: 500 });
  }
}

/**
 * POST /api/projects/:id/milestones
 *
 * Creates a new timeline checkpoint. Only the assigned PROJECT_MANAGER or an
 * ADMIN may add checkpoints — clients only ever view the timeline.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id: userId, role } = session.user;
  if (role === "CLIENT") {
    return NextResponse.json({ error: "Only project managers may add timeline checkpoints." }, { status: 403 });
  }

  const { id: projectId } = await params;

  const body   = await req.json().catch(() => null);
  const parsed = createMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: { managerId: true, clientId: true, title: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (role === "PROJECT_MANAGER" && project.managerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // New checkpoints are appended to the end of the timeline by default.
    const lastMilestone = await prisma.milestone.findFirst({
      where:   { projectId },
      orderBy: { sortOrder: "desc" },
      select:  { sortOrder: true },
    });
    const nextSortOrder = parsed.data.sortOrder ?? (lastMilestone ? lastMilestone.sortOrder + 1 : 0);

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        title:       parsed.data.title,
        description: parsed.data.description ?? null,
        status:      parsed.data.status ?? "PENDING",
        dueDate:     parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        sortOrder:   nextSortOrder,
      },
    });

    if (project.clientId) {
      notifyMilestone({
        clientId:       project.clientId,
        projectTitle:   project.title,
        projectId,
        milestoneId:    milestone.id,
        milestoneTitle: milestone.title,
        kind:           "created",
      }).catch(console.warn);
    }

    revalidatePath(`/dashboard/projects/${projectId}`);

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/projects/[id]/milestones]", err);
    return NextResponse.json({ error: "Failed to create timeline checkpoint." }, { status: 500 });
  }
}
