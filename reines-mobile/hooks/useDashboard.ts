import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClientDashboard } from "@/services/dashboard.service";
import type { ClientDashboardData } from "@/types";

export const DASHBOARD_KEY = ["client-dashboard"] as const;

/**
 * Fetches and caches the full client dashboard payload.
 * Refetches every 30 seconds so data stays fresh while the screen is open.
 */
export function useClientDashboard() {
  return useQuery<ClientDashboardData>({
    queryKey:       DASHBOARD_KEY,
    queryFn:        fetchClientDashboard,
    staleTime:      30_000,
    refetchInterval: 30_000,
  });
}

/** Invalidates the dashboard cache (call after a payment or message is sent). */
export function useInvalidateDashboard() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
}
