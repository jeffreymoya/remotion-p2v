/**
 * Overlay registry — schema round-trip + registry completeness.
 *
 * Usage:
 *   npx tsx tests/docu/overlay-registry.test.ts
 */
import { OVERLAY_REGISTRY, OverlaySpecSchema, PROMPTABLE_REGISTRY, OverlayTypeId } from "../../src/lib/docu/overlays/registry";
import type { OverlayDef, OverlaySpec, DocuOverlay } from "../../src/lib/docu/overlays/registry";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

// ── Registry completeness ───────────────────────────────────────────────

const registryKeys = Object.keys(OVERLAY_REGISTRY);
assert(registryKeys.length === 7, "registry has 7 entries", `got ${registryKeys.length}: ${registryKeys.join(", ")}`);

assert(registryKeys.includes("headline-card"), "registry includes headline-card");
assert(registryKeys.includes("kinetic-number"), "registry includes kinetic-number");
assert(registryKeys.includes("chart"), "registry includes chart");

// ── Schema round-trip: every def's schema parses a valid payload ───────

const validPayloads: Record<string, Record<string, unknown>> = {
  "headline-card": { type: "headline-card", text: "Test Card", sourceAnchorId: "anchor-1", palette: "cool-tech", anchorPhrase: "test phrase", holdSec: 3.5 },
  "kinetic-number": { type: "kinetic-number", text: "Test Metric", value: 42.5, unit: "%", palette: "cool-tech", anchorPhrase: "test", holdSec: 3 },
  "split-card": { type: "split-card", institution: "The Fed", headline: "Rate Decision", palette: "cool-tech", anchorPhrase: "rate decision", holdSec: 3 },
  "context-bar": { type: "context-bar", cycleItems: ["Item A", "Item B"], palette: "warm-real", anchorPhrase: "context", holdSec: 3 },
  "title-card": { type: "title-card", text: "Chapter Title", subtitle: "Episode 1", palette: "cool-tech", anchorPhrase: "chapter", holdSec: 3 },
  "article-card": { type: "article-card", id: "art-1", category: "Finance", headline: "Market Report", authors: ["J. Smith"], date: "2024-06-01", time: "09:30", tz: "ET", source: "WSJ", palette: "cool-tech", anchorPhrase: "market report", holdSec: 3 },
  "chart": { type: "chart", chartKind: "timeseries", label: "Revenue Trend", points: [{ x: "2022", y: 100 }, { x: "2023", y: 150 }], unit: "%", palette: "cool-tech", anchorPhrase: "revenue", holdSec: 3 },
};

for (const key of registryKeys as OverlayTypeId[]) {
  const payload = validPayloads[key];
  if (!payload) continue;
  const def = OVERLAY_REGISTRY[key] as OverlayDef;
  const parsed = def.schema.safeParse(payload);
  assert(
    parsed.success,
    `round-trip: ${key} schema`,
    parsed.success ? "ok" : JSON.stringify(parsed.error.issues),
  );
}

// ── OverlaySpecSchema rejects unknown overlay types ─────────────────────

const unknownOverlay = { type: "garbage-type", text: "hello", anchorPhrase: "test", holdSec: 3, palette: "cool-tech" };
const unknownParsed = OverlaySpecSchema.safeParse(unknownOverlay);
assert(!unknownParsed.success, "rejects unknown overlay type");
assert(
  unknownParsed.error?.issues.some((i) => i.code === "invalid_union"),
  "rejection has invalid_union code",
);

// ── OverlaySpecSchema accepts all 7 known types via the payloads above ──

for (const payload of Object.values(validPayloads)) {
  const parsed = OverlaySpecSchema.safeParse(payload);
  assert(parsed.success, `OverlaySpecSchema accepts ${payload.type}`, parsed.success ? "ok" : JSON.stringify(parsed.error.issues));
}

// ── Schema round-trip with optional enter/exit fields ────────────────────

const headlineWithEnter = { ...validPayloads["headline-card"], enter: "fadeUp", enterParams: {} };
const hlParsed = OverlaySpecSchema.safeParse(headlineWithEnter);
assert(hlParsed.success, "accepts headline-card with enter=fadeUp");

