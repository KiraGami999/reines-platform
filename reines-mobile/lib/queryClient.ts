import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { QUERY_STALE_TIME_MS } from "@/constants";

/**
 * Never retry requests that returned a definitive HTTP error status.
 * Retrying a 401, 403, or 404 will never produce a different result and
 * just adds unnecessary latency. Only retry on network failures or 5xx.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status && [400, 401, 403, 404, 422, 429].includes(status)) return false;
  }
  return true;
}

/**
 * Shared React Query client.
 * Imported once in _layout.tsx and provided via QueryClientProvider.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            QUERY_STALE_TIME_MS,
      retry:                shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
