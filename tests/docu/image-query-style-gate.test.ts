/**
 * Usage:
 *   npx tsx tests/docu/image-query-style-gate.test.ts
 */
import {
  validateImageQueryStyle,
  applyImageQueryFallbacks,
  MOTION_VERB_RE,
} from "../../src/lib/docu/image-query-prompt";
import type { ImageQuery } from "../../src/lib/docu/image-pipeline";

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`PASS ${label}`);
}

function iq(slot: number, query: string, fallback = "default fallback"): ImageQuery {
  return { slot, query, fallback };
}

const runName = "test/image-queries";

// ── Happy path ────────────────────────────────────────────────────────

{
  const queries = [
    iq(0, "financial data screen"),
    iq(1, "office building downtown"),
    iq(2, "family home neighborhood"),
  ];
  const violations = validateImageQueryStyle(queries);
  assert(violations.length === 0, "happy path: zero violations");
}

// ── Word count 1 ──────────────────────────────────────────────────────

{
  const queries = [iq(0, "running")];
  const violations = validateImageQueryStyle(queries);
  assert(violations.length >= 1, "word-count-1: at least one violation");
  assert(
    violations.some((v) => v.reason === "word-count"),
    "word-count-1: reason is word-count",
  );
}

// ── Word count 2 (boundary) — clean ───────────────────────────────────

{
  const queries = [iq(0, "finance chart")];
  const violations = validateImageQueryStyle(queries);
  assert(
    !violations.some((v) => v.reason === "word-count"),
    "word-count-boundary-2: clean",
  );
}

// ── Word count 4 (boundary) — clean ───────────────────────────────────

{
  const queries = [iq(0, "modern glass office tower")];
  const violations = validateImageQueryStyle(queries);
  assert(
    !violations.some((v) => v.reason === "word-count"),
    "word-count-boundary-4: clean",
  );
}

// ── Word count 5 ──────────────────────────────────────────────────────

{
  const queries = [iq(0, "modern glass office tower downtown")];
  const violations = validateImageQueryStyle(queries);
  assert(
    violations.some((v) => v.reason === "word-count"),
    "word-count-5: reason is word-count",
  );
}

// ── Motion verb "running" ─────────────────────────────────────────────

{
  const queries = [iq(0, "office running woman")];
  const violations = validateImageQueryStyle(queries);
  assert(
    violations.some((v) => v.reason === "motion-verb"),
    "motion-verb: running fires",
  );
}

// ── Motion verb "streaming" ───────────────────────────────────────────

{
  const queries = [iq(0, "streaming data charts")];
  const violations = validateImageQueryStyle(queries);
  assert(
    violations.some((v) => v.reason === "motion-verb"),
    "motion-verb: streaming fires",
  );
}

// ── Query equals fallback ─────────────────────────────────────────────

{
  const queries = [iq(0, "same query", "same query")];
  const violations = validateImageQueryStyle(queries);
  assert(
    violations.some((v) => v.reason === "query-equals-fallback"),
    "query-equals-fallback: fires",
  );
}

// ── applyImageQueryFallbacks: word-count → replaced ───────────────────

{
  const queries = [
    iq(0, "a", "financial chart data"),
    iq(1, "office building view", "default fallback"),
  ];
  const violations = validateImageQueryStyle(queries);
  assert(violations.length === 1, "fallback-wc: one violation");
  const result = applyImageQueryFallbacks(queries, violations, runName);
  assert(result[0].query === "financial chart data", "fallback-wc: slot 0 replaced with fallback");
  assert(result[1].query === "office building view", "fallback-wc: slot 1 unchanged");
}

// ── applyImageQueryFallbacks: motion-verb → fallback applied ──────────

{
  const queries = [
    iq(0, "running man city", "office city skyline"),
  ];
  const violations = validateImageQueryStyle(queries);
  const motionV = violations.filter((v) => v.reason === "motion-verb");
  assert(motionV.length >= 1, "fallback-mv: motion-verb violation exists");
  const result = applyImageQueryFallbacks(queries, violations, runName);
  assert(result[0].query === "office city skyline", "fallback-mv: replaced with fallback");
}

// ── applyImageQueryFallbacks: equals-fallback → no mutation ───────────

{
  const queries = [
    iq(0, "same thing", "same thing"),
  ];
  const violations = validateImageQueryStyle(queries);
  const result = applyImageQueryFallbacks(queries, violations, runName);
  assert(result[0].query === "same thing", "fallback-equals: no mutation");
  assert(result[0].fallback === "same thing", "fallback-equals: fallback unchanged");
}

// ── Mixed slots: two violations, two replacements ────────────────────

{
  const queries = [
    iq(0, "single", "fallback zero"),
    iq(1, "dancing finance woman", "office building chart"),
    iq(2, "clean query here", "default fallback"),
  ];
  const violations = validateImageQueryStyle(queries);
  assert(violations.length >= 2, "mixed: at least two violations");
  const result = applyImageQueryFallbacks(queries, violations, runName);
  assert(result[0].query === "fallback zero", "mixed: slot 0 replaced (word-count)");
  assert(result[1].query === "office building chart", "mixed: slot 1 replaced (motion-verb)");
  assert(result[2].query === "clean query here", "mixed: slot 2 unchanged");
}

// ── Regex constant tests ──────────────────────────────────────────────

assert(MOTION_VERB_RE.test("woman running in city"), "MOTION_VERB: matches 'running'");
assert(MOTION_VERB_RE.test("flowing water stream"), "MOTION_VERB: matches 'flowing'");
assert(!MOTION_VERB_RE.test("office building chart"), "MOTION_VERB: does not match static scene");

console.log("\nAll image-query-style-gate tests passed.");
