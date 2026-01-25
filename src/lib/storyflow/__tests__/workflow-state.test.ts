#!/usr/bin/env node
import { test } from "node:test";
import assert from "node:assert/strict";

import { determineWorkflowState } from "../workflow-state";

const baseProject = {
  id: "project-1",
  name: "Demo Project",
  topic: null,
  status: "DRAFT",
  aspectRatio: "16:9",
  createdAt: new Date(),
  updatedAt: new Date(),
  script: null,
  blueprints: [],
} as unknown as Parameters<typeof determineWorkflowState>[0];

const sampleBeat = {
  id: "beat-1",
  index: 1,
  title: "Hook",
  coreArgument: "Test hook",
  targetEmotion: "curiosity",
  microHook: "Test micro hook",
  estimatedDurationMs: 30000,
  mediaSuggestions: [],
  reviewStatus: "pending",
  reviewNotes: null,
};

test("returns preview when a completed script exists", () => {
  const state = determineWorkflowState({
    ...baseProject,
    script: {
      id: "script-1",
      projectId: baseProject.id,
      title: "Finished Script",
      segments: [{ index: 1, text: "Hello world" }],
      timestamps: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      blueprintId: null,
    },
  });

  assert.equal(state.phase, "preview");
  assert.ok(state.script);
  assert.equal(state.error, null);
});

test("returns blueprint phase when blueprint is pending review and no draft", () => {
  const state = determineWorkflowState({
    ...baseProject,
    blueprints: [
      {
        id: "bp-1",
        projectId: baseProject.id,
        version: 1,
        targetDurationMs: 180000,
        status: "PENDING_REVIEW",
        beats: [sampleBeat],
        rejectionNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        scriptDrafts: [],
      },
    ],
  });

  assert.equal(state.phase, "blueprint");
  assert.ok(state.blueprint);
  assert.equal(state.scriptDraft, null);
});

test("returns glue phase when draft is in gluing", () => {
  const state = determineWorkflowState({
    ...baseProject,
    blueprints: [
      {
        id: "bp-2",
        projectId: baseProject.id,
        version: 1,
        targetDurationMs: 180000,
        status: "APPROVED",
        beats: [sampleBeat],
        rejectionNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        scriptDrafts: [
          {
            id: "draft-1",
            blueprintId: "bp-2",
            version: 1,
            status: "GLUING",
            currentBeatIndex: 1,
            beatDrafts: [],
            glueIssues: [],
            polishedText: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ],
  });

  assert.equal(state.phase, "glue");
  assert.ok(state.scriptDraft);
  assert.equal(state.error, null);
});

test("returns error when blueprint beats are invalid", () => {
  const state = determineWorkflowState({
    ...baseProject,
    blueprints: [
      {
        id: "bp-err",
        projectId: baseProject.id,
        version: 1,
        targetDurationMs: 180000,
        status: "PENDING_REVIEW",
        beats: null,
        rejectionNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        scriptDrafts: [],
      },
    ],
  });

  assert.equal(state.phase, "input");
  assert.equal(state.blueprint, null);
  assert.ok(state.error);
});
