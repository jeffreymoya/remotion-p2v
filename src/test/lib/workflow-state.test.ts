import { describe, expect, it } from "vitest";

import { determineWorkflowState } from "@/src/lib/storyflow/workflow-state";
import { buildBlueprint, buildProject, buildScriptDraft } from "@/src/test/factories";

const baseProject = buildProject({
  script: null,
  blueprints: [],
});

const sampleBeat = buildBlueprint().beats[0];

describe("determineWorkflowState", () => {
  it("returns preview when a completed script exists", () => {
    const state = determineWorkflowState(
      buildProject({
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
      })
    );

    expect(state.phase).toBe("preview");
    expect(state.script).toBeTruthy();
    expect(state.error).toBeNull();
  });

  it("returns blueprint phase when blueprint is pending review and no draft", () => {
    const blueprint = buildBlueprint({
      status: "PENDING_REVIEW",
      beats: [sampleBeat],
      scriptDrafts: [],
    });

    const state = determineWorkflowState(
      buildProject({ ...baseProject, blueprints: [blueprint] })
    );

    expect(state.phase).toBe("blueprint");
    expect(state.blueprint).toBeTruthy();
    expect(state.scriptDraft).toBeNull();
  });

  it("returns glue phase when draft is gluing", () => {
    const draft = buildScriptDraft({ status: "GLUING" });
    const blueprint = buildBlueprint({ status: "APPROVED", beats: [sampleBeat], scriptDrafts: [draft] });

    const state = determineWorkflowState(
      buildProject({ ...baseProject, blueprints: [blueprint] })
    );

    expect(state.phase).toBe("glue");
    expect(state.scriptDraft).toBeTruthy();
    expect(state.error).toBeNull();
  });

  it("surfaces an error when blueprint lacks beats", () => {
    const blueprint = buildBlueprint({ beats: [] });
    const state = determineWorkflowState(
      buildProject({ ...baseProject, blueprints: [blueprint] })
    );

    expect(state.phase).toBe("blueprint");
    expect(state.blueprint).toBeNull();
    expect(state.error).toBeTruthy();
  });
});
