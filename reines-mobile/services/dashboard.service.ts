import api from "@/lib/api";
import type { ClientDashboardData } from "@/types";

/**
 * Fetches all client dashboard data from the single aggregated endpoint.
 * One request covers: active projects, pending payments, loyalty balance,
 * recent updates, and recent message conversations.
 */
export async function fetchClientDashboard(): Promise<ClientDashboardData> {
  const { data } = await api.get<ClientDashboardData>("/api/mobile/dashboard");
  return data;
}
