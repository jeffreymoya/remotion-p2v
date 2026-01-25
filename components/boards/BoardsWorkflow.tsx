"use client";

import { useState } from "react";
import Link from "next/link";
import { Asset, Board, Script } from "@/src/lib/storyflow/types";
import { BoardPlannerWizard } from "./BoardPlannerWizard";
import { SimpleBoardsEditor } from "../editors/boards/simple-boards-editor";
import { Button } from "@/components/ui/button";

interface BoardsWorkflowProps {
  projectId: string;
  script: Script | null;
  images: Asset[];
  initialBoards: Board[];
}

type WorkflowMode = "ai" | "manual";

export function BoardsWorkflow({ projectId, script, images, initialBoards }: BoardsWorkflowProps) {
  const [mode, setMode] = useState<WorkflowMode>("ai");

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={mode === "ai" ? "default" : "outline"}
          onClick={() => setMode("ai")}
          className="gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          AI Workflow
        </Button>
        <Button
          size="sm"
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
          className="gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          Manual Editor
        </Button>
      </div>

      {/* Workflow Content */}
      {mode === "ai" ? (
        <div className="space-y-6">
          {script && script.segments.length > 0 ? (
            <BoardPlannerWizard projectId={projectId} script={script} />
          ) : (
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-6">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="mb-1 font-semibold text-amber-300">Script Required</h3>
                  <p className="text-sm text-slate-400">
                    You need to generate a script first before using the AI workflow. Go to the{" "}
                    <strong>Script</strong> step to create one.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <SimpleBoardsEditor projectId={projectId} images={images} initialBoards={initialBoards} />

          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            <p className="font-semibold text-slate-100">Asset mapping now lives in Media.</p>
            <p className="mt-1">
              Map images to script segments from the Media stage so mappings stay the single source of truth
              for downstream boards and build steps.
            </p>
            <Link
              href={`/projects/${projectId}/media`}
              className="mt-3 inline-flex w-fit items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow shadow-brand-600/30 transition hover:bg-brand-500"
            >
              Go to Media
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
