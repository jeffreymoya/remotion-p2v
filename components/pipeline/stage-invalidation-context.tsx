"use client";

import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PipelineStageId } from "@/src/lib/storyflow/stage-validation";
import { Script } from "@/src/lib/storyflow/types";
import {
  EMPTY_NEEDS_REVIEW_STATE,
  NeedsReviewState,
  applyEditToNeedsReviewState,
  clearNeedsReviewForStage,
  detectEditType,
  loadNeedsReviewState,
} from "@/src/lib/storyflow/stage-invalidation";

type StageInvalidationContextValue = {
  needsReview: NeedsReviewState;
  hydrated: boolean;
  registerEdit: (editedStage: PipelineStageId, editType: "minor" | "structural") => void;
  registerScriptChange: (before: Script | null, after: Script | null) => void;
  markStageVisited: (stage?: PipelineStageId) => void;
};

const StageInvalidationContext = createContext<StageInvalidationContextValue | null>(null);

type ProviderProps = PropsWithChildren<{
  projectId: string;
  currentStage: PipelineStageId;
}>;

export function StageInvalidationProvider({ projectId, currentStage, children }: ProviderProps) {
  const [state, setState] = useState<NeedsReviewState>(EMPTY_NEEDS_REVIEW_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage once on mount
  useEffect(() => {
    const initial = loadNeedsReviewState(projectId);
    setState(initial);
    setHydrated(true);
  }, [projectId]);

  // Auto-clear the badge for the currently visited stage
  useEffect(() => {
    if (!hydrated) return;
    setState((prev) => clearNeedsReviewForStage(projectId, prev, currentStage));
  }, [hydrated, projectId, currentStage]);

  const registerEdit = useCallback(
    (editedStage: PipelineStageId, editType: "minor" | "structural") => {
      setState((prev) => applyEditToNeedsReviewState(projectId, prev, editedStage, editType));
    },
    [projectId]
  );

  const registerScriptChange = useCallback(
    (before: Script | null, after: Script | null) => {
      if (!after) return;
      const editType = before ? detectEditType(before, after) : ("structural" as const);
      setState((prev) => applyEditToNeedsReviewState(projectId, prev, "script", editType));
    },
    [projectId]
  );

  const markStageVisited = useCallback(
    (stage: PipelineStageId = currentStage) => {
      setState((prev) => clearNeedsReviewForStage(projectId, prev, stage));
    },
    [projectId, currentStage]
  );

  const value = useMemo<StageInvalidationContextValue>(
    () => ({
      needsReview: state,
      hydrated,
      registerEdit,
      registerScriptChange,
      markStageVisited,
    }),
    [state, hydrated, registerEdit, registerScriptChange, markStageVisited]
  );

  return <StageInvalidationContext.Provider value={value}>{children}</StageInvalidationContext.Provider>;
}

export function useStageInvalidation(): StageInvalidationContextValue {
  const ctx = useContext(StageInvalidationContext);
  if (!ctx) {
    throw new Error("useStageInvalidation must be used within StageInvalidationProvider");
  }
  return ctx;
}

export function useStageInvalidationOptional(): StageInvalidationContextValue | null {
  return useContext(StageInvalidationContext);
}
