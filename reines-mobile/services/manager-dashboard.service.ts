import api from "@/lib/api";
import type { ManagerDashboardData } from "@/types";

/**
 * Fetches all manager dashboard data from the single aggregated endpoint.
 * One request covers: stats, all projects, attention queue, upcoming deadlines,
 * recent client messages, and the project-update activity feed.
 */
export async function fetchManagerDashboard(): Promise<ManagerDashboardData> {
  const { data } = await api.get<ManagerDashboardData>("/api/mobile/manager/dashboard");
  return data;
}
