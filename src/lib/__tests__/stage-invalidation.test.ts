#!/usr/bin/env node

import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  EMPTY_NEEDS_REVIEW_STATE,
  applyEditToNeedsReviewState,
  clearNeedsReviewForStage,
  computeNeedsReviewStages,
  detectEditType,
  resetNeedsReviewState,
} from "../storyflow/stage-invalidation";
import { PipelineStageId } from "../storyflow/stage-validation";
import { Script } from "../storyflow/types";

const projectId = "test-project";

const baseScript: Script = {
  id: "script-1",
  projectId,
  title: "Demo",
  segments: [{ index: 0, text: "Hello world" }],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const extendedScript: Script = {
  ...baseScript,
  segments: [
    { index: 0, text: "Hello world" },
    { index: 1, text: "New segment" },
  ],
};

beforeEach(() => {
  resetNeedsReviewState(projectId);
});

test("detectEditType flags segment count changes as structural", () => {
  assert.equal(detectEditType(baseScript, extendedScript), "structural");
  assert.equal(detectEditType(baseScript, baseScript), "minor");
});

test("computeNeedsReviewStages marks downstream stages only", () => {
  const downstream = computeNeedsReviewStages("script", "structural");

  assert.deepEqual(downstream, {
    script: false,
    media: true,
    storyboard: true,
    build: true,
    render: true,
  });
});

test("applyEditToNeedsReviewState merges structural edits and persists", () => {
  const initial = { ...EMPTY_NEEDS_REVIEW_STATE, build: true };
  const updated = applyEditToNeedsReviewState(projectId, initial, "media", "structural");

  assert.equal(updated.media, false);
  assert.equal(updated.storyboard, true);
  assert.equal(updated.build, true, "existing flags are preserved");
  assert.equal(updated.render, true);
});

test("clearNeedsReviewForStage clears the visited stage only", () => {
  const stateWithFlags: Record<PipelineStageId, boolean> = {
    script: false,
    media: true,
    storyboard: true,
    build: false,
    render: false,
  };

  const cleared = clearNeedsReviewForStage(projectId, stateWithFlags, "media");

  assert.equal(cleared.media, false);
  assert.equal(cleared.storyboard, true);
});
