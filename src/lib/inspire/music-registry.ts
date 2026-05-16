import fs from "node:fs";
import path from "node:path";
import { writeFileAtomically } from "../file-utils";

const REGISTRY_PATH = "prompts/inspire/_music-registry.json";
const MUSIC_DIR = "public/background-music";
const SUPPORTED_EXTENSIONS = new Set([".mp3", ".wav"]);

// ── Types ─────────────────────────────────────────────────────────────────

interface MusicHistoryEntry {
  track: string;
  slug: string;
  usedAt: string;
}

interface MusicRegistry {
  version: 1;
  history: MusicHistoryEntry[];
}

// ── Registry I/O ──────────────────────────────────────────────────────────

function emptyRegistry(): MusicRegistry {
  return { version: 1, history: [] };
}

export function loadMusicRegistry(): MusicRegistry {
  if (!fs.existsSync(REGISTRY_PATH)) return emptyRegistry();
  try {
    const raw = JSON.parse(
      fs.readFileSync(REGISTRY_PATH, "utf-8"),
    ) as MusicRegistry;
    if (raw.version !== 1) return emptyRegistry();
    return raw;
  } catch {
    return emptyRegistry();
  }
}

export function saveMusicRegistry(registry: MusicRegistry): void {
  fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  writeFileAtomically(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

// ── Track scanning ────────────────────────────────────────────────────────

export function scanTracks(): string[] {
  if (!fs.existsSync(MUSIC_DIR)) return [];
  return fs
    .readdirSync(MUSIC_DIR)
    .filter((f) => SUPPORTED_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => `background-music/${f}`);
}

// ── LRU pick ──────────────────────────────────────────────────────────────

export function pickNextTrack(registry: MusicRegistry): string | null {
  const tracks = scanTracks();
  if (tracks.length === 0) return null;

  // Build map: track → most recent usedAt (undefined if never used)
  const lastUsed = new Map<string, string | undefined>();
  for (const track of tracks) {
    lastUsed.set(track, undefined);
  }
  for (const entry of registry.history) {
    if (lastUsed.has(entry.track)) {
      const current = lastUsed.get(entry.track);
      if (current === undefined || entry.usedAt > current) {
        lastUsed.set(entry.track, entry.usedAt);
      }
    }
  }

  // Sort: never-used first, then oldest usedAt first
  const sorted = [...lastUsed.entries()].sort((a, b) => {
    if (a[1] === undefined && b[1] === undefined) return a[0].localeCompare(b[0]);
    if (a[1] === undefined) return -1;
    if (b[1] === undefined) return 1;
    return a[1].localeCompare(b[1]);
  });

  return sorted[0][0];
}

// ── Record usage (immutable) ──────────────────────────────────────────────

export function recordTrackUse(
  registry: MusicRegistry,
  track: string,
  slug: string,
): MusicRegistry {
  const entry: MusicHistoryEntry = {
    track,
    slug,
    usedAt: new Date().toISOString(),
  };
  return {
    ...registry,
    history: [...registry.history, entry],
  };
}
