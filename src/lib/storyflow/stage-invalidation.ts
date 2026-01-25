import { Script } from "@/src/lib/storyflow/types";
import { PipelineStageId, STAGE_ORDER } from "@/src/lib/storyflow/stage-validation";

export type EditType = "minor" | "structural";
export type NeedsReviewState = Record<PipelineStageId, boolean>;

export const EMPTY_NEEDS_REVIEW_STATE: NeedsReviewState = {
  script: false,
  media: false,
  storyboard: false,
  build: false,
  render: false,
};

const STORAGE_PREFIX = "storyflow:needs-review:";
const memoryStore = new Map<string, NeedsReviewState>();

const isBrowser = typeof window !== "undefined";

function normalizeState(state: Partial<NeedsReviewState> | null | undefined): NeedsReviewState {
  return {
    script: Boolean(state?.script),
    media: Boolean(state?.media),
    storyboard: Boolean(state?.storyboard),
    build: Boolean(state?.build),
    render: Boolean(state?.render),
  };
}

function getStorageKey(projectId: string) {
  return `${STORAGE_PREFIX}${projectId}`;
}

function readFromStorage(projectId: string): NeedsReviewState {
  const key = getStorageKey(projectId);

  if (isBrowser) {
    try {
      const value = window.localStorage.getItem(key);
      if (value) {
        const parsed = JSON.parse(value) as Partial<NeedsReviewState>;
        return normalizeState(parsed);
      }
    } catch {
      // fall through to memory fallback
    }
  }

  const fallback = memoryStore.get(key);
  return normalizeState(fallback);
}

function writeToStorage(projectId: string, state: NeedsReviewState) {
  const key = getStorageKey(projectId);

  if (isBrowser) {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
      return;
    } catch {
      // ignore and continue to memory fallback
    }
  }

  memoryStore.set(key, state);
}

export function detectEditType(before: Script, after: Script): EditType {
  const beforeCount = before.segments.length;
  const afterCount = after.segments.length;

  if (beforeCount !== afterCount) {
    return "structural";
  }

  return "minor";
}

export function computeNeedsReviewStages(
  editedStage: PipelineStageId,
  editType: EditType
): Record<PipelineStageId, boolean> {
  if (editType === "minor") {
    return { ...EMPTY_NEEDS_REVIEW_STATE };
  }

  const editedIndex = STAGE_ORDER.indexOf(editedStage);
  const needsReview: NeedsReviewState = { ...EMPTY_NEEDS_REVIEW_STATE };

  STAGE_ORDER.forEach((stage, index) => {
    if (index > editedIndex) {
      needsReview[stage] = true;
    }
  });

  return needsReview;
}

export function loadNeedsReviewState(projectId: string): NeedsReviewState {
  const state = readFromStorage(projectId);
  return normalizeState(state);
}

export function persistNeedsReviewState(projectId: string, state: NeedsReviewState): NeedsReviewState {
  const normalized = normalizeState(state);
  writeToStorage(projectId, normalized);
  return normalized;
}

export function applyEditToNeedsReviewState(
  projectId: string,
  currentState: NeedsReviewState,
  editedStage: PipelineStageId,
  editType: EditType
): NeedsReviewState {
  if (editType === "minor") {
    return currentState;
  }

  const invalidated = computeNeedsReviewStages(editedStage, editType);
  const next: NeedsReviewState = { ...currentState };

  STAGE_ORDER.forEach((stage) => {
    if (invalidated[stage]) {
      next[stage] = true;
    }
  });

  return persistNeedsReviewState(projectId, next);
}

export function clearNeedsReviewForStage(
  projectId: string,
  currentState: NeedsReviewState,
  stage: PipelineStageId
): NeedsReviewState {
  if (!currentState[stage]) return currentState;

  const next: NeedsReviewState = { ...currentState, [stage]: false };
  return persistNeedsReviewState(projectId, next);
}

export function resetNeedsReviewState(projectId: string): NeedsReviewState {
  persistNeedsReviewState(projectId, { ...EMPTY_NEEDS_REVIEW_STATE });
  return { ...EMPTY_NEEDS_REVIEW_STATE };
}
