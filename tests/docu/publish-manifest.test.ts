/**
 * Unit tests for the publish-manifest builder + readiness check (Deliverable C).
 *
 * Usage:
 *   npx tsx tests/docu/publish-manifest.test.ts
 */

import { buildPublishManifest } from "../../src/lib/docu/publish-manifest";
import type { ManifestInputs, AiDisclosure } from "../../src/lib/docu/publish-manifest";

let failures = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  } else {
    console.log(`PASS ${label}`);
  }
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    failures++;
    console.error(`FAIL ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  } else {
    console.log(`PASS ${label}`);
  }
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const DISCLOSURE: AiDisclosure = {
  containsSyntheticPeopleVoicesOrEvents: false,
  recommendedStudioAnswer: "No",
  rationale: "Stock footage + synthesized narration only; no altered real people.",
};

const RESEARCH = {
  anchors: [
    { id: "anc-001", status: "verified", citation: { url: "https://a.example/1", title: "A One" } },
    { id: "anc-002", status: "verified", citation: { url: "https://a.example/2", title: "A Two" } },
    { id: "anc-003", status: "needs_review", citation: { url: "https://a.example/3", title: "A Three" } },
  ],
};

function baseInputs(overrides: Partial<ManifestInputs> = {}): ManifestInputs {
  return {
    slug: "test-topic",
    topic: "Test Topic",
    research: RESEARCH,
    assignedAnchorIds: ["anc-001", "anc-002"],
    clipRecords: [],
    imageSlots: [{ sourceUrl: "https://pexels.example/img1" }, { sourceUrl: "https://pexels.example/img2" }],
    voiceName: "en-US-Chirp3-HD-Charon",
    musicPath: "background-music/track.mp3",
    prior: { aiDisclosure: DISCLOSURE, humanReviewer: "Jane Editor" },
    publishMode: false,
    ...overrides,
  };
}

// ── Happy path: all required fields present → ready ──────────────────────────

{
  const m = buildPublishManifest(baseInputs());
  assertEqual(m.readyToPublish, true, "happy: readyToPublish true");
  assertEqual(m.missing.length, 0, "happy: no missing entries");
  assertEqual(m.sources.length, 2, "happy: two used-anchor sources");
  assertEqual(m.researchAnchorCount, 2, "happy: two verified anchors counted");
  assertEqual(m.voice.name, "en-US-Chirp3-HD-Charon", "happy: voice carried");
  assertEqual(m.voice.provider, "google-chirp3-hd", "happy: voice provider");
  assertEqual(m.music.path, "background-music/track.mp3", "happy: music path");
  assertEqual(m.stockAssets.count, 2, "happy: two stock images");
  assertEqual(m.aiDisclosure !== null, true, "happy: aiDisclosure preserved from prior");
  assertEqual(m.humanReviewer, "Jane Editor", "happy: reviewer preserved from prior");
}

// ── Used-anchor filter: sources reflect assignedAnchorIds, not all anchors ───

{
  const m = buildPublishManifest(baseInputs({ assignedAnchorIds: ["anc-001"] }));
  assertEqual(m.sources.length, 1, "used-anchor: single assigned source");
  assertEqual(m.sources[0]?.anchorId, "anc-001", "used-anchor: correct anchor id");
  assertEqual(m.sources[0]?.url, "https://a.example/1", "used-anchor: correct url");
}

// ── Missing AI disclosure → not ready ────────────────────────────────────────

{
  const m = buildPublishManifest(baseInputs({ prior: { aiDisclosure: null, humanReviewer: "Jane Editor" } }));
  assertEqual(m.readyToPublish, false, "no-disclosure: not ready");
  assert(m.missing.some((x) => x.includes("ai-disclosure")), "no-disclosure: missing lists ai-disclosure");
}

// ── Missing human review → not ready ─────────────────────────────────────────

{
  const m = buildPublishManifest(baseInputs({ prior: { aiDisclosure: DISCLOSURE, humanReviewer: null } }));
  assertEqual(m.readyToPublish, false, "no-reviewer: not ready");
  assert(m.missing.some((x) => x.includes("human review")), "no-reviewer: missing lists human review");
  assertEqual(m.humanReviewer, null, "no-reviewer: humanReviewer null");
}

// ── Blank reviewer string is treated as unset ────────────────────────────────

{
  const m = buildPublishManifest(baseInputs({ prior: { aiDisclosure: DISCLOSURE, humanReviewer: "   " } }));
  assertEqual(m.humanReviewer, null, "blank-reviewer: normalized to null");
  assert(m.missing.some((x) => x.includes("human review")), "blank-reviewer: missing lists human review");
}

// ── No research / no assigned ids → no sources, not ready ────────────────────

{
  const m = buildPublishManifest(baseInputs({ research: null, assignedAnchorIds: [] }));
  assertEqual(m.sources.length, 0, "no-research: zero sources");
  assertEqual(m.researchAnchorCount, 0, "no-research: zero verified count");
  assertEqual(m.readyToPublish, false, "no-research: not ready");
  assert(m.missing.some((x) => x.includes("source")), "no-research: missing lists sources");
}

// ── Fallback to all verified anchors when no segment assignment ──────────────

{
  const m = buildPublishManifest(baseInputs({ assignedAnchorIds: [] }));
  assertEqual(m.sources.length, 2, "fallback: all verified anchors used as sources");
}

// ── Third-party footage + publish-mode transformation-note gate ──────────────

{
  const clip = { sourceUrl: "https://youtube.example/watch?v=x", channel: "Ch", title: "T", durationSec: 6 };
  const withNote = { ...clip, transformationNote: "Short excerpt under original analysis." };

  const offNoNote = buildPublishManifest(baseInputs({ clipRecords: [clip], publishMode: false }));
  assertEqual(offNoNote.thirdPartyFootage.length, 1, "clip: footage listed");
  assertEqual(offNoNote.readyToPublish, true, "clip: non-publish run ignores missing note");

  const onNoNote = buildPublishManifest(baseInputs({ clipRecords: [clip], publishMode: true }));
  assertEqual(onNoNote.readyToPublish, false, "clip: publish run blocks missing note");
  assert(onNoNote.missing.some((x) => x.includes("transformation note")), "clip: missing lists transformation note");

  const onWithNote = buildPublishManifest(baseInputs({ clipRecords: [withNote], publishMode: true }));
  assertEqual(onWithNote.readyToPublish, true, "clip: publish run passes with note");
}

// ── Cached/placeholder stock sources excluded ────────────────────────────────

{
  const m = buildPublishManifest(baseInputs({
    imageSlots: [{ sourceUrl: "https://pexels.example/img1" }, { sourceUrl: "(cached)" }, { sourceUrl: "" }],
  }));
  assertEqual(m.stockAssets.count, 1, "stock: cached + empty excluded");
  assertEqual(m.stockAssets.sources.length, 1, "stock: one real source");
}

// ── Summary ──────────────────────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
console.log("\nAll publish-manifest tests passed.");
