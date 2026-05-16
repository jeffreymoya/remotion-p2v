/**
 * Anchor verifier tests — uses stubbed SearchProvider to test verification
 * logic without live Exa calls.
 *
 * Usage: tsx tests/inspire/research/anchor-verifier.test.ts
 */
import { hasSubstringOverlap } from "../../../src/lib/inspire/research/anchor-verifier";
import { isTrustedUrl } from "../../../src/lib/inspire/research/trusted-domains";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

// ── hasSubstringOverlap tests ────────────────────────────────────────────

console.log("\n── hasSubstringOverlap ──");

assert(
  hasSubstringOverlap(
    "Between stimulus and response there is a space. In that space is our freedom and our power to choose our response.",
    "Viktor Frankl wrote: Between stimulus and response there is a space. In that space is our freedom and our power to choose our response. In our response lies our growth.",
    10,
  ),
  "10-word overlap on Frankl quote → true",
);

assert(
  !hasSubstringOverlap(
    "This is a completely unique sentence that exists nowhere else",
    "Something totally different about cats and dogs playing in the park",
    10,
  ),
  "No overlap → false",
);

assert(
  hasSubstringOverlap(
    "the quick brown fox jumps over the lazy dog",
    "once upon a time the quick brown fox jumps over the lazy dog and then went home",
    5,
  ),
  "5-word overlap → true",
);

assert(
  !hasSubstringOverlap("short", "short text", 10),
  "Quote shorter than minWords → false",
);

assert(
  hasSubstringOverlap(
    "Words with CAPS and punctuation! Should still match.",
    "words with caps and punctuation should still match regardless of case",
    5,
  ),
  "Case-insensitive + punctuation-stripped overlap → true",
);

// ── isTrustedUrl tests ──────────────────────────────────────────────────

console.log("\n── isTrustedUrl ──");

assert(
  isTrustedUrl("https://www.gutenberg.org/ebooks/1234", "quotes"),
  "gutenberg.org is trusted for quotes",
);

assert(
  isTrustedUrl("https://arxiv.org/abs/2301.12345", "papers"),
  "arxiv.org is trusted for papers",
);

assert(
  !isTrustedUrl("https://random-blog.com/post", "quotes"),
  "random-blog.com is NOT trusted for quotes",
);

assert(
  isTrustedUrl("https://library.harvard.edu/collections", "papers"),
  ".edu domain trusted for papers (suffix match)",
);

assert(
  isTrustedUrl("https://en.wikipedia.org/wiki/Test", "encyclopedia"),
  "wikipedia.org trusted for encyclopedia",
);

assert(
  isTrustedUrl("https://www.nytimes.com/article", "journalism"),
  "nytimes.com trusted for journalism",
);

assert(
  !isTrustedUrl("not-a-url", "quotes"),
  "Invalid URL → false",
);

// ── Summary ──────────────────────────────────────────────────────────────

console.log(`\n── Results: ${passed} passed, ${failed} failed ──`);
if (failed > 0) {
  process.exit(1);
}
