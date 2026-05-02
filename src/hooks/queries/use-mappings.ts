import { useMutation } from "@tanstack/react-query";
import { saveAssetMappings } from "@/src/lib/api/mappings";
import type { AssetMappings } from "@/src/lib/storyflow/types";

export function useSaveAssetMappings(projectId: string) {
  return useMutation({
    mutationFn: (mappings: AssetMappings) => saveAssetMappings(projectId, mappings),
  });
}
