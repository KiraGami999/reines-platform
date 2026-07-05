import { NextRequest } from "next/server";
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
import { forbidden, ok, serverError, validationError } from "@/lib/api-response";
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
  if (!parsed.success) return validationError(parsed.error);

  try {
    const projects = parsed.data.projects.map((project, sortOrder) => {
      const imageUrls = project.imageUrls;
      const cover = imageUrls[0];

      return {
        title: project.title,
        location: project.location,
        type: project.type,
        status: project.status,
        description: project.description,
        year: project.year,
        imageUrl: cover,
        imageUrls,
        active: project.active,
        sortOrder,
      };
    });

    await prisma.$transaction([
      prisma.publicProject.deleteMany(),
      prisma.publicProject.createMany({ data: projects }),
    ]);

    const savedProjects = await prisma.publicProject.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    revalidatePath("/projects");
    revalidatePath("/dashboard/admin/public-projects");

    return ok({ projects: savedProjects.map(serializeProject), usingFallback: false });
  } catch {
    return serverError("Could not save public projects. Run the Prisma schema update first, then try again.");
  }
}
