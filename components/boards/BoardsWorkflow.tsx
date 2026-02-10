"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Asset } from "@/src/lib/storyflow/types";
import { SimpleBoardsEditor } from "../editors/boards/simple-boards-editor";
import type { Board } from "@/src/lib/api/boards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BoardsWorkflowProps {
  projectId: string;
  images: Asset[];
  initialBoards: Board[];
}

const disabledCopy =
  "Available after the image storage migration (Phase 3). Generate prompts and upload board images in Media, then return here to run regions/triggers/viewport.";

export function BoardsWorkflow({ projectId, images, initialBoards }: BoardsWorkflowProps) {
  const [selectedBoardId, setSelectedBoardId] = useState<string>(initialBoards[0]?.id ?? "");

  const boards = useMemo(
    () => initialBoards.map((board, index) => ({ ...board, label: board.title ?? `Board ${index + 1}` })),
    [initialBoards]
  );

  const hasBoards = boards.length > 0;

  return (
    <div className="space-y-6">
      <Alert className="border-brand-500/40 bg-brand-900/20">
        <AlertTitle className="text-brand-100">Prompts now live in Media</AlertTitle>
        <AlertDescription className="space-y-2 text-slate-200">
          <p>Generate prompts and upload board images from the Media step (&quot;Create & Upload&quot; tab).</p>
          <p>Return here to edit regions, triggers, and viewport once images are uploaded.</p>
          <Link
            href={`/projects/${projectId}/media`}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow shadow-brand-600/30 transition hover:bg-brand-500"
          >
            Go to Media
          </Link>
        </AlertDescription>
      </Alert>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">Storyboard operations</p>
            <p className="text-xs text-slate-400">Standalone actions unlock after the Phase 3 image migration.</p>
          </div>
          <div className="w-full max-w-xs">
            <Select
              value={selectedBoardId}
              onValueChange={setSelectedBoardId}
              disabled={!hasBoards}
              className="w-full"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select board" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TooltipProvider>
          <div className="flex flex-wrap gap-3">
            {["Detect regions", "Generate triggers", "Build viewport"].map((label) => (
              <Tooltip key={label}>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button type="button" size="sm" variant="outline" disabled>
                      {label}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{disabledCopy}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {!hasBoards && (
          <p className="text-xs text-slate-400">
            No boards yet. Generate a board plan and upload images in Media, then reopen Storyboard to run these
            actions.
          </p>
        )}
      </div>

      <SimpleBoardsEditor projectId={projectId} images={images} initialBoards={initialBoards} />
    </div>
  );
}
