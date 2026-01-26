"use client";

import { useEffect, useMemo, useState } from "react";
import { GlueIssue, ScriptDraft } from "@/src/lib/storyflow/script-builder-types";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/src/lib/storyflow/utils";
import {
  Loader2,
  Sparkles,
  Wand2,
  Save,
  SkipForward,
  RefreshCcw,
  CheckCircle2,
} from "lucide-react";
import { useAnalyzeGlue, useSavePolishedText } from "@/src/hooks/queries/use-execution-status";
import { useBackgroundActivity } from "@/components/ui/background-activity-provider";

const typeStyles: Record<string, { color: string; label: string }> = {
  robot_word: { color: "bg-amber-500/20 text-amber-200", label: "Robot word" },
  seam: { color: "bg-indigo-500/20 text-indigo-200", label: "Seam" },
  repetition: { color: "bg-rose-500/20 text-rose-200", label: "Repetition" },
  pacing: { color: "bg-sky-500/20 text-sky-200", label: "Pacing" },
};

function HighlightOverlay({
  text,
  issues,
  scrollTop = 0,
  scrollLeft = 0
}: {
  text: string;
  issues: GlueIssue[];
  scrollTop?: number;
  scrollLeft?: number;
}) {
  const spans = useMemo(() => {
    if (!issues.length) return [{ text, highlight: null as GlueIssue | null }];

    const sortedIssues = [...issues].sort((a, b) => a.location.charStart - b.location.charStart);
    const segments: Array<{ text: string; highlight: GlueIssue | null }> = [];
    let cursor = 0;

    sortedIssues.forEach((issue) => {
      const { charStart, charEnd } = issue.location;
      if (charStart > cursor) {
        segments.push({ text: text.slice(cursor, charStart), highlight: null });
      }
      segments.push({ text: text.slice(charStart, charEnd), highlight: issue });
      cursor = charEnd;
    });

    if (cursor < text.length) {
      segments.push({ text: text.slice(cursor), highlight: null });
    }

    return segments;
  }, [issues, text]);

  return (
    <div
      className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words rounded-md border border-slate-800 bg-slate-900/80 px-3 py-2 font-mono text-sm leading-relaxed text-slate-100"
      style={{
        transform: `translate(-${scrollLeft}px, -${scrollTop}px)`,
      }}
      aria-hidden
    >
      {spans.map((segment, idx) => {
        if (!segment.highlight) return <span key={idx}>{segment.text}</span>;
        const styles = typeStyles[segment.highlight.type] ?? { color: "bg-brand-500/20 text-white", label: segment.highlight.type };
        return (
          <mark
            key={idx}
            className={cn("rounded-sm px-0.5 py-0.5", styles.color, segment.highlight.resolved && "opacity-40 line-through")}
          >
            {segment.text}
          </mark>
        );
      })}
    </div>
  );
}

interface GluePhaseProps {
  projectId: string;
  scriptDraft: ScriptDraft;
  onDraftUpdated: (draft: ScriptDraft) => void;
  onSegment: () => Promise<void> | void;
  onSkip?: () => void;
}

