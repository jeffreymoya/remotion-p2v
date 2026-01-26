import { useMutation } from "@tanstack/react-query";
import { saveAssetMappings } from "@/src/lib/api/mappings";

export function useSaveAssetMappings(projectId: string) {
  return useMutation({
    mutationFn: (mappings: Record<number, string>) => saveAssetMappings(projectId, mappings),
  });
}
