/**
 * Offline fallback query derivation (A2) — improved RULE, no LLM call.
 *
 * Usage:
 *   npx tsx tests/docu/image-query-fallback.test.ts
 */
import { deriveFallbackQuery } from "../../src/lib/docu/image-query-prompt";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

// ── Phase-0 example: evocative noun no longer lost to top-3 truncation ──

{
  const q = deriveFallbackQuery("Interest rate decisions ripple through to home mortgage costs", "cool-tech");
  // Old rule produced "interest rate decisions financial" — dropping "mortgage".
  assert(q.includes("mortgage"), "phase0: evocative 'mortgage' retained", q);
  assert(wordCount(q) >= 3 && wordCount(q) <= 5, "phase0: 3–5 word query", q);
  assert(q.endsWith("financial"), "phase0: cool-tech palette word appended", q);
}

// ── "rate" is no longer a hard stopword (finance-relevant) ─────────────

{
  const q = deriveFallbackQuery("The rate hike surprised markets", "cool-tech");
  assert(q.includes("rate"), "finance: 'rate' retained (removed from derivation stoplist)", q);
}

// ── Connective filler ("through") is dropped ───────────────────────────

{
  const q = deriveFallbackQuery("Money flowing through banks", "cool-tech");
  assert(!q.split(/\s+/).includes("through"), "filler: 'through' dropped", q);
}

// ── warm-real palette + empty-content fallback ─────────────────────────

{
  const q = deriveFallbackQuery("The families moved", "warm-real");
  assert(q.endsWith("community"), "warm-real: palette word appended", q);
}

{
  // No content words survive the length/stopword filter → palette documentary.
  const q = deriveFallbackQuery("the and for are", "cool-tech");
  assert(q === "financial documentary", "empty: degrades to palette documentary", q);
}

console.log(`\n${passed} passed`);