export function GluePhase({ projectId, scriptDraft, onDraftUpdated, onSegment, onSkip }: GluePhaseProps) {
  const toast = useToast();
  const analyzeMutation = useAnalyzeGlue();
  const saveMutation = useSavePolishedText();
  const { isTaskRunning } = useBackgroundActivity();

  const [text, setText] = useState<string>(
    scriptDraft.polishedText ?? (scriptDraft.beatDrafts as any[]).map((b: any) => b.text).join("\n\n")
  );
  const [issues, setIssues] = useState<GlueIssue[]>(() => (scriptDraft.glueIssues as GlueIssue[]) ?? []);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const warningCount = issues.filter((i) => i.severity === "warning" && !i.resolved).length;
  const errorCount = issues.filter((i) => i.severity === "error" && !i.resolved).length;
  const isSegmenting = isTaskRunning("script-segmentation", projectId);

  const toggleResolved = (id: string) => {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, resolved: !issue.resolved } : issue)));
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const fixRobotWords = () => {
    let updatedText = text;
    const robotIssues = issues.filter((i) => i.type === "robot_word");
    // Sort descending to avoid shifting indices
    robotIssues
      .sort((a, b) => b.location.charStart - a.location.charStart)
      .forEach((issue) => {
        updatedText =
          updatedText.slice(0, issue.location.charStart) + updatedText.slice(issue.location.charEnd);
      });
    setText(updatedText.trim());
    setIssues((prev) => prev.map((i) => (i.type === "robot_word" ? { ...i, resolved: true } : i)));
    toast({ title: "Robot words removed", variant: "success" });
  };

  const runAnalysis = () => {
    analyzeMutation.mutate(scriptDraft.id, {
      onSuccess: (data) => {
        setText(data.polishedText ?? text);
        setIssues((data.issues as GlueIssue[]) ?? []);
        toast({ title: "Glue analysis complete", variant: "success" });
      },
      onError: (error) => {
        toast({ title: error.message || "Glue analysis failed", variant: "error" });
      },
    });
  };

  const handleSave = (segmentAfterSave = false) => {
    saveMutation.mutate(
      {
        draftId: scriptDraft.id,
        polishedText: text,
        resolvedIssues: issues.filter((i) => i.resolved).map((i) => i.id),
      },
      {
        onSuccess: async (data) => {
          onDraftUpdated(data.draft);
          toast({ title: data.message || "Polished text saved", variant: "success" });
          if (segmentAfterSave) {
            await onSegment();
          }
        },
        onError: (error) => {
          toast({ title: error.message || "Failed to save", variant: "error" });
        },
      }
    );
  };

  useEffect(() => {
    if (!issues.length && !analyzeMutation.isPending) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Glue Phase · Polish your script</h2>
          <p className="text-sm text-slate-400">Fix robot words, seams, and pacing before segmentation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1">Warnings: {warningCount}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1">Errors: {errorCount}</span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-400" />
            <span>Inline editor with issue highlights</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={runAnalysis}
              disabled={analyzeMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-brand-500 hover:text-brand-200 disabled:opacity-60"
            >
              {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Re-run analysis
            </button>
            <button
              onClick={fixRobotWords}
              className="inline-flex items-center gap-2 rounded-md border border-amber-600/60 bg-amber-600/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:border-amber-400 hover:bg-amber-500/20"
            >
              <Wand2 className="h-4 w-4" />
              Remove robot words
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <HighlightOverlay
            text={text}
            issues={issues.filter((i) => !i.resolved)}
            scrollTop={scrollTop}
            scrollLeft={scrollLeft}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onScroll={handleScroll}
            className="relative z-10 h-80 w-full rounded-md border border-slate-800 bg-transparent px-3 py-2 font-mono text-sm leading-relaxed text-transparent caret-white selection:bg-brand-500/30 focus:border-brand-500 focus:outline-none"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <span>Click an issue to mark it resolved after editing.</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {issues.map((issue) => {
            const styles = typeStyles[issue.type] ?? { color: "bg-slate-700 text-slate-200", label: issue.type };
            return (
              <button
                key={issue.id}
                onClick={() => toggleResolved(issue.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-3 text-left transition",
                  issue.resolved ? "opacity-50 ring-1 ring-green-500/40" : "hover:border-brand-500/50 hover:bg-brand-500/5"
                )}
              >
                <span className={cn("mt-0.5 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide", styles.color)}>
                  {styles.label}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-white line-clamp-2">{issue.text ?? "Highlighted text"}</p>
                  <p className="text-xs text-slate-400">Beat {issue.location.beatIndex} · chars {issue.location.charStart}–{issue.location.charEnd}</p>
                  {issue.suggestion && (
                    <p className="text-xs text-slate-500">Suggestion: {issue.suggestion}</p>
                  )}
                  {issue.resolved && <span className="text-[11px] font-semibold text-green-400">Marked resolved</span>}
                </div>
              </button>
            );
          })}
          {issues.length === 0 && (
            <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
              No glue issues detected. You can still tweak the script before segmenting.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleSave(true)}
          disabled={saveMutation.isPending || isSegmenting}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save & Continue to Segmentation
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Save only
        </button>
        <button
          onClick={async () => {
            if (onSkip) onSkip();
            await onSegment();
          }}
          disabled={isSegmenting}
          className="inline-flex items-center gap-2 rounded-md border border-amber-600/60 bg-amber-600/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <SkipForward className="h-4 w-4" />
          Skip Glue
        </button>
      </div>
    </div>
  );
}
