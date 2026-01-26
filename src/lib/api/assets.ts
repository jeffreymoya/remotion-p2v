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

export interface Asset {
  id: string;
  projectId: string;
  type: "IMAGE" | "VIDEO" | "MUSIC" | "AUDIO";
  filename: string;
  path: string;
  url: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export async function fetchAssets(projectId: string): Promise<Asset[]> {
  const res = await fetch(`/api/projects/${projectId}/assets`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch assets");
  }
  const data = await res.json();
  return data.assets || [];
}

export async function uploadAsset(
  projectId: string,
  file: File
): Promise<Asset> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("projectId", projectId);

  const res = await fetch("/api/assets/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to upload asset");
  }
  const data = await res.json();
  return data.asset;
}

export async function deleteAsset(id: string): Promise<void> {
  const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete asset");
  }
}

export async function upscaleAsset(assetId: string): Promise<Asset> {
  const res = await fetch("/api/assets/upscale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to upscale asset");
  }
  const data = await res.json();
  return data.asset;
}

export async function selectMusicAsset(
  projectId: string,
  assetId: string
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/music`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to select music asset");
  }
}
