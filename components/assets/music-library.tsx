"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCcw } from "lucide-react";
import { MusicTrack } from "@/src/lib/storyflow/music/types";
import { Asset } from "@/src/lib/storyflow/types";
import { useToast } from "@/components/ui/toast-provider";
import { MusicTrackCard } from "./music-track-card";
import { cn } from "@/src/lib/storyflow/utils";

type Props = {
  projectId: string;
  selectedAssetId?: string | null;
  onSelected: (asset: Asset) => void;
};

export function MusicLibrary({ projectId, selectedAssetId, onSelected }: Props) {
  const [query, setQuery] = useState("cinematic");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const toast = useToast();

  const hasTracks = useMemo(() => tracks.length > 0, [tracks.length]);

  const fetchTracks = async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/music/library?q=${encodeURIComponent(term || "background")}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to load library");
      }
      setTracks(data.tracks ?? []);
    } catch (err: any) {
      setTracks([]);
      setError(err?.message || "Unable to load music library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (track: MusicTrack) => {
    setSelectingId(track.id);
    try {
      const res = await fetch(`/api/projects/${projectId}/music`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to set soundtrack");
      }
      if (data.asset) {
        onSelected(data.asset as Asset);
        setSelectedTrackId(track.id);
      } else if (data.selectedAssetId) {
        // In case the API reused an existing asset, we still refresh selection via toast.
        toast({
          title: "Soundtrack updated",
          description: "Track selected successfully",
          variant: "success",
        });
      }
    } catch (err: any) {
      toast({
        title: "Music selection failed",
        description: err?.message || "Unable to set soundtrack",
        variant: "error",
      });
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brand-300">Music Library</p>
          <p className="text-sm text-slate-400">
            Browse royalty-free tracks from Pixabay. Configure PIXABAY_API_KEY to enable search.
          </p>
        </div>
        <button
          onClick={() => fetchTracks(query)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200 transition hover:border-brand-500 hover:text-brand-100"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <form
        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          fetchTracks(query);
        }}
      >
        <Search className="h-4 w-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search moods or keywords (e.g., cinematic, chill, upbeat)"
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-500"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-400">Loading tracks…</p>
      ) : error ? (
        <div className="rounded-lg border border-amber-600/50 bg-amber-500/10 p-3 text-sm text-amber-100">
          {error}
        </div>
      ) : hasTracks ? (
        <div className={cn("space-y-2", selectingId && "opacity-80")}>
          {tracks.map((track) => (
            <MusicTrackCard
              key={track.id}
              track={track}
              isSelected={selectedTrackId === track.id}
              isPlaying={playingId === track.id}
              isSelecting={selectingId === track.id}
              onPlay={() => setPlayingId(track.id)}
              onPause={() => setPlayingId(null)}
              onSelect={() => handleSelect(track)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No tracks yet. Add PIXABAY_API_KEY or upload your own music on the left.
        </p>
      )}
    </div>
  );
}
