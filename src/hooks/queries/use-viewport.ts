import { useMutation } from "@tanstack/react-query";
import { generateViewport, saveViewport, type ViewportKeyframe, type DetectedRegion } from "@/src/lib/api/viewport";

export function useGenerateViewport() {
  return useMutation({
    mutationFn: ({ projectId, imageAssetId }: { projectId: string; imageAssetId: string }) =>
      generateViewport(projectId, imageAssetId),
  });
}

export function useSaveViewport(projectId: string) {
  return useMutation({
    mutationFn: (data: { imageAssetId: string; keyframes: ViewportKeyframe[]; regions: DetectedRegion[] }) =>
      saveViewport(projectId, data),
  });
}
