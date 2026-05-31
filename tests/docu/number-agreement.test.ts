/**
 * Usage:
 *   npx tsx tests/docu/number-agreement.test.ts
 */
import { numberMatchesText } from "../../src/lib/docu/metric-extraction-prompt";
import { validateNumberAgreement } from "../../src/lib/docu/overlay-prompt";
import type { SentenceDef } from "../../src/lib/docu/tts-pipeline";
import type { DataItem } from "../../src/lib/docu/overlays/types";

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`PASS ${label}`);
}

// ── numberMatchesText (unit tests) ──────────────────────────────────

assert(
  numberMatchesText(9.1, "%", "Inflation hit 9.1 percent last June"),
  "numberMatchesText: 9.1% percent-word match",
);

assert(
  numberMatchesText(9.1, "%", "inflation reached 9.1% in 2022"),
  "numberMatchesText: 9.1% symbol match",
);

assert(
  !numberMatchesText(9.1, "%", "the rate rose to 4.2 percent"),
  "numberMatchesText: 9.1% not in text",
);

assert(
  numberMatchesText(800, "$", "the package cost $800 billion"),
  "numberMatchesText: $800 dollar-prefix match",
);

assert(
  numberMatchesText(800, "$", "costing 800 dollars per household"),
  "numberMatchesText: 800 dollars word match",
);

assert(
  numberMatchesText(250000, "K", "over 250,000 new accounts opened"),
  "numberMatchesText: comma-formatted 250,000 matches 250000",
);

assert(
  !numberMatchesText(250000, "K", "just 50,000 sign-ups last quarter"),
  "numberMatchesText: 250,000 not in text with 50,000",
);

assert(
  numberMatchesText(25, "%", "the Fed raised rates by 25 basis points"),
  "numberMatchesText: 25% unit with basis-points text",
);

assert(
  numberMatchesText(25, "%", "a 25 bp hike was announced"),
  "numberMatchesText: 25% unit with bp abbreviation",
);

assert(
  numberMatchesText(5.5, "%", "the rate stands at 5.5"),
  "numberMatchesText: integer match with word boundary",
);

// ── validateNumberAgreement (integration tests) ─────────────────────

function s(text: string): SentenceDef {
  return { text, emphasis: [], palette: "cool-tech" };
}

const scalarDataItems: DataItem[] = [
  { id: "scalar-01", kind: "scalar", value: 9.1, unit: "%", label: "Inflation Rate", sourceAnchorId: "anc-001", sourceUrl: "https://example.com" },
  { id: "scalar-02", kind: "scalar", value: 800, unit: "$", label: "Stimulus Cost", sourceAnchorId: "anc-002", sourceUrl: "https://example.com" },
  { id: "scalar-03", kind: "scalar", value: 4.2, unit: "%", label: "GDP Growth", sourceAnchorId: "anc-003", sourceUrl: "https://example.com" },
];

// Test: match passes — sentence contains the value
{
  const sentences = [s("Inflation hit 9.1 percent last June")];
  const selections = [
    { type: "kinetic-number", dataItemId: "scalar-01", anchorPhrase: "9.1 percent", holdSec: 3.5, palette: "cool-tech" as const },
  ];
  const violations = validateNumberAgreement(selections, sentences, scalarDataItems);
  assert(violations.length === 0, "validate: match passes — sentence contains 9.1%");
}

// Test: mismatch — sentence says different number
{
  const sentences = [s("GDP grew at 4.2 percent last quarter")];
  const selections = [
    { type: "kinetic-number", dataItemId: "scalar-01", anchorPhrase: "GDP grew", holdSec: 3.5, palette: "cool-tech" as const },
  ];
  const violations = validateNumberAgreement(selections, sentences, scalarDataItems);
  assert(violations.length === 1, "validate: mismatch detected — sentence says 4.2 but overlay shows 9.1");
  assert(violations[0].dataItemId === "scalar-01", "validate: violation references correct dataItem");
  assert(violations[0].value === 9.1, "validate: violation reports correct value");
}

// Test: match — $ with dollar-prefix in sentence
{
  const sentences = [s("The stimulus package cost $800 billion")];
  const selections = [
    { type: "kinetic-number", dataItemId: "scalar-02", anchorPhrase: "stimulus package", holdSec: 3.5, palette: "cool-tech" as const },
  ];
  const violations = validateNumberAgreement(selections, sentences, scalarDataItems);
  assert(violations.length === 0, "validate: $800 match passes");
}

// Test: no-number-in-sentence passes (overlay legitimately amplifies)
{
  const sentences = [s("The Fed announced its latest policy decision")];
  const selections = [
    { type: "kinetic-number", dataItemId: "scalar-01", anchorPhrase: "The Fed", holdSec: 3.5, palette: "cool-tech" as const },
  ];
  const violations = validateNumberAgreement(selections, sentences, scalarDataItems);
  assert(violations.length === 0, "validate: no-number-in-sentence passes (legitimate amplification)");
}

