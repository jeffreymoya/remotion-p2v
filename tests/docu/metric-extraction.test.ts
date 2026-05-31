/**
 * Usage:
 *   npx tsx tests/docu/metric-extraction.test.ts
 *
 * Greenfield metric-fidelity gate harness (PLAN §2.2 / B1). Exercises
 * `valueInAnchorText` — the gate's check that a DataItem's value(s) are
 * attested in the anchor's free-text prose. Note: per the resolved bps
 * convention, basis points are treated as the LITERAL number in the percent
 * class (no ÷100), matching the shipped extraction prompt.
 */
import { valueInAnchorText } from "../../src/lib/docu/metric-extraction-prompt";
import type { DataItem } from "../../src/lib/docu/overlays/types";

let passed = 0;
function assert(condition: boolean, label: string): void {
  if (!condition) throw new Error(`FAIL ${label}`);
  passed++;
  console.log(`PASS ${label}`);
}

function scalar(value: number, unit: DataItem["unit"], label = "Metric"): DataItem {
  return { id: "scalar-01", kind: "scalar", value, unit, label, sourceAnchorId: "anc-001", sourceUrl: "https://example.com" };
}

// ── Scalar true positives (audit's missed cases) ───────────────────────

assert(valueInAnchorText(scalar(2.5, "T"), "the us cloud market is worth $2.5t today"), "scalar: $2.5T glued suffix");
assert(valueInAnchorText(scalar(450, "B"), "spending reached $450b last year"), "scalar: $450B glued suffix");
assert(valueInAnchorText(scalar(94, "B"), "the market hit $94 billion in 2024"), "scalar: 94B ↔ $94 billion");
assert(valueInAnchorText(scalar(25, "%"), "the fed raised rates by 25 basis points"), "scalar: 25% ↔ basis points (literal)");
assert(valueInAnchorText(scalar(2.5, "T"), "roughly two point five trillion dollars in assets"), "scalar: written-out 2.5T");
assert(valueInAnchorText(scalar(2.5, "%"), "rates settled at 2,50 percent in europe"), "scalar: European 2,50 percent");
assert(valueInAnchorText(scalar(9.1, "%"), "inflation hit 9.1% in june"), "scalar: 9.1% symbol");

// ── Scalar true negatives (fidelity protection) ────────────────────────

assert(!valueInAnchorText(scalar(9.1, "%"), "the market reached $9.1 billion"), "scalar reject: percent item vs currency mention");
assert(!valueInAnchorText(scalar(0.025, "%"), "inflation hit 2.5% last year"), "scalar reject: 0.025 fraction not coerced to 2.5%");
assert(!valueInAnchorText(scalar(2.5, "T"), "about $2.5 million in revenue"), "scalar reject: 2.5T claim vs 2.5 million anchor");
assert(!valueInAnchorText(scalar(7.4, "%"), "inflation reached 9.1% in june"), "scalar reject: wrong number");

// ── Multi-point branch (timeseries) ────────────────────────────────────

function timeseries(ys: number[], unit: DataItem["unit"], label: string): DataItem {
  return {
    id: "timeseries-01",
    kind: "timeseries",
    points: ys.map((y, i) => ({ x: String(2020 + i), y })),
    unit,
    label,
    sourceAnchorId: "anc-001",
    sourceUrl: "https://example.com",
  };
}

// Two of two points present → passes regardless of label
assert(
  valueInAnchorText(timeseries([50, 94], "B", "Cloud Spend"), "cloud spend rose from $50 billion to $94 billion"),
  "timeseries: both points attested",
);
// One of two points present + label word present → passes via corroboration
assert(
  valueInAnchorText(timeseries([50, 94], "B", "cloud market"), "the cloud market started near $50 billion"),
  "timeseries: one point + label word corroborates",
);
// One of two points present, no label word → rejected
assert(
  !valueInAnchorText(timeseries([50, 94], "B", "cloud market"), "the figure started near $50 billion in revenue"),
  "timeseries reject: one point, no label corroboration",
);
// No points present → rejected
assert(
  !valueInAnchorText(timeseries([50, 94], "B", "cloud market"), "the cloud market grew substantially over time"),
  "timeseries reject: no points attested",
);

// ── Anchors with numbers but no extractable metric (precondition for 1b throw) ─

// Anchor mentions a year (2023) but no numeric value with a unit
assert(
  !valueInAnchorText(scalar(7.5, "%"), "the economy expanded through the end of 2023"),
  "scalar reject: anchor has numbers (year) but no extractable percent value",
);

// Anchor has a qualitative number "first" but no unit-bearing value
assert(
  !valueInAnchorText(scalar(1.5, "T"), "the first major policy shift occurred in Q2"),
  "scalar reject: anchor has ordinal/qualitative numbers but no T-scale value",
);

// Anchor has a number but unit class mismatch ($ vs %)
assert(
  !valueInAnchorText(scalar(3.2, "%"), "the budget reached $3.2 billion"),
  "scalar reject: % item cannot match a dollar-denominated anchor",
);

// Anchor has value close but different magnitude (5.1 vs 51)
assert(
  !valueInAnchorText(scalar(5.1, "B"), "revenue topped $51 billion last year"),
  "scalar reject: 5.1B does not match 51 billion (order-of-magnitude guard)",
);

console.log(`\n${passed} passed`);
