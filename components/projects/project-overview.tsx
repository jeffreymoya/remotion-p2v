"use client";

import { useState } from "react";
import Link from "next/link";
import { TopicRefinement } from "./topic-refinement";
import { StatusBadge } from "./status-badge";
import { RefinementResponse } from "@/app/api/ai/refine/route";

type Props = {
  projectId: string;
  projectName: string;
  topic: string | null;
  status: string;
  hasRefinement: boolean;
};

export function ProjectOverview({
  projectId,
  projectName,
  topic,
  status,
  hasRefinement: initialHasRefinement,
}: Props) {
  const [showRefinement, setShowRefinement] = useState(!initialHasRefinement);
  const [hasRefinement, setHasRefinement] = useState(initialHasRefinement);

  const handleRefinementComplete = (refinement: RefinementResponse) => {
    setHasRefinement(true);
    setShowRefinement(false);
  };

  return (
    <div className="space-y-6">
      {/* Refinement Section */}
      {!hasRefinement || showRefinement ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Refine Your Topic
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                AI-powered topic analysis to optimize your video for engagement
              </p>
            </div>
            {hasRefinement && (
              <button
                onClick={() => setShowRefinement(false)}
                className="text-sm text-slate-400 hover:text-white transition"
              >
                Skip
              </button>
            )}
          </div>
          <TopicRefinement
            projectId={projectId}
            initialTopic={topic}
            onRefinementComplete={handleRefinementComplete}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950/50 text-emerald-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Topic Refined</p>
                <p className="text-sm text-slate-400">
                  Your topic has been analyzed and optimized
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRefinement(true)}
              className="text-sm text-brand-400 hover:text-brand-300 transition"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Workflow Actions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300 space-y-3">
        <p>
          Continue the workflow: {!hasRefinement ? "refine your topic, then " : ""}
          generate the script, then upload assets. Your current status is{" "}
          <StatusBadge status={status as any} />.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/projects/${projectId}/script`}
            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5"
          >
            Go to Script
          </Link>
          <Link
            href={`/projects/${projectId}/assets`}
            className="inline-flex items-center justify-center rounded-md border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
          >
            Manage Assets
          </Link>
          <Link
            href={`/projects/${projectId}/boards`}
            className="inline-flex items-center justify-center rounded-md border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
          >
            Boards Pipeline
          </Link>
        </div>
      </div>
    </div>
  );
}
