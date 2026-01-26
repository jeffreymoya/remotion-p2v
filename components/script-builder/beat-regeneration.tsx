"use client";

import { useMemo } from "react";
import { BeatDraft, ScriptDraft } from "@/src/lib/storyflow/script-builder-types";
import { useToast } from "@/components/ui/toast-provider";
import { RotateCcw, Wand2 } from "lucide-react";
import { cn } from "@/src/lib/storyflow/utils";
import { useRegenerateBeat } from "@/src/hooks/queries/use-execution-status";

interface BeatRegenerationProps {
  scriptDraft: ScriptDraft;
  onDraftUpdated: (draft: ScriptDraft) => void;
  disabled?: boolean;
}

export function BeatRegeneration({
  scriptDraft,
  onDraftUpdated,
  disabled = false,
}: BeatRegenerationProps) {
  const toast = useToast();
  const regenerateMutation = useRegenerateBeat();

  const beatDrafts = useMemo(
    () => (scriptDraft.beatDrafts as BeatDraft[]).sort((a, b) => a.beatIndex - b.beatIndex),
    [scriptDraft.beatDrafts]
  );

  const handleRegenerate = (beatDraft: BeatDraft) => {
    if (disabled) return;

    const guidance = window.prompt(
      "Optional guidance for regeneration (tone, pacing, missing detail):",
      beatDraft.guidanceApplied ?? ""
    );

    regenerateMutation.mutate(
      {
        beatDraftId: beatDraft.id,
        guidance: guidance?.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          onDraftUpdated(data.draft);
          toast({
            title: data.message || `Beat ${beatDraft.beatIndex} regenerated`,
            variant: "success",
          });
        },
        onError: (error) => {
          toast({
            title: error.message || "Failed to regenerate beat",
            variant: "error",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-200">Regenerate individual beats</p>
          <p className="text-xs text-slate-400">
            Apply reviewer guidance to a single beat without rerunning the whole script.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-300">
          <Wand2 className="h-4 w-4" />
          <span>Re-segmentation recommended after changes</span>
        </div>
      </div>

      <div className="space-y-2">
        {beatDrafts.map((beat) => (
          <div
            key={beat.id}
            className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-3"
          >
            <div className="h-8 w-8 rounded-full bg-brand-600/20 text-center text-sm font-semibold text-brand-300 flex items-center justify-center">
              {beat.beatIndex}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Beat {beat.beatIndex}</p>
                {beat.regeneratedFromId && (
                  <span className="text-[10px] uppercase tracking-wide text-amber-300">
                    Regenerated
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 line-clamp-3">{beat.text}</p>
              {beat.guidanceApplied && (
                <p className="text-[11px] text-slate-400">
                  Guidance: <span className="text-slate-200">{beat.guidanceApplied}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => handleRegenerate(beat)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition",
                "border-slate-700 bg-slate-900 text-slate-200 hover:border-brand-500 hover:bg-brand-500/10 hover:text-brand-200",
                "disabled:cursor-not-allowed disabled:opacity-60"
              )}
            >
              <RotateCcw className="h-4 w-4" />
              Regenerate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
