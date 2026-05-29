/**
 * Usage:
 *   npx tsx tests/docu/narration-style-gate.test.ts
 */
import {
  validateNarrationStyle,
  SPELLED_OUT_NUMBER_WORDS_RE,
  FORBIDDEN_PUNCTUATION_RE,
  DISALLOWED_DASH_RE,
} from "../../src/lib/docu/narration-prompt";
import type { SentenceDef } from "../../src/lib/docu/tts-pipeline";

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`PASS ${label}`);
}

function s(text: string, emphasis: string[] = []): SentenceDef {
  return { text, emphasis, palette: "cool-tech" };
}

// ── Happy path ────────────────────────────────────────────────────────

{
  const sentences = [
    s("The Federal Reserve raised interest rates again this quarter", ["Federal Reserve"]),
  ];
  const violations = validateNarrationStyle(sentences);
  assert(violations.length === 0, "happy path: 8-word sentence, emphasis in text — clean");
}

// ── Word count too short (2) ──────────────────────────────────────────

{
  const sentences = [s("Markets rose")];
  const violations = validateNarrationStyle(sentences);
  assert(violations.length === 1, "word-count-short: one violation");
  assert(violations[0].rules.includes("word-count"), "word-count-short: rule is word-count");
}

// ── Word count too long (21) ──────────────────────────────────────────

{
  const sentences = [s("The Federal Reserve decided to raise interest rates by fifty basis points yesterday afternoon before markets closed because inflation was too high and persistent")];
  const violations = validateNarrationStyle(sentences);
  assert(violations.length === 1, "word-count-long: one violation");
  assert(violations[0].rules.includes("word-count"), "word-count-long: rule is word-count");
}

// ── Word count boundaries 3 and 20 — clean ────────────────────────────

{
  const sentences = [s("The door locks")];
  const violations = validateNarrationStyle(sentences);
  assert(violations.length === 0, "word-count-boundary-3: clean");
}

{
  const sentences = [s("The Federal Reserve decided to raise interest rates at this very important quarterly meeting today and the markets responded immediately")];
  const violations = validateNarrationStyle(sentences);
  assert(violations.length === 0, "word-count-boundary-20: clean");
}

// ── Spelled number with no digit ─────────────────────────────────────

{
  const sentences = [s("The market cap reached four billion in the economy")];
  const violations = validateNarrationStyle(sentences);
  assert(violations.length === 1, "spelled-number: one violation");
  assert(violations[0].rules.includes("spelled-number"), "spelled-number: rule fires");
}

// ── Spelled number with digit present — clean ────────────────────────

{
  const sentences = [s("The stimulus package cost $4 billion")];
  const violations = validateNarrationStyle(sentences);
  // $4 billion contains both a digit and "billion" → spelled-number should NOT fire
  assert(violations.length === 0, "spelled-number-with-digit: clean");
}

// ── Ellipsis ──────────────────────────────────────────────────────────

{
  const sentences = [s("The markets reacted... and then collapsed")];
  const violations = validateNarrationStyle(sentences);
  const hasRule = violations.some((v) => v.rules.includes("forbidden-punctuation"));
  assert(hasRule, "forbidden-punctuation: ellipsis fires");
}

// ── Parens ────────────────────────────────────────────────────────────

{
  const sentences = [s("The Fed (Federal Reserve) made the announcement")];
  const violations = validateNarrationStyle(sentences);
  const hasRule = violations.some((v) => v.rules.includes("forbidden-punctuation"));
  assert(hasRule, "forbidden-punctuation: parens fire");
}

// ── En-dash ───────────────────────────────────────────────────────────

{
  const sentences = [s("The market surged–then crashed overnight")];
  const violations = validateNarrationStyle(sentences);
  const hasRule = violations.some((v) => v.rules.includes("disallowed-dash"));
  assert(hasRule, "disallowed-dash: en-dash fires");
}

// ── Double-hyphen ────────────────────────────────────────────────────

