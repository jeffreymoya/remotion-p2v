"use client";

import { useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { TTSProgressIndicator } from "./tts-progress-indicator";
import { AudioPreview } from "./audio-preview";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/src/lib/storyflow/utils";

type ScriptSegment = {
  index: number;
  text: string;
  audioUrl?: string;
  actualDuration?: number;
  timestamps?: Array<{ word: string; startMs: number; endMs: number }>;
};

type Props = {
  projectId: string;
  segments: ScriptSegment[];
  onSegmentsUpdate?: (segments: ScriptSegment[]) => void;
};

export function TTSManager({ projectId, segments, onSegmentsUpdate }: Props) {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const toast = useToast();

  const generatedCount = segments.filter((s) => s.audioUrl).length;
  const totalCount = segments.length;
  const allGenerated = generatedCount === totalCount;

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
  };

  const handleComplete = () => {
    setIsGeneratingAll(false);
    toast({ title: "TTS generation complete!", variant: "success" });
    // Optionally refresh segments from server
    window.location.reload(); // Simple approach for now
  };

  const handleError = (error: string) => {
    setIsGeneratingAll(false);
    toast({
      title: "TTS generation failed",
      description: error,
      variant: "error",
    });
  };

  const handleRegenerateSegment = async (segmentIndex: number) => {
    setRegeneratingIndex(segmentIndex);

    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, segmentIndex, force: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Regeneration failed");
      }

      const { segment } = await res.json();

      // Update local segments
      const updated = segments.map((s) =>
        s.index === segmentIndex ? { ...s, ...segment } : s
      );
      onSegmentsUpdate?.(updated);

      toast({ title: "Segment regenerated", variant: "success" });
    } catch (error: any) {
      toast({
        title: "Regeneration failed",
        description: error?.message || "Unable to regenerate segment",
        variant: "error",
      });
    } finally {
      setRegeneratingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Generate All button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-300">TTS Audio</p>
          <p className="text-sm text-slate-400">
            {allGenerated
              ? "All segments have audio"
              : `${generatedCount} of ${totalCount} segments generated`}
          </p>
        </div>

        {!allGenerated && !isGeneratingAll && (
          <button
            onClick={handleGenerateAll}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-brand-600/30 transition hover:bg-brand-500"
          >
            <Sparkles className="h-4 w-4" />
            Generate All
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      {isGeneratingAll && (
        <TTSProgressIndicator
          projectId={projectId}
          isGenerating={isGeneratingAll}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}

      {/* Segments List */}
      <div className="space-y-3">
        {segments.map((segment) => (
          <div
            key={segment.index}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
                  Segment {segment.index + 1}
                </p>
                <p className="mt-1 text-sm text-slate-300 line-clamp-2">{segment.text}</p>
              </div>

              {segment.audioUrl && (
                <button
                  onClick={() => handleRegenerateSegment(segment.index)}
                  disabled={regeneratingIndex === segment.index}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200 transition hover:border-brand-500 hover:text-brand-100",
                    regeneratingIndex === segment.index && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <RefreshCw
                    className={cn("h-3 w-3", regeneratingIndex === segment.index && "animate-spin")}
                  />
                  Regenerate
                </button>
              )}
            </div>

            {segment.audioUrl ? (
              <AudioPreview
                audioUrl={segment.audioUrl}
                words={segment.timestamps}
                segmentIndex={segment.index}
              />
            ) : (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-center text-xs text-slate-500">
                No audio generated yet
              </div>
            )}
          </div>
        ))}
      </div>

      {segments.length === 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
          No script segments found. Generate a script first.
        </div>
      )}
    </div>
  );
}
