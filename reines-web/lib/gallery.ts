/**
 * Role-scoped gallery data access layer.
 *
 * - ADMIN           → sees all projects
 * - PROJECT_MANAGER → sees only projects they manage
 * - CLIENT          → sees only their own projects
 */

import { prisma } from "@/lib/prisma";
import type { ProjectUpdate } from "@/models/project";

// ─── Gallery types ────────────────────────────────────────────────────────────

export interface GalleryProject {
  id:        string;
  title:     string;
  clientId:  string;
  managerId: string;
  manager:   { id: string; name: string; email: string };
  updates:   ProjectUpdate[];
}

// ─── Prisma include shape ─────────────────────────────────────────────────────

const GALLERY_INCLUDE = {
  manager: { select: { id: true, name: true, email: true } },
  updates: { orderBy: { createdAt: "desc" as const } },
} as const;

// ─── Internal mapper ──────────────────────────────────────────────────────────

function mapRow(row: {
  id:        string;
  title:     string;
  clientId:  string;
  managerId: string;
  manager:   { id: string; name: string; email: string };
  updates:   {
    id: string;
    note: string;
    imageUrl: string | null;
    documentUrl: string | null;
    documentName: string | null;
    documentType: string | null;
    progressPercent: number | null;
    createdAt: Date;
  }[];
}): GalleryProject {
  return {
    id:        row.id,
    title:     row.title,
    clientId:  row.clientId,
    managerId: row.managerId,
    manager:   row.manager,
    updates:   row.updates.map((u) => ({
      id:        u.id,
      note:      u.note,
      imageUrl:  u.imageUrl ?? null,
      documentUrl: u.documentUrl ?? null,
      documentName: u.documentName ?? null,
      documentType: u.documentType ?? null,
      progressPercent: u.progressPercent ?? null,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns all projects (with their updates) visible to the given user.
 * Used by the gallery overview page.
 */
export async function getGalleryProjects(
  userId: string,
  role:   string
): Promise<GalleryProject[]> {
  try {
    const where =
      role === "ADMIN"           ? {}                     :
      role === "PROJECT_MANAGER" ? { managerId: userId, managerAccepted: true }  :
                                   { clientId:  userId, managerAccepted: true };

    const rows = await prisma.project.findMany({
      where,
      include: GALLERY_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return rows.map(mapRow);
  } catch (err) {
    console.error("[getGalleryProjects]", err);
    return [];
  }
}

/**
 * Returns a single project scoped to the viewer's role.
 * Returns null if the project doesn't exist or the viewer doesn't have access.
 */
export async function getProjectForGallery(
  id:     string,
  userId: string,
  role:   string
): Promise<GalleryProject | null> {
  try {
    const where =
      role === "ADMIN"           ? { id }                            :
      role === "PROJECT_MANAGER" ? { id, managerId: userId, managerAccepted: true } :
                                   { id, clientId:  userId, managerAccepted: true };

    const row = await prisma.project.findFirst({
      where,
      include: GALLERY_INCLUDE,
    });

    return row ? mapRow(row) : null;
  } catch (err) {
    console.error("[getProjectForGallery]", err);
    return null;
  }
}
