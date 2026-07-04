import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSafeUploadUrl } from "@/lib/storage";
import { createGalleryBatchSchema } from "@/lib/validations";
import { notifyGalleryUpload } from "@/lib/push";
import { revalidatePath } from "next/cache";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/:id/gallery/batch
 * Creates multiple ProjectUpdate rows sharing one batchId and progress value.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id: userId, role } = session.user;
  if (role === "CLIENT") return NextResponse.json({ error: "Clients may not post updates" }, { status: 403 });

  const { id } = await params;
  const body   = await req.json().catch(() => null);
  const parsed = createGalleryBatchSchema
    .superRefine((data, ctx) => {
      data.items.forEach((item, index) => {
        if (item.imageUrl && !isSafeUploadUrl(item.imageUrl)) {
          ctx.addIssue({ code: "custom", message: "Invalid image URL", path: ["items", index, "imageUrl"] });
        }
        if (item.documentUrl && !isSafeUploadUrl(item.documentUrl)) {
          ctx.addIssue({ code: "custom", message: "Invalid document URL", path: ["items", index, "documentUrl"] });
        }
        if (!item.imageUrl && !item.documentUrl) {
          ctx.addIssue({
            code: "custom",
            message: "Each item must include a photo or document",
            path: ["items", index],
          });
        }
      });
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (role === "PROJECT_MANAGER" && project.managerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const batchId = randomUUID();
    const { progressPercent, items } = parsed.data;

    const updates = await prisma.$transaction(
      items.map((item) =>
        prisma.projectUpdate.create({
          data: {
            projectId: id,
            batchId,
            note: item.note,
            imageUrl: item.imageUrl ?? null,
            documentUrl: item.documentUrl ?? null,
            documentName: item.documentName ?? null,
            documentType: item.documentType ?? null,
            progressPercent: progressPercent ?? null,
          },
        })
      )
    );

    notifyGalleryUpload({
      clientId:     project.clientId,
      projectTitle: project.title,
      projectId:    id,
      updateId:     updates[0].id,
      progressPct:  progressPercent ?? null,
    }).catch(console.warn);

    revalidatePath(`/dashboard/projects/${id}/gallery`);
    revalidatePath(`/dashboard/projects/${id}`);
    revalidatePath("/dashboard/gallery");

    return NextResponse.json({ batchId, updates }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/projects/[id]/gallery/batch]", err);
    return NextResponse.json({ error: "Could not save batch update. Please try again." }, { status: 500 });
  }
}
