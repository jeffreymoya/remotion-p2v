import { useQuery } from "@tanstack/react-query";
import { fetchAiLogs } from "@/src/lib/api/ai-logs";
import type { AiCallStatus } from "@/src/generated/storyflow";

export function useAiLogs(
  projectId: string,
  statusFilter: AiCallStatus | "all" = "all",
  providerFilter: string = "all",
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ["ai-logs", projectId, statusFilter, providerFilter],
    queryFn: () =>
      fetchAiLogs({
        projectId,
        status: statusFilter,
        provider: providerFilter,
      }),
    // Poll every 3 seconds if there are pending calls
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;

      // If there are pending calls, poll more frequently
      if (data.stats.summary.pendingCalls > 0) {
        return options?.refetchInterval ?? 3000;
      }

      // Otherwise, poll less frequently
      return 10000;
    },
    staleTime: 2 * 1000, // Consider data stale after 2 seconds
    ...options,
  });
}
