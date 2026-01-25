import { Render, RenderQuality } from "@/src/lib/storyflow/types";

export async function startRender(
  projectId: string,
  quality: RenderQuality
): Promise<Render> {
  const res = await fetch("/api/render/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, quality }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to start render");
  }

  return json;
}

export async function fetchRenderStatus(renderId: string): Promise<Render> {
  const res = await fetch(`/api/render/${renderId}/status`);
  if (!res.ok) {
    throw new Error("Failed to fetch render status");
  }
  return res.json();
}
