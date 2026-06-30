import type { ProjectStatus } from "./project";

// ─── Embedded sub-types ───────────────────────────────────────────────────────

export interface MgrClient {
  id:    string;
  name:  string;
  email: string;
  image: string | null;
}

export interface MgrLastUpdate {
  id:              string;
  note:            string;
  progressPercent: number | null;
  imageUrl:        string | null;
  createdAt:       string;
}

// ─── Project row (used in the main list, attention queue, deadlines) ──────────

export interface ManagedProject {
  id:         string;
  title:      string;
  description: string | null;
  status:     ProjectStatus;
  budget:     string | null;
  startDate:  string | null;
  endDate:    string | null;
  createdAt:  string;
  updatedAt:  string;
  client:     MgrClient;
  updates:    MgrLastUpdate[];         // always at most 1 (latest)
  _count:     { messages: number; updates: number };
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export interface ManagerDashboardStats {
  total:                number;
  active:               number;
  onHold:               number;
  completedThisMonth:   number;
  needsAttentionCount:  number;
  upcomingDeadlineCount: number;
}

// ─── Activity feed items ──────────────────────────────────────────────────────

export interface ManagerRecentMessage {
  id:           string;
  message:      string;
  createdAt:    string;
  sender:       { id: string; name: string; role: string };
  projectId:    string;
  projectTitle: string;
}

export interface ManagerActivityUpdate {
  id:              string;
  note:            string;
  imageUrl:        string | null;
  progressPercent: number | null;
  createdAt:       string;
  projectId:       string;
  projectTitle:    string;
}

// ─── Full dashboard response ──────────────────────────────────────────────────

export interface ManagerDashboardData {
  stats:              ManagerDashboardStats;
  projects:           ManagedProject[];
  needsAttention:     ManagedProject[];
  upcomingDeadlines:  ManagedProject[];
  recentMessages:     ManagerRecentMessage[];
  recentActivity:     ManagerActivityUpdate[];
}
