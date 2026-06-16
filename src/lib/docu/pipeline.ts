// Pipeline phases as data (WS4).
//
// Single source of truth for the docu pipeline's phase graph. The CLI flag
// validation (`--from`/`--only`), the `CleanPhase` union, the clean cascade, and
// the `--only` prerequisite fail-fast all derive from `PIPELINE` here instead of
// being hand-encoded in `scripts/docu.ts`. Adding or reordering a phase is a
// single edit to the `PIPELINE` array.
//
// Note: `research` and `dataItems` are internal sub-steps of the LLM executor
// (`generateSegmentedTopicData`) and have no standalone CLI/clean semantics, so
// they are intentionally not modelled as CLI phases here. Promoting them would
// add new `--from`/`--only` surface (a behavior change), which WS4 avoids.

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const PROMPTS_DIR = "prompts/docu";

export type PhaseName =
  | "variety"
  | "plan"
  | "narration"
  | "overlays"
  | "scene-plan"
  | "youtube"
  | "tts"
  | "images"
  | "codegen"
  | "publish-manifest";

export interface PhaseDescriptor {
  name: PhaseName;
  /** Which executor owns the phase: the LLM topic generator or the IO pipeline. */
  group: "llm" | "io";
  /** Valid `--from` resume target. */
  resumable: boolean;
  /** Valid `--only` stop target. */
  stoppable: boolean;
  /** Phases whose output must exist on disk before `--only <name>` can run. */
  requires: PhaseName[];
  /** Artifacts removed by `--clean --only <name>` (curated per phase, not a strict cascade). */
  cleanArtifacts(slug: string): string[];
  /** File whose existence proves this phase produced output (used for prereq checks). */
  readyFile?(slug: string): string;
}

const SEG_NARRATION_FILES = (slug: string): string[] =>
  Array.from({ length: 20 }, (_, i) => `${PROMPTS_DIR}/${slug}-seg-${String(i).padStart(2, "0")}-narration.json`);
const SEG_OVERLAYS_FILES = (slug: string): string[] =>
  Array.from({ length: 20 }, (_, i) => `${PROMPTS_DIR}/${slug}-seg-${String(i).padStart(2, "0")}-overlays.json`);

export const PIPELINE: readonly PhaseDescriptor[] = [
  {
    name: "variety",
    group: "llm",
    resumable: true,
    stoppable: true,
    requires: [],
    // Per-slug assignment only. The channel-level ledger
    // (`_variety-ledger.json`) is durable channel state and is never removed by a
    // per-slug clean.
    cleanArtifacts: (slug) => [`${PROMPTS_DIR}/${slug}-variety.json`],
  },
  {
    name: "plan",
    group: "llm",
    resumable: true,
    stoppable: true,
    requires: [],
    cleanArtifacts: (slug) => [
      `${PROMPTS_DIR}/${slug}-plan.json`,
      `${PROMPTS_DIR}/${slug}-research.json`,
      `${PROMPTS_DIR}/${slug}-corpus.json`,
      `${PROMPTS_DIR}/${slug}-topic.json`,
      ...SEG_NARRATION_FILES(slug),
      ...SEG_OVERLAYS_FILES(slug),
    ],
  },
  {
    name: "narration",
    group: "llm",
    resumable: true,
    stoppable: true,
    requires: [],
    cleanArtifacts: (slug) => [
      `${PROMPTS_DIR}/${slug}-plan.json`,
      `${PROMPTS_DIR}/${slug}-research.json`,
      `${PROMPTS_DIR}/${slug}-corpus.json`,
      `${PROMPTS_DIR}/${slug}-topic.json`,
      ...SEG_NARRATION_FILES(slug),
      ...SEG_OVERLAYS_FILES(slug),
    ],
  },
  {
    name: "overlays",
    group: "llm",
    resumable: true,
    stoppable: true,
    requires: [],
    cleanArtifacts: (slug) => [
      `${PROMPTS_DIR}/${slug}-topic.json`,
      ...SEG_OVERLAYS_FILES(slug),
    ],
  },
  {
    name: "scene-plan",
    group: "llm",
    resumable: true,
    stoppable: true,
    requires: [],
    cleanArtifacts: (slug) => [`${PROMPTS_DIR}/${slug}-scene-plan.json`],
  },
  {
    name: "youtube",
    group: "llm",
    resumable: true,
    stoppable: true,
    requires: [],
    cleanArtifacts: (slug) => [
      `${PROMPTS_DIR}/${slug}-topic.json`,
      `${PROMPTS_DIR}/${slug}-clips.json`,
      `public/videos/docu/interview-clips/${slug}/`,
    ],
  },
  {
    name: "tts",
    group: "io",
    resumable: true,
    stoppable: true,
    requires: [],
    cleanArtifacts: (slug) => [
      `public/audio/docu/${slug}.wav`,
      `${PROMPTS_DIR}/${slug}-timings.json`,
    ],
    readyFile: (slug) => `${PROMPTS_DIR}/${slug}-timings.json`,
  },
  {
    name: "images",
    group: "io",
    resumable: false,
    stoppable: true,
    requires: ["tts"],
    cleanArtifacts: (slug) => [
      `public/images/docu/${slug}/`,
      `${PROMPTS_DIR}/${slug}-images.json`,
    ],
    readyFile: (slug) => `${PROMPTS_DIR}/${slug}-images.json`,
  },
  {
    name: "codegen",
    group: "io",
    resumable: false,
    stoppable: true,
    requires: ["images"],
    cleanArtifacts: () => [`src/generated/docu-composition-plans.ts`],
  },
  {
    // Final phase: aggregate provenance + readiness from existing artifacts.
    // `requires: []` so `--only publish-manifest` runs on partial pipelines —
    // missing artifacts degrade to gaps the readiness check reports, not a crash.
    // `resumable: false` keeps it out of `--from` (it is always last).
    name: "publish-manifest",
    group: "io",
    resumable: false,
    stoppable: true,
    requires: [],
    cleanArtifacts: (slug) => [`${PROMPTS_DIR}/${slug}-publish-manifest.json`],
  },
];

