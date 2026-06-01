// Publish manifest phase (YPP Backlog 1 / Deliverable C).
//
// Aggregates per-video provenance + publish-readiness from the artifacts other
// phases already wrote to `prompts/docu/<slug>-*.json`. This is the *read*
// counterpart to the write-side artifacts (research anchors, the variety
// assignment, the clip-attribution gate's records, the image manifest). It runs
// last in the `PIPELINE` array and performs no LLM / network / heavy IO — pure
// aggregation plus one JSON read/write.
//
// AI disclosure and human review have no producer yet (the AI-disclosure helper
// is Backlog 5 and the metadata-review gate is Step 3), so they are *required
// fields that start null and block "ready to publish"* until a later step or a
// human fills them in. That is Backlog 1's criterion 3.

import { readCachedJson, writeCachedJson } from "./pipeline";

const PROMPTS_DIR = "prompts/docu";

export function publishManifestPath(slug: string): string {
  return `${PROMPTS_DIR}/${slug}-publish-manifest.json`;
}

// ── Types ─────────────────────────────────────────────────────────────────

/** Shape only; populated by the Backlog-5 AI-disclosure helper later. */
export interface AiDisclosure {
  containsSyntheticPeopleVoicesOrEvents: boolean;
  recommendedStudioAnswer: string;
  rationale: string;
}

export interface ThirdPartyClip {
  sourceUrl: string;
  channel: string;
  title: string;
  durationSec: number;
  transformationNote?: string;
}

export interface PublishManifest {
  slug: string;
  topic: string;
  generatedAt: string;
  /** null until the Backlog-5 helper or a human records it. Blocks readiness. */
  aiDisclosure: AiDisclosure | null;
  /** null until the metadata-review gate or a human records it. Blocks readiness. */
  humanReviewer: string | null;
  voice: { name: string; provider: "google-chirp3-hd" };
  music: { path: string };
  thirdPartyFootage: ThirdPartyClip[];
  stockAssets: { provider: "pexels"; count: number; sources: string[] };
  /** Research anchors actually used on screen (by `assignedAnchorIds`). */
  sources: Array<{ anchorId: string; url: string; title: string }>;
  /** Verified anchors available in the research bundle. */
  researchAnchorCount: number;
  readyToPublish: boolean;
  /** Human-readable required-field gaps; non-empty ⇒ not ready. */
  missing: string[];
}

interface ResearchAnchor {
  id: string;
  status?: string;
  citation?: { url?: string; title?: string };
}

export interface ManifestInputs {
  slug: string;
  topic: string;
  research?: { anchors?: ResearchAnchor[] } | null;
  /** From `topic.json` `segmentPlans[].assignedAnchorIds`. */
  assignedAnchorIds?: string[];
  clipRecords?: ThirdPartyClip[];
  imageSlots?: Array<{ sourceUrl?: string }>;
  voiceName?: string;
  musicPath: string;
  /** Human-entered fields carried forward from an existing manifest. */
  prior?: { aiDisclosure?: AiDisclosure | null; humanReviewer?: string | null } | null;
  publishMode: boolean;
}

// ── Pure builder ────────────────────────────────────────────────────────────

function hasText(v: string | undefined | null): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Build the manifest from already-parsed artifact data. Pure: no IO, no clock
 * reads beyond `generatedAt`. Tolerates missing inputs — absent artifacts
 * degrade to empty/zero fields and (where required) a `missing[]` entry.
 */
export function buildPublishManifest(inp: ManifestInputs): PublishManifest {
  const anchors = inp.research?.anchors ?? [];
  const verified = anchors.filter((a) => a.status === "verified");

  // Used-anchor sources: the anchors assigned to segments (what's on screen).
  // Fall back to all verified anchors when segment assignment is unavailable.
  const byId = new Map(anchors.map((a) => [a.id, a]));
  const usedAnchors =
    inp.assignedAnchorIds && inp.assignedAnchorIds.length > 0
      ? inp.assignedAnchorIds.map((id) => byId.get(id)).filter((a): a is ResearchAnchor => a !== undefined)
      : verified;

  const sources = usedAnchors
    .filter((a) => hasText(a.citation?.url))
    .map((a) => ({ anchorId: a.id, url: a.citation!.url!, title: a.citation?.title ?? "" }));

  const stockSources = (inp.imageSlots ?? [])
    .map((s) => s.sourceUrl)
    .filter((u): u is string => hasText(u) && u !== "(cached)");

  const thirdPartyFootage = inp.clipRecords ?? [];

  const base = {
    slug: inp.slug,
    topic: inp.topic,
    generatedAt: new Date().toISOString(),
    aiDisclosure: inp.prior?.aiDisclosure ?? null,
    humanReviewer: hasText(inp.prior?.humanReviewer) ? inp.prior!.humanReviewer! : null,
    voice: { name: inp.voiceName ?? "", provider: "google-chirp3-hd" as const },
    music: { path: inp.musicPath },
    thirdPartyFootage,
    stockAssets: { provider: "pexels" as const, count: stockSources.length, sources: stockSources },
    sources,
    researchAnchorCount: verified.length,
  };

  const { readyToPublish, missing } = assessReadiness(base, inp.publishMode);
  return { ...base, readyToPublish, missing };
}

