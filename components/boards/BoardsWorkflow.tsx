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
import {
  useBoardPrompts,
  useBuildViewport,
  useDetectBoardRegions,
  useGenerateBoardTriggers,
} from "@/src/hooks/queries/use-boards";
import { useBackgroundTask } from "@/src/hooks/use-background-task";
import { useToast } from "@/components/ui/toast-provider";
import type { BoardPrompt, BoardPromptsOutput } from "@/src/lib/boards-types";

interface BoardsWorkflowProps {
  projectId: string;
  images: Asset[];
  initialBoards: Board[];
}

type BoardWithPlan = Board & { plan?: unknown; assetId?: string | null; title?: string };

function extractBoardPlanId(board: BoardWithPlan): string | null {
  if (!board.plan || typeof board.plan !== "object") return null;
  const plan = board.plan as { boardId?: unknown };
  return typeof plan.boardId === "string" ? plan.boardId : null;
}

function resolvePrompt(board: BoardWithPlan, prompts: BoardPromptsOutput): BoardPrompt | null {
  const boardIdFromPlan = extractBoardPlanId(board);
  if (boardIdFromPlan) {
    const byBoardId = prompts.prompts.find((prompt) => prompt.boardId === boardIdFromPlan);
    if (byBoardId) return byBoardId;
  }

  if (board.index >= 0 && board.index < prompts.prompts.length) {
    return prompts.prompts[board.index];
  }

  return null;
}

function resolveBoardAsset(board: BoardWithPlan, images: Asset[]): Asset | null {
  if (!board.assetId) return null;
  const byId = images.find((image) => image.id === board.assetId);
  return byId ?? null;
}

export function BoardsWorkflow({ projectId, images, initialBoards }: BoardsWorkflowProps) {
  const toast = useToast();
  const { runTask, isTaskRunning } = useBackgroundTask();
  const hasInitialBoards = initialBoards.length > 0;
  const [selectedBoardId, setSelectedBoardId] = useState<string>(initialBoards[0]?.id ?? "");
  const promptsQuery = useBoardPrompts(projectId, hasInitialBoards);
  const detectRegionsMutation = useDetectBoardRegions(projectId);
  const triggersMutation = useGenerateBoardTriggers(projectId);
  const viewportMutation = useBuildViewport(projectId);

  const boards = useMemo(
    () => initialBoards.map((board, index) => ({ ...(board as BoardWithPlan), label: `Board ${index + 1}` })),
    [initialBoards]
  );

  const hasBoards = boards.length > 0;
  const selectedBoard = useMemo(
    () => boards.find((board) => board.id === selectedBoardId) ?? null,
    [boards, selectedBoardId]
  );
  const selectedPrompt = useMemo(() => {
    if (!selectedBoard || !promptsQuery.data) return null;
    return resolvePrompt(selectedBoard, promptsQuery.data);
  }, [selectedBoard, promptsQuery.data]);
  const selectedAsset = useMemo(
    () => (selectedBoard ? resolveBoardAsset(selectedBoard, images) : null),
    [images, selectedBoard]
  );

  const regionBlockedReason = useMemo(() => {
    if (!hasBoards) return "Generate a board plan in Media before running storyboard operations.";
    if (!selectedBoard) return "Select a board first.";
    if (!selectedPrompt) return "Generate board prompts in Media before detecting regions.";
    if (!selectedAsset) return "Upload a linked board image in Media before detecting regions.";
    return null;
  }, [hasBoards, selectedAsset, selectedBoard, selectedPrompt]);

  const detectRunning =
    detectRegionsMutation.isPending || isTaskRunning("board-region-detection", projectId);
  const triggersRunning =
    triggersMutation.isPending || isTaskRunning("board-triggers-generation", projectId);
  const viewportRunning =
    viewportMutation.isPending || isTaskRunning("board-viewport-build", projectId);
  const operationsBusy = detectRunning || triggersRunning || viewportRunning;

  const handleDetectRegions = async () => {
    if (!selectedBoard || !selectedPrompt || !selectedAsset) return;

    const result = await runTask(
      {
        projectId,
        category: "board-region-detection",
        name: "Detecting board regions",
        icon: "cog",
      },
      async ({ signal }) =>
        detectRegionsMutation.mutateAsync({
          payload: {
            boardId: selectedPrompt.boardId,
            assetId: selectedAsset.id,
            elements: selectedPrompt.elements,
            gridLayout: selectedPrompt.gridLayout,
          },
          signal,
        })
    );

    if (result) {
      toast({
        title: "Regions detected",
        description: `${result.regions.length} regions mapped for ${selectedPrompt.boardId}.`,
        variant: "success",
      });
    }
  };

  const handleGenerateTriggers = async () => {
    const result = await runTask(
      {
        projectId,
        category: "board-triggers-generation",
        name: "Generating camera triggers",
        icon: "cog",
      },
      async ({ signal }) =>
        triggersMutation.mutateAsync({
          payload: {},
          signal,
        })
    );

    if (result) {
      toast({
        title: "Triggers generated",
        description: `${result.totalTriggers} triggers across ${result.totalWords} words.`,
        variant: "success",
      });
    }
  };

  const handleBuildViewport = async () => {
    const result = await runTask(
      {
        projectId,
        category: "board-viewport-build",
        name: "Building viewport animation",
        icon: "film",
      },
      async ({ signal }) =>
        viewportMutation.mutateAsync({
          payload: { fps: 30 },
          signal,
        })
    );

    if (result) {
      const keyframeCount = result.viewportJson?.keyframes?.length ?? 0;
      toast({
        title: "Viewport built",
        description: `${keyframeCount} keyframes generated for preview and render.`,
        variant: "success",
      });
    }
  };

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
            <p className="text-xs text-slate-400">
              Run region detection, trigger generation, and viewport build directly from Storyboard.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <Select
              value={selectedBoardId}
              onValueChange={setSelectedBoardId}
              disabled={!hasBoards || operationsBusy}
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
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDetectRegions}
                    disabled={!!regionBlockedReason || detectRunning || operationsBusy}
                  >
                    {detectRunning ? "Detecting..." : "Detect regions"}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{regionBlockedReason ?? "Detect regions for the selected board."}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateTriggers}
                    disabled={!hasBoards || triggersRunning || operationsBusy}
                  >
                    {triggersRunning ? "Generating..." : "Generate triggers"}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {hasBoards
                  ? "Generate global trigger timings from saved board artifacts."
                  : "Create boards in Media before generating triggers."}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleBuildViewport}
                    disabled={!hasBoards || viewportRunning || operationsBusy}
                  >
                    {viewportRunning ? "Building..." : "Build viewport"}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {hasBoards
                  ? "Build viewport.json from board plan, regions, and triggers."
                  : "Create boards in Media before building viewport."}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {regionBlockedReason && hasBoards && (
          <p className="text-xs text-amber-300">{regionBlockedReason}</p>
        )}

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
