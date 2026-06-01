/**
 * WS3 — chart dispatch parity + data-contract gating.
 *
 * Verifies:
 *  1. CHART_REGISTRY is total over ChartKind (every render style has a component).
 *  2. Every ChartKind maps to a chartable DataItemKind via CHART_KIND_CONSUMES.
 *  3. populateChart yields the canonical default render style per data shape
 *     (output is byte-identical to pre-WS3 behaviour for the 3 production kinds).
 *  4. A valid render-style override is honoured; a mismatched override falls back.
 *  5. The dropped kinds (stacked-bar, bubble) are gone from the schema.
 *  6. Decoupled styles (horizontal-bar/area/radial) route through a DataItem and
 *     pass the number-agreement gate (non-scalar → no violation).
 *
 * Usage:
 *   npx tsx tests/docu/chart-dispatch.test.ts
 */
import { CHART_REGISTRY } from "../../src/components/docu/DocuChart";
import { chartDef, CHART_KIND_CONSUMES, type ChartKind } from "../../src/lib/docu/overlays/chart";
import { DATA_ITEM_KINDS, type DataItem } from "../../src/lib/docu/overlays/types";
import type { SelectionInput } from "../../src/lib/docu/overlays/registry";
import { validateNumberAgreement } from "../../src/lib/docu/overlay-prompt";
import type { SentenceDef } from "../../src/lib/docu/tts-pipeline";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

const EXPECTED_KINDS: ChartKind[] = ["timeseries", "comparison", "composition", "horizontal-bar", "area", "radial"];

// ── 1. CHART_REGISTRY totality ──────────────────────────────────────────
const registryKeys = Object.keys(CHART_REGISTRY).sort();
assert(registryKeys.length === 6, "CHART_REGISTRY has 6 render styles", `got ${registryKeys.length}: ${registryKeys.join(", ")}`);
for (const k of EXPECTED_KINDS) {
  assert(typeof CHART_REGISTRY[k] === "function", `CHART_REGISTRY has a component for "${k}"`);
}
assert(!("stacked-bar" in CHART_REGISTRY), "CHART_REGISTRY dropped stacked-bar");
assert(!("bubble" in CHART_REGISTRY), "CHART_REGISTRY dropped bubble");

// ── 2. Every render style consumes a chartable DataItemKind ─────────────
const chartableKinds = DATA_ITEM_KINDS.filter((k) => k !== "scalar");
for (const k of EXPECTED_KINDS) {
  const consumes = CHART_KIND_CONSUMES[k];
  assert(
    (chartableKinds as ReadonlyArray<string>).includes(consumes),
    `render style "${k}" consumes a chartable DataItemKind ("${consumes}")`,
  );
}

// ── helpers ─────────────────────────────────────────────────────────────
function dataItem(kind: "timeseries" | "comparison" | "composition"): DataItem {
  return {
    id: `${kind}-01`,
    kind,
    points: [{ x: "2020", y: 50 }, { x: "2024", y: 94 }],
    unit: "B",
    label: "Revenue Growth",
    sourceAnchorId: "anc-001",
    sourceUrl: "https://example.com",
  };
}
const selection: SelectionInput = {
  type: "chart",
  anchorPhrase: "revenue growth",
  holdSec: 4.5,
  palette: "cool-tech",
};

// ── 3. Canonical default render style per data shape (output-preserving) ─
for (const kind of ["timeseries", "comparison", "composition"] as const) {
  const spec = chartDef.populate(dataItem(kind), selection);
  assert(spec.chartKind === kind, `populateChart default: ${kind} → render style "${kind}"`, `got ${String(spec.chartKind)}`);
  const parsed = chartDef.schema.safeParse(spec);
  assert(parsed.success, `populated ${kind} spec passes chart schema`);
}

// ── 4. Override honoured when compatible; falls back when not ────────────
const hbar = chartDef.populate(dataItem("comparison"), selection, "horizontal-bar");
assert(hbar.chartKind === "horizontal-bar", "valid override: comparison + horizontal-bar honoured");

const areaSpec = chartDef.populate(dataItem("timeseries"), selection, "area");
assert(areaSpec.chartKind === "area", "valid override: timeseries + area honoured");

const mismatched = chartDef.populate(dataItem("timeseries"), selection, "horizontal-bar");
assert(mismatched.chartKind === "timeseries", "invalid override: horizontal-bar on timeseries falls back to default");

// ── 5. Dropped kinds rejected by schema ─────────────────────────────────
for (const dropped of ["stacked-bar", "bubble"]) {
  const bad = { ...hbar, chartKind: dropped };
  const parsed = chartDef.schema.safeParse(bad);
  assert(!parsed.success, `chart schema rejects dropped kind "${dropped}"`);
}

// ── 6. Decoupled styles route through a DataItem and pass the gate ──────
const sentences: SentenceDef[] = [{ text: "Revenue grew from $50B to $94B over four years", emphasis: [], palette: "cool-tech" }];
for (const kind of ["horizontal-bar", "area", "radial"] as const) {
  const consumes = CHART_KIND_CONSUMES[kind];
  const item = dataItem(consumes);
  const selections = [{ type: "chart", dataItemId: item.id, anchorPhrase: "Revenue grew", holdSec: 4.5, palette: "cool-tech" as const }];
  const violations = validateNumberAgreement(selections, sentences, [item]);
  assert(violations.length === 0, `gate coverage: "${kind}" (← ${consumes}) routes through DataItem, no violation`);
}

console.log(`\n${passed} assertions passed.`);
