import fs from "node:fs";
import path from "node:path";
import { traceable } from "langsmith/traceable";
import { PIXABAY_VIDEOS_BASE_URL, PIXABAY_TIMEOUT_MS, PIXABAY_VIDEO_PER_PAGE } from "../config";
import type { VideoDownloadResult, VideoSearchOptions, SelectionTier } from "./video-source";
import { screenThumbnails } from "./vision-screener";
import { enrichCurrentRun } from "../tracing";

export type { VideoDownloadResult } from "./video-source";

const USER_AGENT =
  "Mozilla/5.0 (compatible; remotion-p2v-inspire/1.0)";

interface PixabayVideoFile {
  url: string;
  width: number;
  height: number;
  thumbnail?: string;
}

interface PixabayVideoHit {
  id: number;
  pageURL: string;
  tags: string;
  duration: number;
  videos: {
    large?: PixabayVideoFile;
    medium?: PixabayVideoFile;
    small?: PixabayVideoFile;
  };
}

// ── Tag-based content filter ─────────────────────────────────────────────
// Reject videos whose Pixabay tags indicate unsuitable content for
// inspirational videos (animals, pets, toys, holidays, etc.).

const BLOCKED_TAGS = new Set([
  // Animals & pets
  "animal", "animals", "pet", "pets", "dog", "dogs", "puppy", "puppies",
  "cat", "cats", "kitten", "kittens", "bird", "birds", "fish", "horse",
  "horses", "deer", "rabbit", "bunny", "wildlife", "lion", "eagle",
  "wolf", "bear", "insect", "butterfly", "snake", "reptile", "parrot",
  "hamster", "turtle", "frog", "cow", "pig", "sheep", "chicken", "duck",
  "goose", "owl", "hawk", "fox", "monkey", "elephant", "giraffe", "zebra",
  "penguin", "dolphin", "whale", "shark", "octopus", "crab", "squirrel",
  "hedgehog", "panda", "koala", "kangaroo", "camel", "gorilla",
  "reindeer", "moose", "elk",
  // Toys & objects
  "toy", "toys", "stuffed animal", "plush", "doll", "figurine", "teddy",
  "teddy bear", "puppet", "lego", "action figure",
  // Holiday & seasonal
  "christmas", "santa", "easter", "halloween", "valentine", "xmas",
  "holiday", "ornament", "decoration", "festive", "costume",
  // Comedy & unsuitable tone
  "funny", "comedy", "cartoon", "animation", "meme", "prank",
  // Sexualized / glamour content
  "sexy", "sensual", "seductive", "erotic", "glamour", "boudoir",
  "bikini", "swimsuit", "swimwear", "bathing suit", "beachwear",
  "lingerie", "underwear", "undergarment", "thong", "topless", "nude",
  // Food
  "food", "cooking", "recipe", "meal", "dish", "kitchen", "baking",
  "cake", "dessert", "fruit", "vegetable",
  // CGI, 3D, sci-fi, tech (non-cinematic)
  "robot", "robots", "cyborg", "android", "3d", "3d render", "cgi",
  "render", "sci-fi", "science fiction", "futuristic", "mech",
  "mechanical", "artificial intelligence", "ai", "machine", "technology",
  "digital", "virtual", "hologram", "spaceship", "spacecraft", "alien",
  "space", "galaxy", "universe", "fantasy", "magic", "superhero",
  "armor", "warrior", "game", "gaming", "video game",
  // Abstract / motion graphics
  "abstract", "fractal", "particles", "bokeh", "motion graphics",
  "vfx", "effects", "smoke", "ink", "liquid", "fluid", "geometric",
  "neon", "glow", "loop", "background", "wallpaper", "screensaver",
]);

function hasBlockedTag(tags: string): boolean {
  const tagList = tags.toLowerCase().split(",").map((t) => t.trim());
  return tagList.some((tag) => BLOCKED_TAGS.has(tag));
}

interface PixabayVideoResponse {
  totalHits?: number;
  hits?: PixabayVideoHit[];
}

async function searchAndDownloadVideoImpl(
  query: string,
  destPath: string,
  minDurationSeconds: number,
  options?: VideoSearchOptions,
): Promise<VideoDownloadResult> {
  enrichCurrentRun({ phase: "videos", provider: "pixabay" });
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return { ok: false, loop: false, error: "PIXABAY_API_KEY is not set" };
  }

  const url = new URL(PIXABAY_VIDEOS_BASE_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("per_page", String(PIXABAY_VIDEO_PER_PAGE));
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
  const rawHits = body.hits ?? [];

  // Filter out videos with tags indicating unsuitable content
  const tagFiltered = rawHits.filter((h) => !hasBlockedTag(h.tags ?? ""));

  if (tagFiltered.length === 0) {
    const reason = rawHits.length > 0
      ? `all ${rawHits.length} Pixabay results for "${query}" were filtered out (unsuitable content tags)`
      : `no Pixabay video results for "${query}"`;
    return { ok: false, loop: false, error: reason };
  }

  // Visual content gate — batch-screen thumbnails via Cloud Vision
  const thumbnailItems = tagFiltered.map((h) => ({
    id: h.id,
    thumbnailUrl:
      h.videos.medium?.thumbnail ??
      h.videos.small?.thumbnail ??
      h.videos.large?.thumbnail ?? "",
  })).filter((item) => item.thumbnailUrl !== "");

  const passingIds = await screenThumbnails(thumbnailItems);
  const hits = tagFiltered.filter((h) => passingIds.has(h.id));

  if (hits.length === 0) {
    return {
      ok: false,
      loop: false,
      error: `all ${tagFiltered.length} tag-filtered Pixabay results for "${query}" were rejected by visual screen`,
    };
  }

  // Tiered selection with dedup awareness
  const excludeIds = options?.excludeIds ?? new Set<number>();
  const cooldownIds = options?.cooldownIds ?? new Set<number>();
  const lruSortedIds = options?.lruSortedIds ?? [];
  const lruRank = new Map(lruSortedIds.map((id, i) => [id, i]));
  const lruScore = (id: number) => lruRank.get(id) ?? lruSortedIds.length;

  let bestHit: PixabayVideoHit | undefined;
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
  // Tier 5: true last resort (intra-run excluded) — LRU
  if (!bestHit) {
    const sorted = [...hits].sort((a, b) => lruScore(a.id) - lruScore(b.id));
    bestHit = sorted[0];
    needsLoop = bestHit.duration < minDurationSeconds;
    tier = "last-resort";
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
    videoId: bestHit.id,
    tier,
    loop: needsLoop,
  };
}

export const searchAndDownloadVideo = traceable(searchAndDownloadVideoImpl, {
  name: "pixabay_video_search",
  run_type: "tool",
});
