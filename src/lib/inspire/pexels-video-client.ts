import fs from "node:fs";
import path from "node:path";
import { traceable } from "langsmith/traceable";
import { PEXELS_VIDEOS_BASE_URL, PEXELS_VIDEO_PER_PAGE, PIXABAY_TIMEOUT_MS } from "../config";
import type { VideoDownloadResult, VideoSearchOptions, SelectionTier } from "./video-source";
import { screenThumbnails } from "./vision-screener";
import { enrichCurrentRun } from "../tracing";

const USER_AGENT = "Mozilla/5.0 (compatible; remotion-p2v-inspire/1.0)";

interface PexelsVideoFile {
  quality: "sd" | "hd" | "uhd";
  file_type: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsVideoPicture {
  id: number;
  nr: number;
  picture: string;
}

interface PexelsVideoHit {
  id: number;
  duration: number;
  url: string;
  image?: string;
  video_files: PexelsVideoFile[];
  video_pictures?: PexelsVideoPicture[];
}

interface PexelsVideoResponse {
  total_results?: number;
  videos?: PexelsVideoHit[];
}

function pickBestFile(files: PexelsVideoFile[]): PexelsVideoFile | undefined {
  const hd = files
    .filter((f) => f.quality === "hd" && f.width >= 1920)
    .sort((a, b) => b.width - a.width);
  if (hd.length > 0) return hd[0];

  const byWidth = [...files].sort((a, b) => b.width - a.width);
  return byWidth[0];
}

async function searchAndDownloadVideoImpl(
  query: string,
  destPath: string,
  minDurationSeconds: number,
  options?: VideoSearchOptions,
): Promise<VideoDownloadResult> {
  enrichCurrentRun({ phase: "videos", provider: "pexels" });
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return { ok: false, loop: false, error: "PEXELS_API_KEY is not set" };
  }

  const url = new URL(PEXELS_VIDEOS_BASE_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", String(PEXELS_VIDEO_PER_PAGE));
  url.searchParams.set("size", "large");

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
      loop: false,
      error: `Pexels Video API HTTP ${res.status} ${res.statusText}`,
    };
  }

  const body = (await res.json()) as PexelsVideoResponse;
  const rawHits = body.videos ?? [];

  if (rawHits.length === 0) {
    return { ok: false, loop: false, error: `no Pexels video results for "${query}"` };
  }

  const thumbnailItems = rawHits.map((hit) => ({
    id: hit.id,
    thumbnailUrl: hit.video_pictures?.[0]?.picture ?? hit.image ?? "",
  })).filter((item) => item.thumbnailUrl !== "");

  const passingIds = await screenThumbnails(thumbnailItems);
  const hits = rawHits.filter((hit) => passingIds.has(hit.id));

  if (hits.length === 0) {
    return {
      ok: false,
      loop: false,
      error: `all ${rawHits.length} Pexels results for "${query}" were rejected by visual screen`,
    };
  }

  // Tiered selection with dedup awareness
  const excludeIds = options?.excludeIds ?? new Set<number>();
  const cooldownIds = options?.cooldownIds ?? new Set<number>();
  const lruSortedIds = options?.lruSortedIds ?? [];
  const lruRank = new Map(lruSortedIds.map((id, i) => [id, i]));
  const lruScore = (id: number) => lruRank.get(id) ?? lruSortedIds.length;

  let bestHit: PexelsVideoHit | undefined;
  let needsLoop = false;
  let tier: SelectionTier = "last-resort";

  // Tier 1: fresh, duration OK
  for (const hit of hits) {
    if (!excludeIds.has(hit.id) && !cooldownIds.has(hit.id) && hit.duration >= minDurationSeconds) {
      bestHit = hit; needsLoop = false; tier = "fresh"; break;
    }
  }
  // Tier 2: fresh, needs loop
  if (!bestHit) {
    const candidates = hits.filter(h => !excludeIds.has(h.id) && !cooldownIds.has(h.id));
    if (candidates.length) { bestHit = candidates[0]; needsLoop = true; tier = "fresh-loop"; }
  }
  // Tier 3: cooldown, duration OK — LRU preferred
  if (!bestHit) {
    const candidates = hits
      .filter(h => !excludeIds.has(h.id) && h.duration >= minDurationSeconds)
      .sort((a, b) => lruScore(a.id) - lruScore(b.id));
    if (candidates.length) { bestHit = candidates[0]; needsLoop = false; tier = "cooldown"; }
  }
  // Tier 4: cooldown, needs loop — LRU preferred
  if (!bestHit) {
    const candidates = hits
      .filter(h => !excludeIds.has(h.id))
      .sort((a, b) => lruScore(a.id) - lruScore(b.id));
    if (candidates.length) {
      bestHit = candidates[0];
      needsLoop = candidates[0].duration < minDurationSeconds;
      tier = "cooldown-loop";
    }
  }
  // Tier 5: true last resort — LRU
  if (!bestHit) {
    const sorted = [...hits].sort((a, b) => lruScore(a.id) - lruScore(b.id));
    bestHit = sorted[0];
    needsLoop = bestHit.duration < minDurationSeconds;
    tier = "last-resort";
  }

  const bestFile = pickBestFile(bestHit.video_files);
  if (!bestFile) {
    return { ok: false, loop: false, error: "no usable video file in Pexels result" };
  }

  const videoRes = await fetch(bestFile.link, {
    redirect: "follow",
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(PIXABAY_TIMEOUT_MS * 4),
  });

  if (!videoRes.ok) {
    return { ok: false, loop: false, error: `Video download HTTP ${videoRes.status}` };
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
    sourceUrl: bestHit.url,
    videoId: bestHit.id,
    tier,
    loop: needsLoop,
  };
}

export const searchAndDownloadVideoFromPexels = traceable(searchAndDownloadVideoImpl, {
  name: "pexels_video_search",
  run_type: "tool",
});
