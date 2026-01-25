"use client";

import { useState } from "react";
import { Script } from "@/src/lib/storyflow/types";
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
import { cn } from "@/src/lib/utils";

interface BoardPlannerWizardProps {
  projectId: string;
  script: Script;
  className?: string;
}

type WizardStep = "config" | "plan" | "prompts" | "upload" | "regions" | "triggers" | "viewport";

export function BoardPlannerWizard({ projectId, script, className }: BoardPlannerWizardProps) {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState<WizardStep>("config");
  const [loading, setLoading] = useState(false);

  // Config state
  const [maxBoardDuration, setMaxBoardDuration] = useState(60000); // 60 seconds
  const [styleGuide, setStyleGuide] = useState("Detective investigation board");

  // Results state
  const [boardPlan, setBoardPlan] = useState<BoardPlan | null>(null);
  const [prompts, setPrompts] = useState<BoardPromptsOutput | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const [regionsData, setRegionsData] = useState<{
    imagePath: string;
    regions: BoardRegion[];
    imageMetadata: { width: number; height: number; aspectRatio: number };
  } | null>(null);
  const [triggers, setTriggers] = useState<BoardTriggersOutput | null>(null);
  const [viewport, setViewport] = useState<ViewportAnimation | null>(null);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/boards/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptSegments: script.segments,
          options: {
            maxBoardDuration,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate plan");
      }

      const data = await response.json();
      setBoardPlan(data.plan); // API returns { boards, plan }
      setCurrentStep("plan");
      toast({ title: "Plan generated", variant: "success" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrompts = async () => {
    if (!boardPlan) return;

    setLoading(true);
    try {
      // Convert board plan to the format expected by prompts API
      const segments = script.segments.map((seg, idx) => ({
        id: `seg-${idx}`,
        order: idx + 1,
        text: seg.text,
        estimatedDurationMs: seg.estimatedDuration || 5000,
        speakingNotes: "",
      }));

      const response = await fetch(`/api/projects/${projectId}/boards/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boards: boardPlan.boards,
          segments,
          gridLayout: {
            rows: 2,
            cols: 3,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate prompts");
      }

      const data = await response.json();
      const promptsPayload = data.data ?? data;
      setPrompts(promptsPayload);
      setCurrentStep("prompts");
      toast({ title: "Prompts generated", variant: "success" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (boardId: string, imagePath: string) => {
    setUploadedImages((prev) => ({ ...prev, [boardId]: imagePath }));
  };

  const handleDetectRegions = async () => {
    if (!prompts || !boardPlan) return;

    // For now, detect regions for the first board only
    const firstBoard = boardPlan.boards[0];
    const boardId = firstBoard.boardId;
    const imagePath = uploadedImages[boardId];

    if (!imagePath) {
      toast({ title: "Error", description: "Please upload an image first", variant: "error" });
      return;
    }

    const boardPrompt = prompts.prompts.find((p) => p.boardId === boardId);
    if (!boardPrompt) {
      toast({ title: "Error", description: "Board prompt not found", variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/boards/regions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          imagePath,
          elements: boardPrompt.elements,
          gridLayout: boardPrompt.gridLayout,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to detect regions");
      }

      const data = await response.json();
      setRegionsData({
        imagePath,
        regions: data.regions,
        imageMetadata: data.imageMetadata,
      });
      setCurrentStep("regions");
      toast({ title: "Regions detected", variant: "success" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTriggers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/boards/triggers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate triggers");
      }

      const data = await response.json();
      setTriggers(data);
      setCurrentStep("triggers");
      toast({ title: "Triggers generated", variant: "success" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleBuildViewport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/boards/viewport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fps: 30 }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to build viewport");
      }

      const data = await response.json();
      setViewport(data.viewportJson);
      setCurrentStep("viewport");
      toast({ title: "Viewport built successfully", variant: "success" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBoardPlan(null);
    setPrompts(null);
    setUploadedImages({});
    setRegionsData(null);
    setTriggers(null);
    setViewport(null);
    setCurrentStep("config");
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Steps */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <StepIndicator
          number={1}
          label="Config"
          isActive={currentStep === "config"}
          isCompleted={!!boardPlan}
        />
        <StepSeparator />
        <StepIndicator
          number={2}
          label="Plan"
          isActive={currentStep === "plan"}
          isCompleted={!!prompts}
        />
        <StepSeparator />
        <StepIndicator
          number={3}
          label="Prompts"
          isActive={currentStep === "prompts"}
          isCompleted={prompts !== null && Object.keys(uploadedImages).length > 0}
        />
        <StepSeparator />
        <StepIndicator
          number={4}
          label="Upload"
          isActive={currentStep === "upload"}
          isCompleted={!!regionsData}
        />
        <StepSeparator />
        <StepIndicator
          number={5}
          label="Regions"
          isActive={currentStep === "regions"}
          isCompleted={!!triggers}
        />
        <StepSeparator />
        <StepIndicator
          number={6}
          label="Triggers"
          isActive={currentStep === "triggers"}
          isCompleted={!!viewport}
        />
        <StepSeparator />
        <StepIndicator
          number={7}
          label="Viewport"
          isActive={currentStep === "viewport"}
          isCompleted={false}
        />
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
                <label className="text-sm font-medium text-slate-200">Style Guide</label>
                <Input
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
                    <li>AI detects regions in your images and creates camera paths</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleGeneratePlan} disabled={loading || !script.segments.length}>
                {loading ? "Generating..." : "Generate Board Plan"}
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

            <BoardPlanView plan={boardPlan} />

            <div className="flex gap-3 border-t border-slate-800 pt-6">
              <Button onClick={handleGeneratePrompts} disabled={loading}>
                {loading ? "Generating..." : "Generate Image Prompts"}
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep("config")}>
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
                      Upload the generated images in the <strong>Assets</strong> page
                    </li>
                    <li>
                      Return here to map images to boards and generate camera paths (coming in next phase)
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-800 pt-6">
              <Button onClick={() => setCurrentStep("upload")} disabled={loading}>
                Continue to Upload
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep("plan")}>
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
                onUploadComplete={(path) => handleImageUpload(boardPlan.boards[0].boardId, path)}
              />
            )}

            <div className="flex gap-3 border-t border-slate-800 pt-6">
              <Button
                onClick={handleDetectRegions}
                disabled={loading || Object.keys(uploadedImages).length === 0}
              >
                {loading ? "Detecting..." : "Detect Regions"}
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep("prompts")}>
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
              imagePath={regionsData.imagePath}
              regions={regionsData.regions}
              imageMetadata={regionsData.imageMetadata}
              onRegionsChange={(updated) =>
                setRegionsData((prev) => (prev ? { ...prev, regions: updated } : null))
              }
            />

            <div className="flex gap-3 border-t border-slate-800 pt-6">
              <Button onClick={handleGenerateTriggers} disabled={loading}>
                {loading ? "Generating..." : "Generate Triggers"}
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep("upload")}>
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
              <Button onClick={handleBuildViewport} disabled={loading}>
                {loading ? "Building..." : "Build Viewport"}
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep("regions")}>
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
                imagePath={regionsData.imagePath}
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
              <Button variant="outline" onClick={() => setCurrentStep("triggers")}>
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
