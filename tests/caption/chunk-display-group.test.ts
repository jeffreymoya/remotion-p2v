/**
 * Unit tests for chunkDisplayGroup.
 *
 * Usage: tsx tests/caption/chunk-display-group.test.ts
 */
import { chunkDisplayGroup, MAX_CHUNK_WORDS } from "../../src/components/captions/chunk-display-group";
import type { DisplayGroup } from "../../src/components/captions/chunk-display-group";
import type { WordTiming } from "../../src/lib/tts-google";

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

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function deepEq(actual: unknown, expected: unknown, label: string): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${b}`);
    console.error(`    actual:   ${a}`);
    failed++;
  }
}

function refEq(actual: unknown, expected: unknown, label: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    not reference-equal`);
    failed++;
  }
}

function makeWordTimings(count: number, wordDurationSeconds = 0.1): WordTiming[] {
  return Array.from({ length: count }, (_, i) => ({
    word: `w${i}`,
    startSeconds: i * wordDurationSeconds,
    endSeconds: (i + 1) * wordDurationSeconds,
  }));
}

function makeGroup(overrides: Partial<DisplayGroup> & { text: string; tokenWordIndexes: number[] }): DisplayGroup {
  const n = overrides.tokenWordIndexes.length;
  return {
    sentenceIndexes: [0],
    primarySentenceIndex: 0,
    startSeconds: 0,
    endSeconds: n * 0.1,
    startFrame: 0,
    endFrame: Math.floor(n * 0.1 * 30),
    isQuote: false,
    ...overrides,
  };
}

