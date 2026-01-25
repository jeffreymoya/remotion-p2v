import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchExecutionStatus,
  fetchScriptDraft,
  startExecution,
  resumeExecution,
  ExecutionStatus,
} from "@/src/lib/api/script-builder";

export function useExecutionStatus(draftId: string | null) {
  return useQuery({
    queryKey: ["execution-status", draftId],
    queryFn: () => fetchExecutionStatus(draftId!),
    enabled: !!draftId,
    // Poll every 2.5 seconds while executing
    refetchInterval: (query) => {
      const data = query.state.data as ExecutionStatus | undefined;
      if (!data) return 2500;
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        return false; // Stop polling
      }
      return 2500;
    },
  });
}

export function useScriptDraft(draftId: string | null) {
  return useQuery({
    queryKey: ["script-draft", draftId],
    queryFn: () => fetchScriptDraft(draftId!),
    enabled: !!draftId,
  });
}

export function useStartExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startExecution,
    onSuccess: (data) => {
      // Initialize the execution status cache
      queryClient.setQueryData(
        ["execution-status", data.scriptDraftId],
        {
          status: data.status,
          currentBeatIndex: 0,
          completedBeats: 0,
          totalBeats: data.totalBeats,
          lastCheckpoint: new Date().toISOString(),
        }
      );
    },
  });
}

export function useResumeExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeExecution,
    onSuccess: (_data, draftId) => {
      // Invalidate to refetch status
      queryClient.invalidateQueries({ queryKey: ["execution-status", draftId] });
    },
  });
}
