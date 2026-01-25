"use client";

import { useEffect, useState } from "react";
import { Blueprint, ScriptDraft } from "@/src/lib/storyflow/script-builder-types";
import { BeatStatusIndicator, BeatStatus } from "./beat-status-indicator";
import { useToast } from "@/components/ui/toast-provider";
import { Play, Loader2 } from "lucide-react";
import {
  useExecutionStatus,
  useScriptDraft,
  useStartExecution,
  useResumeExecution,
} from "@/src/hooks/queries/use-execution-status";

interface ExecutionProgressProps {
  blueprint: Blueprint;
  scriptDraftId: string | null;
  projectId: string;
  onComplete: (scriptDraft: ScriptDraft) => void;
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="h-2 w-full rounded-full bg-slate-800">
      <div
        className="h-2 rounded-full bg-brand-500 transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function ExecutionProgress({
  blueprint,
  scriptDraftId: initialDraftId,
  projectId,
  onComplete,
}: ExecutionProgressProps) {
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [notifiedComplete, setNotifiedComplete] = useState(false);
  const toast = useToast();

  // React Query hooks
  const { data: status } = useExecutionStatus(draftId);
  const { data: scriptDraft } = useScriptDraft(
    status && ["GLUING", "POLISHING", "COMPLETED"].includes(status.status) ? draftId : null
  );
  const startMutation = useStartExecution();
  const resumeMutation = useResumeExecution();

  // Notify parent when execution completes
  useEffect(() => {
    if (scriptDraft && !notifiedComplete) {
      onComplete(scriptDraft as ScriptDraft);
      setNotifiedComplete(true);
    }
  }, [scriptDraft, notifiedComplete, onComplete]);

  const handleStartExecution = () => {
    startMutation.mutate(blueprint.id, {
      onSuccess: (data) => {
        setDraftId(data.scriptDraftId);
        setNotifiedComplete(false);
        toast({ title: "Script execution started", variant: "success" });
      },
      onError: (error) => {
        toast({
          title: error.message || "Failed to start execution",
          variant: "error",
        });
      },
    });
  };

  const handleResume = () => {
    if (!draftId) return;

    resumeMutation.mutate(draftId, {
      onSuccess: (data) => {
        setNotifiedComplete(false);
        toast({
          title: `Resumed from beat ${data.resumedFromBeat}`,
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: error.message || "Failed to resume execution",
          variant: "error",
        });
      },
    });
  };

  const getBeatStatus = (beatIndex: number): BeatStatus => {
    if (!status) return "pending";
    if (beatIndex < status.completedBeats) return "completed";
    if (beatIndex === status.currentBeatIndex) return "in_progress";
    return "pending";
  };

  const progress = status
    ? (status.completedBeats / Math.max(status.totalBeats, 1)) * 100
    : 0;

  const isExecuting = status && status.status === "DRAFTING";
  const isGluing = status && (status.status === "GLUING" || status.status === "POLISHING");
  const isPaused = status && status.status === "FAILED";
  const isCompleted = status && status.status === "COMPLETED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Script Execution</h2>
          <p className="text-sm text-slate-400">
            {status
              ? `${status.completedBeats} / ${status.totalBeats} beats completed`
              : "Ready to start execution"}
          </p>
        </div>
        <div className="flex gap-2">
          {!draftId && (
            <button
              onClick={handleStartExecution}
              disabled={startMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {startMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Execution
                </>
              )}
            </button>
          )}
          {isPaused && (
            <button
              onClick={handleResume}
              disabled={resumeMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resumeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resuming...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {status && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">
                {isExecuting && "Executing..."}
                {isGluing && "Ready for Glue phase"}
                {isPaused && "Paused (error occurred)"}
                {isCompleted && "Completed"}
              </span>
              <span className="text-slate-400">
                {Math.round(progress)}%
              </span>
            </div>
            <ProgressBar value={progress} />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {status.completedBeats} / {status.totalBeats} beats
              </span>
              <span>
                Status: {status.status.toLowerCase().replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Beat List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300">Beats</h3>
        <div className="space-y-2">
          {blueprint.beats.map((beat, index) => {
            const beatStatus = getBeatStatus(index);
            const isCurrent = status && index === status.currentBeatIndex;

            return (
              <div
                key={beat.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  isCurrent
                    ? "border-brand-500/50 bg-brand-950/30"
                    : "border-slate-800 bg-slate-900/60"
                }`}
              >
                <BeatStatusIndicator status={beatStatus} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {beat.index}. {beat.title}
                  </p>
                  <p className="text-xs text-slate-400">{beat.coreArgument}</p>
                </div>
                {isCurrent && isExecuting && (
                  <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed message */}
      {isCompleted && (
        <div className="rounded-lg border border-green-600/50 bg-green-950/30 p-4 text-center">
          <p className="text-sm font-semibold text-green-300">
            Script execution completed! Review the final script below.
          </p>
        </div>
      )}
    </div>
  );
}