function main(): void {
  console.log("\n━━ Caption Chunk Display Group Tests ━━\n");

  // ── TC-1: Passthrough — 8 tokens ──────────────────────────────────────
  console.log("TC-1: Passthrough — 8 tokens");
  {
    const group = makeGroup({
      text: "one two three four five six seven eight",
      tokenWordIndexes: [0, 1, 2, 3, 4, 5, 6, 7],
    });
    const wts = makeWordTimings(10);
    const result = chunkDisplayGroup(group, wts, 30);
    assert(result.length === 1, "returns single-element array");
    refEq(result[0], group, "returns same reference as input");
  }

  // ── TC-2: Basic 20-word split ──────────────────────────────────────────
  console.log("\nTC-2: Basic 20-word split");
  {
    const words = Array.from({ length: 20 }, (_, i) => `w${i}`);
    const group = makeGroup({
      text: words.join(" "),
      tokenWordIndexes: Array.from({ length: 20 }, (_, i) => i),
    });
    const wts = makeWordTimings(30);
    const result = chunkDisplayGroup(group, wts, 30);
    eq(result.length, 2, "returns 2 chunks");
    eq(result[0].tokenWordIndexes.length, 10, "first chunk has 10 tokens");
    eq(result[1].tokenWordIndexes.length, 10, "second chunk has 10 tokens");
  }

  // ── TC-3: Chained boundary continuity ──────────────────────────────────
  console.log("\nTC-3: Chained boundary continuity");
  {
    const words = Array.from({ length: 20 }, (_, i) => `w${i}`);
    const group = makeGroup({
      text: words.join(" "),
      tokenWordIndexes: Array.from({ length: 20 }, (_, i) => i),
      endSeconds: 2.5,
      endFrame: 75,
    });
    const wts = makeWordTimings(30);
    const result = chunkDisplayGroup(group, wts, 30);
    eq(result[0].endSeconds, result[1].startSeconds, "chunk[0].endSeconds === chunk[1].startSeconds");
    eq(result[1].endSeconds, 2.5, "last chunk endSeconds = group.endSeconds");
    eq(result[1].endFrame, 75, "last chunk endFrame = group.endFrame");
  }

  // ── TC-4: Last-chunk tail preserved ────────────────────────────────────
  console.log("\nTC-4: Last-chunk tail preserved");
  {
    const words = Array.from({ length: 20 }, (_, i) => `w${i}`);
    const group = makeGroup({
      text: words.join(" "),
      tokenWordIndexes: Array.from({ length: 20 }, (_, i) => i),
      endSeconds: 3.0,
      endFrame: 90,
    });
    const wts = makeWordTimings(30);
    const result = chunkDisplayGroup(group, wts, 30);
    eq(result[result.length - 1].endSeconds, 3.0, "last chunk endSeconds preserved");
    eq(result[result.length - 1].endFrame, 90, "last chunk endFrame preserved");
    // Verify it differs from last word timing
    const rawLastEnd = wts[result[result.length - 1].tokenWordIndexes.at(-1)!].endSeconds;
    assert(rawLastEnd !== 3.0, "raw last-word endSeconds differs from group endSeconds");
  }

  // ── TC-5: Punctuation-aware split ──────────────────────────────────────
  console.log("\nTC-5: Punctuation-aware split");
  {
    const words = "one two three four five six seven eight, nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split(" ");
    assert(words.length === 20, "setup: 20 words");
    const group = makeGroup({
      text: words.join(" "),
      tokenWordIndexes: Array.from({ length: 20 }, (_, i) => i),
    });
    const wts = makeWordTimings(30);
    const result = chunkDisplayGroup(group, wts, 30);
    // Comma on word 8 (index 7) snaps first boundary from 10 → 8, so 3 chunks: [0:8], [8:18], [18:20]
    eq(result.length, 3, "returns 3 chunks (snap at comma creates uneven split)");
    eq(result[0].tokenWordIndexes.length, 8, "first chunk has 8 tokens (ends on comma word)");
    eq(result[1].tokenWordIndexes.length, 10, "second chunk has 10 tokens");
    eq(result[2].tokenWordIndexes.length, 2, "third chunk has 2 tokens (remainder)");
    assert(result[0].text === "one two three four five six seven eight,", "first chunk text ends at comma word");
  }

  // ── TC-6: Proportional mapping mismatch ────────────────────────────────
  console.log("\nTC-6: Proportional mapping mismatch (15 text words / 20 tokens)");
  {
    const group = makeGroup({
      text: "a b c d e f g h i j k l m n o",
      tokenWordIndexes: Array.from({ length: 20 }, (_, i) => i),
    });
    const wts = makeWordTimings(30);
    const result = chunkDisplayGroup(group, wts, 30);
    eq(result.length, 2, "returns 2 chunks");
    // ratio = 20/15 ≈ 1.333; textEnd=10 → tokenEnd = round(13.33) = 13
    eq(result[0].tokenWordIndexes.length, 13, "first chunk maps proportionally (13 tokens)");
    eq(result[1].tokenWordIndexes.length, 7, "second chunk gets remainder (7 tokens)");
  }

  // ── TC-7: Non-contiguous indexes preserved ─────────────────────────────
  console.log("\nTC-7: Non-contiguous indexes preserved");
  {
    const indexes = [0, 3, 5, 8, 10, 13, 15, 18, 20, 22, 25, 28, 30, 33, 35, 38, 40, 42, 45, 48];
    const words = Array.from({ length: 20 }, (_, i) => `w${i}`);
    const group = makeGroup({
      text: words.join(" "),
      tokenWordIndexes: indexes,
    });
    const wts = makeWordTimings(50);
    const result = chunkDisplayGroup(group, wts, 30);
    eq(result.length, 2, "returns 2 chunks");
    deepEq(result[0].tokenWordIndexes, [0, 3, 5, 8, 10, 13, 15, 18, 20, 22], "first chunk preserves non-contiguous order");
    deepEq(result[1].tokenWordIndexes, [25, 28, 30, 33, 35, 38, 40, 42, 45, 48], "second chunk preserves non-contiguous order");
  }

  // ── TC-8: isQuote propagation ──────────────────────────────────────────
  console.log("\nTC-8: isQuote propagation");
  {
    const words = Array.from({ length: 20 }, (_, i) => `w${i}`);
    const group = makeGroup({
      text: words.join(" "),
      tokenWordIndexes: Array.from({ length: 20 }, (_, i) => i),
      isQuote: true,
    });
    const wts = makeWordTimings(30);
    const result = chunkDisplayGroup(group, wts, 30);
    assert(result.every((c) => c.isQuote), "all chunks inherit isQuote: true");
  }

  // ── TC-9: sentenceIndexes / primarySentenceIndex propagation ───────────
  console.log("\nTC-9: sentenceIndexes / primarySentenceIndex propagation");
  {
    const words = Array.from({ length: 20 }, (_, i) => `w${i}`);
    const group = makeGroup({
      text: words.join(" "),
      tokenWordIndexes: Array.from({ length: 20 }, (_, i) => i),
      sentenceIndexes: [1, 2, 3],
      primarySentenceIndex: 2,
    });
    const wts = makeWordTimings(30);
    const result = chunkDisplayGroup(group, wts, 30);
    assert(result.every((c) => c.sentenceIndexes.length === 3), "all chunks have 3 sentenceIndexes");
    deepEq(result[0].sentenceIndexes, [1, 2, 3], "first chunk has correct sentenceIndexes");
    eq(result[0].primarySentenceIndex, 2, "first chunk has primarySentenceIndex = 2");
  }

  // ── TC-10: Alignment gap — chunk dropped ───────────────────────────────
  console.log("\nTC-10: Alignment gap — chunk dropped");
  {
    const group = makeGroup({
      text: Array.from({ length: 40 }, (_, i) => `w${i}`).join(" "),
      // First 20 valid, last 20 point beyond wordTimings
      tokenWordIndexes: [
        ...Array.from({ length: 20 }, (_, i) => i),
        ...Array.from({ length: 20 }, (_, i) => 100 + i),
      ],
    });
    const wts = makeWordTimings(20);
    const result = chunkDisplayGroup(group, wts, 30);
    // 40 tokens → nominal 4 chunks of 10; chunks 3-4 (indexes >=20) should be dropped
    assert(result.length > 0, "some chunks survive");
    eq(result.length, 2, "only 2 valid chunks remain (invalid chunks dropped)");
    // Verify all tokens in returned chunks are within wordTimings
    assert(
      result.every((c) => c.tokenWordIndexes.every((ti) => ti < wts.length)),
      "all returned chunks have valid token indexes",
    );
  }

  // ── TC-11: Safety fallback ─────────────────────────────────────────────
  console.log("\nTC-11: Safety fallback");
  {
    const group = makeGroup({
      text: Array.from({ length: 20 }, (_, i) => `w${i}`).join(" "),
      tokenWordIndexes: Array.from({ length: 20 }, (_, i) => 100 + i),
    });
    const wts = makeWordTimings(10);
    const result = chunkDisplayGroup(group, wts, 30);
    eq(result.length, 1, "returns single element on fallback");
    refEq(result[0], group, "returns same reference as input (safety fallback)");
  }

  // ── TC-12: Frame uses Math.floor ───────────────────────────────────────
  console.log("\nTC-12: Frame uses Math.floor");
  {
    const group = makeGroup({
      text: Array.from({ length: 20 }, (_, i) => `w${i}`).join(" "),
      tokenWordIndexes: Array.from({ length: 20 }, (_, i) => i),
    });
    // Use custom word timings with non-integer startSeconds
    const wts: WordTiming[] = [
      { word: "w0", startSeconds: 0.0333, endSeconds: 0.1333 },
      ...makeWordTimings(29, 0.1),
    ];
    const fps = 30;
    const result = chunkDisplayGroup(group, wts, fps);
    eq(result[0].startFrame, 0, "startFrame = Math.floor(0.0333 * 30) = 0, not 1");
  }

  // ── TC-13: Exactly 10 tokens — passthrough ─────────────────────────────
  console.log("\nTC-13: Exactly 10 tokens");
  {
    const group = makeGroup({
      text: "one two three four five six seven eight nine ten",
      tokenWordIndexes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    });
    const wts = makeWordTimings(15);
    const result = chunkDisplayGroup(group, wts, 30);
    eq(result.length, 1, "returns single-element array (passthrough)");
    refEq(result[0], group, "returns same reference");
  }

  // ── TC-14: 11 tokens (minimum split) ───────────────────────────────────
  console.log("\nTC-14: 11 tokens (minimum split)");
  {
    const group = makeGroup({
      text: Array.from({ length: 11 }, (_, i) => `w${i}`).join(" "),
      tokenWordIndexes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    });
    const wts = makeWordTimings(15);
    const result = chunkDisplayGroup(group, wts, 30);
    eq(result.length, 2, "returns 2 chunks");
    eq(result[0].tokenWordIndexes.length, 10, "first chunk: 10 tokens");
    eq(result[1].tokenWordIndexes.length, 1, "second chunk: 1 token");
    assert(result[1].text.length > 0, "1-token chunk has non-empty text");
  }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`\n━━ Results: ${passed} passed, ${failed} failed ━━\n`);
  if (failed > 0) process.exit(1);
}

main();
