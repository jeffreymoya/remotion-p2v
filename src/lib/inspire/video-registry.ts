import fs from "node:fs";
import path from "node:path";

const REGISTRY_PATH = "prompts/inspire/_video-registry.json";
const SLUG_HISTORY_MAX = 50;

interface VideoRegistryUse {
  slug: string;
  clipIndex: number;
  query: string;
  usedAt: string;
}

interface VideoRegistryEntry {
  pageURL: string;
  duration: number;
  uses: VideoRegistryUse[];
}

interface VideoRegistry {
  version: 1;
  slugHistory: string[];
  videos: {
    pixabay: Record<string, VideoRegistryEntry>;
    pexels: Record<string, VideoRegistryEntry>;
  };
}

function emptyRegistry(): VideoRegistry {
  return {
    version: 1,
    slugHistory: [],
    videos: { pixabay: {}, pexels: {} },
  };
}

export function loadRegistry(): VideoRegistry {
  if (!fs.existsSync(REGISTRY_PATH)) return emptyRegistry();
  try {
    const raw = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8")) as VideoRegistry;
    if (raw.version !== 1) return emptyRegistry();
    return raw;
  } catch {
    return emptyRegistry();
  }
}

export function saveRegistry(r: VideoRegistry): void {
  fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(r, null, 2));
}

export function getCooldownIds(
  r: VideoRegistry,
  source: "pixabay" | "pexels",
  cooldownN: number,
): Set<number> {
  const recentSlugs = new Set(r.slugHistory.slice(-cooldownN));
  const ids = new Set<number>();
  const entries = r.videos[source];

  for (const [idStr, entry] of Object.entries(entries)) {
    if (entry.uses.some((u) => recentSlugs.has(u.slug))) {
      ids.add(Number(idStr));
    }
  }

  return ids;
}

export function getLruSortedIds(
  r: VideoRegistry,
  source: "pixabay" | "pexels",
): number[] {
  const entries = Object.entries(r.videos[source]);
  return entries
    .map(([idStr, entry]) => ({
      id: Number(idStr),
      lastUsed: entry.uses.length > 0 ? entry.uses[entry.uses.length - 1].usedAt : "",
    }))
    .sort((a, b) => a.lastUsed.localeCompare(b.lastUsed))
    .map((e) => e.id);
}

export function registerVideo(
  r: VideoRegistry,
  source: "pixabay" | "pexels",
  id: number,
  info: { pageURL: string; duration: number; slug: string; clipIndex: number; query: string },
): void {
  const key = String(id);
  const existing = r.videos[source][key];
  const use: VideoRegistryUse = {
    slug: info.slug,
    clipIndex: info.clipIndex,
    query: info.query,
    usedAt: new Date().toISOString(),
  };

  if (existing) {
    r.videos[source][key] = {
      ...existing,
      uses: [...existing.uses, use],
    };
  } else {
    r.videos[source][key] = {
      pageURL: info.pageURL,
      duration: info.duration,
      uses: [use],
    };
  }
}

export function recordSlug(r: VideoRegistry, slug: string): void {
  if (r.slugHistory[r.slugHistory.length - 1] === slug) return;
  const updated = [...r.slugHistory, slug];
  r.slugHistory = updated.slice(-SLUG_HISTORY_MAX);
}
