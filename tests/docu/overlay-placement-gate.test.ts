/**
 * Usage:
 *   npx tsx tests/docu/overlay-placement-gate.test.ts
 */
import {
  validateOverlayPlacement,
  type OverlayPlacementIssue,
  type OverlayPlacementWarning,
} from "../../src/lib/docu/overlay-prompt";
import type { OverlaySpec } from "../../src/lib/docu/overlays/registry";
import type { SentenceDef } from "../../src/lib/docu/tts-pipeline";

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

function makeSentence(text: string, palette: "cool-tech" | "warm-real" = "cool-tech"): SentenceDef {
  return { text, emphasis: [], palette };
}

function makeSpec(
  type: string,
  anchorPhrase: string,
  palette: "cool-tech" | "warm-real" = "cool-tech",
  holdSec = 3,
): OverlaySpec {
  const base = { type, anchorPhrase, palette, holdSec };
  if (type === "headline-card") {
    return { ...base, text: "TEST", sourceAnchorId: "anc-001" } as unknown as OverlaySpec;
  }
  return { ...base, value: 100, unit: "$" as const, label: "Test" } as unknown as OverlaySpec;
}

// ── Test 1: Happy path ────────────────────────────────────────────────

{
  const specs: OverlaySpec[] = [
    makeSpec("headline-card", "balance sheet", "cool-tech"),
    makeSpec("kinetic-number", "unemployment rate", "cool-tech"),
    makeSpec("headline-card", "mortgage rates", "warm-real"),
    makeSpec("kinetic-number", "inflation peaked", "cool-tech"),
  ];
  const sentences: SentenceDef[] = [
    makeSentence("The Fed balance sheet expanded rapidly.", "cool-tech"),
    makeSentence("The unemployment rate fell to historic lows.", "cool-tech"),
    makeSentence("Mortgage rates climbed past seven percent.", "warm-real"),
    makeSentence("Inflation peaked in mid-2022.", "cool-tech"),
    makeSentence("Homeowners felt the squeeze.", "warm-real"),
    makeSentence("Markets reacted with volatility.", "cool-tech"),
    makeSentence("Central banks coordinated their response.", "cool-tech"),
    makeSentence("The dollar strengthened globally.", "cool-tech"),
    makeSentence("Supply chains began to heal.", "warm-real"),
    makeSentence("Consumer spending remained resilient.", "warm-real"),
    makeSentence("Wages grew but lagged inflation.", "warm-real"),
    makeSentence("The cycle was turning.", "cool-tech"),
  ];
  const { issues, warnings } = validateOverlayPlacement(specs, sentences);
  assert(issues.length === 0, "1-happy: zero issues");
  assert(warnings.length === 0, "1-happy: zero warnings (ratio 4/12 = 0.33)");
}

// ── Test 2: Density low ───────────────────────────────────────────────

{
  const specs: OverlaySpec[] = [
    makeSpec("headline-card", "economy", "cool-tech"),
  ];
  const sentences: SentenceDef[] = Array.from({ length: 10 }, (_, i) =>
    makeSentence(`Sentence ${i + 1} about the economy.`, "cool-tech"),
  );
  const { issues, warnings } = validateOverlayPlacement(specs, sentences);
  assert(issues.length === 0, "2-density-low: zero issues");
  assert(warnings.length === 1, "2-density-low: one warning");
  assert(warnings[0].kind === "density-low", "2-density-low: density-low kind");
  assert(warnings[0].ratio === 0.1, "2-density-low: ratio 0.1");
}

// ── Test 3: Density high ──────────────────────────────────────────────

{
  const specs: OverlaySpec[] = Array.from({ length: 8 }, (_, i) =>
    makeSpec("headline-card", "data point", "cool-tech"),
  );
  const sentences: SentenceDef[] = Array.from({ length: 10 }, (_, i) =>
    makeSentence(`Sentence ${i + 1} about data point.`, "cool-tech"),
  );
  const { issues, warnings } = validateOverlayPlacement(specs, sentences);
  assert(warnings.length === 1, "3-density-high: one warning");
  assert(warnings[0].kind === "density-high", "3-density-high: density-high kind");
  assert(warnings[0].ratio === 0.8, "3-density-high: ratio 0.8");
}

