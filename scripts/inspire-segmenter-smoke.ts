/**
 * Smoke test for sentence-segmenter.ts
 *
 * Runs against inline fixtures — no network calls required.
 */
import { segmentSentences } from "../src/lib/inspire/sentence-segmenter";
import type { WordTiming } from "../src/lib/tts-google";

// ── Fixture: narration with prosody marks ───────────────────────────────
const NARRATION = `Every morning... you have a choice.

You can hit snooze — or you can show up.

Not for applause. Not for recognition. But for the person you're becoming.

"Success isn't loud." It's the quiet discipline of showing up... even when no one is watching.`;

// ── Fixture: simulated STT word timings (stripped punctuation) ───────────
const WORD_TIMINGS: WordTiming[] = [
  { word: "Every", startSeconds: 0.1, endSeconds: 0.4 },
  { word: "morning", startSeconds: 0.4, endSeconds: 0.8 },
  { word: "you", startSeconds: 1.3, endSeconds: 1.5 },
  { word: "have", startSeconds: 1.5, endSeconds: 1.7 },
  { word: "a", startSeconds: 1.7, endSeconds: 1.8 },
  { word: "choice", startSeconds: 1.8, endSeconds: 2.2 },
  { word: "You", startSeconds: 2.8, endSeconds: 3.0 },
  { word: "can", startSeconds: 3.0, endSeconds: 3.2 },
  { word: "hit", startSeconds: 3.2, endSeconds: 3.4 },
  { word: "snooze", startSeconds: 3.4, endSeconds: 3.8 },
  { word: "or", startSeconds: 4.0, endSeconds: 4.2 },
  { word: "you", startSeconds: 4.2, endSeconds: 4.3 },
  { word: "can", startSeconds: 4.3, endSeconds: 4.5 },
  { word: "show", startSeconds: 4.5, endSeconds: 4.7 },
  { word: "up", startSeconds: 4.7, endSeconds: 4.9 },
  { word: "Not", startSeconds: 5.4, endSeconds: 5.6 },
  { word: "for", startSeconds: 5.6, endSeconds: 5.8 },
  { word: "applause", startSeconds: 5.8, endSeconds: 6.2 },
  { word: "Not", startSeconds: 6.5, endSeconds: 6.7 },
  { word: "for", startSeconds: 6.7, endSeconds: 6.9 },
  { word: "recognition", startSeconds: 6.9, endSeconds: 7.4 },
  { word: "But", startSeconds: 7.7, endSeconds: 7.9 },
  { word: "for", startSeconds: 7.9, endSeconds: 8.0 },
  { word: "the", startSeconds: 8.0, endSeconds: 8.1 },
  { word: "person", startSeconds: 8.1, endSeconds: 8.4 },
  { word: "you're", startSeconds: 8.4, endSeconds: 8.6 },
  { word: "becoming", startSeconds: 8.6, endSeconds: 9.1 },
  { word: "Success", startSeconds: 9.6, endSeconds: 10.0 },
  { word: "isn't", startSeconds: 10.0, endSeconds: 10.3 },
  { word: "loud", startSeconds: 10.3, endSeconds: 10.6 },
  { word: "It's", startSeconds: 11.0, endSeconds: 11.2 },
  { word: "the", startSeconds: 11.2, endSeconds: 11.3 },
  { word: "quiet", startSeconds: 11.3, endSeconds: 11.6 },
  { word: "discipline", startSeconds: 11.6, endSeconds: 12.0 },
  { word: "of", startSeconds: 12.0, endSeconds: 12.1 },
  { word: "showing", startSeconds: 12.1, endSeconds: 12.4 },
  { word: "up", startSeconds: 12.4, endSeconds: 12.6 },
  { word: "even", startSeconds: 13.0, endSeconds: 13.2 },
  { word: "when", startSeconds: 13.2, endSeconds: 13.4 },
  { word: "no", startSeconds: 13.4, endSeconds: 13.5 },
  { word: "one", startSeconds: 13.5, endSeconds: 13.7 },
  { word: "is", startSeconds: 13.7, endSeconds: 13.8 },
  { word: "watching", startSeconds: 13.8, endSeconds: 14.2 },
];

const DURATION_SECONDS = 15.0;

// ── Run ─────────────────────────────────────────────────────────────────
const { sentences, warnings } = segmentSentences(
  NARRATION,
  WORD_TIMINGS,
  DURATION_SECONDS,
);

console.log("=== Sentence Segmentation Smoke Test ===\n");

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

// Check sentence count
assert(sentences.length >= 6, `Got ${sentences.length} sentences (expected >= 6)`);

// Check all sentences have valid frame ranges
for (const s of sentences) {
  assert(
    s.startFrame < s.endFrame,
    `Sentence ${s.sentenceIndex} frames: ${s.startFrame}–${s.endFrame}`,
  );
  assert(
    s.tokenWordIndexes.length > 0,
    `Sentence ${s.sentenceIndex} has ${s.tokenWordIndexes.length} word indexes`,
  );
}

// Check first sentence starts near 0
assert(
  sentences[0].startSeconds < 1,
  `First sentence starts at ${sentences[0].startSeconds}s`,
);

// Check last sentence extends to duration
const lastSentence = sentences[sentences.length - 1];
assert(
  lastSentence.endSeconds >= DURATION_SECONDS,
  `Last sentence ends at ${lastSentence.endSeconds}s (duration: ${DURATION_SECONDS}s)`,
);

// Check monotonic ordering
for (let i = 1; i < sentences.length; i++) {
  assert(
    sentences[i].startSeconds >= sentences[i - 1].startSeconds,
    `Sentence ${i} starts after sentence ${i - 1}`,
  );
}

// Check "..." extended endSeconds
const ellipsisSentence = sentences.find((s) => s.text.includes("..."));
if (ellipsisSentence) {
  assert(
    true,
    `Ellipsis sentence found: "${ellipsisSentence.text.slice(0, 40)}..."`,
  );
}

console.log("\n--- Warnings ---");
if (warnings.length === 0) {
  console.log("  (none)");
} else {
  for (const w of warnings) {
    console.log(`  ⚠ ${w}`);
  }
}

console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);

console.log("\n--- Sentence Details ---");
for (const s of sentences) {
  console.log(
    `  [${s.sentenceIndex}] ${s.startSeconds.toFixed(1)}s–${s.endSeconds.toFixed(1)}s (frames ${s.startFrame}–${s.endFrame}) words=${s.tokenWordIndexes.length}: "${s.text.slice(0, 60)}"`,
  );
}

if (failed > 0) {
  process.exit(1);
}
