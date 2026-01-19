"use client";

import { useMemo, useState } from "react";
import { Beat } from "@/src/lib/storyflow/script-builder-types";
import { EmotionBadge } from "./emotion-badge";
import { Check, X } from "lucide-react";
import { cn } from "@/src/lib/storyflow/utils";

interface BlueprintBeatCardProps {
  beat: Beat;
  onApprove: (beatIndex: number) => void;
  onReject: (beatIndex: number, notes?: string) => void;
  disabled?: boolean;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function BlueprintBeatCard({
  beat,
  onApprove,
  onReject,
  disabled = false,
}: BlueprintBeatCardProps) {
  const isApproved = beat.reviewStatus === "approved";
  const isRejected = beat.reviewStatus === "rejected";
  const isPending = beat.reviewStatus === "pending";

  const [notes, setNotes] = useState(beat.reviewNotes ?? "");
  const showNotes = useMemo(
    () => isRejected || notes.trim().length > 0,
    [isRejected, notes]
  );

  const handleReject = () => {
    onReject(beat.index, notes.trim() || undefined);
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all",
        isApproved && "border-green-600/50 bg-green-950/30",
        isRejected && "border-rose-600/50 bg-rose-950/30",
        isPending && "border-slate-800 bg-slate-900/60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-600/20 text-xs font-semibold text-brand-300">
              {beat.index}
            </span>
            <h3 className="flex-1 text-base font-semibold text-white">{beat.title}</h3>
            <EmotionBadge emotion={beat.targetEmotion} />
          </div>

          {/* Core Argument */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400">Core Argument</p>
            <p className="text-sm text-slate-200">{beat.coreArgument}</p>
          </div>

          {/* Micro Hook */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400">Micro Hook</p>
            <p className="text-sm italic text-slate-300">"{beat.microHook}"</p>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium">Duration:</span>
            <span className="font-mono text-brand-300">{formatDuration(beat.estimatedDurationMs)}</span>
          </div>

          {/* Media Suggestions */}
          {beat.mediaSuggestions && beat.mediaSuggestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400">Media Suggestions</p>
              <ul className="space-y-1 text-xs text-slate-300">
                {beat.mediaSuggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 text-brand-400">•</span>
                    <span className="flex-1">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Review Notes */}
          {showNotes && (
            <div className="space-y-2 rounded-md border border-rose-700/50 bg-rose-950/30 p-3">
              <label className="text-xs font-medium text-rose-200">Rejection Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add guidance so regen addresses tone, emotion, or missing details"
                className="w-full rounded-md border border-rose-800/60 bg-rose-950/50 px-3 py-2 text-sm text-rose-50 placeholder:text-rose-200/70 focus:border-rose-400 focus:outline-none"
                rows={3}
                disabled={disabled}
              />
              <p className="text-[11px] text-rose-200/80">
                Notes are bundled into the regeneration prompt.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onApprove(beat.index)}
            disabled={disabled || isApproved}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border transition",
              isApproved
                ? "border-green-600 bg-green-600/20 text-green-300"
                : "border-slate-700 bg-slate-900 text-slate-400 hover:border-green-600 hover:bg-green-600/10 hover:text-green-300",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
            aria-label="Approve beat"
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            onClick={handleReject}
            disabled={disabled || isRejected}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border transition",
              isRejected
                ? "border-rose-600 bg-rose-600/20 text-rose-300"
                : "border-slate-700 bg-slate-900 text-slate-400 hover:border-rose-600 hover:bg-rose-600/10 hover:text-rose-300",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
            aria-label="Reject beat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
