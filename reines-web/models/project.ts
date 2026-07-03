// Project domain types — mirror the Prisma schema.
// Use these across components and API routes for full type safety.

export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export interface ProjectPhase {
  label: string;
  weeks: string;
  description: string;
  status: "DONE" | "ACTIVE" | "UPCOMING";
}

export interface BudgetBreakdown {
  label: string;
  amount: number;
  paid: boolean;
}

/** A single file inside a multi-file batch upload. */
export interface BatchFile {
  url:  string;
  name: string;
  type: string;  // MIME type
  kind: "image" | "document";
}

export interface ProjectUpdate {
  id: string;
  note: string;
  imageUrl: string | null;
  documentUrl: string | null;
  documentName: string | null;
  documentType: string | null;
  /** Populated for batch uploads — takes priority over the legacy single-file fields. */
  files?: BatchFile[] | null;
  progressPercent: number | null;
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
  phases: ProjectPhase[];
  updates: ProjectUpdate[];
  completionPercent: number;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
}
