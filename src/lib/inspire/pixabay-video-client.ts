import fs from "node:fs";
import path from "node:path";
import { traceable } from "langsmith/traceable";
import { PIXABAY_VIDEOS_BASE_URL, PIXABAY_TIMEOUT_MS } from "../config";

const USER_AGENT =
  "Mozilla/5.0 (compatible; remotion-p2v-inspire/1.0)";

interface PixabayVideoFile {
  url: string;
  width: number;
  height: number;
}

interface PixabayVideoHit {
  id: number;
  pageURL: string;
  duration: number;
  videos: {
    large?: PixabayVideoFile;
    medium?: PixabayVideoFile;
    small?: PixabayVideoFile;
  };
}

interface PixabayVideoResponse {
  totalHits?: number;
  hits?: PixabayVideoHit[];
}

export interface VideoDownloadResult {
  ok: boolean;
  path?: string;
  sourceUrl?: string;
  loop: boolean;
  error?: string;
}

async function searchAndDownloadVideoImpl(
  query: string,
  destPath: string,
  minDurationSeconds: number,
): Promise<VideoDownloadResult> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return { ok: false, loop: false, error: "PIXABAY_API_KEY is not set" };
  }

  const url = new URL(PIXABAY_VIDEOS_BASE_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("per_page", "5");
  url.searchParams.set("min_width", "1920");
  url.searchParams.set("safesearch", "true");

  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(PIXABAY_TIMEOUT_MS),
  });

  if (!res.ok) {
    return {
      ok: false,
      loop: false,
      error: `Pixabay Video API HTTP ${res.status} ${res.statusText}`,
    };
  }

  const body = (await res.json()) as PixabayVideoResponse;
  const hits = body.hits ?? [];

  if (hits.length === 0) {
    return { ok: false, loop: false, error: `no Pixabay video results for "${query}"` };
  }

  // Pick first hit with sufficient duration, or longest available
  let bestHit = hits[0];
  let needsLoop = bestHit.duration < minDurationSeconds;

  for (const hit of hits) {
    if (hit.duration >= minDurationSeconds) {
      bestHit = hit;
      needsLoop = false;
      break;
    }
    if (hit.duration > bestHit.duration) {
      bestHit = hit;
    }
  }

  const videoUrl =
    bestHit.videos.large?.url ?? bestHit.videos.medium?.url;

  if (!videoUrl) {
    return { ok: false, loop: false, error: "no usable video URL in Pixabay result" };
  }

  const videoRes = await fetch(videoUrl, {
    redirect: "follow",
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(PIXABAY_TIMEOUT_MS * 4), // videos are larger
  });

  if (!videoRes.ok) {
    return {
      ok: false,
      loop: false,
      error: `Video download HTTP ${videoRes.status}`,
    };
  }

  const buffer = Buffer.from(await videoRes.arrayBuffer());
  if (buffer.length === 0) {
    return { ok: false, loop: false, error: "Downloaded video is empty" };
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);

  return {
    ok: true,
    path: destPath,
    sourceUrl: bestHit.pageURL,
    loop: needsLoop,
  };
}

export const searchAndDownloadVideo = traceable(searchAndDownloadVideoImpl, {
  name: "pixabay_video_search",
  run_type: "tool",
});
