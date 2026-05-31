/**
 * Usage:
 *   npx tsx tests/docu/anchor-id-resolution.test.ts
 *
 * Covers C2: the overlay LLM now emits canonical anchor ids (anc-001) directly.
 * `rejectUnknownSourceAnchorIds` keeps selections whose sourceAnchorId is in the
 * verified-anchor set and drops (does NOT silently pass through) any others.
 */
import { rejectUnknownSourceAnchorIds } from "../../src/lib/docu/overlay-prompt";
import type { Anchor } from "../../src/lib/shared/research/research-schema";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    failed++;
    throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  }
  passed++;
  console.log(`PASS ${label}`);
}

// Only `.id` is read by the function under test.
const anchors = [{ id: "anc-001" }, { id: "anc-002" }] as unknown as readonly Anchor[];

function textual(sourceAnchorId: string, anchorPhrase = "the fed") {
  return {
    type: "headline-card",
    anchorPhrase,
    holdSec: 3.5,
    palette: "cool-tech",
    text: "TEST",
    source: "src",
    sourceAnchorId,
  };
}

function numeric(dataItemId = "scalar-01") {
  return {
    type: "kinetic-number",
    dataItemId,
    anchorPhrase: "nine percent",
    holdSec: 3.5,
    palette: "cool-tech",
  };
}

// ── Test 1: canonical id resolves (kept) ───────────────────────────────
{
  const kept = rejectUnknownSourceAnchorIds(
    [textual("anc-001"), textual("anc-002")] as never,
    anchors,
    "test",
  );
  assert(kept.length === 2, "1-canonical: both canonical ids kept");
}

// ── Test 2: unknown id rejected (dropped, not passed through) ──────────
{
  const kept = rejectUnknownSourceAnchorIds(
    [textual("anc-001"), textual("anc-1"), textual("anc-999")] as never,
    anchors,
    "test",
  );
  assert(kept.length === 1, "2-unknown: legacy anc-1 and anc-999 dropped");
  assert(
    (kept[0] as { sourceAnchorId: string }).sourceAnchorId === "anc-001",
    "2-unknown: surviving selection is the canonical one",
  );
}

// ── Test 3: numeric selections (no sourceAnchorId) untouched ───────────
{
  const kept = rejectUnknownSourceAnchorIds(
    [numeric("scalar-01"), textual("anc-002")] as never,
    anchors,
    "test",
  );
  assert(kept.length === 2, "3-numeric: dataItemId-based selection retained");
}

// ── Test 4: all-unknown empties the set (drift fully surfaced) ─────────
{
  const kept = rejectUnknownSourceAnchorIds(
    [textual("anc-1"), textual("bogus")] as never,
    anchors,
    "test",
  );
  assert(kept.length === 0, "4-all-unknown: nothing passed through");
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
