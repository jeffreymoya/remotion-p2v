import { useQuery, useMutation } from "@tanstack/react-query";
import {
  searchMusicTracks,
  selectMusicTrack,
  updateMusicVolume,
  MusicTrack,
} from "@/src/lib/api/music";

export function useMusicSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["music-search", query],
    queryFn: () => searchMusicTracks(query),
    enabled: enabled && query.length > 0,
    staleTime: 5 * 60 * 1000, // Cache search results for 5 minutes
  });
}

export function useSelectMusicTrack(projectId: string) {
  return useMutation({
    mutationFn: (track: MusicTrack) => selectMusicTrack(projectId, track),
  });
}

export function useUpdateMusicVolume(projectId: string) {
  return useMutation({
    mutationFn: ({ assetId, volume }: { assetId: string; volume: number }) =>
      updateMusicVolume(projectId, assetId, volume),
  });
}
