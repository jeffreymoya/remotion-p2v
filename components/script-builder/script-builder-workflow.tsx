"use client";

import { useState } from "react";
import { Blueprint, ScriptDraft } from "@/src/lib/storyflow/script-builder-types";
import { Script } from "@/src/lib/storyflow/types";
import { DurationPicker } from "./duration-picker";
import { BlueprintReview } from "./blueprint-review";
import { ExecutionProgress } from "./execution-progress";
import { ScriptPreview } from "../script/script-preview";
import { BeatRegeneration } from "./beat-regeneration";
import { GluePhase } from "./glue-phase";
import { HistoryPanel } from "./history-panel";
import { useToast } from "@/components/ui/toast-provider";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";

type WorkflowPhase = "input" | "blueprint" | "execution" | "glue" | "preview";

interface ScriptBuilderWorkflowProps {
  projectId: string;
  initialTopic: string | null;
  initialScript: Script | null;
}

export function ScriptBuilderWorkflow({
  projectId,
  initialTopic,
  initialScript,
}: ScriptBuilderWorkflowProps) {
  const [phase, setPhase] = useState<WorkflowPhase>(
    initialScript ? "preview" : "input"
  );
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [targetDuration, setTargetDuration] = useState(180000); // 3 minutes default
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [scriptDraft, setScriptDraft] = useState<ScriptDraft | null>(null);
  const [script, setScript] = useState<Script | null>(initialScript);
  const [loading, setLoading] = useState(false);
  const [segmenting, setSegmenting] = useState(false);
  const toast = useToast();

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
      setScript(finalScript);
      setPhase("preview");
      toast({ title: message ?? "Script segmented", variant: "success" });
    } catch (err) {
      console.error(err);
      toast({ title: "Network error creating segments", variant: "error" });
    } finally {
      setSegmenting(false);
    }
  };

  const handleBackToInput = () => {
    setPhase("input");
    setBlueprint(null);
    setScriptDraft(null);
  };

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
          <div className="space-y-2">
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
          </div>

          <DurationPicker value={targetDuration} onChange={setTargetDuration} />

          <button
            onClick={handleGenerateBlueprint}
            disabled={loading}
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
          <ScriptPreview script={script} />
          <div className="flex gap-3">
            <button
              onClick={() => setPhase("input")}
              className="rounded-md border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5"
            >
              Start New Script
            </button>
            <a
              href={`/projects/${projectId}`}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:-translate-y-0.5"
            >
              Continue to Assets
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
