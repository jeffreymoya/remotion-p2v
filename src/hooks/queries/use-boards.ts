import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBoard, fetchBoards, updateBoard, type BoardRegion } from "@/src/lib/api/boards";

export const boardKeys = {
  all: (projectId: string) => ["boards", projectId] as const,
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
