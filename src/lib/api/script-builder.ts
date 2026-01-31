import type {
  BeatDraft,
  Blueprint as ScriptBlueprint,
  ScriptDraft as ScriptBuilderDraft,
} from "@/src/lib/storyflow/script-builder-types";
import type { Script as StoryflowScript } from "@/src/lib/storyflow/types";

export interface ExecutionStatus {
  status: "PENDING" | "DRAFTING" | "GLUING" | "POLISHING" | "COMPLETED" | "FAILED";
  currentBeatIndex: number;
  completedBeats: number;
  totalBeats: number;
  lastCheckpoint: string;
}

export type ScriptDraft = ScriptBuilderDraft;

export async function fetchExecutionStatus(draftId: string): Promise<ExecutionStatus> {
  const res = await fetch(`/api/script-builder/execute/${draftId}/status`);
  if (!res.ok) throw new Error("Failed to fetch execution status");
  return res.json();
}

export async function fetchScriptDraft(draftId: string): Promise<ScriptDraft> {
  const res = await fetch(`/api/script-builder/draft/${draftId}`);
  if (!res.ok) throw new Error("Failed to fetch script draft");
  const data = await res.json();
  return data.draft;
}

export async function startExecution(blueprintId: string): Promise<{
  scriptDraftId: string;
  status: string;
  totalBeats: number;
}> {
  const res = await fetch("/api/script-builder/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blueprintId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to start execution");
  }
  return res.json();
}

export async function resumeExecution(draftId: string): Promise<{
  status: string;
  resumedFromBeat: number;
}> {
  const res = await fetch(`/api/script-builder/execute/${draftId}/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to resume execution");
  }
  return res.json();
}

export type Blueprint = ScriptBlueprint;

export async function generateBlueprint(params: {
  projectId: string;
  topic: string;
  targetDurationMs: number;
}): Promise<{ blueprint: Blueprint }> {
  const res = await fetch("/api/script-builder/blueprint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail =
      typeof data.error === "string"
        ? data.error
        : data.error?.topic?.[0] || "Failed to generate blueprint";
    throw new Error(detail);
  }
  return res.json();
}

export async function regenerateBlueprint(params: {
  blueprintId: string;
  rejectionNotes?: string;
}): Promise<{ blueprint: Blueprint; message?: string }> {
  const res = await fetch(`/api/script-builder/blueprint/${params.blueprintId}/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rejectionNotes: params.rejectionNotes }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail = typeof data.error === "string" ? data.error : "Failed to regenerate blueprint";
    throw new Error(detail);
  }
  return res.json();
}

export type Beat = BeatDraft;
export type Script = StoryflowScript;

export async function segmentScript(draftId: string): Promise<{
  script: Script;
  message?: string;
}> {
  const res = await fetch("/api/script-builder/segment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draftId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail =
      typeof data.error === "string"
        ? data.error
        : data.error?.draftId?.[0] || "Failed to segment script";
    throw new Error(detail);
  }
  return res.json();
}

// Beat regeneration
export async function regenerateBeat(params: {
  beatDraftId: string;
  guidance?: string;
}): Promise<{ message: string; draft: ScriptDraft }> {
  const res = await fetch(`/api/script-builder/beat/${params.beatDraftId}/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guidance: params.guidance }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to regenerate beat");
  }
  return res.json();
}

// Blueprint review
export async function reviewBlueprint(params: {
  blueprintId: string;
  reviews: Array<{ beatIndex: number; status: "approved" | "rejected"; notes?: string }>;
}): Promise<{ message: string; blueprint: Blueprint; requiresRegeneration: boolean }> {
  const res = await fetch(`/api/script-builder/blueprint/${params.blueprintId}/review`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviews: params.reviews }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to submit reviews");
  }
  return res.json();
}

// Blueprint/Draft history
export interface HistoryItem {
  id: string;
  version: number;
  event: string;
  createdAt: string;
  snapshot: unknown;
}

export async function fetchBlueprintHistory(blueprintId: string): Promise<HistoryItem[]> {
  const res = await fetch(`/api/script-builder/blueprint/${blueprintId}/history`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load history");
  }
  const data = await res.json();
  return data.history.map((h: Record<string, unknown>) => ({
    id: h.id as string,
    version: h.version as number,
    event: h.event as string,
    createdAt: h.createdAt as string,
    snapshot: h.snapshot,
  }));
}

export async function fetchDraftHistory(draftId: string): Promise<HistoryItem[]> {
  const res = await fetch(`/api/script-builder/draft/${draftId}/history`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load history");
  }
  const data = await res.json();
  return data.history.map((h: Record<string, unknown>) => ({
    id: h.id as string,
    version: h.version as number,
    event: h.event as string,
    createdAt: h.createdAt as string,
    snapshot: h.snapshot,
  }));
}

// Glue phase
export async function analyzeGlue(draftId: string): Promise<{
  polishedText: string;
  issues: Array<Record<string, unknown>>;
}> {
  const res = await fetch(`/api/script-builder/draft/${draftId}/glue-analysis`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Glue analysis failed");
  }
  return res.json();
}

export async function savePolishedText(params: {
  draftId: string;
  polishedText: string;
  resolvedIssues: string[];
}): Promise<{ message: string; draft: ScriptDraft }> {
  const res = await fetch(`/api/script-builder/draft/${params.draftId}/polish`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      polishedText: params.polishedText,
      resolvedIssues: params.resolvedIssues,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save");
  }
  return res.json();
}
