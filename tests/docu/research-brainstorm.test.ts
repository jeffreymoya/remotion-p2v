/**
 * normalizeKind (C1) — synonym tolerance + graceful default (no throw).
 *
 * Usage:
 *   npx tsx tests/docu/research-brainstorm.test.ts
 */
import {
  normalizeKind,
  RESEARCH_BRAINSTORM_MAX_TOKENS,
} from "../../src/lib/shared/research/research-brainstorm";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

// ── Known synonyms map to canonical enum ───────────────────────────────

assert(normalizeKind("quote") === "primary_quote", "synonym: quote → primary_quote");
assert(normalizeKind("statistics_or_distribution") === "study", "synonym: statistics_or_distribution → study");
assert(normalizeKind("review_article") === "meta_analysis", "synonym: review_article → meta_analysis");
assert(normalizeKind("real_world_example") === "case_study", "synonym: real_world_example → case_study");
assert(normalizeKind("transformation_story") === "narrative", "synonym: transformation_story → narrative");
// case / whitespace / hyphen normalization
assert(normalizeKind("  Primary-Quote  ") === "primary_quote", "synonym: case+hyphen normalized");

// ── Unknown kind degrades gracefully (no throw) ────────────────────────

{
  let result: string | undefined;
  let threw = false;
  try {
    result = normalizeKind("totally_made_up_kind");
  } catch {
    threw = true;
  }
  assert(!threw, "unknown: does not throw");
  assert(result === "study", "unknown: defaults to 'study'", result);
}

// ── Brainstorm request budget stays explicit ────────────────────────────

assert(
  RESEARCH_BRAINSTORM_MAX_TOKENS >= 16_000,
  "brainstorm: explicit max token budget set high enough for large corpus prompts",
  String(RESEARCH_BRAINSTORM_MAX_TOKENS),
);

console.log(`\n${passed} passed`);
