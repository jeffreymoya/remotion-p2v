"use client";

import { useEffect, useMemo, useState } from "react";
import { Script } from "@/src/lib/storyflow/types";
import { ScriptPreview } from "./script-preview";
import { useToast } from "@/components/ui/toast-provider";

type Props = {
  projectId: string;
  initialTopic: string | null;
  initialScript: Script | null;
};

export function ScriptGenerator({ projectId, initialTopic, initialScript }: Props) {
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [script, setScript] = useState<Script | null>(initialScript);
  const [loading, setLoading] = useState(false);
  const [ttsState, setTtsState] = useState({
    running: false,
    completed: 0,
    total: initialScript?.segments.length ?? 0,
    error: null as string | null,
  });
  const toast = useToast();

  useEffect(() => {
    setTtsState((prev) => ({
      ...prev,
      completed: 0,
      total: script?.segments.length ?? 0,
      error: null,
      running: false,
    }));
  }, [script?.id, script?.segments.length]);

  const readySegments = useMemo(
    () => script?.segments.filter((s) => !!s.audioUrl).length ?? 0,
    [script]
  );

  const trigger = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", variant: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          topic: topic.trim(),
          regenerate: !!script,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail =
          typeof body.error === "string"
            ? body.error
            : body.error?.topic?.[0] || "Failed to generate script";
        toast({ title: detail, variant: "error" });
        return;
      }
      const { script: next } = await res.json();
      setScript(next);
      toast({
        title: script ? "Script regenerated" : "Script generated",
        variant: "success",
      });
      setTtsState((prev) => ({
        ...prev,
        completed: 0,
        total: next.segments.length,
        error: null,
        running: false,
      }));
    } catch (err) {
      console.error(err);
      toast({ title: "Network error generating script", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const runTTS = async (force = false) => {
    if (!script) {
      toast({ title: "Generate the script first", variant: "error" });
      return;
    }
    const targets = script.segments.filter((seg) => force || !seg.audioUrl);
    if (targets.length === 0) {
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
        setTtsState((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      }

      setTtsState((prev) => ({ ...prev, running: false }));
      toast({
        title: force ? "Audio regenerated" : "Audio generated",
        variant: "success",
      });
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">Topic</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Latest breakthroughs in fusion energy"
          rows={6}
          className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-white shadow-inner shadow-black/20 focus:border-brand-500 focus:outline-none font-mono text-sm resize-vertical"
          disabled={loading}
        />
        <p className="text-xs text-slate-400">
          This topic seeds the AI script. You can adjust it before generating.
        </p>
      </div>

      {!script ? (
        <button
          onClick={trigger}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate Script"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">TTS Audio</p>
                <p className="text-xs text-slate-400">
                  Generate audio for each segment and capture word-level timings.
                </p>
                <p className="text-xs text-slate-400">
                  {readySegments} / {script.segments.length} segments have audio.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => runTTS(false)}
                  disabled={ttsState.running}
                  className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {ttsState.running ? "Generating…" : "Generate Audio"}
                </button>
                <button
                  onClick={() => runTTS(true)}
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
                  value={(ttsState.completed / Math.max(ttsState.total, 1)) * 100}
                />
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {ttsState.completed} / {ttsState.total} segments
                  </span>
                  {ttsState.error ? (
                    <span className="text-rose-300">{ttsState.error}</span>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <ScriptPreview script={script} />
          <div className="flex gap-3">
            <button
              onClick={trigger}
              disabled={loading}
              className="rounded-md border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? "Regenerating…" : "Regenerate"}
            </button>
            <a
              href={`/projects/${projectId}`}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5"
            >
              Back to project
            </a>
          </div>
        </div>
      )}
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
