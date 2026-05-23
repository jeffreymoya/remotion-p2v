import fs from "node:fs";
import path from "node:path";
import { traceable } from "langsmith/traceable";
import { PEXELS_IMAGES_BASE_URL, PEXELS_IMAGE_PER_PAGE, PIXABAY_TIMEOUT_MS } from "../config";
import { enrichCurrentRun } from "../tracing";

const USER_AGENT = "Mozilla/5.0 (compatible; remotion-p2v/1.0)";

export interface ImageDownloadResult {
  ok: boolean;
  path?: string;
  sourceUrl?: string;
  imageId?: number;
  error?: string;
}

interface PexelsPhotoSrc {
  original: string;
  large2x: string;
  large: string;
  medium: string;
}

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  src: PexelsPhotoSrc;
}

interface PexelsPhotosResponse {
  total_results?: number;
  photos?: PexelsPhoto[];
}

async function searchAndDownloadImageImpl(
  query: string,
  destPath: string,
): Promise<ImageDownloadResult> {
  enrichCurrentRun({ phase: "videos", provider: "pexels" });
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "PEXELS_API_KEY is not set" };
  }

  const url = new URL(PEXELS_IMAGES_BASE_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", String(PEXELS_IMAGE_PER_PAGE));

  const res = await fetch(url, {
    headers: {
      Authorization: apiKey,
      "user-agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(PIXABAY_TIMEOUT_MS),
  });

  if (!res.ok) {
    return {
      ok: false,
      error: `Pexels Image API HTTP ${res.status} ${res.statusText}`,
    };
  }

  const body = (await res.json()) as PexelsPhotosResponse;
  const photos = body.photos ?? [];

  if (photos.length === 0) {
    return { ok: false, error: `no Pexels image results for "${query}"` };
  }

  // Prefer landscape photos with width >= 1920
  const candidates = photos
    .filter((p) => p.width >= 1920)
    .sort((a, b) => b.width - a.width);
  const bestPhoto = candidates[0] ?? photos[0];

  const imageUrl = bestPhoto.src.large2x || bestPhoto.src.original;
  const imageRes = await fetch(imageUrl, {
    redirect: "follow",
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(PIXABAY_TIMEOUT_MS * 2),
  });

  if (!imageRes.ok) {
    return { ok: false, error: `Image download HTTP ${imageRes.status}` };
  }

  const buffer = Buffer.from(await imageRes.arrayBuffer());
  if (buffer.length === 0) {
    return { ok: false, error: "Downloaded image is empty" };
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);

  return {
    ok: true,
    path: destPath,
    sourceUrl: bestPhoto.url,
    imageId: bestPhoto.id,
  };
}

export const searchAndDownloadImage = traceable(searchAndDownloadImageImpl, {
  name: "pexels_image_search",
  run_type: "tool",
});
