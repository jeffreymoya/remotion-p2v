import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAssets,
  uploadAsset,
  deleteAsset,
  upscaleAsset,
  selectMusicAsset,
  importAsset,
  Asset,
} from "@/src/lib/api/assets";

export const assetKeys = {
  all: ["assets"] as const,
  byProject: (projectId: string) => ["assets", projectId] as const,
};

export function useAssets(projectId: string) {
  return useQuery({
    queryKey: assetKeys.byProject(projectId),
    queryFn: () => fetchAssets(projectId),
    enabled: !!projectId,
  });
}

export function useUploadAsset(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: File | { file: File; options?: Parameters<typeof uploadAsset>[2] }) =>
      uploadAsset(
        projectId,
        input instanceof File ? input : input.file,
        input instanceof File ? undefined : input.options
      ),
    onSuccess: (newAsset) => {
      // Add to cache (prepend to list)
      queryClient.setQueryData<Asset[]>(
        assetKeys.byProject(projectId),
        (old = []) => [newAsset, ...old]
      );
    },
  });
}

export function useImportAsset(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof importAsset>[0]) => importAsset(payload),
    onSuccess: (newAsset) => {
      queryClient.setQueryData<Asset[]>(
        assetKeys.byProject(projectId),
        (old = []) => [newAsset, ...old]
      );
    },
  });
}

export function useDeleteAsset(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.setQueryData<Asset[]>(
        assetKeys.byProject(projectId),
        (old = []) => old.filter((asset) => asset.id !== deletedId)
      );
    },
  });
}

export function useUpscaleAsset(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upscaleAsset,
    onSuccess: (updatedAsset) => {
      // Update asset in cache
      queryClient.setQueryData<Asset[]>(
        assetKeys.byProject(projectId),
        (old = []) =>
          old.map((asset) =>
            asset.id === updatedAsset.id ? updatedAsset : asset
          )
      );
    },
  });
}

export function useSelectMusicAsset(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) => selectMusicAsset(projectId, assetId),
    onSuccess: () => {
      // Invalidate project query to refetch music selection state
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}
