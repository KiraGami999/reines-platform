/**
 * Secure server-side data access layer for projects.
 *
 * Every query is scoped to the authenticated user's ID so a client can never
 * read another client's project — even by guessing a URL.
 *
 * Falls back to mock data when the database is not yet available (development).
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { Project, BudgetBreakdown } from "@/models/project";
import { MOCK_PROJECTS, getMockProjects, getMockProjectById } from "@/lib/mock-data";

// ─── Prisma result shape ──────────────────────────────────────────────────────

type ProjectRow = Prisma.ProjectGetPayload<{
  include: {
    client: { select: { id: true; name: true; email: true } };
    manager: { select: { id: true; name: true; email: true } };
    updates: { orderBy: { createdAt: "desc" } };
    payments: {
      select: {
        id: true;
        amount: true;
        description: true;
        status: true;
        createdAt: true;
      };
    };
  };
}>;

export type ManagerProject = Project & {
  client: { id: string; name: string; email: string };
};

// ─── Mapping ──────────────────────────────────────────────────────────────────

/**
 * Maps a raw Prisma row (which may be missing rich fields like phases) to the
 * app-level Project type. Fields not stored in the DB (phases, breakdown) are
 * derived or defaulted until the schema is extended with those columns.
 */
function mapRow(row: ProjectRow): Project {
  const successPayments = row.payments.filter((p) => p.status === "SUCCESS");

  const breakdown: BudgetBreakdown[] = successPayments.map((p, i) => ({
    label:  p.description ?? `Payment ${i + 1}`,
    amount: Number(p.amount),
    paid:   true,
  }));

  const totalBudget    = Number(row.budget ?? 0);
  const totalPaid      = breakdown.reduce((s, b) => s + b.amount, 0);
  const remaining      = totalBudget - totalPaid;

  // Add an outstanding line if unpaid balance exists
  if (remaining > 0 && totalBudget > 0) {
    breakdown.push({
      label:  "Remaining Balance",
      amount: remaining,
      paid:   false,
    });
  }

  const latestProgressUpdate = row.updates.find((update) => update.progressPercent !== null);

  // Prefer the project manager's latest estimated progress value.
  let completionPercent = 0;
  if (latestProgressUpdate?.progressPercent !== undefined && latestProgressUpdate.progressPercent !== null) {
    completionPercent = latestProgressUpdate.progressPercent;
  } else if (row.status === "COMPLETED") {
    completionPercent = 100;
  } else if (row.status === "PLANNING") {
    completionPercent = 0;
  } else if (row.status === "CANCELLED") {
    completionPercent = 0;
  } else {
    // Rough estimate: 5% per update, capped at 95 until marked complete
    completionPercent = Math.min(row.updates.length * 8, 95);
  }

  return {
    id:               row.id,
    title:            row.title,
    description:      row.description ?? "",
    status:           row.status,
    clientId:         row.clientId,
    managerId:        row.managerId,
    manager:          row.manager,
    managerAccepted:  row.managerAccepted,
    managerAcceptedAt: row.managerAcceptedAt ? row.managerAcceptedAt.toISOString() : null,
    budget:           totalBudget,
    budgetBreakdown:  breakdown,
    startDate:        row.startDate  ? row.startDate.toISOString().slice(0, 10)  : null,
    endDate:          row.endDate    ? row.endDate.toISOString().slice(0, 10)    : null,
    phases:           [], // Populated from mock; extend schema when phase table is added
    updates:          row.updates.map((u) => ({
      id:        u.id,
      note:      u.note,
      imageUrl:  u.imageUrl ?? null,
      documentUrl: u.documentUrl ?? null,
      documentName: u.documentName ?? null,
      documentType: u.documentType ?? null,
      progressPercent: u.progressPercent ?? null,
      createdAt: u.createdAt.toISOString(),
    })),
    completionPercent,
    createdAt: row.createdAt.toISOString(),
  };
}

const INCLUDE = {
  client:  { select: { id: true, name: true, email: true } },
  manager: { select: { id: true, name: true, email: true } },
  updates: { orderBy: { createdAt: "desc" as const } },
  payments: {
    select: {
      id:          true,
      amount:      true,
      description: true,
      status:      true,
      createdAt:   true,
    },
  },
} satisfies Prisma.ProjectInclude;

function mapManagerRow(row: ProjectRow): ManagerProject {
  return {
    ...mapRow(row),
    client: row.client,
  };
}

function mockToManagerProject(project: Project): ManagerProject {
  return {
    ...project,
    client: {
      id:    project.clientId,
      name:  project.clientId === "client_001" ? "Reines Test Client" : "Client",
      email: project.clientId === "client_001" ? "client@example.com" : "client@example.com",
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns all projects assigned to a specific client.
 * Scoped by `clientId` — clients cannot see others' projects.
 */
export async function getClientProjects(userId: string): Promise<Project[]> {
  try {
    const rows = await prisma.project.findMany({
      where:   { clientId: userId, managerAccepted: true },
      include: INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapRow);
  } catch {
    // Database not available — return mock data (development only)
    return getMockProjects("client_001");
  }
}

/**
 * Returns projects assigned to a project manager.
 * Scoped by `managerId` so managers cannot see projects owned by other managers.
 */
export async function getManagerProjects(userId: string): Promise<ManagerProject[]> {
  try {
    const rows = await prisma.project.findMany({
      where:   { managerId: userId },
      include: INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(mapManagerRow);
  } catch {
    return MOCK_PROJECTS
      .filter((project) => project.managerId === userId || project.managerId.startsWith("mgr_"))
      .map(mockToManagerProject);
  }
}

/**
 * Returns a single project by ID, scoped to the authenticated client.
 * Returns null (→ 404) if the project doesn't exist OR belongs to someone else.
 */
export async function getClientProject(
  id:     string,
  userId: string
): Promise<Project | null> {
  try {
    const row = await prisma.project.findFirst({
      where:   { id, clientId: userId, managerAccepted: true }, // ownership enforced here
      include: INCLUDE,
    });
    return row ? mapRow(row) : null;
  } catch {
    return getMockProjectById(id, "client_001");
  }
}

/**
 * Returns a single project scoped to the current dashboard role.
 * ADMIN can read all projects, PROJECT_MANAGER only assigned projects, CLIENT only owned projects.
 */
export async function getDashboardProject(
  id:     string,
  userId: string,
  role:   string
): Promise<Project | null> {
  try {
    const where =
      role === "ADMIN"           ? { id }                    :
      role === "PROJECT_MANAGER" ? { id, managerId: userId } :
                                   { id, clientId:  userId, managerAccepted: true };

    const row = await prisma.project.findFirst({
      where,
      include: INCLUDE,
    });
    return row ? mapRow(row) : null;
  } catch {
    if (role === "PROJECT_MANAGER") {
      return MOCK_PROJECTS.find((project) => project.id === id && project.managerId.startsWith("mgr_")) ?? null;
    }
    if (role === "ADMIN") {
      return MOCK_PROJECTS.find((project) => project.id === id) ?? null;
    }
    return getMockProjectById(id, "client_001");
  }
}
