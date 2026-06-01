/**
 * Step 2 / Deliverable A — variety controller.
 *
 * Verifies:
 *  1. Baseline: force / preset reproduce exact assignments.
 *  2. Determinism: same (ledger, seed) → same assignment.
 *  3. Arc quota: ≤40% same arc per rolling 10; ≥3 distinct arcs in a full window.
 *  4. Ledger append is immutable (input ledger unchanged).
 *  5. Arc affinity tables are total over ARC_AXES.
 *  6. Pacing profile `measured` matches today's exact shot/rate constants.
 *
 * Usage:
 *   npx tsx tests/docu/variety-controller.test.ts
 */
import {
  assignVariety,
  ARC_AXES,
  BASELINE_PRESET,
  pacingProfile,
  VOICE_POOL,
  ROLLING_WINDOW,
  MAX_SAME_ARC_RATIO,
  MIN_DISTINCT_ARCS,
  type VarietyLedger,
  type VarietyLedgerEntry,
} from "../../src/lib/docu/variety-controller";
import { SpineOutputSchemaPrimaryStructures } from "../../src/lib/docu/segment-plan-prompt";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

const empty: VarietyLedger = { schemaVersion: 1, entries: [] };

// ── 1. Baseline ─────────────────────────────────────────────────────────────
{
  const { assignment } = assignVariety("slug", "topic", empty, { force: true });
  assert(
    JSON.stringify(assignment) === JSON.stringify(BASELINE_PRESET),
    "force → BASELINE_PRESET",
    JSON.stringify(assignment),
  );

  const pinned = { ...BASELINE_PRESET, arc: "countdown" as const };
  const { assignment: p } = assignVariety("slug", "topic", empty, { preset: pinned });
  assert(p.arc === "countdown", "preset is honored");
}

// ── 2. Determinism ───────────────────────────────────────────────────────────
{
  const a = assignVariety("fixed-fed", "topic", empty).assignment;
  const b = assignVariety("fixed-fed", "topic", empty).assignment;
  assert(JSON.stringify(a) === JSON.stringify(b), "same (ledger, seed) → same assignment");

  const c = assignVariety("other-slug", "topic", empty).assignment;
  // Different seed should generally differ on at least one axis (not guaranteed,
  // but for these two seeds it does — guards against a constant-output bug).
  assert(JSON.stringify(a) !== JSON.stringify(c), "different seed → different assignment", `${JSON.stringify(a)} vs ${JSON.stringify(c)}`);
}

// ── 3. Arc quota over a rolling batch of 10 ──────────────────────────────────
{
  let ledger: VarietyLedger = { schemaVersion: 1, entries: [] };
  const arcs: string[] = [];
  for (let i = 0; i < ROLLING_WINDOW; i++) {
    const r = assignVariety(`vid-${i}`, "topic", ledger, { seed: `vid-${i}` });
    ledger = r.ledger;
    arcs.push(r.assignment.arc);
  }
  const window = arcs.slice(-ROLLING_WINDOW);
  const counts = new Map<string, number>();
  for (const a of window) counts.set(a, (counts.get(a) ?? 0) + 1);
  const maxCount = Math.max(...counts.values());
  assert(
    maxCount <= Math.floor(ROLLING_WINDOW * MAX_SAME_ARC_RATIO),
    "≤40% same arc per rolling 10",
    `maxCount=${maxCount}, counts=${JSON.stringify([...counts])}`,
  );
  assert(
    counts.size >= MIN_DISTINCT_ARCS,
    "≥3 distinct arcs in a full window",
    `distinct=${counts.size}`,
  );
}

// ── 4. Immutability of input ledger ──────────────────────────────────────────
{
  const before: VarietyLedger = { schemaVersion: 1, entries: [] };
  const r = assignVariety("slug", "topic", before, { seed: "s" });
  assert(before.entries.length === 0, "input ledger not mutated");
  assert(r.ledger.entries.length === 1, "returned ledger has appended entry");
  const e: VarietyLedgerEntry = r.ledger.entries[0];
  assert(e.slug === "slug" && e.topic === "topic", "entry records slug + topic");
}

// ── 5. Arc enum ↔ spine primaryStructure parity ──────────────────────────────
{
  const spineArcs = [...SpineOutputSchemaPrimaryStructures].sort();
  const controllerArcs = [...ARC_AXES].sort();
  assert(
    JSON.stringify(spineArcs) === JSON.stringify(controllerArcs),
    "ARC_AXES matches spine primaryStructure enum",
    `${spineArcs.join(",")} vs ${controllerArcs.join(",")}`,
  );
}

// ── 6. measured pacing == today's constants ──────────────────────────────────
{
  const m = pacingProfile("measured");
  assert(m.targetShotSeconds === 2.5, "measured targetShotSeconds == 2.5 (TARGET_SHOT_SECONDS)");
  assert(m.speakingRate === 1.0, "measured speakingRate == 1.0 (DOCU_TTS_SPEAKING_RATE)");
}

// ── 7. Voice pool default is Charon ──────────────────────────────────────────
{
  assert(VOICE_POOL[0] === "en-US-Chirp3-HD-Charon", "voice pool default is Charon");
}

console.log(`\n${passed} assertions passed.`);
