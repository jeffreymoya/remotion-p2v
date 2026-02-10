"use client";

import Link from "next/link";
import { BoardPlan } from "@/src/lib/boards-types";
import { cn } from "@/src/lib/storyflow/utils";

interface BoardPlanViewProps {
  plan: BoardPlan;
  projectId?: string;
  className?: string;
}

export function BoardPlanView({ plan, projectId, className }: BoardPlanViewProps) {
  const mediaHref = projectId ? `/projects/${projectId}/media#create` : "/projects";

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">Total Boards</div>
          <div className="mt-1 text-2xl font-bold text-brand-400">{plan.boards.length}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">Total Segments</div>
          <div className="mt-1 text-2xl font-bold text-slate-200">{plan.totalSegments}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">Total Duration</div>
          <div className="mt-1 text-2xl font-bold text-slate-200">
            {formatDuration(plan.totalDurationMs)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">Avg per Board</div>
          <div className="mt-1 text-2xl font-bold text-slate-300">
            {formatDuration(plan.totalDurationMs / plan.boards.length)}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-sm text-amber-100">
        Board images live in Media → Create & Upload. If you see missing images in Storyboard, upload them there and re-run region detection.
        <div className="mt-2">
          <Link href={mediaHref} className="font-semibold text-amber-50 underline underline-offset-4">
            Go to Media for this project
          </Link>
        </div>
      </div>

      {/* Board Details */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Board Breakdown</h3>
        <div className="space-y-2">
          {plan.boards.map((board, index) => (
            <div
              key={board.boardId}
              className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 transition hover:border-brand-500/40"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-900/40 text-sm font-bold text-brand-300">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{board.boardId}</div>
                    <div className="text-xs text-slate-400">
                      {board.segmentIndices.length} segments · {formatDuration(board.totalDurationMs)}
                    </div>
                  </div>
                </div>
                <div className="rounded-md bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                  Segments {board.segmentIndices[0]} - {board.segmentIndices[board.segmentIndices.length - 1]}
                </div>
              </div>

              {board.topicSummary && (
                <div className="mt-3 rounded-md border border-slate-800 bg-slate-900/60 p-3">
                  <div className="mb-1 text-xs uppercase tracking-wider text-slate-400">Topic</div>
                  <p className="text-sm leading-relaxed text-slate-300">{board.topicSummary}</p>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1">
                {board.segmentIndices.map((segIdx) => (
                  <span
                    key={segIdx}
                    className="rounded-md bg-slate-800/70 px-2 py-1 text-[10px] font-medium text-slate-400"
                  >
                    #{segIdx}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Generated: {new Date(plan.generatedAt).toLocaleString()}</span>
          <span>Version: {plan.version}</span>
        </div>
      </div>
    </div>
  );
}
