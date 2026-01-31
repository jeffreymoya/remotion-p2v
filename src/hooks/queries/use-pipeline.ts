import { useMutation, useQueryClient } from "@tanstack/react-query";

import { buildProject, runMedia, runScriptStageApi, runStoryboard } from "@/src/lib/api/pipeline";
import { Timeline } from "@/src/lib/storyflow/types";

export function useBuildProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ signal }: { signal?: AbortSignal } = {}) => buildProject(projectId, signal),
    onSuccess: (timeline: Timeline) => {
      queryClient.setQueryData(["timeline", projectId], timeline);
    },
  });
}

export function useRunStoryboard(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ signal }: { signal?: AbortSignal } = {}) => runStoryboard(projectId, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}

export function useRunMediaStage(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ signal }: { signal?: AbortSignal } = {}) => runMedia(projectId, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["assets", projectId] });
    },
  });
}

export function useRunScriptStage(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ signal }: { signal?: AbortSignal } = {}) => runScriptStageApi(projectId, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["script", projectId] });
    },
  });
}
