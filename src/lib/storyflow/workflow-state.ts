import { Prisma } from "@/src/generated/storyflow";

import { Blueprint, ScriptDraft } from "./script-builder-types";
import { Script, ScriptSegment } from "./types";

export type WorkflowPhase = "input" | "blueprint" | "execution" | "glue" | "preview";

export interface WorkflowState {
  phase: WorkflowPhase;
  blueprint: Blueprint | null;
  scriptDraft: ScriptDraft | null;
  script: Script | null;
  error: string | null;
}

type ProjectWithWorkflowRelations = Prisma.ProjectGetPayload<{
  include: {
    script: true;
    blueprints: {
      include: {
        scriptDrafts: true;
      };
    };
  };
}>;

function parseScript(raw: ProjectWithWorkflowRelations["script"]): Script | null {
  if (!raw) return null;

  if (!Array.isArray(raw.segments)) {
    throw new Error("Script segments are missing or invalid");
  }

  return {
    id: raw.id,
    projectId: raw.projectId,
    title: raw.title,
    segments: raw.segments as unknown as ScriptSegment[],
    timestamps: Array.isArray(raw.timestamps)
      ? (raw.timestamps as unknown as Script["timestamps"])
      : undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function parseBlueprint(raw: ProjectWithWorkflowRelations["blueprints"][number]): Blueprint {
  if (!Array.isArray(raw.beats)) {
    throw new Error("Blueprint beats are missing or invalid");
  }

  return {
    id: raw.id,
    projectId: raw.projectId,
    version: raw.version,
    targetDurationMs: raw.targetDurationMs,
    status: raw.status as Blueprint["status"],
    beats: raw.beats as unknown as Blueprint["beats"],
    rejectionNotes: raw.rejectionNotes ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function parseScriptDraft(
  raw: ProjectWithWorkflowRelations["blueprints"][number]["scriptDrafts"][number]
): ScriptDraft {
  if (!Array.isArray(raw.beatDrafts)) {
    throw new Error("Script draft beatDrafts are missing or invalid");
  }

  return {
    id: raw.id,
    blueprintId: raw.blueprintId,
    version: raw.version,
    status: raw.status as ScriptDraft["status"],
    currentBeatIndex: raw.currentBeatIndex,
    beatDrafts: raw.beatDrafts as unknown as ScriptDraft["beatDrafts"],
    glueIssues: Array.isArray(raw.glueIssues) ? (raw.glueIssues as unknown as ScriptDraft["glueIssues"]) : undefined,
    polishedText: raw.polishedText ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function determineWorkflowState(project: ProjectWithWorkflowRelations): WorkflowState {
  const errors: string[] = [];

  let script: Script | null = null;
  try {
    script = parseScript(project.script);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  if (script) {
    return { phase: "preview", blueprint: null, scriptDraft: null, script, error: errors[0] ?? null };
  }

  const rawBlueprint = project.blueprints?.[0];
  if (!rawBlueprint) {
    return { phase: "input", blueprint: null, scriptDraft: null, script: null, error: errors[0] ?? null };
  }

  let blueprint: Blueprint | null = null;
  let scriptDraft: ScriptDraft | null = null;

  try {
    blueprint = parseBlueprint(rawBlueprint);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  const rawDraft = rawBlueprint.scriptDrafts?.[0];
  if (rawDraft) {
    try {
      scriptDraft = parseScriptDraft(rawDraft);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length > 0 || !blueprint) {
    return { phase: "input", blueprint: null, scriptDraft: null, script: null, error: errors.join("; ") };
  }

  if (!scriptDraft) {
    if (blueprint.status === "APPROVED") {
      return { phase: "execution", blueprint, scriptDraft: null, script: null, error: null };
    }
    return { phase: "blueprint", blueprint, scriptDraft: null, script: null, error: null };
  }

  switch (scriptDraft.status) {
    case "DRAFTING":
      return { phase: "execution", blueprint, scriptDraft, script: null, error: null };
    case "GLUING":
    case "POLISHING":
      return { phase: "glue", blueprint, scriptDraft, script: null, error: null };
    case "COMPLETED":
      return { phase: "preview", blueprint, scriptDraft, script: null, error: null };
    case "FAILED":
      return {
        phase: "execution",
        blueprint,
        scriptDraft,
        script: null,
        error: "Script draft failed; please retry execution or regenerate.",
      };
    default:
      return { phase: "input", blueprint: null, scriptDraft: null, script: null, error: null };
  }
}
