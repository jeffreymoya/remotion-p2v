"use client";

import { useEffect, useRef } from "react";
import { Pause, Play } from "lucide-react";
import { MusicTrack } from "@/src/lib/storyflow/music/types";
import { cn } from "@/src/lib/storyflow/utils";

type Props = {
  track: MusicTrack;
  isSelected?: boolean;
  isPlaying?: boolean;
  isSelecting?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSelect: () => void;
};

function formatDuration(seconds?: number | null) {
  if (!seconds) return "–";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export function MusicTrackCard({
  track,
  isSelected,
  isPlaying,
  isSelecting,
  onPlay,
  onPause,
  onSelect,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isPlaying]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3",
        isSelected && "border-brand-500 bg-brand-500/5"
      )}
    >
      <audio ref={audioRef} src={track.previewUrl} preload="none" />

      <button
        onClick={isPlaying ? onPause : onPlay}
        className="grid h-10 w-10 place-items-center rounded-full bg-slate-800 text-slate-100 transition hover:bg-slate-700"
        aria-label={isPlaying ? "Pause preview" : "Play preview"}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-white">{track.title}</p>
        <p className="text-xs text-slate-400">
          {track.author ? `${track.author} • ` : ""}
          {formatDuration(track.duration)}
        </p>
        {track.tags ? (
          <p className="truncate text-[11px] text-slate-500">{track.tags}</p>
        ) : null}
      </div>

      <button
        onClick={onSelect}
        disabled={isSelecting}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold transition",
          isSelected
            ? "bg-brand-600 text-white"
            : "border border-slate-700 bg-slate-800 text-slate-100 hover:border-brand-500 hover:text-brand-100"
        )}
      >
        {isSelecting ? "Selecting…" : isSelected ? "Selected" : "Use track"}
      </button>
    </div>
  );
}
