/**
 * Anchor-phrase strategy (D1) — spoken-form + edit-distance resolution.
 *
 * Usage:
 *   npx tsx tests/docu/anchor-strategies.test.ts
 */
import { phraseAnchorStrategy } from "../../src/lib/docu/overlays/anchor-strategies";
import { resolveOverlays } from "../../src/lib/docu/overlay-resolver";
import type { OverlaySpec } from "../../src/lib/docu/overlays/registry";
import type { OverlaySpecBase } from "../../src/lib/docu/overlays/types";
import type { WordTiming } from "../../src/lib/audio-wav";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

const FPS = 30;

/** Build word timings from words, each 0.5s apart starting at 0. */
function timings(words: string[]): WordTiming[] {
  return words.map((word, i) => ({
    word,
    startSeconds: i * 0.5,
    endSeconds: i * 0.5 + 0.4,
  }));
}

function spec(anchorPhrase: string): OverlaySpecBase {
  return { anchorPhrase, holdSec: 3.5, palette: "cool-tech" };
}

// ── Exact match still works (regression) ───────────────────────────────

{
  const wt = timings(["the", "federal", "reserve", "raised", "rates"]);
  const { startFrame } = phraseAnchorStrategy({ spec: spec("federal reserve"), wordTimings: wt, fps: FPS });
  // "federal" is index 1 → 0.5s → frame 15
  assert(startFrame === 15, "exact: 'federal reserve' resolves to frame 15", String(startFrame));
}

// ── Number-bearing anchor resolves against spoken-form TTS timings ──────

{
  const wt = timings([
    "the", "cloud", "market", "hit", "two", "point", "five", "trillion", "dollars", "last", "year",
  ]);
  // "$2.5T" → spoken "two point five trillion dollars", starting at index 4 → 2.0s → frame 60
  const { startFrame } = phraseAnchorStrategy({ spec: spec("$2.5T"), wordTimings: wt, fps: FPS });
  assert(startFrame === 60, "spoken: '$2.5T' resolves against spoken TTS tokens (frame 60)", String(startFrame));
}

{
  const wt = timings(["inflation", "hit", "nine", "point", "one", "percent"]);
  // "9.1%" → spoken "nine point one percent", starting at index 2 → 1.0s → frame 30
  const { startFrame } = phraseAnchorStrategy({ spec: spec("9.1%"), wordTimings: wt, fps: FPS });
  assert(startFrame === 30, "spoken: '9.1%' resolves against spoken TTS tokens (frame 30)", String(startFrame));
}

{
  const wt = timings(["not", "the", "$1", "614", "your", "friend"]);
  const { startFrame } = phraseAnchorStrategy({ spec: spec("$1,614"), wordTimings: wt, fps: FPS });
  // "$1" is index 2 → 1.0s → frame 30
  assert(startFrame === 30, "raw: '$1,614' resolves against split numeric TTS tokens", String(startFrame));
}

{
  const wt = timings(["saved", "buyers", "just", "a", "month"]);
  const { startFrame } = phraseAnchorStrategy({
    spec: spec("$40"),
    wordTimings: wt,
    fps: FPS,
    sentenceAnchors: [
      {
        text: "Yet in 2025, a rate drop to 6.35% saved buyers just $40 a month.",
        startSeconds: 8,
        endSeconds: 10,
      },
    ],
  });
  assert(startFrame === 240, "fallback: '$40' resolves from sentence text when TTS drops the number", String(startFrame));
}

// ── Edit-distance ≤1 fallback resolves without prefix truncation ────────

{
  // TTS mis-transcribed "federal" → "federel" (distance 1). Full exact match
  // fails; fuzzy match must resolve the full phrase at index 1, NOT truncate.
  const wt = timings(["the", "federel", "reserve", "decision", "today"]);
  const { startFrame } = phraseAnchorStrategy({ spec: spec("federal reserve decision"), wordTimings: wt, fps: FPS });
  // index 1 → 0.5s → frame 15
  assert(startFrame === 15, "fuzzy: edit-distance-1 token resolves full phrase (frame 15)", String(startFrame));
}

// ── Short-token edit distance must NOT over-match ───────────────────────

{
  // "cat" vs "car" is distance 1 but both length 3 — must not fuzzy-match.
  const wt = timings(["the", "car", "drove", "off"]);
  let threw = false;
  try {
    phraseAnchorStrategy({ spec: spec("cat"), wordTimings: wt, fps: FPS });
  } catch {
    threw = true;
  }
  assert(threw, "fuzzy-guard: short token 'cat' does not fuzzy-match 'car'");
}

// ── Genuinely absent phrase still throws ────────────────────────────────

{
  const wt = timings(["completely", "different", "words", "here"]);
  let threw = false;
  try {
    phraseAnchorStrategy({ spec: spec("nonexistent anchor phrase"), wordTimings: wt, fps: FPS });
  } catch {
    threw = true;
  }
  assert(threw, "absent: unmatched phrase throws");
}

// ── resolveOverlays throws on critical overlay drop ───────────────────

{
  const wt = timings(["welcome", "to", "the", "show"]);
  const spec: OverlaySpec = {
    type: "kinetic-number" as const,
    anchorPhrase: "nonexistent metric phrase",
    holdSec: 3.0,
    palette: "cool-tech",
    text: "INFLATION",
    value: 3.2,
    unit: "%",
  };
  let threw = false;
  try {
    resolveOverlays([spec], wt, FPS);
  } catch (e) {
    threw = true;
    assert(
      (e as Error).message.includes("kinetic-number"),
      "resolveOverlays throws on kinetic-number drop",
      (e as Error).message,
    );
  }
  assert(threw, "resolveOverlays did not throw for critical overlay drop");
}

// Non-critical overlay (headline-card) skip does NOT throw
{
  const wt = timings(["welcome", "to", "the", "show"]);
  const spec: OverlaySpec = {
    type: "headline-card" as const,
    anchorPhrase: "nonexistent headline phrase",
    holdSec: 3.0,
    palette: "cool-tech",
    text: "BREAKING NEWS",
    source: "anonymous",
    sourceAnchorId: "anc-headline",
  };
  let threw = false;
  try {
    const result = resolveOverlays([spec], wt, FPS);
    assert(result.length === 0, "non-critical skip: headline-card dropped without throwing");
  } catch (e) {
    threw = true;
  }
  assert(!threw, "resolveOverlays should NOT throw for non-critical (headline-card) skip");
}

console.log(`\n${passed} passed`);
