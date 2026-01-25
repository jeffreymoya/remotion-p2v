import { ProjectStatus } from "@/src/lib/storyflow/types";

export type PipelineStageId = "script" | "media" | "storyboard" | "build" | "render";

export const STAGE_ORDER: PipelineStageId[] = [
  "script",
  "media",
  "storyboard",
  "build",
  "render",
];

export type PipelineStageMeta = {
  id: PipelineStageId;
  label: string;
  description: string;
  completionRequirement: string;
};

export const STAGE_COMPLETION_CRITERIA: Record<PipelineStageId, string> = {
  script: "Script text generated and TTS completed (blocking).",
  media: "User clicks Continue to Storyboard.",
  storyboard: "AI boards generated; can proceed immediately.",
  build: "viewport.json and timeline.json generated.",
  render: "Final stage (no gating).",
};

export const PIPELINE_STAGE_META: Record<PipelineStageId, PipelineStageMeta> = {
  script: {
    id: "script",
    label: "Script",
    description: "Topic & AI script",
    completionRequirement: STAGE_COMPLETION_CRITERIA.script,
  },
  media: {
    id: "media",
    label: "Media",
    description: "Upload & map assets",
    completionRequirement: STAGE_COMPLETION_CRITERIA.media,
  },
  storyboard: {
    id: "storyboard",
    label: "Storyboard",
    description: "AI plan with manual edits",
    completionRequirement: STAGE_COMPLETION_CRITERIA.storyboard,
  },
  build: {
    id: "build",
    label: "Build",
    description: "Viewport & timeline",
    completionRequirement: STAGE_COMPLETION_CRITERIA.build,
  },
  render: {
    id: "render",
    label: "Render",
    description: "Preview & export",
    completionRequirement: STAGE_COMPLETION_CRITERIA.render,
  },
};

export const stageFromStatus: Record<ProjectStatus, PipelineStageId | "current"> = {
  DRAFT: "script",
  SCRIPT_READY: "media",
  ASSETS_READY: "storyboard",
  BOARDS_READY: "build",
  VIEWPORT_READY: "build",
  RENDER_READY: "render",
  RENDERING: "render",
  COMPLETED: "render",
  ERROR: "current",
};

export function getCurrentStage(status: ProjectStatus): PipelineStageId {
  const mapped = stageFromStatus[status];
  if (mapped === "current") {
    return "script";
  }
  return mapped;
}

export function isStageComplete(
  stage: PipelineStageId,
  status: ProjectStatus
): boolean {
  const current = getCurrentStage(status);
  return STAGE_ORDER.indexOf(stage) < STAGE_ORDER.indexOf(current);
}

export function isStageLocked(
  stage: PipelineStageId,
  status: ProjectStatus
): boolean {
  const current = getCurrentStage(status);
  return STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(current);
}

export function getStageStates(status: ProjectStatus) {
  const current = getCurrentStage(status);
  return STAGE_ORDER.map((stage) => ({
    stage,
    current: stage === current,
    completed: isStageComplete(stage, status),
    locked: isStageLocked(stage, status),
  }));
}

export function getPreviousStage(stage: PipelineStageId): PipelineStageId | null {
  const index = STAGE_ORDER.indexOf(stage);
  if (index <= 0) return null;
  return STAGE_ORDER[index - 1];
}

export type StageGateState = {
  stage: PipelineStageId;
  currentStage: PipelineStageId;
  locked: boolean;
  requiredStage: PipelineStageId | null;
  message?: string;
};

export function getStageGateState(
  stage: PipelineStageId,
  status: ProjectStatus
): StageGateState {
  const currentStage = getCurrentStage(status);
  const locked = isStageLocked(stage, status);
  const requiredStage = getPreviousStage(stage);

  const requirement = requiredStage ? PIPELINE_STAGE_META[requiredStage].completionRequirement : undefined;

  const message = locked
    ? requiredStage
      ? `Complete ${PIPELINE_STAGE_META[requiredStage].label} (${requirement}) to unlock ${PIPELINE_STAGE_META[stage].label}.`
      : "This stage is locked until earlier steps are complete."
    : undefined;

  return {
    stage,
    currentStage,
    locked,
    requiredStage,
    message,
  };
}
