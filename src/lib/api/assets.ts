export interface AssetSearchResult {
  id: string;
  previewUrl: string;
  downloadUrl: string;
  photographer?: string;
  type: "IMAGE" | "VIDEO";
  source: "pexels" | "unsplash" | "pixabay";
}

export async function searchAssets(query: string): Promise<AssetSearchResult[]> {
  const res = await fetch(`/api/assets/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to search assets");
  }
  const data = await res.json();
  return data.results || [];
}

export async function uploadAsset(
  projectId: string,
  file: File
): Promise<{ id: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("projectId", projectId);

  const res = await fetch("/api/assets/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload asset");
  return res.json();
}
