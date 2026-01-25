import { useQuery } from "@tanstack/react-query";
import { searchAssets } from "@/src/lib/api/assets";

export function useAssetSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["asset-search", query],
    queryFn: () => searchAssets(query),
    enabled: enabled && query.length > 2,
    staleTime: 5 * 60 * 1000, // Cache search results for 5 minutes
  });
}
