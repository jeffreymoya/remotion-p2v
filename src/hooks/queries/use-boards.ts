import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  buildViewport,
  createBoard,
  detectBoardRegions,
  fetchBoardPlan,
  fetchBoardPrompts,
  updateBoard,
  generateBoardPrompts,
  generateBoardTriggers,
  planBoards,
  fetchBoards,
  type BoardRegion,
} from "@/src/lib/api/boards";
import { BoardPromptsOutput, BoardRegionsOutput, BoardTriggersOutput } from "@/src/lib/boards-types";
import { ViewportAnimation } from "@/src/lib/types";

export const boardKeys = {
  all: (projectId: string) => ["boards", projectId] as const,
  plan: (projectId: string) => ["boards", projectId, "plan"] as const,
  prompts: (projectId: string) => ["boards", projectId, "prompts"] as const,
  regions: (projectId: string) => ["boards", projectId, "regions"] as const,
  triggers: (projectId: string) => ["boards", projectId, "triggers"] as const,
  viewport: (projectId: string) => ["boards", projectId, "viewport"] as const,
};

export function useBoards(projectId: string) {
  return useQuery({
    queryKey: boardKeys.all(projectId),
    queryFn: () => fetchBoards(projectId),
  });
}

export function useCreateBoard(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (layout: { columns: number; rows: number }) => createBoard(projectId, layout),
    onSuccess: () => {
      // Invalidate boards cache to refetch
      queryClient.invalidateQueries({ queryKey: boardKeys.all(projectId) });
    },
  });
}

export function usePlanBoards(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { payload: Parameters<typeof planBoards>[1]; signal?: AbortSignal }) =>
      planBoards(projectId, variables.payload, variables.signal),
    onSuccess: (data) => {
      queryClient.setQueryData(boardKeys.plan(projectId), data);
      queryClient.invalidateQueries({ queryKey: boardKeys.all(projectId) });
    },
  });
}

export function useBoardPlan(projectId: string, enabled = true) {
  return useQuery({
    queryKey: boardKeys.plan(projectId),
    queryFn: ({ signal }) => fetchBoardPlan(projectId, signal),
    enabled: enabled && !!projectId,
    retry: false,
  });
}

export function useGenerateBoardPrompts(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { payload: Parameters<typeof generateBoardPrompts>[1]; signal?: AbortSignal }) =>
      generateBoardPrompts(projectId, variables.payload, variables.signal),
    onSuccess: (data: BoardPromptsOutput) => {
      queryClient.setQueryData(boardKeys.prompts(projectId), data);
    },
  });
}

export function useBoardPrompts(projectId: string, enabled = true) {
  return useQuery({
    queryKey: boardKeys.prompts(projectId),
    queryFn: ({ signal }) => fetchBoardPrompts(projectId, signal),
    enabled: enabled && !!projectId,
    retry: false,
  });
}

export function useDetectBoardRegions(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { payload: Parameters<typeof detectBoardRegions>[1]; signal?: AbortSignal }) =>
      detectBoardRegions(projectId, variables.payload, variables.signal),
    onSuccess: (data: BoardRegionsOutput) => {
      queryClient.setQueryData(boardKeys.regions(projectId), data);
    },
  });
}

export function useGenerateBoardTriggers(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { payload?: Parameters<typeof generateBoardTriggers>[1]; signal?: AbortSignal }) =>
      generateBoardTriggers(projectId, variables.payload, variables.signal),
    onSuccess: (data: BoardTriggersOutput) => {
      queryClient.setQueryData(boardKeys.triggers(projectId), data);
    },
  });
}

export function useBuildViewport(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { payload: Parameters<typeof buildViewport>[1]; signal?: AbortSignal }) =>
      buildViewport(projectId, variables.payload, variables.signal),
    onSuccess: (data: { viewportJson: ViewportAnimation }) => {
      queryClient.setQueryData(boardKeys.viewport(projectId), data.viewportJson);
    },
  });
}

export function useUpdateBoard(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      layout,
      regions,
    }: {
      boardId: string;
      layout: { columns: number; rows: number };
      regions: BoardRegion[];
    }) => updateBoard(projectId, boardId, { layout, regions }),
    onSuccess: () => {
      // Invalidate boards cache to refetch
      queryClient.invalidateQueries({ queryKey: boardKeys.all(projectId) });
    },
  });
}
