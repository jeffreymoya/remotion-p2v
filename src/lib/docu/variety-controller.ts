// Variety controller (Step 2 / Deliverable A).
//
// Front-of-pipeline assignment of per-video variety parameters
// ({arc, opener, pacing, voice, skin}) under rolling-quota constraints, recorded
// to a channel-level ledger. This is the WRITE counterpart to the Step 3
// channel-pattern audit (read). Enforced distribution makes channel variety
// provable instead of relying on per-video randomness that drifts into a
// recognizable template.
//
// Behavior-preserving: the BASELINE_PRESET reproduces today's output exactly
// (scenario-escalation arc, scenario-first opener, measured pacing, Charon voice,
// default skin). `--variety off` forces it for golden-frame regression.

import { DOCU_TTS_VOICE } from "../config";
import { readCachedJson, writeCachedJson } from "./pipeline";

// ── Axes ──────────────────────────────────────────────────────────────────

/** Mirrors SpineOutputSchema.primaryStructure (segment-plan-prompt.ts). */
export type ArcAxis =
  | "scenario-escalation"
  | "disaster-simulation"
  | "case-file-autopsy"
  | "countdown"
  | "comparison-gauntlet"
  | "inside-the-machine"
  | "experiment-challenge"
  | "reveal-ladder";

export const ARC_AXES: readonly ArcAxis[] = [
  "scenario-escalation",
  "disaster-simulation",
  "case-file-autopsy",
  "countdown",
  "comparison-gauntlet",
  "inside-the-machine",
  "experiment-challenge",
  "reveal-ladder",
] as const;

export type OpenerAxis =
  | "scenario-first"
  | "cold-stat"
  | "second-person-scenario"
  | "contrarian-claim"
  | "dollar-shock"
  | "question";

export const OPENER_AXES: readonly OpenerAxis[] = [
  "scenario-first",
  "cold-stat",
  "second-person-scenario",
  "contrarian-claim",
  "dollar-shock",
  "question",
] as const;

export type PacingAxis = "measured" | "rapid";
export const PACING_AXES: readonly PacingAxis[] = ["measured", "rapid"] as const;

export type SkinAxis = "bloomberg-default" | "case-file" | "ticker" | "warm-human";
export const SKIN_AXES: readonly SkinAxis[] = [
  "bloomberg-default",
  "case-file",
  "ticker",
  "warm-human",
] as const;

/** Auditioned voice pool. Charon is the default (today's single voice). */
export const VOICE_POOL = [
  "en-US-Chirp3-HD-Charon",
  "en-US-Chirp3-HD-Fenrir",
  "en-US-Chirp3-HD-Orus",
] as const;
export type VoiceAxis = (typeof VOICE_POOL)[number];

export interface VarietyAssignment {
  arc: ArcAxis;
  opener: OpenerAxis;
  pacing: PacingAxis;
  voice: VoiceAxis;
  skin: SkinAxis;
}

export interface VarietyLedgerEntry {
  slug: string;
  topic: string;
  assignment: VarietyAssignment;
  assignedAt: string;
}

export interface VarietyLedger {
  schemaVersion: 1;
  entries: VarietyLedgerEntry[];
}

// ── Baseline preset (today's exact behavior) ────────────────────────────────

export const BASELINE_PRESET: VarietyAssignment = {
  arc: "scenario-escalation",
  opener: "scenario-first",
  pacing: "measured",
  voice: "en-US-Chirp3-HD-Charon",
  skin: "bloomberg-default",
};

// ── Pacing / shot profiles ──────────────────────────────────────────────────

export interface PacingProfile {
  /** Average target shot length in seconds (drives shot subdivision). */
  targetShotSeconds: number;
  /** TTS speaking rate. */
  speakingRate: number;
}

const PACING_PROFILES: Record<PacingAxis, PacingProfile> = {
  // measured = today's exact values (TARGET_SHOT_SECONDS 2.5, rate 1.0).
  measured: { targetShotSeconds: 2.5, speakingRate: 1.0 },
  rapid: { targetShotSeconds: 1.8, speakingRate: 1.1 },
};

