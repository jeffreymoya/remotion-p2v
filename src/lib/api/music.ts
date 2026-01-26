import { MusicTrack } from "@/src/lib/storyflow/music/types";

export async function searchMusicTracks(query: string): Promise<MusicTrack[]> {
  const res = await fetch(`/api/music/library?q=${encodeURIComponent(query || "background")}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Music library search is unavailable");
  }
  const data = await res.json();
  return data.tracks || [];
}

export async function selectMusicTrack(
  projectId: string,
  track: MusicTrack
): Promise<{ asset: unknown; selectedAssetId?: string }> {
  const res = await fetch(`/api/projects/${projectId}/music`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ track }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Unable to set soundtrack");
  }

  return res.json();
}
