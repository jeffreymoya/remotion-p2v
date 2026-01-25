"use client";

import { useMemo } from "react";
import { ProjectStatus } from "@/src/lib/storyflow/types";
import {
  PipelineStageId,
  getStageGateState,
  StageGateState,
} from "@/src/lib/storyflow/stage-validation";

/**
 * Compute gate state for a given stage and project status.
 * Memoized to avoid recalculating on re-renders.
 */
export function useStageGate(stage: PipelineStageId, status: ProjectStatus): StageGateState {
  return useMemo(() => getStageGateState(stage, status), [stage, status]);
}
