import { Project } from "@/src/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProjects, fetchProject, updateProject, deleteProject } from "@/src/lib/api/projects";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: fetchProjects,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProject(id),
    enabled: !!id,
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      updateProject(id, data),
    onSuccess: (updatedProject, { id }) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(id), updatedProject);
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
