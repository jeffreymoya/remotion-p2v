/**
 * Unit tests for YouTube clip extraction pipeline.
 *
 * Usage:
 *   npx tsx tests/docu/youtube-pipeline.test.ts
 */

import {
  parseJson3,
  flattenEvents,
  findPhraseInEvents,
  extractCaptionWords,
  mergeYouTubeClipsIntoShots,
} from "../../src/lib/docu/youtube-pipeline";
import type { ScheduledShot } from "../../src/lib/docu/shot-scheduler";

let failures = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  } else {
    console.log(`PASS ${label}`);
  }
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    failures++;
    console.error(`FAIL ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  } else {
    console.log(`PASS ${label}`);
  }
}

// ── json3 fixtures ──────────────────────────────────────────────────────

const SAMPLE_JSON3 = `{
  "events": [
    {
      "tStartMs": 18800,
      "dDurationMs": 7160,
      "segs": [
        { "utf8": "We're" },
        { "utf8": " no", "tOffsetMs": 239 },
        { "utf8": " strangers", "tOffsetMs": 559 },
        { "utf8": " to", "tOffsetMs": 1040 },
        { "utf8": " love", "tOffsetMs": 1560 }
      ]
    },
    {
      "tStartMs": 25960,
      "dDurationMs": 5040,
      "segs": [
        { "utf8": "You" },
        { "utf8": " know", "tOffsetMs": 180 },
        { "utf8": " the", "tOffsetMs": 360 },
        { "utf8": " rules", "tOffsetMs": 540 },
        { "utf8": " and", "tOffsetMs": 900 },
        { "utf8": " so", "tOffsetMs": 1080 },
        { "utf8": " do", "tOffsetMs": 1260 },
        { "utf8": " I", "tOffsetMs": 1440 }
      ]
    },
    {
      "tStartMs": 50000,
      "dDurationMs": 3000,
      "segs": [
        { "utf8": "\\n" }
      ]
    }
  ]
}`;

// ── parseJson3 ──────────────────────────────────────────────────────────

function testParseJson3(): void {
  console.log("\n--- parseJson3 ---");

  const events = parseJson3(SAMPLE_JSON3);
  assert(events.length === 3, "parses all events");
  assertEqual(events[0].tStartMs, 18800, "first event tStartMs");
  assert(events[0].segs !== undefined && events[0].segs.length === 5, "first event has 5 segs");
  assertEqual(events[0].segs![0].utf8, "We're", "first seg text");
  assertEqual(events[0].segs![1].tOffsetMs, 239, "tOffsetMs on second seg");

  // Empty
  assertEqual(parseJson3("").length, 0, "empty string returns []");
  assertEqual(parseJson3("{}").length, 0, "no events array returns []");
  assertEqual(parseJson3("[]").length, 0, "non-object returns []");
}

// ── flattenEvents ───────────────────────────────────────────────────────

function testFlattenEvents(): void {
  console.log("\n--- flattenEvents ---");

  const events = parseJson3(SAMPLE_JSON3);
  const flat = flattenEvents(events);

  // 5 words from event 0 + 8 words from event 1 = 13 (event 2 is \\n, filtered)
  assertEqual(flat.length, 13, "13 words (20 filtered window-control events)");

  // First word: no tOffsetMs → absMs = tStartMs
  assertEqual(flat[0].text, "We're", "first word text");
  assertEqual(flat[0].absMs, 18800, "first word absMs = event tStartMs");

  // Second word: tOffsetMs = 239 → absMs = 18800 + 239 = 19039
  assertEqual(flat[1].text, "no", "word 'no' has leading space stripped");
  assertEqual(flat[1].absMs, 19039, "second word absMs");

  // Last word from event 1
  assertEqual(flat[12].text, "I", "last word text");
  assertEqual(flat[12].eventIdx, 1, "last word eventIdx");
  assertEqual(flat[12].segIdx, 7, "last word segIdx");

  // Edge cases
  assertEqual(flattenEvents([]).length, 0, "empty events returns []");
}

// ── findPhraseInEvents ──────────────────────────────────────────────────

function testFindPhraseInEvents(): void {
  console.log("\n--- findPhraseInEvents ---");

  const events = parseJson3(SAMPLE_JSON3);
  const flat = flattenEvents(events);

  // Exact match on first target
  const m1 = findPhraseInEvents(flat, ["love", "nope"]);
  assert(m1 !== null, "exact match found");
  assertEqual(m1!.matchMethod, "exact", "match method is exact");
  assertEqual(m1!.matchedTarget, "love", "matched target string");

  // Case-insensitive
  const m2 = findPhraseInEvents(flat, ["YOU KNOW THE RULES"]);
  assert(m2 !== null, "case-insensitive match found");
  assertEqual(m2!.matchMethod, "exact", "case-insensitive is exact");

  // Match on second target
  const m3 = findPhraseInEvents(flat, ["zzzz", "love"]);
  assert(m3 !== null, "fallback to second target");
  assertEqual(m3!.matchedTarget, "love", "matched second target");

  // No match
  const m4 = findPhraseInEvents(flat, ["zzzz", "nope"]);
  assert(m4 === null, "no match returns null");

  // Fuzzy match — use "no stragners to love" (typo of "no strangers to love")
  // The concatenated text is: "We're no strangers to love You know the rules and so do I"
  // "no strangers to love" → should fuzzy match with distance 1
  const m5 = findPhraseInEvents(flat, ["no stranggers to love"]);
  assert(m5 !== null, "fuzzy match with typo");
  assertEqual(m5!.matchMethod, "fuzzy", "match method is fuzzy");

  // Fuzzy no match (too many errors)
  const m6 = findPhraseInEvents(flat, ["complete gibberish nonsense"]);
  assert(m6 === null, "fuzzy no match when distance > 2");

  // Edge cases
  assert(findPhraseInEvents([], ["test"]) === null, "empty flatWords returns null");
  assert(findPhraseInEvents(flat, []) === null, "empty targets returns null");
}

// ── extractCaptionWords ─────────────────────────────────────────────────

function testExtractCaptionWords(): void {
  console.log("\n--- extractCaptionWords ---");

  const events = parseJson3(SAMPLE_JSON3);

  // Window: 18800ms to 32500ms (covers both events)
  const words = extractCaptionWords(events, 18800, 32500);
  assertEqual(words.length, 13, "all 13 words in window");

  // First word offset relative to clipStart
  assertEqual(words[0].startMs, 0, "first word offset from clipStart");
  assertEqual(words[0].isMatch, false, "no matchSpan → all false");

  // With match span
  const words2 = extractCaptionWords(events, 18800, 32500, { startMs: 25960, matchEndMs: 26700 });
  const matchedWords = words2.filter((w) => w.isMatch);
  assert(matchedWords.length >= 2, "time-range flagging marks words within span");
  assertEqual(words2[0].isMatch, false, "words before span are not matched");

  // Word at clip boundary trimmed
  const words3 = extractCaptionWords(events, 19000, 26000);
  assert(words3.length > 0, "partial window works");

  // Empty
  assertEqual(extractCaptionWords([], 0, 1000).length, 0, "empty events returns []");
}

// ── mergeYouTubeClipsIntoShots ──────────────────────────────────────────

function makeShots(specs: Array<[number, number, "cool-tech" | "warm-real"]>): ScheduledShot[] {
  return specs.map(([start, end, palette]) => ({
    startFrame: start,
    endFrame: end,
    palette,
  }));
}

function makeSentRanges(specs: Array<[number, number]>): Array<{ startFrame: number; endFrame: number }> {
  return specs.map(([start, end]) => ({ startFrame: start, endFrame: end }));
}

function testMergeYouTubeClipsIntoShots(): void {
  console.log("\n--- mergeYouTubeClipsIntoShots ---");

  const fps = 30;
  const DEFAULT_FRAME_DURATION = 5000;

  // No successful clips — passthrough
  {
    const shots = makeShots([[0, 60, "cool-tech"], [60, 120, "warm-real"]]);
    const results: Parameters<typeof mergeYouTubeClipsIntoShots>[1] = [
      { sentenceIndex: 0, success: false },
    ];
    const { shots: merged, citationBlocks } = mergeYouTubeClipsIntoShots(
      shots, results, makeSentRanges([[0, 60], [60, 120]]), DEFAULT_FRAME_DURATION,
    );
    assertEqual(merged.length, 2, "no successful clips — passthrough");
    assert(merged.every((m) => m.mediaType === "image"), "all are image shots");
    assertEqual(citationBlocks.length, 0, "no citation blocks emitted");
  }

  // Single clip mid-video — block starts at sentence endFrame
  {
    const shots = makeShots([[0, 30, "cool-tech"], [30, 60, "cool-tech"], [60, 90, "warm-real"]]);
    const results: Parameters<typeof mergeYouTubeClipsIntoShots>[1] = [{
      sentenceIndex: 1,
      success: true,
      matchedTimestampSec: 7,
      clipStartSec: 2,
      clipEndSec: 10,
      videoPath: "videos/docu/test/youtube-abc-2-10.mp4",
    }];
    const sentRanges = makeSentRanges([[0, 30], [30, 60], [60, 90]]);
    // sent 1 endFrame = 60, blockStart = 60
    // clipDurationFrames = (10-2)*30 = 240, blockEnd = 60 + 240 = 300
    const { shots: merged, citationBlocks } = mergeYouTubeClipsIntoShots(
      shots, results, sentRanges, DEFAULT_FRAME_DURATION,
    );
    assertEqual(citationBlocks.length, 1, "one citation block emitted");
    assertEqual(citationBlocks[0].startFrame, 60, "block starts at sent endFrame");
    assertEqual(citationBlocks[0].endFrame, 300, "block end = start + clipDuration");
    assertEqual(citationBlocks[0].sentenceIndex, 1, "sentenceIndex matches");

    const videoShots = merged.filter((m) => m.mediaType === "video");
    assertEqual(videoShots.length, 1, "one video shot inserted (talking-head)");
    assertEqual(videoShots[0].startFrame, 60, "talking-head starts at blockStart");
    assert(videoShots[0].endFrame <= 60 + 10 * fps, "talking-head is max 10s");

    const imageShots = merged.filter((m) => m.mediaType === "image");
    assert(imageShots.length >= 1, "B-roll images survive outside talking-head window");
  }

  // Overlapping clips — earliest sentenceIndex wins
  {
    const shots = makeShots([[0, 90, "cool-tech"], [90, 180, "warm-real"]]);
    const results: Parameters<typeof mergeYouTubeClipsIntoShots>[1] = [
      {
        sentenceIndex: 0,
        success: true,
        matchedTimestampSec: 5,
        clipStartSec: 2,
        clipEndSec: 10,
        videoPath: "videos/docu/test/youtube-abc-2-10.mp4",
      },
      {
        sentenceIndex: 1,
        success: true,
        matchedTimestampSec: 10,
        clipStartSec: 5,
        clipEndSec: 13,
        videoPath: "videos/docu/test/youtube-def-5-13.mp4",
      },
    ];
    const sentRanges = makeSentRanges([[0, 90], [90, 180]]);
    // sent 0 endFrame = 90, block0 start = 90, block0 end = 90 + 240 = 330
    // sent 1 endFrame = 180, block1 start = 180, block1 end = 180 + 240 = 420
    // block1.start (180) < block0.end (330) → overlap, block1 dropped
    const { shots: merged, citationBlocks } = mergeYouTubeClipsIntoShots(
      shots, results, sentRanges, DEFAULT_FRAME_DURATION,
    );
    assertEqual(citationBlocks.length, 1, "overlapping — only first block survives");
    const videoShots = merged.filter((m) => m.mediaType === "video");
    assertEqual(videoShots.length, 1, "one video shot (talking-head)");
  }

  // Stub below 12-frame threshold is dropped
  {
    const shots = makeShots([[0, 15, "cool-tech"], [15, 30, "cool-tech"]]);
    const results: Parameters<typeof mergeYouTubeClipsIntoShots>[1] = [{
      sentenceIndex: 0,
      success: true,
      matchedTimestampSec: 3,
      clipStartSec: 0.5,
      clipEndSec: 5,
      videoPath: "videos/docu/test/youtube-abc-0-5.mp4",
    }];
    const sentRanges = makeSentRanges([[0, 15], [15, 30]]);
    const { shots: merged } = mergeYouTubeClipsIntoShots(shots, results, sentRanges, DEFAULT_FRAME_DURATION);
    const veryShort = merged.filter((m) => m.mediaType === "image" && (m.endFrame - m.startFrame) < 12);
    assertEqual(veryShort.length, 0, "stubs below 12 frames are dropped");
  }

  // Overflow guard — blocks exceeding 45% of total duration are dropped
  {
    const shots = makeShots([[0, 60, "cool-tech"], [60, 120, "cool-tech"], [120, 180, "cool-tech"]]);
    const results: Parameters<typeof mergeYouTubeClipsIntoShots>[1] = [
      {
        sentenceIndex: 0,
        success: true,
        matchedTimestampSec: 10,
        clipStartSec: 0,
        clipEndSec: 20,
        videoPath: "videos/docu/test/youtube-aaa-0-20.mp4",
      },
      {
        sentenceIndex: 1,
        success: true,
        matchedTimestampSec: 10,
        clipStartSec: 0,
        clipEndSec: 20,
        videoPath: "videos/docu/test/youtube-bbb-0-20.mp4",
      },
    ];
    const sentRanges = makeSentRanges([[0, 60], [60, 120], [120, 180]]);
    // sent0 end = 60, clipDuration = 600 frames (20s)
    // sent1 end = 120
    // 600 frames ÷ 200 totalDurationFrames = 3.0 > 0.45 — first block alone exceeds limit! Both dropped.
    const { citationBlocks } = mergeYouTubeClipsIntoShots(
      shots, results, sentRanges, 200,
    );
    assertEqual(citationBlocks.length, 0, "overflow guard drops blocks exceeding 45% threshold");
  }

  // CitationBlock carries captionWords from result
  {
    const shots = makeShots([[0, 90, "cool-tech"], [90, 180, "warm-real"]]);
    const captionWords = [{ word: "test", startMs: 0, endMs: 100, isMatch: true, wordIndexInEvent: 0 }];
    const results: Parameters<typeof mergeYouTubeClipsIntoShots>[1] = [{
      sentenceIndex: 0,
      success: true,
      matchedTimestampSec: 5,
      clipStartSec: 2,
      clipEndSec: 10,
      videoPath: "videos/docu/test/youtube-abc-2-10.mp4",
      captionWords,
    }];
    const sentRanges = makeSentRanges([[0, 90], [90, 180]]);
    const { citationBlocks } = mergeYouTubeClipsIntoShots(shots, results, sentRanges, DEFAULT_FRAME_DURATION);
    assertEqual(citationBlocks.length, 1, "caption test — one block");
    assert(citationBlocks[0].captionWords !== undefined, "captionWords passed through");
    assertEqual(citationBlocks[0].captionWords!.length, 1, "correct caption word count");
  }
}

// ── Runner ──────────────────────────────────────────────────────────────

testParseJson3();
testFlattenEvents();
testFindPhraseInEvents();
testExtractCaptionWords();
testMergeYouTubeClipsIntoShots();

console.log(`\n${failures === 0 ? "All tests passed!" : `${failures} test(s) failed`}`);
process.exit(failures > 0 ? 1 : 0);
