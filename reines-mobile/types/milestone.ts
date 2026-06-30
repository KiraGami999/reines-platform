// ---------------------------------------------------------------------------
// Milestone types (mobile)
// ---------------------------------------------------------------------------

export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Milestone {
  id:          string;
  projectId:   string;
  title:       string;
  description: string | null;
  status:      MilestoneStatus;
  dueDate:     string | null;   // ISO-8601 string
  completedAt: string | null;   // ISO-8601 string
  sortOrder:   number;
  createdAt:   string;
  updatedAt:   string;
}

export interface MilestoneSummary {
  total:       number;
  completed:   number;
  inProgress:  number;
  progressPct: number;
}

export interface MilestonesResponse {
  projectTitle: string;
  milestones:   Milestone[];
  summary:      MilestoneSummary;
}

export interface MilestoneResponse {
  milestone: Milestone;
}

// ---------- form shapes (React Hook Form) -----------------------------------

export interface CreateMilestoneValues {
  title:       string;
  description: string;
  dueDate:     string;   // "" or ISO-8601
}

export interface UpdateMilestoneValues {
  title?:       string;
  description?: string | null;
  status?:      MilestoneStatus;
  dueDate?:     string | null;
}

// ---------- constants -------------------------------------------------------

export const MILESTONE_STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; color: string; bg: string }
> = {
  PENDING:     { label: "Pending",     color: "#71717a", bg: "#f4f4f5" },
  IN_PROGRESS: { label: "In Progress", color: "#2d4a6b", bg: "#dbeafe" },
  COMPLETED:   { label: "Completed",   color: "#16a34a", bg: "#dcfce7" },
  CANCELLED:   { label: "Cancelled",   color: "#dc2626", bg: "#fee2e2" },
};
