"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Asset, Board, Script } from "@/src/lib/storyflow/types";
import { BoardPlan, BoardPromptsOutput, BoardRegion, BoardTriggersOutput } from "@/src/lib/boards-types";
import { ViewportAnimation } from "@/src/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BoardPlanView } from "./BoardPlanView";
import { PromptDisplay } from "./PromptDisplay";
import { ImageUploader } from "./ImageUploader";
import { RegionEditor } from "./RegionEditor";
import { ViewportPreview } from "./ViewportPreview";
import { useToast } from "@/components/ui/toast-provider";
import { useBackgroundTask } from "@/src/hooks/use-background-task";
import {
  useBoardPlan,
  useBoardPrompts,
  useBuildViewport,
  useDetectBoardRegions,
  useGenerateBoardPrompts,
  useGenerateBoardTriggers,
  usePlanBoards,
} from "@/src/hooks/queries/use-boards";
import { useProject, useUpdateProject } from "@/src/hooks/queries/use-projects";
import { cn } from "@/src/lib/storyflow/utils";

interface BoardPlannerWizardProps {
  projectId: string;
  script: Script;
  images?: Asset[];
  initialBoards?: (Board & { assetId?: string | null })[];
  mode?: "media" | "storyboard";
  className?: string;
}

type WizardStep = "config" | "plan" | "prompts" | "upload" | "regions" | "triggers" | "viewport";

type WizardProgressState = {
  currentStep: WizardStep;
  maxBoardDuration: number;
  styleGuide: string;
  gridRows: number;
  gridCols: number;
  boardPlan: BoardPlan | null;
  prompts: BoardPromptsOutput | null;
  uploadedImages: Record<string, { assetId: string; path?: string }>;
  updatedAt: string;
};

function isWizardStep(value: unknown): value is WizardStep {
  return (
    value === "config" ||
    value === "plan" ||
    value === "prompts" ||
    value === "upload" ||
    value === "regions" ||
    value === "triggers" ||
    value === "viewport"
  );
}

function readWizardProgress(value: unknown): Partial<WizardProgressState> | null {
  if (!value || typeof value !== "object") return null;
  const root = value as Record<string, unknown>;
  const boardPlanner = root.boardPlanner;
  if (!boardPlanner || typeof boardPlanner !== "object") return null;
  return boardPlanner as Partial<WizardProgressState>;
}

