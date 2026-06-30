import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";
import { isSafeUploadUrl } from "@/lib/storage";
import { notifyGalleryUpload } from "@/lib/push";
import { z } from "zod";

const postSchema = z.object({
  note:            z.string().min(1, "Please add a note for this update.").max(1000),
  imageUrl:        z.string().optional().nullable(),
  progressPercent: z.number().int().min(0).max(100).optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/mobile/projects/:id/gallery
 *
 * Returns all ProjectUpdate records for a project, split into:
 *   - `withImages`  — updates that have an imageUrl (shown in the photo grid)
 *   - `textOnly`    — updates without an image (shown in the updates feed)
 *
 * Ordered newest-first within each group.
 *
 * Also returns `projectTitle` so the gallery header doesn't need a second fetch.
 *
 * Access control (same as other mobile project routes):
 *   CLIENT          → clientId  === userId
 *   PROJECT_MANAGER → managerId === userId
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const token   = extractBearer(_req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  const { id: userId, role } = payload;
  const { id: projectId }    = await params;

  try {
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: { id: true, title: true, clientId: true, managerId: true },
    });

    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    if (role === "CLIENT"          && project.clientId  !== userId)
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    if (role === "PROJECT_MANAGER" && project.managerId !== userId)
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const updates = await prisma.projectUpdate.findMany({
      where:   { projectId },
      orderBy: { createdAt: "desc" },
    });

    const withImages = updates.filter((u) => !!u.imageUrl);
    const textOnly   = updates.filter((u) => !u.imageUrl);

    return NextResponse.json({
      projectTitle: project.title,
      withImages,
      textOnly,
      totalCount:  updates.length,
    });
  } catch (err) {
    console.error("[GET /api/mobile/projects/:id/gallery]", err);
    return NextResponse.json({ error: "Failed to load gallery." }, { status: 500 });
  }
}

/**
 * POST /api/mobile/projects/:id/gallery
 *
 * Creates a new progress update (note + optional image URL + optional progress %).
 * Only PROJECT_MANAGER role may post.
 * If imageUrl is provided it must have been saved via POST /api/mobile/upload
 * so isSafeUploadUrl() passes.
 * Sends a push notification to the project's client (fire-and-forget).
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  if (payload.role !== "PROJECT_MANAGER" && payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Only project managers may post updates." }, { status: 403 });
  }

  const { id: projectId } = await params;

  const body   = await req.json().catch(() => null);
  const parsed = postSchema
    .refine(
      (d) => !d.imageUrl || isSafeUploadUrl(d.imageUrl),
      { message: "Invalid image URL. Upload via /api/mobile/upload first.", path: ["imageUrl"] }
    )
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { note, imageUrl, progressPercent } = parsed.data;

  try {
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: { id: true, title: true, clientId: true, managerId: true },
    });
    if (!project)
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (payload.role === "PROJECT_MANAGER" && project.managerId !== payload.id)
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const update = await prisma.projectUpdate.create({
      data: {
        projectId,
        note,
        imageUrl:        imageUrl ?? null,
        progressPercent: progressPercent ?? null,
      },
    });

    notifyGalleryUpload({
      clientId:    project.clientId,
      projectTitle: project.title,
      projectId,
      updateId:    update.id,
      progressPct: update.progressPercent,
    }).catch(console.warn);

    return NextResponse.json({ update }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/projects/:id/gallery]", err);
    return NextResponse.json({ error: "Failed to save update. Please try again." }, { status: 500 });
  }
}
