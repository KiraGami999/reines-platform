import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSafeUploadUrl } from "@/lib/storage";
import { createGalleryUpdateSchema } from "@/lib/validations";
import { notifyGalleryUpload } from "@/lib/push";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/:id/gallery
 * Returns all ProjectUpdate records for a project.
 * Clients may only access their own projects.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const { id: userId, role } = session.user;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (role === "CLIENT"          && project.clientId  !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (role === "PROJECT_MANAGER" && project.managerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updates = await prisma.projectUpdate.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ updates });
  } catch {
    // DB not connected — return mock gallery from project mock data
    const { getMockProjectById } = await import("@/lib/mock-data");
    const mock = getMockProjectById(id, "client_001");
    return NextResponse.json({ updates: mock?.updates ?? [], _source: "mock" });
  }
}

/**
 * POST /api/projects/:id/gallery
 * Creates a new ProjectUpdate (progress note + optional image).
 * Only PROJECT_MANAGER and ADMIN may post.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id: userId, role } = session.user;
  if (role === "CLIENT") return NextResponse.json({ error: "Clients may not post updates" }, { status: 403 });

  const { id } = await params;

  const body   = await req.json().catch(() => null);
  // Validate note; additionally verify imageUrl is a safe upload path if present
  const parsed = createGalleryUpdateSchema
    .refine(
      (d) => !d.imageUrl || isSafeUploadUrl(d.imageUrl),
      { message: "Invalid image URL", path: ["imageUrl"] }
    )
    .refine(
      (d) => !d.documentUrl || isSafeUploadUrl(d.documentUrl),
      { message: "Invalid document URL", path: ["documentUrl"] }
    )
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (role === "PROJECT_MANAGER" && project.managerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const update = await prisma.projectUpdate.create({
      data: {
        projectId: id,
        note:            parsed.data.note,
        imageUrl:        parsed.data.imageUrl ?? null,
        ...(parsed.data.documentUrl
          ? {
              documentUrl:  parsed.data.documentUrl,
              documentName: parsed.data.documentName ?? null,
              documentType: parsed.data.documentType ?? null,
            }
          : {}),
        progressPercent: parsed.data.progressPercent ?? null,
      },
    });

    // Notify the client that a new progress update was posted (fire-and-forget)
    notifyGalleryUpload({
      clientId:    project.clientId,
      projectTitle: project.title,
      projectId:   id,
      updateId:    update.id,
      progressPct: update.progressPercent,
    }).catch(console.warn);

    return NextResponse.json({ update }, { status: 201 });
  } catch (err) {
    console.error("[PROJECT_GALLERY_POST]", err);
    return NextResponse.json({ error: "Could not save update. Please try again." }, { status: 500 });
  }
}