{
  const sentences = [s("The market surged--then crashed overnight")];
  const violations = validateNarrationStyle(sentences);
  const hasRule = violations.some((v) => v.rules.includes("disallowed-dash"));
  assert(hasRule, "disallowed-dash: double-hyphen fires");
}

// ── Em-dash — clean (not flagged) ────────────────────────────────────

{
  const sentences = [s("The market surged—then crashed overnight")];
  const violations = validateNarrationStyle(sentences);
  const hasRule = violations.some((v) => v.rules.includes("disallowed-dash"));
  assert(!hasRule, "em-dash: clean (not flagged)");
}

// ── Emphasis not in text ─────────────────────────────────────────────

{
  const sentences = [s("The Federal Reserve raised interest rates", ["stock market"])];
  const violations = validateNarrationStyle(sentences);
  assert(violations.length === 1, "emphasis-not-found: one violation");
  assert(violations[0].rules.includes("emphasis-not-found"), "emphasis-not-found: rule fires");
}

// ── Emphasis in text (token-normalized) ──────────────────────────────

{
  // "Federal Reserve" should match "The Federal Reserve raised rates"
  const sentences = [s("The Federal Reserve raised interest rates", ["Federal Reserve"])];
  const violations = validateNarrationStyle(sentences);
  assert(violations.length === 0, "emphasis-found: clean (token match)");
}

// ── Emphasis with punctuation normalization ──────────────────────────

{
  // "Federal Reserve" should match "The Federal Reserve's decision..."
  // normalizeToken strips apostrophe and lowercase → "federalreserve" vs "federalreserves"
  // This is a partial token match — should work with sliding window
  const sentences = [s("The Federal Reserve decision shapes markets", ["Federal Reserve"])];
  const violations = validateNarrationStyle(sentences);
  assert(violations.length === 0, "emphasis-found: clean with normalized tokens");
}

// ── Multiple rules on one sentence ────────────────────────────────────

{
  const sentences = [s("value... (stuff)")];
  const violations = validateNarrationStyle(sentences);
  assert(violations.length === 1, "multi-rule: one violation entry");
  const rules = violations[0].rules;
  assert(
    rules.includes("word-count") && rules.includes("forbidden-punctuation"),
    "multi-rule: both word-count and forbidden-punctuation",
  );
}

// ── Multi-sentence: only violating sentences returned ─────────────────

{
  const sentences = [
    s("The Federal Reserve raised interest rates today carefully", ["Federal Reserve"]),
    s("no"),
    s("another perfectly fine sentence about market conditions too"),
  ];
  const violations = validateNarrationStyle(sentences);
  assert(violations.length === 1, "multi-sentence: only one violation (short sentence)");
  assert(violations[0].index === 1, "multi-sentence: correct index (1)");
}

// ── Regex constant tests ──────────────────────────────────────────────

assert(SPELLED_OUT_NUMBER_WORDS_RE.test("four billion in value"), "SPELLED_OUT: matches 'four billion'");
assert(SPELLED_OUT_NUMBER_WORDS_RE.test("a hundred reasons"), "SPELLED_OUT: matches 'hundred'");
assert(!SPELLED_OUT_NUMBER_WORDS_RE.test("baseball game"), "SPELLED_OUT: does not match 'ball' substring");

assert(FORBIDDEN_PUNCTUATION_RE.test("wait..."), "FORBIDDEN_PUNCTUATION: matches ellipsis");
assert(FORBIDDEN_PUNCTUATION_RE.test("(note)"), "FORBIDDEN_PUNCTUATION: matches parens");
assert(!FORBIDDEN_PUNCTUATION_RE.test("hello world"), "FORBIDDEN_PUNCTUATION: clean text");

assert(DISALLOWED_DASH_RE.test("high--risk"), "DISALLOWED_DASH: matches double-hyphen");
assert(DISALLOWED_DASH_RE.test("high–risk"), "DISALLOWED_DASH: matches en-dash");
assert(!DISALLOWED_DASH_RE.test("high—risk"), "DISALLOWED_DASH: em-dash is allowed");

console.log("\nAll narration-style-gate tests passed.");
