import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchManagerDashboard } from "@/services/manager-dashboard.service";
import type { ManagerDashboardData } from "@/types";

export const MANAGER_DASHBOARD_KEY = ["manager-dashboard"] as const;

/**
 * Fetches and caches the full manager dashboard payload.
 * Refetches every 30 seconds so stats stay current while the screen is open.
 */
export function useManagerDashboard() {
  return useQuery<ManagerDashboardData>({
    queryKey:        MANAGER_DASHBOARD_KEY,
    queryFn:         fetchManagerDashboard,
    staleTime:       30_000,
    refetchInterval: 30_000,
  });
}

/** Invalidates the manager dashboard cache (e.g. after posting an update). */
export function useInvalidateManagerDashboard() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: MANAGER_DASHBOARD_KEY });
}
