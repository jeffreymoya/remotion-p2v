import { Timeline } from "@/src/lib/storyflow/types";

export async function buildProject(projectId: string, signal?: AbortSignal): Promise<Timeline> {
  const res = await fetch(`/api/projects/${projectId}/timeline`, { method: "GET", signal });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error ?? "Failed to build project artifacts");
  }

  return json.timeline as Timeline;
}

export async function runStoryboard(projectId: string, signal?: AbortSignal): Promise<{ status: string; boardCount: number }> {
  const res = await fetch(`/api/projects/${projectId}/storyboard`, {
    method: "POST",
    signal,
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error ?? "Failed to run storyboard stage");
  }

  return json as { status: string; boardCount: number };
}

export async function runMedia(projectId: string, signal?: AbortSignal): Promise<{ status: string; assets: number }> {
  const res = await fetch(`/api/projects/${projectId}/media/stage`, {
    method: "POST",
    signal,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? "Failed to run media stage");
  }
  return json as { status: string; assets: number };
}

export async function runScriptStageApi(projectId: string, signal?: AbortSignal): Promise<{ status: string; segments: number }> {
  const res = await fetch(`/api/projects/${projectId}/script/stage`, {
    method: "POST",
    signal,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? "Failed to run script stage");
  }
  return json as { status: string; segments: number };
}
