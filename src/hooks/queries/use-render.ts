import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { startRender, fetchRenderStatus } from "@/src/lib/api/render";
import { RenderQuality, Render } from "@/src/lib/storyflow/types";

export function useRenderStatus(renderId: string | null) {
  return useQuery({
    queryKey: ["render-status", renderId],
    queryFn: () => fetchRenderStatus(renderId!),
    enabled: !!renderId,
    // Poll every 2 seconds while processing
    refetchInterval: (query) => {
      const data = query.state.data as Render | undefined;
      if (!data) return false;
      if (data.status === "PROCESSING") {
        return 2000;
      }
      return false; // Stop polling when completed or failed
    },
    staleTime: 1000, // Consider data stale after 1 second
  });
}

export function useStartRender(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quality: RenderQuality) => startRender(projectId, quality),
    onSuccess: (data) => {
      // Initialize the render status cache
      queryClient.setQueryData(["render-status", data.id], data);
    },
  });
}