// ── Test 4: Density boundaries — clean ────────────────────────────────

{
  // Ratio exactly 0.2
  const specs2: OverlaySpec[] = [
    makeSpec("headline-card", "one", "cool-tech"),
    makeSpec("headline-card", "two", "cool-tech"),
  ];
  const sentences10: SentenceDef[] = Array.from({ length: 10 }, (_, i) =>
    makeSentence(`Sentence ${i + 1}.`, "cool-tech"),
  );
  const r1 = validateOverlayPlacement(specs2, sentences10);
  assert(r1.warnings.length === 0, "4-boundary-0.2: clean (ratio=0.2)");

  // Ratio exactly 0.5
  const specs5: OverlaySpec[] = Array.from({ length: 5 }, (_, i) =>
    makeSpec("headline-card", `fact ${i}`, "cool-tech"),
  );
  const r2 = validateOverlayPlacement(specs5, sentences10);
  assert(r2.warnings.length === 0, "4-boundary-0.5: clean (ratio=0.5)");
}

// ── Test 5: Palette drift ─────────────────────────────────────────────

{
  const specs: OverlaySpec[] = [
    makeSpec("headline-card", "mortgage crisis", "cool-tech"),
  ];
  const sentences: SentenceDef[] = [
    makeSentence("The mortgage crisis devastated millions of families.", "warm-real"),
  ];
  const { issues } = validateOverlayPlacement(specs, sentences);
  assert(issues.length === 1, "5-palette-drift: one issue");
  assert(issues[0].kind === "palette-drift", "5-palette-drift: correct kind");
  assert(issues[0].specIndex === 0, "5-palette-drift: correct specIndex");
}

// ── Test 6: Anchor-phrase collision ───────────────────────────────────

{
  const specs: OverlaySpec[] = [
    makeSpec("headline-card", "the fed balance sheet", "cool-tech"),
    makeSpec("kinetic-number", "the fed balance sheet", "cool-tech"),
  ];
  const sentences: SentenceDef[] = [
    makeSentence("The Fed balance sheet hit nine trillion.", "cool-tech"),
  ];
  const { issues } = validateOverlayPlacement(specs, sentences);
  assert(issues.length === 1, "6-collision: one issue");
  assert(issues[0].kind === "anchor-collision", "6-collision: correct kind");
  assert(issues[0].specIndex === 1, "6-collision: second spec flagged");
}

// ── Test 7: Anchor phrase not found in any sentence ───────────────────

{
  const specs: OverlaySpec[] = [
    makeSpec("headline-card", "nonexistent phrase here", "cool-tech"),
  ];
  const sentences: SentenceDef[] = [
    makeSentence("This sentence has different words entirely.", "cool-tech"),
  ];
  const { issues } = validateOverlayPlacement(specs, sentences);
  assert(issues.length === 0, "7-not-found: no palette-drift (can't determine sentence)");
}

// ── Test 8: Combined drift + collision ────────────────────────────────

{
  const specs: OverlaySpec[] = [
    makeSpec("headline-card", "consumer spending", "cool-tech"),
    makeSpec("headline-card", "consumer spending", "cool-tech"),
    makeSpec("headline-card", "housing starts", "cool-tech"),
  ];
  const sentences: SentenceDef[] = [
    makeSentence("Consumer spending surged in Q2.", "warm-real"),
    makeSentence("Housing starts declined for the third month.", "cool-tech"),
  ];
  const { issues } = validateOverlayPlacement(specs, sentences);
  assert(issues.length >= 2, "8-combined: at least two issues");
  assert(
    issues.some((i) => i.kind === "palette-drift" && i.specIndex === 0),
    "8-combined: palette-drift on spec 0",
  );
  assert(
    issues.some((i) => i.kind === "anchor-collision" && i.specIndex === 1),
    "8-combined: anchor-collision on spec 1",
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
