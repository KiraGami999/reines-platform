import { prisma } from "@/lib/prisma";
import { resolveStorageUrl } from "@/lib/storage";
import {
  FALLBACK_PUBLIC_PROJECTS,
  getPublicProjectCoverImage,
  normalizePublicProjectImages,
  type PublicProjectItem,
  type PublicProjectStatus,
} from "@/lib/public-projects-data";

export {
  AVAILABLE_PUBLIC_PROJECT_IMAGES,
  FALLBACK_PUBLIC_PROJECTS,
  MAX_FEATURED_PUBLIC_PROJECTS,
  MAX_PUBLIC_PROJECT_IMAGES,
  PUBLIC_PROJECT_STATUS_OPTIONS,
  getPublicProjectCoverImage,
  normalizePublicProjectImages,
  type AvailablePublicProjectImage,
  type PublicProjectItem,
  type PublicProjectStatus,
} from "@/lib/public-projects-data";

function resolveImageUrl(url: string): string {
  return resolveStorageUrl(url) ?? url;
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
  featured: boolean;
  sortOrder: number;
}): PublicProjectItem {
  const rawUrls = normalizePublicProjectImages(project);
  const imageUrls = rawUrls.map(resolveImageUrl);
  const cover = getPublicProjectCoverImage({ imageUrl: project.imageUrl, imageUrls: rawUrls });

  return {
    id: project.id,
    title: project.title,
    location: project.location,
    type: project.type,
    status: project.status as PublicProjectStatus,
    description: project.description,
    year: project.year,
    imageUrl: resolveImageUrl(cover),
    imageUrls,
    active: project.active,
    featured: project.featured,
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

/**
 * Projects the admin has flagged for the homepage "Featured Projects"
 * slideshow. Falls back to the fallback dataset's featured entries so the
 * section still renders sensibly before any admin has published real data.
 */
export async function getFeaturedPublicProjects(): Promise<PublicProjectItem[]> {
  try {
    const projects = await prisma.publicProject.findMany({
      where: { active: true, featured: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (projects.length > 0) return projects.map(serializeProject);

    const anyProjectsExist = (await prisma.publicProject.count()) > 0;
    // Real projects exist but none are marked featured yet — let the admin's
    // choice (none) stand rather than silently substituting fallback data.
    if (anyProjectsExist) return [];

    return FALLBACK_PUBLIC_PROJECTS.filter((p) => p.featured);
  } catch {
    return FALLBACK_PUBLIC_PROJECTS.filter((p) => p.featured);
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
      projects: projects.map((p) => {
        const imageUrls = normalizePublicProjectImages(p);
        const cover = getPublicProjectCoverImage({ imageUrl: p.imageUrl, imageUrls });

        return {
          id: p.id,
          title: p.title,
          location: p.location,
          type: p.type,
          status: p.status as PublicProjectStatus,
          description: p.description,
          year: p.year,
          imageUrl: cover,
          imageUrls,
          active: p.active,
          featured: p.featured,
          sortOrder: p.sortOrder,
        };
      }),
      usingFallback: false,
    };
  } catch {
    return { projects: FALLBACK_PUBLIC_PROJECTS, usingFallback: true };
  }
}