const BY_NAME: ReadonlyMap<PhaseName, PhaseDescriptor> = new Map(
  PIPELINE.map((p) => [p.name, p]),
);

export function getPhase(name: PhaseName): PhaseDescriptor {
  const p = BY_NAME.get(name);
  if (!p) throw new Error(`Unknown pipeline phase: ${name}`);
  return p;
}

/** All phases that participate in `--clean --only <phase>`. */
export const CLEAN_PHASES: PhaseName[] = PIPELINE.map((p) => p.name);

/** Valid `--from` targets, derived from `PIPELINE`. */
export const VALID_FROM: PhaseName[] = PIPELINE.filter((p) => p.resumable).map((p) => p.name);

/** Valid `--only` targets, derived from `PIPELINE`. */
export const VALID_ONLY: PhaseName[] = PIPELINE.filter((p) => p.stoppable).map((p) => p.name);

/** Artifacts removed by `--clean --only <phase>`. */
export function cleanArtifactsFor(slug: string, only: PhaseName): string[] {
  return getPhase(only).cleanArtifacts(slug);
}

/**
 * Validate that every prerequisite of `only` has produced its output on disk.
 * Returns an actionable error message string if a prerequisite is missing, or
 * `null` if the phase is ready to run. Fail-fast, matching the prior inline
 * checks for `--only images` / `--only codegen`.
 */
export function checkPrereqs(only: PhaseName, slug: string, topicArg: string): string | null {
  const desc = getPhase(only);
  for (const reqName of desc.requires) {
    const req = getPhase(reqName);
    const file = req.readyFile?.(slug);
    if (file && !fs.existsSync(file)) {
      return (
        `Error: --only ${only} requires the "${reqName}" phase output at ${file}, which is missing.\n` +
        `Run first: npx tsx --env-file=.env scripts/docu.ts "${topicArg}" --only ${reqName}`
      );
    }
  }
  return null;
}

// ── Cache helpers (collapse the per-phase load/save triplets) ─────────────

/**
 * Read and JSON-parse a cache file. When a `schema` is supplied the parsed value
 * is validated (and a validation failure yields `null`, triggering regeneration);
 * without a schema the raw parsed value is cast. Missing file or parse error → `null`.
 */
export function readCachedJson<T>(filePath: string, schema?: z.ZodType<T>): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return schema ? schema.parse(raw) : (raw as T);
  } catch {
    return null;
  }
}

/** Write a value as pretty JSON, creating the parent directory if needed. */
export function writeCachedJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
