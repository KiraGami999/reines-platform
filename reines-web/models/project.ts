// Project domain types — mirror the Prisma schema.
// Use these across components and API routes for full type safety.

export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export interface BudgetBreakdown {
  label: string;
  amount: number;
  paid: boolean;
}

export interface ProjectUpdate {
  id: string;
  note: string;
  imageUrl: string | null;
  documentUrl: string | null;
  documentName: string | null;
  documentType: string | null;
  progressPercent: number | null;
  batchId:         string | null;
  createdAt: string;
}

export interface ProjectManager {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  clientId: string;
  managerId: string;
  manager: ProjectManager;
  managerAccepted: boolean;
  managerAcceptedAt: string | null;
  budget: number;
  budgetBreakdown: BudgetBreakdown[];
  startDate: string | null;
  endDate: string | null;
  milestones: Milestone[];
  updates: ProjectUpdate[];
  completionPercent: number;
  createdAt: string;
}

/**
 * Project timeline checkpoint — created by a PROJECT_MANAGER (or ADMIN) to
 * show the client the construction phases/checkpoints for a project.
 * Mirrors the Prisma `Milestone` model exactly. Also consumed by the mobile
 * app (see app/api/mobile/projects/[id]/milestones).
 */
export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