export function BoardPlannerWizard({
  projectId,
  script,
  images = [],
  initialBoards = [],
  mode = "storyboard",
  className,
}: BoardPlannerWizardProps) {
  const toast = useToast();
  const { runTask, isTaskRunning } = useBackgroundTask();
  const { data: project } = useProject(projectId);
  const { data: existingPlan, isFetching: isPlanFetching } = useBoardPlan(projectId);
  const { data: existingPrompts, isFetching: isPromptsFetching } = useBoardPrompts(projectId);
  const updateProjectMutation = useUpdateProject();
  const planBoardsMutation = usePlanBoards(projectId);
  const promptsMutation = useGenerateBoardPrompts(projectId);
  const regionsMutation = useDetectBoardRegions(projectId);
  const triggersMutation = useGenerateBoardTriggers(projectId);
  const viewportMutation = useBuildViewport(projectId);
  const isMediaMode = mode === "media";
  const [currentStep, setCurrentStep] = useState<WizardStep>("config");
  const [loading, setLoading] = useState(false);

  // Config state
  const [maxBoardDuration, setMaxBoardDuration] = useState(60000); // 60 seconds
  const [styleGuide, setStyleGuide] = useState("Detective investigation board");
  const [gridRows, setGridRows] = useState(2);
  const [gridCols, setGridCols] = useState(3);

  // Results state
  const [boardPlan, setBoardPlan] = useState<BoardPlan | null>(null);
  const [prompts, setPrompts] = useState<BoardPromptsOutput | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Record<string, { assetId: string; path?: string }>>({});
  const [regionsData, setRegionsData] = useState<{
    assetId: string;
    assetPath?: string;
    regions: BoardRegion[];
    imageMetadata: { width: number; height: number; aspectRatio: number };
  } | null>(null);
  const [triggers, setTriggers] = useState<BoardTriggersOutput | null>(null);
  const [viewport, setViewport] = useState<ViewportAnimation | null>(null);
  const [hydratedFromServer, setHydratedFromServer] = useState(false);

  const imagesById = useMemo(() => {
    return images.reduce<Record<string, Asset>>((acc, asset) => {
      acc[asset.id] = asset;
      return acc;
    }, {});
  }, [images]);

  const persistWizardProgress = useMemo(() => {
    return (next: Partial<WizardProgressState>) => {
      const persisted = readWizardProgress(project?.wizardProgress);
      const payload: WizardProgressState = {
        currentStep: next.currentStep ?? currentStep,
        maxBoardDuration: next.maxBoardDuration ?? maxBoardDuration,
        styleGuide: next.styleGuide ?? styleGuide,
        gridRows: next.gridRows ?? gridRows,
        gridCols: next.gridCols ?? gridCols,
        boardPlan: next.boardPlan ?? boardPlan,
        prompts: next.prompts ?? prompts,
        uploadedImages: next.uploadedImages ?? uploadedImages,
        updatedAt: new Date().toISOString(),
      };

      updateProjectMutation.mutate({
        id: projectId,
        data: {
          wizardProgress: {
            ...(typeof project?.wizardProgress === "object" && project?.wizardProgress !== null
              ? (project.wizardProgress as Record<string, unknown>)
              : {}),
            boardPlanner: {
              ...persisted,
              ...payload,
            },
          },
        },
      });
    };
  }, [
    project,
    currentStep,
    maxBoardDuration,
    styleGuide,
    gridRows,
    gridCols,
    boardPlan,
    prompts,
    uploadedImages,
    updateProjectMutation,
    projectId,
  ]);

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
    persistWizardProgress({ currentStep: step });
  };

  useEffect(() => {
    if (hydratedFromServer || isPlanFetching || isPromptsFetching) return;

    const persisted = readWizardProgress(project?.wizardProgress);
    const hydratedPlan = (persisted?.boardPlan as BoardPlan | null | undefined) ?? existingPlan?.plan ?? null;
    const hydratedPrompts =
      (persisted?.prompts as BoardPromptsOutput | null | undefined) ?? existingPrompts ?? null;
    const initialUploadsFromBoards = initialBoards.reduce<Record<string, { assetId: string; path?: string }>>(
      (acc, board) => {
        const assetId = (board as { assetId?: string | null }).assetId;
        if (!assetId) return acc;
        const boardKey =
          hydratedPlan?.boards?.[board.index]?.boardId ??
          hydratedPlan?.boards?.[0]?.boardId ??
          board.id;
        acc[boardKey] = { assetId, path: imagesById[assetId]?.path };
        return acc;
      },
      {}
    );
    const normalizedPersistedUploads =
      persisted?.uploadedImages && typeof persisted.uploadedImages === "object"
        ? (persisted.uploadedImages as Record<string, unknown>)
        : {};
    const sanitizedPersistedUploads = Object.entries(normalizedPersistedUploads).reduce<
      Record<string, { assetId: string; path?: string }>
    >((acc, [boardId, value]) => {
      if (value && typeof value === "object" && typeof (value as { assetId?: string }).assetId === "string") {
        acc[boardId] = {
          assetId: (value as { assetId: string }).assetId,
          path: (value as { path?: string }).path,
        };
      }
      return acc;
    }, {});
    const hydratedUploads = {
      ...sanitizedPersistedUploads,
      ...initialUploadsFromBoards,
    };

    if (typeof persisted?.maxBoardDuration === "number") {
      setMaxBoardDuration(persisted.maxBoardDuration);
    }
    if (typeof persisted?.styleGuide === "string") {
      setStyleGuide(persisted.styleGuide);
    }
    if (typeof persisted?.gridRows === "number") {
      setGridRows(Math.min(4, Math.max(1, persisted.gridRows)));
    }
    if (typeof persisted?.gridCols === "number") {
      setGridCols(Math.min(6, Math.max(1, persisted.gridCols)));
    }

    if (hydratedPlan) setBoardPlan(hydratedPlan);
    if (hydratedPrompts) setPrompts(hydratedPrompts);
    if (Object.keys(hydratedUploads).length > 0) setUploadedImages(hydratedUploads);

    const stepOrder: WizardStep[] = ["config", "plan", "prompts", "upload", "regions", "triggers", "viewport"];
    let dataMinStep: WizardStep = "config";
    if (hydratedPlan) dataMinStep = "plan";
    if (hydratedPrompts) dataMinStep = "prompts";
    if (Object.keys(hydratedUploads).length > 0) dataMinStep = "upload";

    let nextStep = dataMinStep;
    if (persisted?.currentStep && isWizardStep(persisted.currentStep)) {
      const persistedIdx = stepOrder.indexOf(persisted.currentStep);
      const dataMinIdx = stepOrder.indexOf(dataMinStep);
      if (persistedIdx >= dataMinIdx) {
        nextStep = persisted.currentStep;
      }
    }
    if (isMediaMode && (nextStep === "regions" || nextStep === "triggers" || nextStep === "viewport")) {
      nextStep = "upload";
    }

    setCurrentStep(nextStep);
    setHydratedFromServer(true);
  }, [
    hydratedFromServer,
    isPlanFetching,
    isPromptsFetching,
    project?.wizardProgress,
    existingPlan,
    existingPrompts,
    initialBoards,
    imagesById,
    isMediaMode,
  ]);

  const handleGeneratePlan = async () => {
    setLoading(true);
    await runTask(
      { projectId, category: "board-plan-generation", name: "Generating board plan", icon: "cog" },
      async ({ signal }) => {
        const data = await planBoardsMutation.mutateAsync({
          payload: {
            scriptSegments: script.segments,
            options: { maxBoardDuration },
          },
          signal,
        });
        setBoardPlan(data.plan);
        setCurrentStep("plan");
        persistWizardProgress({
          currentStep: "plan",
          boardPlan: data.plan,
          maxBoardDuration,
          styleGuide,
          gridRows,
          gridCols,
        });
        return data;
      }
    );
    setLoading(false);
  };

  const handleGeneratePrompts = async () => {
    if (!boardPlan) return;

    setLoading(true);
    await runTask(
      { projectId, category: "board-prompts-generation", name: "Generating image prompts", icon: "sparkles" },
      async ({ signal }) => {
        // Convert board plan to the format expected by prompts API
        const segments = script.segments.map((seg, idx) => ({
          id: `seg-${idx}`,
          order: idx + 1,
          text: seg.text,
          estimatedDurationMs: seg.estimatedDuration || 5000,
          speakingNotes: "",
        }));

        const data = await promptsMutation.mutateAsync({
          payload: {
            boards: boardPlan.boards,
            segments,
            gridLayout: { rows: gridRows, cols: gridCols },
            styleGuide: styleGuide.trim() || undefined,
          },
          signal,
        });
        setPrompts(data);
        setCurrentStep("prompts");
        persistWizardProgress({ currentStep: "prompts", prompts: data });
        return data;
      }
    );
    setLoading(false);
  };

  const handleImageUpload = (boardId: string, uploaded: { assetId: string; path?: string }) => {
    setUploadedImages((prev) => {
      const next = { ...prev, [boardId]: uploaded };
      persistWizardProgress({ uploadedImages: next, currentStep: "upload" });
      return next;
    });
  };

  const handleDetectRegions = async () => {
    if (isMediaMode) return;
    if (!prompts || !boardPlan) return;

    // For now, detect regions for the first board only
    const firstBoard = boardPlan.boards[0];
    const boardId = firstBoard.boardId;
    const uploadInfo = uploadedImages[boardId];
    const assetId = uploadInfo?.assetId;
    const assetPath = uploadInfo?.path ?? (assetId ? imagesById[assetId]?.path : undefined);

    if (!assetId) {
      toast({ title: "Error", description: "Please upload an image first", variant: "error" });
      return;
    }

    const boardPrompt = prompts.prompts.find((p) => p.boardId === boardId);
    if (!boardPrompt) {
      toast({ title: "Error", description: "Board prompt not found", variant: "error" });
      return;
    }

    setLoading(true);
    await runTask(
      { projectId, category: "board-region-detection", name: "Detecting board regions", icon: "cog" },
      async ({ signal }) => {
        const data = await regionsMutation.mutateAsync({
          payload: {
            boardId,
            assetId,
            elements: boardPrompt.elements,
            gridLayout: boardPrompt.gridLayout,
          },
          signal,
        });
        setRegionsData({
          assetId: data.assetId,
          assetPath: data.assetPath ?? assetPath,
          regions: data.regions,
          imageMetadata: data.imageMetadata,
        });
        goToStep("regions");
        return data;
      }
    );
    setLoading(false);
  };

  const handleGenerateTriggers = async () => {
    if (isMediaMode) return;
    setLoading(true);
    await runTask(
      { projectId, category: "board-triggers-generation", name: "Generating camera triggers", icon: "cog" },
      async ({ signal }) => {
        const data = await triggersMutation.mutateAsync({
          payload: {},
          signal,
        });
        setTriggers(data);
        goToStep("triggers");
        return data;
      }
    );
    setLoading(false);
  };

  const handleBuildViewport = async () => {
    if (isMediaMode) return;
    setLoading(true);
    await runTask(
      { projectId, category: "board-viewport-build", name: "Building viewport animation", icon: "film" },
      async ({ signal }) => {
        const data = await viewportMutation.mutateAsync({
          payload: { fps: 30 },
          signal,
        });
        setViewport(data.viewportJson);
        goToStep("viewport");
        return data;
      }
    );
    setLoading(false);
  };

  const handleReset = () => {
    setBoardPlan(null);
    setPrompts(null);
    setUploadedImages({});
    setRegionsData(null);
    setTriggers(null);
    setViewport(null);
    goToStep("config");
    persistWizardProgress({
      currentStep: "config",
      boardPlan: null,
      prompts: null,
      uploadedImages: {},
    });
  };

  const isAnyMutationPending = useMemo(
    () =>
      planBoardsMutation.isPending ||
      promptsMutation.isPending ||
      regionsMutation.isPending ||
      triggersMutation.isPending ||
      viewportMutation.isPending,
    [
      planBoardsMutation.isPending,
      promptsMutation.isPending,
      regionsMutation.isPending,
      triggersMutation.isPending,
      viewportMutation.isPending,
    ]
  );

  const isBusy = loading || isAnyMutationPending;

  const visibleSteps: WizardStep[] = isMediaMode
    ? ["config", "plan", "prompts", "upload"]
    : ["config", "plan", "prompts", "upload", "regions", "triggers", "viewport"];

  const stepCompleted: Record<WizardStep, boolean> = {
    config: !!boardPlan,
    plan: !!prompts,
    prompts: !!prompts,
    upload: Object.keys(uploadedImages).length > 0 || (!!regionsData && !isMediaMode),
    regions: !!triggers,
    triggers: !!viewport,
    viewport: false,
  };

  const stepLabels: Record<WizardStep, string> = {
    config: "Config",
    plan: "Plan",
    prompts: "Prompts",
    upload: "Upload",
    regions: "Regions",
    triggers: "Triggers",
    viewport: "Viewport",
  };

  const steps = visibleSteps.map((step, idx) => ({
    step,
    label: stepLabels[step],
    number: idx + 1,
    isActive: currentStep === step,
    isCompleted: stepCompleted[step],
  }));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Steps */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((item, index) => (
          <Fragment key={item.step}>
            <StepIndicator
              number={item.number}
              label={item.label}
              isActive={item.isActive}
              isCompleted={item.isCompleted}
            />
            {index < steps.length - 1 && <StepSeparator />}
          </Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-6">
        {currentStep === "config" && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-lg font-semibold text-slate-100">Configure Board Planning</h2>
              <p className="text-sm text-slate-400">
                Set parameters for how the script will be divided into visual boards
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  Max Board Duration (milliseconds)
                </label>
                <Input
                  type="number"
                  min={10000}
                  max={120000}
                  step={1000}
                  value={maxBoardDuration}
                  onChange={(e) => setMaxBoardDuration(Number(e.target.value))}
                  className="max-w-xs"
                />
                <p className="text-xs text-slate-500">
                  Recommended: 60000ms (1 minute). Boards group segments by topic and duration.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="style-guide" className="text-sm font-medium text-slate-200">
                  Style Guide
                </label>
                <Input
                  id="style-guide"
                  type="text"
                  value={styleGuide}
                  onChange={(e) => setStyleGuide(e.target.value)}
                  placeholder="Detective investigation board"
                  className="max-w-md"
                />
                <p className="text-xs text-slate-500">
                  Visual style for AI image generation (e.g., "Detective board", "Modern infographic",
                  "Conspiracy wall")
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-200">Grid Layout</p>
                <div className="flex flex-wrap gap-3">
                  <div className="space-y-1">
                    <label htmlFor="grid-rows" className="text-xs text-slate-400">
                      Rows
                    </label>
                    <Input
                      id="grid-rows"
                      type="number"
                      min={1}
                      max={4}
                      value={gridRows}
                      onChange={(e) =>
                        setGridRows(Math.min(4, Math.max(1, Number.parseInt(e.target.value || "2", 10) || 2)))
                      }
                      className="w-24"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="grid-cols" className="text-xs text-slate-400">
                      Columns
                    </label>
                    <Input
                      id="grid-cols"
                      type="number"
                      min={1}
                      max={6}
                      value={gridCols}
                      onChange={(e) =>
                        setGridCols(Math.min(6, Math.max(1, Number.parseInt(e.target.value || "3", 10) || 3)))
                      }
                      className="w-24"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Controls prompt layout (max 4 rows x 6 columns).
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-brand-500/30 bg-brand-950/20 p-4">
              <div className="mb-2 flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-xs text-slate-300">
                  <p className="mb-1 font-medium text-brand-300">How it works:</p>
                  <ol className="list-inside list-decimal space-y-1 text-slate-400">
                    <li>AI analyzes your script and groups segments into themed boards</li>
                    <li>Each board gets detailed image prompts for AI tools (DALL-E, Midjourney, etc.)</li>
                    <li>You generate the images externally, then upload them here</li>
                    {isMediaMode ? (
                      <li>Continue in Storyboard to detect regions and build camera paths</li>
                    ) : (
                      <li>AI detects regions in your images and creates camera paths</li>
                    )}
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleGeneratePlan} disabled={isBusy || !script.segments.length || isTaskRunning("board-plan-generation", projectId)}>
                {isBusy ? "Generating..." : "Generate Board Plan"}
              </Button>
            </div>
          </div>
        )}

        {currentStep === "plan" && boardPlan && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-100">Board Plan Generated</h2>
                <p className="text-sm text-slate-400">
                  Your script has been organized into {boardPlan.boards.length} visual boards
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleReset}>
                Start Over
              </Button>
            </div>

            <BoardPlanView plan={boardPlan} projectId={projectId} />

            <div className="flex gap-3 border-t border-slate-800 pt-6">
              <Button onClick={handleGeneratePrompts} disabled={isBusy || isTaskRunning("board-prompts-generation", projectId)}>
                {isBusy ? "Generating..." : "Generate Image Prompts"}
              </Button>
              <Button variant="outline" onClick={() => goToStep("config")}>
                Back to Config
              </Button>
            </div>
          </div>
        )}

        {currentStep === "prompts" && prompts && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-100">Image Prompts Ready</h2>
                <p className="text-sm text-slate-400">
                  Copy these prompts and use them in your AI image generator of choice
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleReset}>
                Start Over
              </Button>
            </div>

            <PromptDisplay prompts={prompts.prompts} />

            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
              <div className="mb-2 flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-xs text-slate-300">
                  <p className="mb-1 font-medium text-amber-300">Next Steps:</p>
                  <ol className="list-inside list-decimal space-y-1 text-slate-400">
                    <li>Copy each board's prompt and paste into DALL-E, Midjourney, or Stable Diffusion</li>
                    <li>Generate high-resolution images (minimum 2048x2048, recommend 4K+)</li>
                    <li>
                      Upload the generated images in the <strong>Media</strong> page
                    </li>
                    <li>
                      Continue in Storyboard to detect regions and build camera paths
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-800 pt-6">
              <Button onClick={() => goToStep("upload")} disabled={loading}>
                Continue to Upload
              </Button>
              <Button variant="outline" onClick={() => goToStep("plan")}>
                Back to Plan
              </Button>
            </div>
          </div>
        )}

        {currentStep === "upload" && prompts && boardPlan && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-100">Upload Board Images</h2>
                <p className="text-sm text-slate-400">
                  Upload the AI-generated images for each board
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleReset}>
                Start Over
              </Button>
            </div>

            {/* Upload for first board (simplified for now) */}
            {boardPlan.boards.length > 0 && (
              <ImageUploader
                projectId={projectId}
                boardId={boardPlan.boards[0].boardId}
                onUploadComplete={(payload) => handleImageUpload(boardPlan.boards[0].boardId, payload)}
              />
            )}

            <div className="flex gap-3 border-t border-slate-800 pt-6">
              <Button
                onClick={handleDetectRegions}
                disabled={
                  isMediaMode ||
                  isBusy ||
                  Object.keys(uploadedImages).length === 0 ||
                  isTaskRunning("board-region-detection", projectId)
                }
              >
                {isMediaMode ? "Detect Regions (Storyboard)" : isBusy ? "Detecting..." : "Detect Regions"}
              </Button>
              <Button variant="outline" onClick={() => goToStep("prompts")}>
                Back to Prompts
              </Button>
            </div>
          </div>
        )}

        {currentStep === "regions" && regionsData && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-100">
                  Edit Regions ({regionsData.regions.length})
                </h2>
                <p className="text-sm text-slate-400">
                  Adjust region boundaries and salience values
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleReset}>
                Start Over
              </Button>
            </div>

            <RegionEditor
              projectId={projectId}
              assetId={regionsData.assetId}
              assetPath={regionsData.assetPath ?? (regionsData.assetId ? imagesById[regionsData.assetId]?.path ?? "" : "")}
              regions={regionsData.regions}
              imageMetadata={regionsData.imageMetadata}
              onRegionsChange={(updated) =>
                setRegionsData((prev) => (prev ? { ...prev, regions: updated } : null))
              }
            />

            <div className="flex gap-3 border-t border-slate-800 pt-6">
              <Button onClick={handleGenerateTriggers} disabled={isBusy || isTaskRunning("board-triggers-generation", projectId)}>
                {isBusy ? "Generating..." : "Generate Triggers"}
              </Button>
              <Button variant="outline" onClick={() => goToStep("upload")}>
                Back to Upload
              </Button>
            </div>
          </div>
        )}

        {currentStep === "triggers" && triggers && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-100">
                  Triggers Generated ({triggers.totalTriggers})
                </h2>
                <p className="text-sm text-slate-400">
                  {triggers.totalTriggers} word-level camera triggers across {triggers.totalWords} words
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleReset}>
                Start Over
              </Button>
            </div>

            {/* Trigger Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="text-xs text-slate-500">Total Triggers</div>
                <div className="text-2xl font-bold text-brand-400">{triggers.totalTriggers}</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="text-xs text-slate-500">Total Words</div>
                <div className="text-2xl font-bold text-slate-300">{triggers.totalWords}</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="text-xs text-slate-500">Trigger Rate</div>
                <div className="text-2xl font-bold text-slate-300">
                  {((triggers.totalTriggers / triggers.totalWords) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="text-xs text-slate-500">Avg Transition</div>
                <div className="text-2xl font-bold text-slate-300">
                  {(
                    triggers.triggers.reduce((sum, t) => sum + t.transitionMs, 0) /
                    triggers.triggers.length
                  ).toFixed(0)}
                  ms
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-brand-500/30 bg-brand-950/20 p-4">
              <div className="mb-2 flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-xs text-slate-300">
                  <p className="mb-1 font-medium text-brand-300">Ready to build viewport</p>
                  <p className="text-slate-400">
                    Triggers map spoken words to camera movements. Click "Build Viewport" to generate the
                    final camera path animation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-800 pt-6">
              <Button onClick={handleBuildViewport} disabled={isBusy || isTaskRunning("board-viewport-build", projectId)}>
                {isBusy ? "Building..." : "Build Viewport"}
              </Button>
              <Button variant="outline" onClick={() => goToStep("regions")}>
                Back to Regions
              </Button>
            </div>
          </div>
        )}

        {currentStep === "viewport" && viewport && boardPlan && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-100">Viewport Complete!</h2>
                <p className="text-sm text-slate-400">
                  Camera path generated with {viewport.keyframes?.length || 0} keyframes
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleReset}>
                Start Over
              </Button>
            </div>

            {regionsData && (
              <ViewportPreview
                projectId={projectId}
                assetId={regionsData.assetId}
                assetPath={regionsData.assetPath ?? (regionsData.assetId ? imagesById[regionsData.assetId]?.path ?? "" : "")}
                viewportAnimation={viewport}
                totalDurationMs={boardPlan.totalDurationMs}
              />
            )}

            <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-4">
              <div className="mb-2 flex items-start gap-2">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-slate-300">
                  <p className="mb-1 font-semibold text-green-300">Boards Pipeline Complete!</p>
                  <p className="text-slate-400">
                    Your viewport.json has been generated and saved. You can now proceed to build the
                    timeline and render your video.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-800 pt-6">
              <Button variant="outline" onClick={() => goToStep("triggers")}>
                Back to Triggers
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  isActive,
  isCompleted = false,
}: {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
          isActive && "bg-brand-600 text-white ring-2 ring-brand-400/50 ring-offset-2 ring-offset-slate-950",
          isCompleted && !isActive && "bg-brand-900/60 text-brand-300",
          !isActive && !isCompleted && "bg-slate-800 text-slate-500"
        )}
      >
        {isCompleted && !isActive ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          number
        )}
      </div>
      <span
        className={cn(
          "text-sm font-medium transition",
          isActive && "text-slate-100",
          !isActive && "text-slate-500"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function StepSeparator() {
  return <div className="h-px w-12 bg-slate-800" />;
}
