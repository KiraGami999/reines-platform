import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const createSchema = z.object({
  title:       z.string().min(2, "Title must be at least 2 characters.").max(200),
  description: z.string().max(1000).optional().nullable(),
  dueDate:     z.string().datetime({ offset: true }).optional().nullable(),
  sortOrder:   z.number().int().min(0).default(0),
});

/**
 * GET /api/mobile/projects/:id/milestones
 *
 * Returns all milestones for a project with a summary of completion stats.
 * Both CLIENT and PROJECT_MANAGER may read (access-controlled by project membership).
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  const { id: projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: { id: true, title: true, clientId: true, managerId: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    if (payload.role === "CLIENT"          && project.clientId  !== payload.id)
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    if (payload.role === "PROJECT_MANAGER" && project.managerId !== payload.id)
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const milestones = await prisma.milestone.findMany({
      where:   { projectId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const total     = milestones.length;
    const completed = milestones.filter((m) => m.status === "COMPLETED").length;
    const inProgress= milestones.filter((m) => m.status === "IN_PROGRESS").length;
    const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      projectTitle: project.title,
      milestones:   milestones.map((m) => ({
        ...m,
        dueDate:     m.dueDate     ? m.dueDate.toISOString()     : null,
        completedAt: m.completedAt ? m.completedAt.toISOString() : null,
        createdAt:   m.createdAt.toISOString(),
        updatedAt:   m.updatedAt.toISOString(),
      })),
      summary: { total, completed, inProgress, progressPct },
    });
  } catch (err) {
    console.error("[GET /api/mobile/projects/:id/milestones]", err);
    return NextResponse.json({ error: "Failed to load milestones." }, { status: 500 });
  }
}

/**
 * POST /api/mobile/projects/:id/milestones
 *
 * Creates a new milestone for the project.
 * PROJECT_MANAGER only (must be assigned to this project).
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  if (payload.role !== "PROJECT_MANAGER" && payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Only project managers may create milestones." }, { status: 403 });
  }

  const { id: projectId } = await params;

  const body   = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: { managerId: true },
    });
    if (!project)
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (payload.role === "PROJECT_MANAGER" && project.managerId !== payload.id)
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        title:       parsed.data.title,
        description: parsed.data.description ?? null,
        dueDate:     parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        sortOrder:   parsed.data.sortOrder,
      },
    });

    return NextResponse.json({
      milestone: {
        ...milestone,
        dueDate:     milestone.dueDate     ? milestone.dueDate.toISOString()     : null,
        completedAt: milestone.completedAt ? milestone.completedAt.toISOString() : null,
        createdAt:   milestone.createdAt.toISOString(),
        updatedAt:   milestone.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/projects/:id/milestones]", err);
    return NextResponse.json({ error: "Failed to create milestone." }, { status: 500 });
  }
}
