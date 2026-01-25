export interface ExecutionStatus {
  status: "PENDING" | "DRAFTING" | "GLUING" | "POLISHING" | "COMPLETED" | "FAILED";
  currentBeatIndex: number;
  completedBeats: number;
  totalBeats: number;
  lastCheckpoint: string;
}

export interface ScriptDraft {
  id: string;
  status: string;
  content: Record<string, unknown>;
  beatDrafts: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

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
