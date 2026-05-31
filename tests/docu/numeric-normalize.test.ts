/**
 * Usage:
 *   npx tsx tests/docu/numeric-normalize.test.ts
 *
 * Covers the shared numeric-normalize util (PLAN §2.1): comma normalization
 * (incl. European decimals), magnitude extraction with unit class + scale, and
 * the value-vs-text matcher used by the metric-fidelity gate.
 */
import {
  normalizeNumericText,
  extractMagnitudes,
  valueMatchesText,
  toSpokenForm,
} from "../../src/lib/shared/numeric-normalize";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

// ── normalizeNumericText ───────────────────────────────────────────────

assert(normalizeNumericText("250,000") === "250000", "normalize: grouping comma stripped");
assert(normalizeNumericText("1,234,567") === "1234567", "normalize: multi-group stripped");
assert(normalizeNumericText("2,50") === "2.50", "normalize: European decimal comma → dot");
assert(normalizeNumericText("10,00") === "10.00", "normalize: European 10,00 → 10.00");
assert(normalizeNumericText("2,500") === "2500", "normalize: 2,500 treated as grouping");
assert(normalizeNumericText("12,345.67") === "12345.67", "normalize: grouping with decimal point");
assert(normalizeNumericText("$2.5T") === "$2.5T", "normalize: no comma untouched");

// ── extractMagnitudes ──────────────────────────────────────────────────

function findClass(text: string, value: number): string | undefined {
  return extractMagnitudes(text).find((m) => Math.abs(m.mantissa - value) < 1e-9)?.unitClass;
}

assert(findClass("$2.5T deal", 2.5) === "currency", "extract: $2.5T glued → currency");
{
  const m = extractMagnitudes("$2.5T").find((x) => x.mantissa === 2.5)!;
  assert(m.scale === "T" && m.expanded === 2.5e12, "extract: $2.5T scale=T expanded=2.5e12");
}
assert(findClass("inflation hit 9.1%", 9.1) === "percent", "extract: 9.1% → percent");
assert(findClass("a 250bps hike", 250) === "percent", "extract: 250bps → percent (literal)");
assert(findClass("25 basis points", 25) === "percent", "extract: 25 basis points → percent");
assert(findClass("revenue of $450 billion", 450) === "currency", "extract: $450 billion → currency");
{
  const m = extractMagnitudes("$450 billion").find((x) => x.mantissa === 450)!;
  assert(m.scale === "B" && m.expanded === 4.5e11, "extract: $450 billion scale=B expanded=4.5e11");
}
assert(findClass("grew 3x last year", 3) === "multiple", "extract: 3x → multiple");
assert(findClass("over 250,000 accounts", 250000) === "count", "extract: 250,000 → count (no false scale)");
assert(findClass("priced at 2,50 euros", 2.5) === "count", "extract: European 2,50 → 2.5 count");
// written-out
assert(findClass("two point five trillion dollars", 2.5) === "currency", "extract: written 2.5T dollars → currency");
{
  const m = extractMagnitudes("two point five trillion").find((x) => x.mantissa === 2.5)!;
  assert(m.scale === "T" && m.expanded === 2.5e12, "extract: written 2.5 trillion expanded");
}
assert(findClass("nine point one percent", 9.1) === "percent", "extract: written 9.1 percent → percent");
assert(findClass("twenty five basis points", 25) === "percent", "extract: written 25 bps → percent");
// stray small word-number must NOT be emitted
assert(
  extractMagnitudes("one of the largest banks").every((m) => m.mantissa !== 1),
  "extract: bare 'one' (no unit/scale/point) not emitted",
);
// false scale guard: "5 trees" must not become 5T
assert(
  extractMagnitudes("5 trees lined the street").every((m) => m.scale === null),
  "extract: '5 trees' → no spurious scale",
);

// ── valueMatchesText (the gate core) ───────────────────────────────────

// True positives
assert(valueMatchesText(2.5, "T", "the $2.5T cloud market"), "match: 2.5T ↔ $2.5T");
assert(valueMatchesText(450, "B", "valued at $450B"), "match: 450B ↔ $450B");
assert(valueMatchesText(94, "B", "the US cloud market hit $94 billion"), "match: 94B ↔ $94 billion");
assert(valueMatchesText(25, "%", "the Fed raised rates by 25 basis points"), "match: 25% ↔ 25 basis points");
assert(valueMatchesText(250000, "K", "over 250,000 new accounts opened"), "match: 250000K ↔ 250,000");
assert(valueMatchesText(2.5, "T", "roughly two point five trillion dollars"), "match: 2.5T ↔ written");
assert(valueMatchesText(2.5, "%", "rates fell to 2,50 percent"), "match: 2.5% ↔ European 2,50 percent");

// True negatives — fidelity protection
assert(
  !valueMatchesText(9.1, "%", "the market reached $9.1 billion"),
  "reject: percent item must not match a currency mention of same digits",
);
assert(
  !valueMatchesText(0.025, "%", "inflation hit 2.5%"),
  "reject: fraction 0.025 not coerced to 2.5%",
);
assert(
  !valueMatchesText(2.5, "T", "about $2.5 million in revenue"),
  "reject: 2.5 trillion claim against 2.5 million anchor (scale fabrication)",
);
assert(
  !valueMatchesText(7, "%", "inflation reached 9.1%"),
  "reject: wrong number",
);
assert(
  !valueMatchesText(3, "x", "grew by 3 percent"),
  "reject: multiplier item must not match a percent mention",
);

// ── toSpokenForm (digits/symbols → spoken tokens) ──────────────────────

assert(toSpokenForm("$2.5T deal") === "two point five trillion dollars deal", "spoken: $2.5T → words");
assert(toSpokenForm("the $800 billion package") === "the eight hundred billion dollars package", "spoken: $800 billion → words");
assert(toSpokenForm("inflation hit 9.1%") === "inflation hit nine point one percent", "spoken: 9.1% → words");
assert(toSpokenForm("a 250bps hike") === "a two hundred fifty basis points hike", "spoken: 250bps → basis points");
assert(toSpokenForm("grew 3x in a year") === "grew three times in a year", "spoken: 3x → times");
assert(toSpokenForm("94 banks closed") === "ninety four banks closed", "spoken: bare integer → words");
assert(toSpokenForm("no numbers here") === "no numbers here", "spoken: non-numeric untouched");

console.log(`\n${passed} passed`);
