import type { Script, ScriptSegment, WordTimestamp } from "@/src/lib/storyflow/types";
import type {
  Beat,
  BeatDraft,
  Blueprint,
  BlueprintStatus,
  GlueIssue,
  ScriptDraft,
  ScriptDraftStatus,
} from "@/src/lib/storyflow/script-builder-types";
import { TargetEmotion } from "@/src/lib/storyflow/script-builder-types";

import { createId, mergeFactory, now } from "./base";

const DEFAULT_TIMESTAMPS: WordTimestamp[] = [
  { word: "Hello", startMs: 0, endMs: 500 },
  { word: "world", startMs: 500, endMs: 1000 },
];

export function buildSegment(overrides: Partial<ScriptSegment> = {}): ScriptSegment {
  return mergeFactory<ScriptSegment>(
    {
      index: overrides.index ?? 0,
      text: overrides.text ?? "Test segment text.",
      wordCount: overrides.wordCount ?? 5,
      estimatedDuration: overrides.estimatedDuration ?? 3,
      audioUrl: overrides.audioUrl ?? "/audio/segment-0.mp3",
      actualDuration: overrides.actualDuration ?? 3,
      timestamps: overrides.timestamps ?? DEFAULT_TIMESTAMPS,
    },
    overrides
  );
}

export function buildScript(overrides: Partial<Script> = {}): Script {
  const createdAt = overrides.createdAt ?? now();
  const updatedAt = overrides.updatedAt ?? now();
  const projectId = overrides.projectId ?? createId("project");

  return mergeFactory<Script>(
    {
      id: overrides.id ?? createId("script"),
      projectId,
      title: overrides.title ?? "Test Script",
      segments: overrides.segments ?? [buildSegment()],
      timestamps: overrides.timestamps ?? DEFAULT_TIMESTAMPS,
      createdAt,
      updatedAt,
    },
    overrides
  );
}

export function buildBeat(overrides: Partial<Beat> = {}): Beat {
  return mergeFactory<Beat>(
    {
      id: overrides.id ?? createId("beat"),
      blueprintId: overrides.blueprintId,
      index: overrides.index ?? 0,
      title: overrides.title ?? "Hook",
      coreArgument: overrides.coreArgument ?? "Core argument goes here.",
      targetEmotion: overrides.targetEmotion ?? TargetEmotion.CURIOSITY,
      microHook: overrides.microHook ?? "Did you know?",
      estimatedDurationMs: overrides.estimatedDurationMs ?? 12000,
      mediaSuggestions: overrides.mediaSuggestions ?? ["image"],
      reviewStatus: overrides.reviewStatus ?? "pending",
      reviewNotes: overrides.reviewNotes ?? null,
    },
    overrides
  );
}

export function buildBlueprint(overrides: Partial<Blueprint> = {}): Blueprint {
  const createdAt = overrides.createdAt ?? now();
  const updatedAt = overrides.updatedAt ?? now();
  const projectId = overrides.projectId ?? createId("project");
  const beats = overrides.beats ?? [buildBeat({ blueprintId: overrides.id })];

  return mergeFactory<Blueprint>(
    {
      id: overrides.id ?? createId("blueprint"),
      projectId,
      version: overrides.version ?? 1,
      targetDurationMs: overrides.targetDurationMs ?? 90_000,
      status: overrides.status ?? ("PENDING_REVIEW" as BlueprintStatus),
      beats,
      rejectionNotes: overrides.rejectionNotes ?? null,
      createdAt,
      updatedAt,
    },
    { ...overrides, beats }
  );
}

export function buildBeatDraft(overrides: Partial<BeatDraft> = {}): BeatDraft {
  return mergeFactory<BeatDraft>(
    {
      id: overrides.id ?? createId("beat-draft"),
      scriptDraftId: overrides.scriptDraftId ?? createId("script-draft"),
      beatId: overrides.beatId ?? createId("beat"),
      beatIndex: overrides.beatIndex ?? 0,
      text: overrides.text ?? "This is a drafted beat.",
      wordCount: overrides.wordCount ?? 42,
      styleModifiersUsed: overrides.styleModifiersUsed ?? ["dramatic"],
      checkpoint: overrides.checkpoint ?? "first_draft",
      guidanceApplied: overrides.guidanceApplied ?? null,
      regeneratedFromId: overrides.regeneratedFromId ?? null,
    },
    overrides
  );
}

export function buildGlueIssue(overrides: Partial<GlueIssue> = {}): GlueIssue {
  return mergeFactory<GlueIssue>(
    {
      id: overrides.id ?? createId("glue-issue"),
      type: overrides.type ?? "seam",
      location:
        overrides.location ??
        ({
          beatIndex: 0,
          charStart: 0,
          charEnd: 5,
        } satisfies GlueIssue["location"]),
      severity: overrides.severity ?? "warning",
      suggestion: overrides.suggestion ?? "Smooth the transition.",
      text: overrides.text ?? "Detected seam between beats.",
      resolved: overrides.resolved ?? false,
    },
    overrides
  );
}

export function buildScriptDraft(
  overrides: Partial<ScriptDraft> = {}
): ScriptDraft {
  const createdAt = overrides.createdAt ?? now();
  const updatedAt = overrides.updatedAt ?? now();
  const beatDrafts = overrides.beatDrafts ?? [buildBeatDraft()];

  return mergeFactory<ScriptDraft>(
    {
      id: overrides.id ?? createId("script-draft"),
      blueprintId: overrides.blueprintId ?? createId("blueprint"),
      version: overrides.version ?? 1,
      status: overrides.status ?? ("DRAFTING" as ScriptDraftStatus),
      currentBeatIndex: overrides.currentBeatIndex ?? 0,
      beatDrafts,
      glueIssues: overrides.glueIssues ?? [buildGlueIssue()],
      polishedText: overrides.polishedText ?? null,
      createdAt,
      updatedAt,
    },
    { ...overrides, beatDrafts }
  );
}
