/**
 * Usage:
 *   tsx tests/docu/emphasis-detect.test.ts
 */
import { strict as assert } from "node:assert";
import {
  EMPHASIS_STOPWORDS,
  matchPhrase,
  normalizeEmphasisToken,
  resolveEmphasisIndexes,
  scoreEmphasisTarget,
  selectEmphasis,
  tokenizeEmphasis,
} from "../../src/lib/docu/emphasis-detect";

// ── normalisation ────────────────────────────────────────────────────────
assert.equal(normalizeEmphasisToken("Money."), "money", "strips punctuation + lowercases");
assert.equal(normalizeEmphasisToken("$30,000"), "$30000", "keeps $ and digits, drops comma");
assert.equal(normalizeEmphasisToken("5%"), "5%", "keeps percent");
assert.deepEqual(tokenizeEmphasis("  expires   tonight "), ["expires", "tonight"], "tokenises on whitespace");

// ── matchPhrase: single + multi-word ─────────────────────────────────────
const words = tokenizeEmphasis("Your mortgage rate resets in 90 days, not later.");
assert.deepEqual(matchPhrase(words, "rate"), { start: 2, end: 2 }, "single-word match");
assert.deepEqual(matchPhrase(words, "resets in"), { start: 3, end: 4 }, "multi-word contiguous match");
assert.deepEqual(matchPhrase(words, "90 days"), { start: 5, end: 6 }, "number + word match");
assert.equal(matchPhrase(words, "missing phrase"), null, "no match returns null");
assert.equal(matchPhrase(words, "   "), null, "empty phrase returns null");

// ── resolveEmphasisIndexes: phrase-aware, sorted, de-duplicated ───────────
assert.deepEqual(
  resolveEmphasisIndexes(words, ["resets in", "rate"]),
  [2, 3, 4],
  "multi-word span highlights every word; results sorted",
);
assert.deepEqual(
  resolveEmphasisIndexes(words, ["rate", "rate"]),
  [2],
  "duplicate phrases collapse",
);
// Regression: the old single-token matcher dropped multi-word phrases entirely.
assert.equal(
  resolveEmphasisIndexes(words, ["resets in"]).length > 0,
  true,
  "multi-word emphasis no longer silently dropped",
);

// ── scoreEmphasisTarget ──────────────────────────────────────────────────
assert.equal(scoreEmphasisTarget("the"), 0, "lone stopword rejected");
assert.equal(scoreEmphasisTarget("   "), 0, "empty rejected");
assert.equal(scoreEmphasisTarget("yields") > 0, true, "plain content word accepted");
assert.equal(
  scoreEmphasisTarget("$30,000") > scoreEmphasisTarget("expensive"),
  true,
  "money beats a plain adjective",
);
assert.equal(
  scoreEmphasisTarget("expires tonight") > scoreEmphasisTarget("expires"),
  true,
  "short risk phrase beats the bare verb",
);
assert.equal(
  scoreEmphasisTarget("the Federal Reserve") > scoreEmphasisTarget("the bank"),
  true,
  "named entity beats a generic noun phrase",
);

// ── selectEmphasis: filter, rank, cap, dedup ─────────────────────────────
assert.deepEqual(
  selectEmphasis(["the", "of", "Fed"]),
  ["Fed"],
  "filters lone stopwords, keeps content word",
);
assert.equal(
  selectEmphasis(["very", "really", "just"]).length,
  0,
  "all-filler candidates yield nothing",
);
const capped = selectEmphasis(["$2.4B", "bond yields", "the Fed", "rate", "balance"]);
assert.equal(capped.length, 3, "density capped at 3 per sentence");
assert.equal(capped[0], "$2.4B", "highest-value (money) ranked first");
assert.deepEqual(
  selectEmphasis(["Rates", "Rates"]),
  ["Rates"],
  "de-duplicates by normalised form",
);

// ── back-compat: single-word emphasis still resolves (scene-resolver path) ─
const sceneWords = tokenizeEmphasis("The Fed moves money Rates reshape household budgets");
assert.deepEqual(
  resolveEmphasisIndexes(sceneWords, selectEmphasis(["Fed", "Rates"])),
  [1, 4],
  "single-word emphasis resolves to the same indexes as before",
);

// guard: stopword set is non-trivial
assert.equal(EMPHASIS_STOPWORDS.has("the"), true, "stopword set populated");

console.log("PASS emphasis detect");
