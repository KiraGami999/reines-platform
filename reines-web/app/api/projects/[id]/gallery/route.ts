import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSafeUploadUrl } from "@/lib/storage";
import { createGalleryUpdateSchema } from "@/lib/validations";
import { notifyGalleryUpload } from "@/lib/push";
import { revalidatePath } from "next/cache";

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
  } catch (err) {
    console.error("[GET /api/projects/[id]/gallery]", err);
    return NextResponse.json({ error: "Failed to load gallery updates." }, { status: 500 });
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
  // Validate note; additionally verify imageUrl / documentUrl / each batch file URL is a safe upload path
  const parsed = createGalleryUpdateSchema
    .refine(
      (d) => !d.imageUrl || isSafeUploadUrl(d.imageUrl),
      { message: "Invalid image URL", path: ["imageUrl"] }
    )
    .refine(
      (d) => !d.documentUrl || isSafeUploadUrl(d.documentUrl),
      { message: "Invalid document URL", path: ["documentUrl"] }
    )
    .refine(
      (d) => !d.files || d.files.every((f) => isSafeUploadUrl(f.url)),
      { message: "One or more file URLs are invalid", path: ["files"] }
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

    const hasBatchFiles = Boolean(parsed.data.files && parsed.data.files.length > 0);

    // Build the create payload with an explicit Prisma type so the conditional
    // fields don't get inferred into a fragile union (which broke the Vercel build).
    const data: Prisma.ProjectUpdateUncheckedCreateInput = {
      projectId:       id,
      note:            parsed.data.note,
      progressPercent: parsed.data.progressPercent ?? null,
    };

    if (hasBatchFiles) {
      // Prisma's Json? field only accepts InputJsonValue (never plain `null`);
      // the array is guaranteed non-null here.
      data.files = parsed.data.files as Prisma.InputJsonValue;
    } else {
      // Legacy single-file mode — keep old fields for backward compat.
      data.imageUrl = parsed.data.imageUrl ?? null;
      if (parsed.data.documentUrl) {
        data.documentUrl  = parsed.data.documentUrl;
        data.documentName = parsed.data.documentName ?? null;
        data.documentType = parsed.data.documentType ?? null;
      }
    }

    const update = await prisma.projectUpdate.create({ data });

    // Notify the client that a new progress update was posted (fire-and-forget)
    notifyGalleryUpload({
      clientId:    project.clientId,
      projectTitle: project.title,
      projectId:   id,
      updateId:    update.id,
      progressPct: update.progressPercent,
    }).catch(console.warn);

    // Bust the cache so the gallery page and project detail page reflect
    // the new update immediately (for both the uploader and the client).
    revalidatePath(`/dashboard/projects/${id}/gallery`);
    revalidatePath(`/dashboard/projects/${id}`);
    revalidatePath("/dashboard/gallery");

    return NextResponse.json({ update }, { status: 201 });
  } catch (err) {
    console.error("[PROJECT_GALLERY_POST]", err);
    return NextResponse.json({ error: "Could not save update. Please try again." }, { status: 500 });
  }
}
