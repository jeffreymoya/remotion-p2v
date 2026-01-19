import { URLSearchParams } from "url";
import { MusicTrack } from "./types";

type PixabayHit = {
  id: number | string;
  title?: string;
  tags?: string;
  duration?: number;
  duration_secs?: number;
  user?: string;
  username?: string;
  audio?: string;
  audio_url?: string;
  audioURL?: string;
  sound_url?: string;
  previewURL?: string;
  url?: string;
  download_url?: string;
};

function requireApiKey(): string {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    throw new Error("PIXABAY_API_KEY is not configured for the music library.");
  }
  return apiKey;
}

function toTrack(hit: PixabayHit): MusicTrack | null {
  if (!hit) return null;

  // Pixabay audio assets typically expose an `audio` or `audio_url` field on the hit.
  const preview =
    hit.audio ||
    hit.audio_url ||
    hit.audioURL ||
    hit.sound_url ||
    hit.previewURL ||
    hit.url;

  if (!preview) return null;

  // Prefer explicit download URL; fall back to preview when missing.
  const download =
    hit.download_url ||
    hit.audio ||
    hit.audio_url ||
    hit.audioURL ||
    hit.sound_url ||
    preview;

  const tags: string | undefined = typeof hit.tags === "string" ? hit.tags : undefined;
  const firstTag =
    tags?.split(",").map((t) => t.trim()).filter(Boolean)?.[0] ?? `Pixabay track ${hit.id}`;

  return {
    id: `pixabay-${hit.id}`,
    title: hit.title || firstTag,
    duration: typeof hit.duration === "number" ? hit.duration : hit.duration_secs ?? null,
    previewUrl: preview,
    downloadUrl: download,
    tags,
    author: hit.user || hit.username,
    source: "pixabay",
  };
}

export async function searchPixabayMusic(query: string, mood?: string): Promise<MusicTrack[]> {
  const apiKey = requireApiKey();
  const params = new URLSearchParams({
    key: apiKey,
    q: query || mood || "background",
    category: "music",
    per_page: "20",
    safesearch: "true",
    media_type: "audio",
  });

  const url = `https://pixabay.com/api/?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Pixabay music request failed (${res.status})`);
  }

  const data = (await res.json().catch(() => ({ hits: [] }))) as { hits?: PixabayHit[] };
  const hits: PixabayHit[] = Array.isArray(data.hits) ? data.hits : [];

  return hits
    .map((hit) => toTrack(hit))
    .filter((track): track is MusicTrack => Boolean(track));
}