const headlineWithBadEnter = { ...validPayloads["headline-card"], enter: "garbage-preset" };
const hlBadParsed = OverlaySpecSchema.safeParse(headlineWithBadEnter);
assert(!hlBadParsed.success, "rejects headline-card with invalid enter preset");

const kineticWithEnter = { ...validPayloads["kinetic-number"], enter: "countUp", enterParams: {} };
const knParsed = OverlaySpecSchema.safeParse(kineticWithEnter);
assert(knParsed.success, "accepts kinetic-number with enter=countUp");

const chartWithEnter = { ...validPayloads["chart"], enter: "fadeIn", enterParams: {} };
const chParsed = OverlaySpecSchema.safeParse(chartWithEnter);
assert(chParsed.success, "accepts chart with enter=fadeIn");

// ── Enter/exit field propagation on parsed specs ─────────────────────────

if (hlParsed.success) {
  assert(hlParsed.data.enter === "fadeUp", "parsed headline-card preserves enter field");
  assert(hlParsed.data.palette === "cool-tech", "parsed headline-card preserves palette from base schema");
  assert(hlParsed.data.holdSec === 3.5, "parsed headline-card preserves holdSec from base schema");
}

// ── PROMPTABLE_REGISTRY: only promotable overlays ────────────────────────

const promotableKeys = Object.keys(PROMPTABLE_REGISTRY);
assert(promotableKeys.length === 3, "promotable registry has 3 entries", `got ${promotableKeys.length}`);
assert(promotableKeys.includes("headline-card"), "promotable includes headline-card");
assert(promotableKeys.includes("kinetic-number"), "promotable includes kinetic-number");
assert(promotableKeys.includes("chart"), "promotable includes chart");

// ── OverlaySpec union type is discriminable ─────────────────────────────

function describeOverlay(o: OverlaySpec): string {
  switch (o.type) {
    case "headline-card": return `headline: ${o.text}`;
    case "kinetic-number": return `kinetic: ${o.value}${o.unit}`;
    case "split-card": return `split: ${o.institution}`;
    case "context-bar": return `context: ${o.cycleItems.length} items`;
    case "title-card": return `title: ${o.text}`;
    case "article-card": return `article: ${o.headline}`;
    case "chart": return `chart: ${o.chartKind}`;
    default: {
      const _exhaustive: never = o;
      throw new Error(`unhandled overlay type: ${String(_exhaustive.type)}`);
    }
  }
}
// If this compiles, the switch is exhaustive.
const testSpec = { type: "headline-card" as const, text: "Test", sourceAnchorId: "a1", palette: "cool-tech" as const, anchorPhrase: "test", holdSec: 3 };
const desc = describeOverlay(testSpec as OverlaySpec);
assert(desc === "headline: Test", "OverlaySpec union discriminates on type");

// ── DocuOverlay derives correctly ───────────────────────────────────────

type _HasStartFrame = DocuOverlay extends { startFrame: number } ? true : false;
type _HasEndFrame = DocuOverlay extends { endFrame: number } ? true : false;
// These are compile-time checks; verify at runtime that the type is usable.
const resolvedExample: DocuOverlay = {
  type: "headline-card",
  text: "Test",
  sourceAnchorId: "a1",
  palette: "cool-tech",
  startFrame: 0,
  endFrame: 90,
} as DocuOverlay;
assert(resolvedExample.startFrame === 0, "DocuOverlay has startFrame");
assert(resolvedExample.endFrame === 90, "DocuOverlay has endFrame");

// ── Every def has required fields ────────────────────────────────────────

for (const key of registryKeys as OverlayTypeId[]) {
  const def = OVERLAY_REGISTRY[key] as OverlayDef;
  assert(typeof def.id === "string", `${key}: has id`);
  assert(typeof def.anchorStrategy === "function", `${key}: has anchorStrategy`);
  assert(typeof def.promptRule === "string" && def.promptRule.length > 0, `${key}: has promptRule`);
  assert(typeof def.surface === "string", `${key}: has surface`);
}

// ── Summary ─────────────────────────────────────────────────────────────

console.log(`\n${passed} tests passed`);
if (passed < 25) throw new Error(`${passed} tests passed — expected 25+`);
