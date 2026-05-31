/**
 * Sentence segmenter (D2) — drift resistance + sanity post-pass.
 *
 * Usage:
 *   npx tsx tests/docu/sentence-segmenter.test.ts
 */
import { segmentSentences } from "../../src/lib/shared/sentence-segmenter";
import type { WordTiming } from "../../src/lib/tts-google";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

/** Build word timings from [word, start, end] tuples. */
function wt(rows: Array<[string, number, number]>): WordTiming[] {
  return rows.map(([word, startSeconds, endSeconds]) => ({ word, startSeconds, endSeconds }));
}

// ── Digit-vs-spoken number + injected STT filler: no cursor drift ──────

{
  // Narration writes "$2.5T"; STT spells it out and injects a filler "uh".
  const narration = "The deal cost $2.5T total.";
  const words = wt([
    ["The", 0.0, 0.4],
    ["deal", 0.5, 0.9],
    ["uh", 1.0, 1.1], // injected filler
    ["cost", 1.2, 1.6],
    ["two", 1.7, 1.9],
    ["point", 2.0, 2.1],
    ["five", 2.2, 2.4],
    ["trillion", 2.5, 2.9],
    ["dollars", 3.0, 3.4],
    ["total", 3.5, 3.9],
  ]);
  const { sentences } = segmentSentences(narration, words, 3.9);
  assert(sentences.length === 1, "digit+filler: one sentence");
  // The number expanded and the filler was absorbed → "total" (index 9) is the
  // last aligned word, so endSeconds = 3.9 → endFrame 117. Drift would land short.
  assert(sentences[0].startFrame === 0, "digit+filler: starts at frame 0", String(sentences[0].startFrame));
  assert(sentences[0].endFrame === 117, "digit+filler: covers through 'total' (frame 117)", String(sentences[0].endFrame));
  assert(
    sentences[0].tokenWordIndexes.includes(9),
    "digit+filler: 'total' (index 9) is aligned (no drift)",
  );
}

// ── Multi-sentence: spoken number in the middle does not desync later ──

{
  const narration = "Markets opened high. Inflation hit 9.1 percent. Investors stayed calm.";
  const words = wt([
    ["Markets", 0.0, 0.4],
    ["opened", 0.5, 0.9],
    ["high", 1.0, 1.4],
    ["Inflation", 1.5, 1.9],
    ["hit", 2.0, 2.4],
    ["nine", 2.5, 2.9],
    ["point", 3.0, 3.4],
    ["one", 3.5, 3.9],
    ["percent", 4.0, 4.4],
    ["Investors", 4.5, 4.9],
    ["stayed", 5.0, 5.4],
    ["calm", 5.5, 5.9],
  ]);
  const { sentences } = segmentSentences(narration, words, 6.0);
  assert(sentences.length === 3, "multi: three sentences");
  // Final sentence must start at "Investors" (index 9 → 4.5s → frame 135),
  // proving the spoken "9.1 percent" expansion did not drift the cursor.
  assert(sentences[2].startFrame === 135, "multi: final sentence starts at frame 135 (no drift)", String(sentences[2].startFrame));
}

// ── Sanity post-pass repairs an implausibly short sentence ─────────────

{
  const narration = "First sentence here. Mid. Last sentence ending.";
  const words = wt([
    ["First", 0.0, 0.4],
    ["sentence", 0.5, 0.9],
    ["here", 1.0, 1.4],
    ["Mid", 1.5, 1.52], // 0.02s — implausibly short single-token sentence
    ["Last", 2.0, 2.4],
    ["sentence", 2.5, 2.9],
    ["ending", 3.0, 3.4],
  ]);
  const { sentences, warnings } = segmentSentences(narration, words, 3.5);
  assert(sentences.length === 3, "post-pass: three sentences");
  const mid = sentences[1];
  assert(mid.endFrame > mid.startFrame, "post-pass: repaired sentence is not inverted");
  assert(
    (mid.endSeconds - mid.startSeconds) >= 0.3 - 1e-9,
    "post-pass: repaired duration ≥ 0.3s",
    String(mid.endSeconds - mid.startSeconds),
  );
  assert(
    warnings.some((w) => w.includes("Sentence 1") && w.includes("repaired")),
    "post-pass: emits a repair warning (does not silently fix)",
  );
}

console.log(`\n${passed} passed`);
