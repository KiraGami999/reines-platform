import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AVAILABLE_PUBLIC_PROJECT_IMAGES,
  FALLBACK_PUBLIC_PROJECTS,
  MAX_PUBLIC_PROJECT_IMAGES,
  PUBLIC_PROJECT_STATUS_OPTIONS,
  getPublicProjectCoverImage,
  normalizePublicProjectImages,
  type PublicProjectItem,
} from "@/lib/public-projects";
import { forbidden, ok, serverError } from "@/lib/api-response";
import { isVercelBlobUrl } from "@/lib/storage";

const statusValues = PUBLIC_PROJECT_STATUS_OPTIONS.map((status) => status.value) as [
  PublicProjectItem["status"],
  ...PublicProjectItem["status"][],
];

const presetImageUrls = new Set(AVAILABLE_PUBLIC_PROJECT_IMAGES.map((image) => image.imageUrl));

function isValidProjectImageUrl(url: string): boolean {
  return presetImageUrls.has(url) || isVercelBlobUrl(url);
}

const publicProjectSchema = z.object({
  // Real DB cuid for existing rows, or a client-generated "draft-…" id for
  // new/duplicated projects that have never been saved. Used to upsert
  // in place instead of wiping and recreating every project on every save.
  id: z.string().optional(),
  title: z.string().trim().min(3, "Project title must be at least 3 characters").max(100),
  location: z.string().trim().min(2, "Add a project location").max(100),
  type: z.string().trim().min(3, "Add a project type").max(80),
  status: z.enum(statusValues),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(700),
  year: z.string().trim().min(4, "Add a year or date range").max(30),
  imageUrls: z
    .array(z.string().refine(isValidProjectImageUrl, "Each image must be a valid preset or uploaded URL"))
    .min(1, "Add at least one project image")
    .max(MAX_PUBLIC_PROJECT_IMAGES, `A project can have up to ${MAX_PUBLIC_PROJECT_IMAGES} images`),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100),
});

const updateSchema = z.object({
  projects: z.array(publicProjectSchema).min(1, "Add at least one public project").max(30, "Keep the public project page focused"),
});

/**
 * Builds a specific, human-readable error message from a ZodError so admins
 * (and we, when debugging) can immediately see WHICH project/field failed,
 * instead of a generic "Validation failed" that hides real problems (like an
 * image URL that didn't pass the upload allow-list check).
 */
function describeValidationError(err: z.ZodError, projects: unknown): string {
  const first = err.issues[0];
  if (!first) return "Validation failed.";

  const [, indexPart, fieldPart] = first.path;
  if (typeof indexPart === "number" && Array.isArray(projects)) {
    const projectTitle = (projects[indexPart] as { title?: string } | undefined)?.title;
    const label = projectTitle ? `"${projectTitle}"` : `#${indexPart + 1}`;
    const field = fieldPart ? ` (${String(fieldPart)})` : "";
    return `Project ${label}${field}: ${first.message}`;
  }

  return first.message;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

function serializeProject(project: {
  id: string;
  title: string;
  location: string;
  type: string;
  status: string;
  description: string;
  year: string;
  imageUrl: string;
  imageUrls: string[];
  active: boolean;
  sortOrder: number;
}) {
  const imageUrls = normalizePublicProjectImages(project);
  const cover = getPublicProjectCoverImage({ imageUrl: project.imageUrl, imageUrls });

  return {
    id: project.id,
    title: project.title,
    location: project.location,
    type: project.type,
    status: project.status,
    description: project.description,
    year: project.year,
    imageUrl: cover,
    imageUrls,
    active: project.active,
    sortOrder: project.sortOrder,
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const projects = await prisma.publicProject.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return ok({
      availableImages: AVAILABLE_PUBLIC_PROJECT_IMAGES,
      projects: projects.length > 0 ? projects.map(serializeProject) : FALLBACK_PUBLIC_PROJECTS,
      usingFallback: projects.length === 0,
    });
  } catch {
    return ok({
      availableImages: AVAILABLE_PUBLIC_PROJECT_IMAGES,
      projects: FALLBACK_PUBLIC_PROJECTS,
      usingFallback: true,
    });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const message = describeValidationError(parsed.error, (body as { projects?: unknown })?.projects);
    console.warn("[PUT /api/admin/public-projects] validation failed:", message, parsed.error.flatten());
    return NextResponse.json(
      { error: message, issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const existing = await prisma.publicProject.findMany({ select: { id: true } });
    const existingIds = new Set(existing.map((p) => p.id));
    const incomingIds = new Set(
      parsed.data.projects.map((p) => p.id).filter((id): id is string => !!id && existingIds.has(id))
    );
    const idsToDelete = existing.map((p) => p.id).filter((id) => !incomingIds.has(id));

    // Upsert in place (by id) instead of delete-all + recreate. This keeps
    // stable ids across saves (so the admin's selection doesn't jump to a
    // different project) and means one project's data never gets dropped
    // just because it happens to share a save request with another one.
    const writes = parsed.data.projects.map((project, sortOrder) => {
      const imageUrls = project.imageUrls;
      const cover = imageUrls[0];

      const data = {
        title:       project.title,
        location:    project.location,
        type:        project.type,
        status:      project.status,
        description: project.description,
        year:        project.year,
        imageUrl:    cover,
        imageUrls,
        active:      project.active,
        sortOrder,
      };

      const isExisting = project.id && existingIds.has(project.id);
      return isExisting
        ? prisma.publicProject.update({ where: { id: project.id }, data })
        : prisma.publicProject.create({ data });
    });

    await prisma.$transaction([
      ...(idsToDelete.length > 0 ? [prisma.publicProject.deleteMany({ where: { id: { in: idsToDelete } } })] : []),
      ...writes,
    ]);

    const savedProjects = await prisma.publicProject.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    revalidatePath("/projects");
    revalidatePath("/");
    revalidatePath("/dashboard/admin/public-projects");

    return ok({ projects: savedProjects.map(serializeProject), usingFallback: false });
  } catch (err) {
    console.error("[PUT /api/admin/public-projects]", err);
    return serverError("Could not save public projects. Run the Prisma schema update first, then try again.");
  }
}
