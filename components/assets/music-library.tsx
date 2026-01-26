"use client";

import { useMemo, useState } from "react";
import { Search, RefreshCcw } from "lucide-react";
import { MusicTrack } from "@/src/lib/storyflow/music/types";
import { Asset } from "@/src/lib/storyflow/types";
import { useToast } from "@/components/ui/toast-provider";
import { MusicTrackCard } from "./music-track-card";
import { cn } from "@/src/lib/storyflow/utils";
import { useMusicSearch, useSelectMusicTrack } from "@/src/hooks/queries/use-music-library";

type Props = {
  projectId: string;
  selectedAssetId?: string | null;
  onSelected: (asset: Asset) => void;
};

export function MusicLibrary({ projectId, selectedAssetId, onSelected }: Props) {
  const [query, setQuery] = useState("cinematic");
  const [searchQuery, setSearchQuery] = useState("cinematic");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const toast = useToast();

  // React Query hooks
  const { data: tracks = [], isLoading: loading, error, refetch } = useMusicSearch(searchQuery);
  const selectMutation = useSelectMusicTrack(projectId);

  const hasTracks = useMemo(() => tracks.length > 0, [tracks.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  const handleSelect = (track: MusicTrack) => {
    selectMutation.mutate(track, {
      onSuccess: (data) => {
        if (data.asset) {
          onSelected(data.asset as Asset);
          setSelectedTrackId(track.id);
        } else if (data.selectedAssetId) {
          toast({
            title: "Soundtrack updated",
            description: "Track selected successfully",
            variant: "success",
          });
        }
      },
      onError: (err) => {
        toast({
          title: "Music selection failed",
          description: err.message || "Unable to set soundtrack",
          variant: "error",
        });
      },
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brand-300">Music Library</p>
          <p className="text-sm text-slate-400">
            Online music search has been deprecated—upload your own tracks or reuse existing assets.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1 rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200 transition hover:border-brand-500 hover:text-brand-100"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <form
        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
        onSubmit={handleSearch}
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
          {error.message}
        </div>
      ) : hasTracks ? (
        <div className={cn("space-y-2", selectMutation.isPending && "opacity-80")}>
          {tracks.map((track) => (
            <MusicTrackCard
              key={track.id}
              track={track}
              isSelected={selectedTrackId === track.id}
              isPlaying={playingId === track.id}
              isSelecting={selectMutation.isPending && selectMutation.variables?.id === track.id}
              onPlay={() => setPlayingId(track.id)}
              onPause={() => setPlayingId(null)}
              onSelect={() => handleSelect(track)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No tracks yet. Upload your own music on the left to build your library.
        </p>
      )}
    </div>
  );
}
