import { Prisma } from "@/src/generated/storyflow";
import { storyflowPrisma } from "./prisma";

type BlueprintSnapshot = {
  id: string;
  projectId: string;
  version: number;
  targetDurationMs: number;
  status: string;
  beats: Prisma.JsonValue;
  rejectionNotes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type ScriptDraftSnapshot = {
  id: string;
  blueprintId: string;
  version: number;
  status: string;
  currentBeatIndex: number;
  beatDrafts: Prisma.JsonValue;
  glueIssues?: Prisma.JsonValue | null;
  polishedText?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

function normalizeDates<T extends { createdAt?: Date; updatedAt?: Date }>(
  snapshot: T
): Record<string, unknown> {
  return {
    ...snapshot,
    createdAt:
      snapshot.createdAt instanceof Date
        ? snapshot.createdAt.toISOString()
        : snapshot.createdAt,
    updatedAt:
      snapshot.updatedAt instanceof Date
        ? snapshot.updatedAt.toISOString()
        : snapshot.updatedAt,
  };
}

export async function recordBlueprintHistory(
  blueprint: BlueprintSnapshot,
  event: string
) {
  try {
    await storyflowPrisma.blueprintHistory.create({
      data: {
        blueprintId: blueprint.id,
        version: blueprint.version,
        event,
        snapshot: normalizeDates(blueprint) as Prisma.JsonValue,
      },
    });
  } catch (error) {
    console.error("[history] Failed to record blueprint history:", error);
  }
}

export async function recordScriptDraftHistory(
  draft: ScriptDraftSnapshot,
  event: string
) {
  try {
    await storyflowPrisma.scriptDraftHistory.create({
      data: {
        scriptDraftId: draft.id,
        blueprintId: draft.blueprintId,
        version: draft.version,
        event,
        snapshot: normalizeDates(draft) as Prisma.JsonValue,
      },
    });
  } catch (error) {
    console.error("[history] Failed to record script draft history:", error);
  }
}
