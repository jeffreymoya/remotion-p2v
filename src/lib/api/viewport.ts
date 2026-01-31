import {
  DetectedRegion,
  Viewport,
  ViewportKeyframe,
} from "@/src/lib/storyflow/types";

export async function generateViewport(
  projectId: string,
  imageAssetId: string
): Promise<{
  viewport: {
    keyframes: ViewportKeyframe[];
    regions: DetectedRegion[];
  };
  source: "ai" | "fallback";
}> {
  const res = await fetch("/api/ai/viewport", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, imageAssetId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || "Failed to generate viewport");
  }
  return res.json();
}

export async function saveViewport(
  projectId: string,
  data: {
    imageAssetId: string;
    keyframes: ViewportKeyframe[];
    regions: DetectedRegion[];
  }
): Promise<Viewport> {
  const res = await fetch(`/api/projects/${projectId}/viewport`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || "Failed to save viewport");
  }
  const result = await res.json();
  return result.viewport;
}