// Test: comma-formatted equivalence
{
  const sentences = [s("over 250,000 new accounts were opened")];
  const dataItems: DataItem[] = [
    { id: "scalar-04", kind: "scalar", value: 250000, unit: "K", label: "New Accounts", sourceAnchorId: "anc-004", sourceUrl: "https://example.com" },
  ];
  const selections = [
    { type: "kinetic-number", dataItemId: "scalar-04", anchorPhrase: "new accounts", holdSec: 3.5, palette: "cool-tech" as const },
  ];
  const violations = validateNumberAgreement(selections, sentences, dataItems);
  assert(violations.length === 0, "validate: comma-formatted 250,000 matches 250000");
}

// Test: textual selection (no dataItemId) is skipped by gate
{
  const sentences = [s("The Federal Reserve acted decisively")];
  const selections = [
    { type: "headline-card", anchorPhrase: "The Federal Reserve", holdSec: 4.0, palette: "cool-tech" as const, text: "FED ACTS", source: "Fed", sourceAnchorId: "anc-001" },
  ];
  const violations = validateNumberAgreement(selections, sentences, scalarDataItems);
  assert(violations.length === 0, "validate: textual selection (headline-card) skipped by number gate");
}

// Test: non-scalar data items are skipped
{
  const sentences = [s("Revenue grew from $50B to $94B over four years")];
  const timeseriesItems: DataItem[] = [
    { id: "timeseries-01", kind: "timeseries", points: [{ x: "2020", y: 50 }, { x: "2024", y: 94 }], unit: "B", label: "Revenue Growth", sourceAnchorId: "anc-005", sourceUrl: "https://example.com" },
  ];
  const selections = [
    { type: "chart", dataItemId: "timeseries-01", anchorPhrase: "Revenue grew", holdSec: 4.5, palette: "cool-tech" as const },
  ];
  const violations = validateNumberAgreement(selections, sentences, timeseriesItems);
  assert(violations.length === 0, "validate: non-scalar (timeseries) skipped by number gate");
}

// Test: multiple selections, mixed results
{
  const sentences = [
    s("Inflation hit 9.1 percent last June"),
    s("GDP grew at 4.2 percent"),
    s("The stimulus cost $800 billion"),
  ];
  const selections = [
    { type: "kinetic-number", dataItemId: "scalar-01", anchorPhrase: "9.1 percent", holdSec: 3.5, palette: "cool-tech" as const },
    { type: "kinetic-number", dataItemId: "scalar-01", anchorPhrase: "4.2 percent", holdSec: 3.5, palette: "cool-tech" as const },
    { type: "kinetic-number", dataItemId: "scalar-02", anchorPhrase: "stimulus cost", holdSec: 3.5, palette: "cool-tech" as const },
  ];
  const violations = validateNumberAgreement(selections, sentences, scalarDataItems);
  assert(violations.length === 1, "validate: mixed — 1 mismatch (scalar-01 anchored to 4.2% sentence)");
  assert(violations[0].index === 1, "validate: mismatch at correct index");
}

// Test: spelled-out number is no longer skipped — matching value passes
{
  const sentences = [s("Inflation reached nine point one percent that summer")];
  const selections = [
    { type: "kinetic-number", dataItemId: "scalar-01", anchorPhrase: "Inflation reached", holdSec: 3.5, palette: "cool-tech" as const },
  ];
  const violations = validateNumberAgreement(selections, sentences, scalarDataItems);
  assert(violations.length === 0, "validate: spelled-out 'nine point one percent' matches 9.1% (not skipped)");
}

// Test: spelled-out number MISMATCH is now detected (was skipped by /\d/ before)
{
  const sentences = [s("GDP grew four point two percent last quarter")];
  const selections = [
    { type: "kinetic-number", dataItemId: "scalar-01", anchorPhrase: "GDP grew", holdSec: 3.5, palette: "cool-tech" as const },
  ];
  const violations = validateNumberAgreement(selections, sentences, scalarDataItems);
  assert(violations.length === 1, "validate: spelled-out mismatch detected (4.2 spoken vs 9.1 overlay)");
}

// Test: magnitude-shorthand sentence ($2.5T) matches a {2.5, T} scalar
{
  const sentences = [s("The acquisition was worth $2.5T at close")];
  const dataItems: DataItem[] = [
    { id: "scalar-05", kind: "scalar", value: 2.5, unit: "T", label: "Deal Value", sourceAnchorId: "anc-005", sourceUrl: "https://example.com" },
  ];
  const selections = [
    { type: "kinetic-number", dataItemId: "scalar-05", anchorPhrase: "acquisition", holdSec: 3.5, palette: "cool-tech" as const },
  ];
  const violations = validateNumberAgreement(selections, sentences, dataItems);
  assert(violations.length === 0, "validate: '$2.5T' shorthand matches {value:2.5, unit:'T'}");
}

console.log("\nAll number-agreement tests passed.");
