/**
 * WS4 — pipeline-as-data derivations.
 *
 * Verifies (behavior-preserving refactor proof):
 *  1. VALID_FROM / VALID_ONLY / CLEAN_PHASES derive from PIPELINE and equal the
 *     pre-WS4 hardcoded arrays in scripts/docu.ts.
 *  2. cleanArtifactsFor(slug, phase) is byte-identical to the legacy
 *     PHASE_FILE_PATTERNS table for every phase.
 *  3. checkPrereqs() fails fast for --only images/codegen with missing upstream
 *     artifacts and passes when present; phases with no prereqs return null.
 *  4. readCachedJson / writeCachedJson round-trip; schema validation rejects bad
 *     shapes (→ null); missing file → null; no-schema casts raw.
 *
 * Usage:
 *   npx tsx tests/docu/pipeline-runner.test.ts
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import {
  PIPELINE,
  VALID_FROM,
  VALID_ONLY,
  CLEAN_PHASES,
  cleanArtifactsFor,
  checkPrereqs,
  readCachedJson,
  writeCachedJson,
  type PhaseName,
} from "../../src/lib/docu/pipeline";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}
function eq<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ── Legacy reference values (copied verbatim from pre-WS4 scripts/docu.ts) ──

const SEG_NARRATION_FILES = (slug: string) =>
  Array.from({ length: 20 }, (_, i) => `prompts/docu/${slug}-seg-${String(i).padStart(2, "0")}-narration.json`);
const SEG_OVERLAYS_FILES = (slug: string) =>
  Array.from({ length: 20 }, (_, i) => `prompts/docu/${slug}-seg-${String(i).padStart(2, "0")}-overlays.json`);

const LEGACY_PATTERNS: Record<PhaseName, (slug: string) => string[]> = {
  variety: (slug) => [
    `prompts/docu/${slug}-variety.json`,
  ],
  plan: (slug) => [
    `prompts/docu/${slug}-plan.json`,
    `prompts/docu/${slug}-research.json`,
    `prompts/docu/${slug}-corpus.json`,
    `prompts/docu/${slug}-topic.json`,
    ...SEG_NARRATION_FILES(slug),
    ...SEG_OVERLAYS_FILES(slug),
  ],
  narration: (slug) => [
    `prompts/docu/${slug}-plan.json`,
    `prompts/docu/${slug}-research.json`,
    `prompts/docu/${slug}-corpus.json`,
    `prompts/docu/${slug}-topic.json`,
    ...SEG_NARRATION_FILES(slug),
    ...SEG_OVERLAYS_FILES(slug),
  ],
  overlays: (slug) => [
    `prompts/docu/${slug}-topic.json`,
    ...SEG_OVERLAYS_FILES(slug),
  ],
  youtube: (slug) => [
    `prompts/docu/${slug}-topic.json`,
    `prompts/docu/${slug}-clips.json`,
    `public/videos/docu/interview-clips/${slug}/`,
  ],
  tts: (slug) => [
    `public/audio/docu/${slug}.wav`,
    `prompts/docu/${slug}-timings.json`,
  ],
  images: (slug) => [
    `public/images/docu/${slug}/`,
    `prompts/docu/${slug}-images.json`,
  ],
  codegen: () => [
    `src/generated/docu-scripts.ts`,
  ],
  "publish-manifest": (slug) => [
    `prompts/docu/${slug}-publish-manifest.json`,
  ],
};

const LEGACY_VALID_FROM = ["variety", "plan", "narration", "overlays", "youtube", "tts"];
const LEGACY_VALID_ONLY = ["variety", "plan", "narration", "overlays", "youtube", "tts", "images", "codegen", "publish-manifest"];
const LEGACY_CLEAN_PHASES = ["variety", "plan", "narration", "overlays", "youtube", "tts", "images", "codegen", "publish-manifest"];

// ── 1. Derivation parity ────────────────────────────────────────────────

assert(eq(VALID_FROM, LEGACY_VALID_FROM), "VALID_FROM matches legacy", VALID_FROM.join(","));
assert(eq(VALID_ONLY, LEGACY_VALID_ONLY), "VALID_ONLY matches legacy", VALID_ONLY.join(","));
assert(eq(CLEAN_PHASES, LEGACY_CLEAN_PHASES), "CLEAN_PHASES matches legacy", CLEAN_PHASES.join(","));

const names = PIPELINE.map((p) => p.name);
assert(new Set(names).size === names.length, "each phase name is unique");
assert(eq(names, LEGACY_CLEAN_PHASES), "PIPELINE order is canonical", names.join(","));

// ── 2. Clean cascade parity ─────────────────────────────────────────────

const SLUG = "test-slug";
for (const phase of CLEAN_PHASES as PhaseName[]) {
  assert(
    eq(cleanArtifactsFor(SLUG, phase), LEGACY_PATTERNS[phase](SLUG)),
    `cleanArtifactsFor(${phase}) matches legacy PHASE_FILE_PATTERNS`,
  );
}

// ── 3. Prerequisite fail-fast ───────────────────────────────────────────

const cwd0 = process.cwd();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ws4-prereq-"));
process.chdir(tmp);
try {
  assert(checkPrereqs("plan", "s", "topic") === null, "plan has no prereqs");
  assert(checkPrereqs("narration", "s", "topic") === null, "narration has no prereqs");
  assert(checkPrereqs("tts", "s", "topic") === null, "tts has no prereqs");

  // images requires tts timings
  assert(checkPrereqs("images", "s", "topic") !== null, "images fails fast when timings absent");
  fs.mkdirSync("prompts/docu", { recursive: true });
  fs.writeFileSync("prompts/docu/s-timings.json", "{}");
  assert(checkPrereqs("images", "s", "topic") === null, "images passes when timings present");

  // codegen requires images manifest
  assert(checkPrereqs("codegen", "s", "topic") !== null, "codegen fails fast when manifest absent");
  fs.writeFileSync("prompts/docu/s-images.json", "{}");
  assert(checkPrereqs("codegen", "s", "topic") === null, "codegen passes when manifest present");
} finally {
  process.chdir(cwd0);
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ── 4. Cache helper round-trip ──────────────────────────────────────────

const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), "ws4-cache-"));
try {
  const p = path.join(tmp2, "nested", "x.json");
  assert(readCachedJson(p) === null, "readCachedJson missing file → null");

  writeCachedJson(p, { a: 1, b: ["x"] });
  assert(eq(readCachedJson(p), { a: 1, b: ["x"] }), "round-trip without schema");

  const schema = z.array(z.string());
  const arrPath = path.join(tmp2, "arr.json");
  writeCachedJson(arrPath, ["a", "b"]);
  assert(eq(readCachedJson(arrPath, schema), ["a", "b"]), "schema validation accepts valid");

  const badPath = path.join(tmp2, "bad.json");
  writeCachedJson(badPath, { not: "an array" });
  assert(readCachedJson(badPath, schema) === null, "schema validation rejects bad shape → null");

  const corruptPath = path.join(tmp2, "corrupt.json");
  fs.writeFileSync(corruptPath, "{ not json");
  assert(readCachedJson(corruptPath) === null, "corrupt JSON → null");
} finally {
  fs.rmSync(tmp2, { recursive: true, force: true });
}

console.log(`\n${passed} assertions passed.`);
