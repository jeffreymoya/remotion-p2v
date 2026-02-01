import { beforeEach, describe, expect, it } from "vitest";

import {
  EMPTY_NEEDS_REVIEW_STATE,
  applyEditToNeedsReviewState,
  clearNeedsReviewForStage,
  computeNeedsReviewStages,
  detectEditType,
  resetNeedsReviewState,
} from "@/src/lib/storyflow/stage-invalidation";
import { PipelineStageId } from "@/src/lib/storyflow/stage-validation";
import { buildScript } from "@/src/test/factories";

const projectId = "test-project";

const baseScript = buildScript({
  id: "script-1",
  projectId,
  segments: [{ index: 0, text: "Hello world" }],
});

const extendedScript = buildScript({
  ...baseScript,
  segments: [
    { index: 0, text: "Hello world" },
    { index: 1, text: "New segment" },
  ],
});

describe("stage invalidation", () => {
  beforeEach(() => {
    resetNeedsReviewState(projectId);
  });

  it("detects structural edits when segment count changes", () => {
    expect(detectEditType(baseScript, extendedScript)).toBe("structural");
    expect(detectEditType(baseScript, baseScript)).toBe("minor");
  });

  it("computes downstream stages", () => {
    const downstream = computeNeedsReviewStages("script", "structural");

    expect(downstream).toEqual({
      script: false,
      media: true,
      storyboard: true,
      build: true,
      render: true,
    });
  });

  it("applies edits and preserves existing flags", () => {
    const initial = { ...EMPTY_NEEDS_REVIEW_STATE, build: true };
    const updated = applyEditToNeedsReviewState(
      projectId,
      initial,
      "media",
      "structural"
    );

    expect(updated.media).toBe(false);
    expect(updated.storyboard).toBe(true);
    expect(updated.build).toBe(true);
    expect(updated.render).toBe(true);
  });

  it("clears only the visited stage", () => {
    const stateWithFlags: Record<PipelineStageId, boolean> = {
      script: false,
      media: true,
      storyboard: true,
      build: false,
      render: false,
    };

    const cleared = clearNeedsReviewForStage(projectId, stateWithFlags, "media");

    expect(cleared.media).toBe(false);
    expect(cleared.storyboard).toBe(true);
  });
});
