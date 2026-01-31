"use client";

import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/src/lib/storyflow/utils";
import { useUpdateMusicVolume } from "@/src/hooks/queries/use-music-library";
import { useToast } from "@/components/ui/toast-provider";

type Props = {
  projectId: string;
  selectedAssetId: string | null;
  initialVolume?: number;
  onVolumeChange?: (volume: number) => void;
};

export function MusicSettings({
  projectId,
  selectedAssetId,
  initialVolume = 0.3,
  onVolumeChange,
}: Props) {
  const [volume, setVolume] = useState(initialVolume);
  const updateVolume = useUpdateMusicVolume(projectId);
  const toast = useToast();

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);

    if (!selectedAssetId) return;

    try {
      await updateVolume.mutateAsync({ assetId: selectedAssetId, volume: newVolume });
      onVolumeChange?.(newVolume);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update volume";
      toast({ title: message, variant: "error" });
    }
  };

  const volumePercent = Math.round(volume * 100);
  const isMuted = volume === 0;

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-brand-300">Music Settings</p>
        <p className="text-sm text-slate-400">
          {selectedAssetId
            ? "Adjust soundtrack volume for your video"
            : "Select a track to configure volume"}
        </p>
      </div>

      <div className={cn("space-y-2", !selectedAssetId && "opacity-50 pointer-events-none")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-slate-500" />
            ) : (
              <Volume2 className="h-4 w-4 text-slate-300" />
            )}
            <span className="text-sm font-semibold text-white">Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-brand-300">{volumePercent}%</span>
            {updateVolume.isPending && (
              <span className="text-xs text-slate-500 animate-pulse">Saving...</span>
            )}
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={volumePercent}
          onChange={(e) => handleVolumeChange(Number(e.target.value) / 100)}
          disabled={!selectedAssetId}
          className={cn(
            "w-full h-2 rounded-full appearance-none cursor-pointer",
            "bg-slate-800",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:h-4",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-brand-500",
            "[&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-thumb]:transition",
            "[&::-webkit-slider-thumb]:hover:bg-brand-400",
            "[&::-moz-range-thumb]:w-4",
            "[&::-moz-range-thumb]:h-4",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-brand-500",
            "[&::-moz-range-thumb]:border-0",
            "[&::-moz-range-thumb]:cursor-pointer",
            "[&::-moz-range-thumb]:transition",
            "[&::-moz-range-thumb]:hover:bg-brand-400",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">Audio Mixing Info</p>
        <p>• Music will auto-duck to 20% during narration</p>
        <p>• Fade in: 2s • Fade out: 3s</p>
        <p>• Audio normalized to -16 LUFS</p>
      </div>
    </div>
  );
}
