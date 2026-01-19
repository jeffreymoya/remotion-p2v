"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/src/lib/storyflow/utils";

type WordTimestamp = {
  word: string;
  startMs: number;
  endMs: number;
};

type Props = {
  audioUrl: string;
  words?: WordTimestamp[];
  segmentIndex?: number;
  className?: string;
};

export function AudioPreview({ audioUrl, words = [], segmentIndex, className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [duration, setDuration] = useState(0);

  // Find the current word based on playback time
  const currentWordIndex = words.findIndex(
    (w) => currentTimeMs >= w.startMs && currentTimeMs < w.endMs
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTimeMs(audio.currentTime * 1000);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTimeMs(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        console.error("Audio play failed:", error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTimeMs(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4", className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-white shadow shadow-brand-600/30 transition hover:bg-brand-500"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>

        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            {segmentIndex !== undefined ? `Segment ${segmentIndex + 1}` : "Audio Preview"}
          </p>
          <p className="text-xs text-slate-400">
            {formatTime(currentTimeMs / 1000)} / {formatTime(duration)}
          </p>
        </div>

        <button
          onClick={handleReset}
          className="grid h-8 w-8 place-items-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="relative h-1.5 w-full rounded-full bg-slate-800">
        <div
          className="absolute h-full rounded-full bg-brand-500 transition-all"
          style={{
            width: duration > 0 ? `${(currentTimeMs / 1000 / duration) * 100}%` : "0%",
          }}
        />
      </div>

      {words.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/60 p-2">
          <div className="flex flex-wrap gap-1 text-xs">
            {words.map((word, index) => (
              <span
                key={index}
                className={cn(
                  "rounded px-1 py-0.5 transition",
                  index === currentWordIndex
                    ? "bg-brand-500 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {word.word}
              </span>
            ))}
          </div>
        </div>
      )}

      {words.length === 0 && (
        <p className="text-center text-xs text-slate-500">
          No word timestamps available
        </p>
      )}
    </div>
  );
}
