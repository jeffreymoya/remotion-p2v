"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { RefinementResponse } from "@/app/api/ai/refine/route";

type Props = {
  projectId: string;
  initialTopic: string | null;
  onRefinementComplete?: (refinement: RefinementResponse) => void;
};

export function TopicRefinement({
  projectId,
  initialTopic,
  onRefinementComplete,
}: Props) {
  const [title, setTitle] = useState(initialTopic ?? "");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("ages 20-40");
  const [loading, setLoading] = useState(false);
  const [refinement, setRefinement] = useState<RefinementResponse | null>(null);
  const toast = useToast();

  const handleRefine = async () => {
    if (!title.trim()) {
      toast({ title: "Topic title is required", variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          description: description.trim() || undefined,
          targetAudience,
          minDuration: 60,
          maxDuration: 600,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail =
          typeof body.error === "string"
            ? body.error
            : body.error?.title?.[0] || "Failed to refine topic";
        toast({ title: detail, variant: "error" });
        return;
      }

      const data: RefinementResponse = await res.json();
      setRefinement(data);
      toast({
        title: "Topic refined successfully",
        variant: "success",
      });
      onRefinementComplete?.(data);
    } catch (err) {
      console.error(err);
      toast({ title: "Network error refining topic", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRefinement(null);
    setTitle(initialTopic ?? "");
    setDescription("");
    setTargetAudience("ages 20-40");
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      {!refinement && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Topic Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your video topic"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what you want to cover"
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., ages 20-40, tech enthusiasts"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleRefine}
            disabled={loading || !title.trim()}
            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Refining...
              </>
            ) : (
              "Refine Topic"
            )}
          </button>
        </div>
      )}

      {/* Refinement Results */}
      {refinement && (
        <div className="space-y-4">
          {/* Header with Reset Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Refined Topic Analysis
            </h3>
            <button
              onClick={handleReset}
              className="text-sm text-brand-400 hover:text-brand-300 transition"
            >
              Start Over
            </button>
          </div>

          {/* Refined Title */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
              Refined Title
            </p>
            <h4 className="text-xl font-semibold text-white">
              {refinement.refinedTitle}
            </h4>
          </div>

          {/* Description */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
              Description
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {refinement.refinedDescription}
            </p>
          </div>

          {/* Target Audience */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
              Target Audience
            </p>
            <p className="text-sm text-slate-300">{refinement.targetAudience}</p>
          </div>

          {/* Key Angles */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              Key Angles ({refinement.keyAngles.length})
            </p>
            <ul className="space-y-2">
              {refinement.keyAngles.map((angle, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-xs font-semibold text-brand-400">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{angle}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hooks */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              Attention Hooks ({refinement.hooks.length})
            </p>
            <ul className="space-y-2">
              {refinement.hooks.map((hook, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 text-brand-400">•</span>
                  <span className="leading-relaxed italic">{hook}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Duration and Reasoning */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                Suggested Duration
              </p>
              <p className="text-2xl font-semibold text-white">
                {Math.floor(refinement.suggestedDuration / 60)}:
                {String(refinement.suggestedDuration % 60).padStart(2, "0")}
                <span className="ml-2 text-sm font-normal text-slate-400">
                  ({refinement.suggestedDuration}s)
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                AI Reasoning
              </p>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                {refinement.reasoning}
              </p>
            </div>
          </div>

          {/* Success Message */}
          <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-4">
            <p className="text-sm text-emerald-400">
              ✓ Topic has been refined and saved to your project. You can now proceed to
              generate the script using the refined title and insights.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
