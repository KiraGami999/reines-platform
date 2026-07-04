import { prisma } from "@/lib/prisma";
import { resolveStorageUrl } from "@/lib/storage";
import {
  FALLBACK_PUBLIC_PROJECTS,
  type PublicProjectItem,
  type PublicProjectStatus,
} from "@/lib/public-projects-data";

export {
  AVAILABLE_PUBLIC_PROJECT_IMAGES,
  FALLBACK_PUBLIC_PROJECTS,
  PUBLIC_PROJECT_STATUS_OPTIONS,
  type AvailablePublicProjectImage,
  type PublicProjectItem,
  type PublicProjectStatus,
} from "@/lib/public-projects-data";

function serializeProject(project: {
  id: string;
  title: string;
  location: string;
  type: string;
  status: string;
  description: string;
  year: string;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
}): PublicProjectItem {
  return {
    id: project.id,
    title: project.title,
    location: project.location,
    type: project.type,
    status: project.status as PublicProjectStatus,
    description: project.description,
    year: project.year,
    imageUrl: resolveStorageUrl(project.imageUrl) ?? project.imageUrl,
    active: project.active,
    sortOrder: project.sortOrder,
  };
}

export async function getPublicProjects(): Promise<PublicProjectItem[]> {
  try {
    const projects = await prisma.publicProject.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (projects.length === 0) return FALLBACK_PUBLIC_PROJECTS;
    return projects.map(serializeProject);
  } catch {
    return FALLBACK_PUBLIC_PROJECTS;
  }
}

/** Admin view — returns RAW DB URLs so the admin form can save them back without corruption. */
export async function getAdminPublicProjects(): Promise<{ projects: PublicProjectItem[]; usingFallback: boolean }> {
  try {
    const projects = await prisma.publicProject.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (projects.length === 0) return { projects: FALLBACK_PUBLIC_PROJECTS, usingFallback: true };

    return {
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        location: p.location,
        type: p.type,
        status: p.status as PublicProjectStatus,
        description: p.description,
        year: p.year,
        imageUrl: p.imageUrl,
        active: p.active,
        sortOrder: p.sortOrder,
      })),
      usingFallback: false,
    };
  } catch {
    return { projects: FALLBACK_PUBLIC_PROJECTS, usingFallback: true };
  }
}