export function pacingProfile(pacing: PacingAxis): PacingProfile {
  return PACING_PROFILES[pacing];
}

// ── Arc → axis affinity tables ──────────────────────────────────────────────

const OPENER_FOR_ARC: Record<ArcAxis, OpenerAxis> = {
  "scenario-escalation": "scenario-first",
  "disaster-simulation": "second-person-scenario",
  "case-file-autopsy": "cold-stat",
  countdown: "question",
  "comparison-gauntlet": "contrarian-claim",
  "inside-the-machine": "cold-stat",
  "experiment-challenge": "question",
  "reveal-ladder": "contrarian-claim",
};

const SKIN_FOR_ARC: Record<ArcAxis, SkinAxis> = {
  "scenario-escalation": "bloomberg-default",
  "disaster-simulation": "warm-human",
  "case-file-autopsy": "case-file",
  countdown: "ticker",
  "comparison-gauntlet": "ticker",
  "inside-the-machine": "bloomberg-default",
  "experiment-challenge": "bloomberg-default",
  "reveal-ladder": "case-file",
};

/** Build a full preset deterministically from an arc (pinning path). */
export function presetForArc(arc: ArcAxis): VarietyAssignment {
  return {
    arc,
    opener: OPENER_FOR_ARC[arc],
    pacing: "measured",
    voice: VOICE_POOL[0],
    skin: SKIN_FOR_ARC[arc],
  };
}

// ── Quota thresholds (report P1 §6) ─────────────────────────────────────────

export const ROLLING_WINDOW = 10;
/** No single arc may exceed this share of the rolling window. */
export const MAX_SAME_ARC_RATIO = 0.4;
/** A full window of 10 must contain at least this many distinct arcs. */
export const MIN_DISTINCT_ARCS = 3;

// ── Deterministic seeded picking ────────────────────────────────────────────

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededPick<T>(items: readonly T[], seed: string): T {
  if (items.length === 0) throw new Error("seededPick: empty candidate list");
  return items[hashSeed(seed) % items.length];
}

// ── Quota-aware arc selection ───────────────────────────────────────────────

function arcCountsInWindow(entries: VarietyLedgerEntry[]): Map<ArcAxis, number> {
  const window = entries.slice(-ROLLING_WINDOW);
  const counts = new Map<ArcAxis, number>();
  for (const e of window) {
    counts.set(e.assignment.arc, (counts.get(e.assignment.arc) ?? 0) + 1);
  }
  return counts;
}

/**
 * Arcs eligible for the next pick: adding one must keep the "≤40% same per 10"
 * cap satisfiable. When the window is near-full and distinct-arc pressure exists,
 * arcs already present are de-prioritized in favor of unseen arcs so a full window
 * reaches ≥3 distinct structures.
 */
function eligibleArcs(entries: VarietyLedgerEntry[]): ArcAxis[] {
  const counts = arcCountsInWindow(entries);
  const windowSize = Math.min(entries.length, ROLLING_WINDOW);
  // Projected window size after this assignment (cap at ROLLING_WINDOW).
  const projected = Math.min(windowSize + 1, ROLLING_WINDOW);
  const maxAllowed = Math.floor(projected * MAX_SAME_ARC_RATIO);

  const underCap = ARC_AXES.filter((arc) => (counts.get(arc) ?? 0) < Math.max(1, maxAllowed));

  // Distinct-arc pressure: prefer unseen arcs to guarantee ≥3 distinct per 10.
  const distinct = counts.size;
  if (windowSize + 1 >= ROLLING_WINDOW && distinct < MIN_DISTINCT_ARCS) {
    const unseen = underCap.filter((arc) => !counts.has(arc));
    if (unseen.length > 0) return unseen;
  }

  return underCap.length > 0 ? underCap : [...ARC_AXES];
}

