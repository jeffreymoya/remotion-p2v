import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateTTS, type TTSGenerateRequest } from "@/src/lib/api/tts";

/**
 * Mutation hook to regenerate TTS audio for a single segment
 *
 * @param projectId - Project ID for cache invalidation
 * @returns Mutation object with mutate function
 *
 * @example
 * ```tsx
 * const regenerateMutation = useRegenerateSegment(projectId);
 * regenerateMutation.mutate(
 *   { projectId, segmentIndex: 3, force: true },
 *   { onSuccess: (data) => console.log(data.segment) }
 * );
 * ```
 */
export function useRegenerateSegment(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TTSGenerateRequest) => generateTTS(request),
    onSuccess: () => {
      // Invalidate any script/segment queries that might be cached
      queryClient.invalidateQueries({ queryKey: ["script", projectId] });
      queryClient.invalidateQueries({ queryKey: ["segments", projectId] });
    },
  });
}
