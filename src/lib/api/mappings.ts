import type { AssetMappings } from "@/src/lib/storyflow/types";

export async function saveAssetMappings(
  projectId: string,
  mappings: AssetMappings
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/mappings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mappings }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || "Failed to save asset mappings");
  }
}