/**
 * Decide publish readiness. Each `missing[]` entry is a required-field gap that
 * blocks publishing. `readyToPublish` is true only when there are none.
 */
export function assessReadiness(
  m: Omit<PublishManifest, "readyToPublish" | "missing">,
  publishMode: boolean,
): { readyToPublish: boolean; missing: string[] } {
  const missing: string[] = [];

  if (m.aiDisclosure === null) missing.push("ai-disclosure not recorded");
  if (!hasText(m.humanReviewer)) missing.push("human review not recorded");
  if (m.sources.length === 0) missing.push("no research source URLs");

  // Defensive: in publish mode the clip gate already blocks un-noted clips
  // before merge, but a clip that slipped through (or a manifest regenerated
  // from older artifacts) must still block here.
  if (publishMode && m.thirdPartyFootage.some((c) => !hasText(c.transformationNote))) {
    missing.push("third-party clip missing transformation note");
  }

  return { readyToPublish: missing.length === 0, missing };
}

// ── IO wrapper ──────────────────────────────────────────────────────────────

interface RawTopic {
  segmentPlans?: Array<{ assignedAnchorIds?: string[] }>;
}

/**
 * Read the existing `prompts/docu/<slug>-*.json` artifacts, build the manifest
 * (preserving any human-entered `aiDisclosure`/`humanReviewer`), write it to
 * `<slug>-publish-manifest.json`, and return it. The phase tolerates partial
 * runs: missing artifacts simply produce gaps the readiness check reports.
 */
export function generatePublishManifest(
  slug: string,
  opts: { topic: string; voiceName?: string; musicPath: string; publishMode: boolean },
): PublishManifest {
  const research = readCachedJson<{ anchors?: ResearchAnchor[] }>(`${PROMPTS_DIR}/${slug}-research.json`);
  const topic = readCachedJson<RawTopic>(`${PROMPTS_DIR}/${slug}-topic.json`);
  const clips = readCachedJson<{ records?: ThirdPartyClip[] }>(`${PROMPTS_DIR}/${slug}-clips.json`);
  const images = readCachedJson<{ slots?: Array<{ sourceUrl?: string }> }>(`${PROMPTS_DIR}/${slug}-images.json`);
  const variety = readCachedJson<{ voice?: string }>(`${PROMPTS_DIR}/${slug}-variety.json`);
  const prior = readCachedJson<{ aiDisclosure?: AiDisclosure | null; humanReviewer?: string | null }>(
    publishManifestPath(slug),
  );

  const assignedAnchorIds = (topic?.segmentPlans ?? [])
    .flatMap((p) => p.assignedAnchorIds ?? []);

  const manifest = buildPublishManifest({
    slug,
    topic: opts.topic,
    research,
    assignedAnchorIds,
    clipRecords: clips?.records ?? [],
    imageSlots: images?.slots ?? [],
    voiceName: opts.voiceName ?? variety?.voice,
    musicPath: opts.musicPath,
    prior,
    publishMode: opts.publishMode,
  });

  writeCachedJson(publishManifestPath(slug), manifest);
  console.log(
    `[docu] publish-manifest: ${manifest.readyToPublish ? "READY" : "NOT READY"} ` +
    `(${manifest.sources.length} sources, ${manifest.thirdPartyFootage.length} clips, ` +
    `${manifest.stockAssets.count} stock images)` +
    (manifest.missing.length > 0 ? ` — missing: ${manifest.missing.join("; ")}` : ""),
  );
  return manifest;
}
