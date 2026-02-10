"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { cn } from "@/src/lib/storyflow/utils";
import {
  PIPELINE_STAGE_META,
  PipelineStageId,
  STAGE_ORDER,
  getCurrentStage,
} from "@/src/lib/storyflow/stage-validation";
import { ProjectStatus } from "@/src/lib/storyflow/types";
import { EMPTY_NEEDS_REVIEW_STATE } from "@/src/lib/storyflow/stage-invalidation";
import { useStageInvalidationOptional } from "@/components/pipeline/stage-invalidation-context";

type StageState = {
  id: PipelineStageId;
  label: string;
  description: string;
  href: string;
  needsReview?: boolean;
};

type PipelineStepperProps = {
  projectId: string;
  status: ProjectStatus;
  needsReview?: Partial<Record<PipelineStageId, boolean>>;
};

function routeForStage(projectId: string, stage: PipelineStageId) {
  switch (stage) {
    case "script":
      return `/projects/${projectId}/script`;
    case "media":
      return `/projects/${projectId}/media`;
    case "storyboard":
      return `/projects/${projectId}/storyboard`;
    case "build":
      return `/projects/${projectId}/build`;
    case "render":
      return `/projects/${projectId}/render`;
  }
}

export function PipelineStepper({ projectId, status, needsReview }: PipelineStepperProps) {
  const invalidation = useStageInvalidationOptional();
  const currentStage = getCurrentStage(status);
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const needsReviewState =
    needsReview ?? invalidation?.needsReview ?? { ...EMPTY_NEEDS_REVIEW_STATE };

  const stages: StageState[] = STAGE_ORDER.map((stage) => ({
    id: PIPELINE_STAGE_META[stage].id,
    label: PIPELINE_STAGE_META[stage].label,
    description: PIPELINE_STAGE_META[stage].description,
    href: routeForStage(projectId, stage),
    needsReview: needsReviewState[stage],
  }));

  return (
    <nav
      aria-label="Project pipeline"
      data-onboarding="pipeline-stepper"
      className="w-full rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 shadow-inner backdrop-blur"
    >
      <ol className="flex flex-wrap items-center gap-4 lg:flex-nowrap">
        {stages.map((stage, index) => {
          const completed = index < currentIndex;
          const isCurrent = index === currentIndex;
          const locked = index > currentIndex;

          return (
            <li key={stage.id} className="flex min-w-[140px] flex-1 items-center gap-3">
              <Link
                href={locked ? "#" : stage.href}
                aria-disabled={locked}
                onClick={(event) => {
                  if (locked) event.preventDefault();
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition",
                  locked
                    ? "cursor-not-allowed border-slate-800 bg-slate-900/30 text-slate-600"
                    : isCurrent
                      ? "border-brand-500/60 bg-brand-500/10 text-white shadow-[0_0_0_1px_rgba(124,58,237,0.2)]"
                      : completed
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:border-emerald-400"
                        : "border-slate-800 bg-slate-900/40 text-slate-200 hover:border-slate-700"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                    locked && "border-slate-700 bg-slate-900/80 text-slate-600",
                    isCurrent && "border-brand-400/60 bg-brand-500/20 text-brand-50",
                    completed && "border-emerald-400/60 bg-emerald-500/20 text-emerald-50",
                    !locked && !isCurrent && !completed && "border-slate-700 bg-slate-900 text-slate-200"
                  )}
                >
                  {completed ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : locked ? (
                    <Lock className="h-4 w-4" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{stage.label}</span>
                    {stage.needsReview && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-amber-400"
                        title="Needs review"
                        aria-label="Needs review"
                      />
                    )}
                  </div>
                  <span className="line-clamp-1 text-xs text-slate-400">{stage.description}</span>
                </div>
              </Link>
              {index < stages.length - 1 && (
                <div className="hidden h-px flex-1 rounded bg-slate-800 lg:block" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
