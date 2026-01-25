"use client";

import { useMemo, useState } from "react";
import { Blueprint, ScriptDraft } from "@/src/lib/storyflow/script-builder-types";
import { Script } from "@/src/lib/storyflow/types";
import { WorkflowError } from "./workflow-error";
import { WorkflowPhase, WorkflowState } from "@/src/lib/storyflow/workflow-state";
import { DurationPicker } from "./duration-picker";
import { BlueprintReview } from "./blueprint-review";
import { ExecutionProgress } from "./execution-progress";
import { ScriptPreview } from "../script/script-preview";
import { BeatRegeneration } from "./beat-regeneration";
import { GluePhase } from "./glue-phase";
import { HistoryPanel } from "./history-panel";
import { useToast } from "@/components/ui/toast-provider";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { useStageInvalidation } from "@/components/pipeline/stage-invalidation-context";
import { SaveIndicator } from "@/components/ui/save-indicator";
import { useAutoSave } from "@/src/hooks/use-auto-save";

interface ScriptBuilderWorkflowProps {
  projectId: string;
  initialTopic: string | null;
  initialState: WorkflowState;
}

export function ScriptBuilderWorkflow({
  projectId,
  initialTopic,
  initialState,
}: ScriptBuilderWorkflowProps) {
  const [stateError, setStateError] = useState<string | null>(initialState.error);
  const [phase, setPhase] = useState<WorkflowPhase>(initialState.phase);
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [targetDuration, setTargetDuration] = useState(180000); // 3 minutes default
  const [blueprint, setBlueprint] = useState<Blueprint | null>(initialState.blueprint);
  const [scriptDraft, setScriptDraft] = useState<ScriptDraft | null>(initialState.scriptDraft);
  const [script, setScript] = useState<Script | null>(initialState.script);
  const [loading, setLoading] = useState(false);
  const [_segmenting, _setSegmenting] = useState(false);
  const [ttsState, setTtsState] = useState({
    running: false,
    completed: 0,
    total: initialState.script?.segments.length ?? 0,
    error: null as string | null,
  });
  const toast = useToast();
  const { registerScriptChange, registerEdit } = useStageInvalidation();
  const storageKey = useMemo(
    () => `storyflow:auto-save:project:${projectId}:builder-topic`,
    [projectId]
  );

  const handleResetState = () => {
    setStateError(null);
    setPhase("input");
    setBlueprint(null);
    setScriptDraft(null);
    setScript(null);
    setTtsState({ running: false, completed: 0, total: 0, error: null });
  };

  const persistTopic = async (payload: { topic: string }) => {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail =
        typeof body.error === "string"
          ? body.error
          : body.error?.topic?.[0] || "Failed to save topic";
      throw new Error(detail);
    }
  };

  const { status: saveStatus, lastSavedAt, error: saveError } = useAutoSave({
    data: { topic },
    saveFn: persistTopic,
    storageKey,
    debounceMs: 1500,
    enabled: topic.trim().length > 0,
    onError: (err) => toast({ title: err.message, variant: "error" }),
  });

  const handleGenerateBlueprint = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/script-builder/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          topic: topic.trim(),
          targetDurationMs: targetDuration,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail =
          typeof body.error === "string"
            ? body.error
            : body.error?.topic?.[0] || "Failed to generate blueprint";
        toast({ title: detail, variant: "error" });
        return;
      }

      const { blueprint: newBlueprint } = await res.json();
      setBlueprint(newBlueprint);
      setPhase("blueprint");
      toast({ title: "Blueprint generated", variant: "success" });
    } catch (err) {
      console.error(err);
      toast({ title: "Network error generating blueprint", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleBlueprintApproved = () => {
    setPhase("execution");
  };

  const handleBlueprintRegenerate = async () => {
    if (!blueprint) {
      await handleGenerateBlueprint();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/script-builder/blueprint/${blueprint.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rejectionNotes: blueprint.rejectionNotes ?? undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = typeof body.error === "string" ? body.error : "Failed to regenerate blueprint";
        toast({ title: detail, variant: "error" });
        return;
      }

      const { blueprint: newBlueprint, message } = await res.json();
      setBlueprint(newBlueprint);
      setScriptDraft(null);
      setScript(null);
      setPhase("blueprint");
      registerEdit("script", "structural");
      toast({ title: message ?? "Blueprint regenerated", variant: "success" });
    } catch (err) {
      console.error(err);
      toast({ title: "Network error regenerating blueprint", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleExecutionComplete = (completedDraft: ScriptDraft) => {
    setScriptDraft(completedDraft);
    setPhase("glue");
    toast({ title: "Execution finished. Run glue analysis before segmenting.", variant: "success" });
  };

  const handleSegmentDraft = async () => {
    if (!scriptDraft) return;
    setSegmenting(true);
    try {
      const res = await fetch("/api/script-builder/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: scriptDraft.id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail =
          typeof body.error === "string"
            ? body.error
            : body.error?.draftId?.[0] || "Failed to segment script";
        toast({ title: detail, variant: "error" });
        return;
      }

      const { script: finalScript, message } = await res.json();
      registerScriptChange(script, finalScript);
      setScript(finalScript);
      setPhase("preview");
      setTtsState({
        running: true,
        completed: 0,
        total: finalScript.segments.length,
        error: null,
      });
      toast({ title: message ?? "Script segmented", variant: "success" });

      await runTtsForScript(finalScript);
    } catch (err) {
      console.error(err);
      toast({ title: "Network error creating segments", variant: "error" });
    } finally {
      setSegmenting(false);
    }
  };

  const runTtsForScript = async (
    scriptToUse: Script,
    { force = false }: { force?: boolean } = {}
  ) => {
    const targets = scriptToUse.segments.filter((seg) => force || !seg.audioUrl);
    if (targets.length === 0) {
      setTtsState((prev) => ({
        ...prev,
        running: false,
        error: null,
        completed: prev.total || scriptToUse.segments.length,
      }));
      toast({ title: "All segments already have audio" });
      return;
    }

    setTtsState({ running: true, completed: 0, total: targets.length, error: null });

    try {
      for (let i = 0; i < targets.length; i++) {
        const seg = targets[i];
        const res = await fetch("/api/tts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            segmentIndex: seg.index,
            force,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const detail = typeof body.error === "string" ? body.error : "TTS failed";
          setTtsState({
            running: false,
            completed: i,
            total: targets.length,
            error: detail,
          });
          toast({ title: detail, variant: "error" });
          return;
        }

        const { segment: updated } = await res.json();
        setScript((prev) =>
          prev
            ? {
                ...prev,
                segments: prev.segments.map((s) =>
                  s.index === updated.index ? updated : s
                ),
              }
            : prev
        );
        setTtsState((prev) => ({ ...prev, completed: prev.completed + 1 }));
      }

      setTtsState((prev) => ({ ...prev, running: false, error: null }));
      toast({ title: force ? "Audio regenerated" : "Audio generated", variant: "success" });
    } catch (error) {
      console.error(error);
      setTtsState({
        running: false,
        completed: 0,
        total: targets.length,
        error: "Network error generating audio",
      });
      toast({ title: "Network error generating audio", variant: "error" });
    }
  };

  const handleBackToInput = () => {
    setPhase("input");
    setBlueprint(null);
    setScriptDraft(null);
  };

  if (stateError) {
    return <WorkflowError error={stateError} onReset={handleResetState} />;
  }

  return (
    <div className="space-y-6">
      {/* Phase Indicator */}
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-4">
          <PhaseIndicator
            label="1. Topic"
            active={phase === "input"}
            completed={phase !== "input"}
          />
          <PhaseIndicator
            label="2. Blueprint"
            active={phase === "blueprint"}
            completed={phase === "execution" || phase === "preview"}
          />
          <PhaseIndicator
            label="3. Execute"
            active={phase === "execution"}
            completed={phase === "glue" || phase === "preview"}
          />
          <PhaseIndicator
            label="4. Glue"
            active={phase === "glue"}
            completed={phase === "preview"}
          />
          <PhaseIndicator label="5. Preview" active={phase === "preview"} completed={false} />
        </div>
        {phase !== "input" && (
          <button
            onClick={handleBackToInput}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Topic
          </button>
        )}
      </div>

      {/* Phase 1: Topic Input */}
      {phase === "input" && (
        <div className="space-y-6">
          <div className="space-y-2" data-onboarding="script-input">
            <label className="text-sm font-medium text-slate-200">Topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. When Fandom Goes Too Far: The Psychology of Toxic Fan Culture"
              rows={6}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-white shadow-inner shadow-black/20 focus:border-brand-500 focus:outline-none font-mono text-sm resize-vertical"
              disabled={loading}
            />
            <p className="text-xs text-slate-400">
              This topic will be used to generate an engagement-focused blueprint with narrative beats.
            </p>
            <div data-onboarding="save-indicator">
              <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} error={saveError} />
            </div>
          </div>

          <DurationPicker value={targetDuration} onChange={setTargetDuration} />

          <button
            onClick={handleGenerateBlueprint}
            disabled={loading}
            data-onboarding="ai-generate"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Blueprint...
              </>
            ) : (
              <>
                Generate Blueprint
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Phase 2: Blueprint Review */}
      {phase === "blueprint" && blueprint && (
        <div className="space-y-4">
          <BlueprintReview
            blueprint={blueprint}
            onApproved={handleBlueprintApproved}
            onRegenerate={handleBlueprintRegenerate}
          />
          <HistoryPanel blueprintId={blueprint.id} />
        </div>
      )}

      {/* Phase 3: Execution Progress */}
      {phase === "execution" && blueprint && (
        <div className="space-y-4">
          <ExecutionProgress
            blueprint={blueprint}
            scriptDraftId={scriptDraft?.id ?? null}
            projectId={projectId}
            onComplete={handleExecutionComplete}
          />
          <HistoryPanel blueprintId={blueprint.id} draftId={scriptDraft?.id ?? null} />
        </div>
      )}

      {/* Phase 4: Glue Phase */}
      {phase === "glue" && scriptDraft && (
        <div className="space-y-4">
          <BeatRegeneration
            scriptDraft={scriptDraft}
            onDraftUpdated={(draft) => setScriptDraft(draft)}
          />
          <GluePhase
            scriptDraft={scriptDraft}
            onDraftUpdated={(draft) => setScriptDraft(draft)}
            onSegment={handleSegmentDraft}
            onSkip={() => setPhase("preview")}
          />
          <HistoryPanel blueprintId={scriptDraft.blueprintId} draftId={scriptDraft.id} />
        </div>
      )}

      {/* Phase 4: Final Script Preview */}
      {phase === "preview" && script && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">TTS Audio</p>
                <p className="text-xs text-slate-400">
                  Audio runs automatically after segmentation. Regenerate if you change pacing or voice.
                </p>
                <p className="text-xs text-slate-400">
                  {ttsState.completed} / {ttsState.total || script.segments.length} segments processed.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => runTtsForScript(script)}
                  disabled={ttsState.running}
                  className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {ttsState.running ? "Generating…" : "Generate Audio"}
                </button>
                <button
                  onClick={() => runTtsForScript(script, { force: true })}
                  disabled={ttsState.running}
                  className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow hover:-translate-y-0.5 disabled:opacity-60"
                >
                  Regenerate All
                </button>
              </div>
            </div>
            {(ttsState.running || ttsState.completed > 0 || ttsState.error) && (
              <div className="mt-3 space-y-2">
                <ProgressBar
                  value={
                    (ttsState.completed /
                      Math.max(ttsState.total || script.segments.length, 1)) *
                    100
                  }
                />
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {ttsState.completed} / {ttsState.total || script.segments.length} segments
                  </span>
                  {ttsState.error ? <span className="text-rose-300">{ttsState.error}</span> : null}
                </div>
              </div>
            )}
          </div>

          <ScriptPreview script={script} />
          <div className="flex gap-3">
            <button
              onClick={() => setPhase("input")}
              className="rounded-md border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5"
            >
              Start New Script
            </button>
            <a
              href={`/projects/${projectId}/media`}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:-translate-y-0.5"
            >
              Continue to Media
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

interface PhaseIndicatorProps {
  label: string;
  active: boolean;
  completed: boolean;
}

function PhaseIndicator({ label, active, completed }: PhaseIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
          active
            ? "bg-brand-600 text-white"
            : completed
              ? "bg-green-600 text-white"
              : "bg-slate-800 text-slate-400"
        }`}
      >
        {completed ? "✓" : label.charAt(0)}
      </div>
      <span
        className={`text-sm font-medium ${
          active ? "text-white" : completed ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
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