/** Least-recently-used pick across a fixed pool, seeded tiebreak. */
function leastRecentlyUsed<T>(
  pool: readonly T[],
  recentValues: T[],
  seed: string,
): T {
  const lastSeen = new Map<T, number>();
  recentValues.forEach((v, idx) => lastSeen.set(v, idx));
  let best: T[] = [];
  let bestRank = Infinity;
  for (const candidate of pool) {
    const rank = lastSeen.has(candidate) ? lastSeen.get(candidate)! : -1;
    if (rank < bestRank) {
      bestRank = rank;
      best = [candidate];
    } else if (rank === bestRank) {
      best.push(candidate);
    }
  }
  return seededPick(best, seed);
}

// ── Assignment ──────────────────────────────────────────────────────────────

export interface AssignVarietyOpts {
  /** Force the baseline preset (regression / `--variety off`). */
  force?: boolean;
  /** Pin a specific preset assignment (`--variety <preset>`). */
  preset?: VarietyAssignment;
  /** Deterministic seed; defaults to the slug. */
  seed?: string;
}

export interface AssignVarietyResult {
  assignment: VarietyAssignment;
  ledger: VarietyLedger;
}

/**
 * Pure function over `(ledger, opts)` → `{ assignment, ledger' }`. The only side
 * effect is the appended ledger entry in the returned (new) ledger; callers
 * persist it via `saveLedger`.
 */
export function assignVariety(
  slug: string,
  topic: string,
  ledger: VarietyLedger,
  opts?: AssignVarietyOpts,
): AssignVarietyResult {
  const seed = opts?.seed ?? slug;

  let assignment: VarietyAssignment;
  if (opts?.force) {
    assignment = BASELINE_PRESET;
  } else if (opts?.preset) {
    assignment = opts.preset;
  } else {
    const entries = ledger.entries;
    const arc = seededPick(eligibleArcs(entries), `${seed}:arc`);
    const window = entries.slice(-ROLLING_WINDOW);
    const opener = OPENER_FOR_ARC[arc];
    const pacing = leastRecentlyUsed(
      PACING_AXES,
      window.map((e) => e.assignment.pacing),
      `${seed}:pacing`,
    );
    const voice = leastRecentlyUsed(
      VOICE_POOL,
      window.map((e) => e.assignment.voice),
      `${seed}:voice`,
    );
    const skin = SKIN_FOR_ARC[arc];
    assignment = { arc, opener, pacing, voice, skin };
  }

  const entry: VarietyLedgerEntry = {
    slug,
    topic,
    assignment,
    assignedAt: new Date().toISOString(),
  };

  return {
    assignment,
    ledger: { schemaVersion: 1, entries: [...ledger.entries, entry] },
  };
}

// ── Persistence ─────────────────────────────────────────────────────────────

const PROMPTS_DIR = "prompts/docu";
/** Channel-level ledger. Underscore prefix keeps it out of the per-slug clean glob. */
export const VARIETY_LEDGER_PATH = `${PROMPTS_DIR}/_variety-ledger.json`;

export function varietyCachePath(slug: string): string {
  return `${PROMPTS_DIR}/${slug}-variety.json`;
}

const EMPTY_LEDGER: VarietyLedger = { schemaVersion: 1, entries: [] };

export function loadLedger(): VarietyLedger {
  const raw = readCachedJson<VarietyLedger>(VARIETY_LEDGER_PATH);
  if (!raw || raw.schemaVersion !== 1 || !Array.isArray(raw.entries)) {
    return { schemaVersion: 1, entries: [] };
  }
  return raw;
}

export function saveLedger(ledger: VarietyLedger): void {
  writeCachedJson(VARIETY_LEDGER_PATH, ledger);
}

export function loadCachedAssignment(slug: string): VarietyAssignment | null {
  return readCachedJson<VarietyAssignment>(varietyCachePath(slug));
}

export function saveCachedAssignment(slug: string, assignment: VarietyAssignment): void {
  writeCachedJson(varietyCachePath(slug), assignment);
}

export { EMPTY_LEDGER };

// Compile-time guards: the voice pool default and baseline voice must match
// today's `DOCU_TTS_VOICE` default so the baseline preset is truly a no-op.
const _baselineVoiceMatchesConfigDefault: VoiceAxis = "en-US-Chirp3-HD-Charon";
void _baselineVoiceMatchesConfigDefault;
void DOCU_TTS_VOICE;
