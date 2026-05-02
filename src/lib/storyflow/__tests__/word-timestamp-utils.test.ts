import { describe, it, expect } from "vitest";

import { snapToSentenceBoundary } from "../word-timestamp-utils";
import type { WordTimestamp } from "../types";

const ms = (startMs: number, endMs: number, word: string): WordTimestamp => ({
  word,
  startMs,
  endMs,
});

describe("snapToSentenceBoundary", () => {
  it("snaps to a strong sentence-end within tolerance", () => {
    const ts: WordTimestamp[] = [
      ms(0, 200, "The"),
      ms(200, 400, "fox."),
      ms(400, 600, "Then"),
      ms(600, 800, "ran"),
    ];
    // target 380 → nearest sentence-end is "fox." at 400 (distance 20)
    expect(snapToSentenceBoundary(380, ts, "The fox. Then ran")).toBe(400);
  });

  it("falls back to weak punctuation when no strong boundary is in range", () => {
    const ts: WordTimestamp[] = [
      ms(0, 100, "First,"),
      ms(100, 200, "second"),
      ms(200, 300, "third"),
    ];
    expect(snapToSentenceBoundary(110, ts, "First, second third")).toBe(100);
  });

  it("strong boundary beats weak even when weak is closer (within tolerance)", () => {
    const ts: WordTimestamp[] = [
      ms(0, 100, "A,"),
      ms(100, 250, "B."),
    ];
    // target 110: weak A, at endMs 100 (dist 10); strong B. at endMs 250 (dist 140)
    // strong is preferred and 140 ≤ 300 tolerance
    expect(snapToSentenceBoundary(110, ts, "A, B.")).toBe(250);
  });

  it("returns target unchanged when nothing falls within tolerance", () => {
    const ts: WordTimestamp[] = [
      ms(0, 100, "A."),
      ms(100, 200, "B."),
    ];
    expect(snapToSentenceBoundary(2000, ts, "A. B.")).toBe(2000);
  });

  it("uses tokenized segment text when timestamps strip punctuation", () => {
    const ts: WordTimestamp[] = [
      ms(0, 200, "The"),
      ms(200, 400, "fox"),
      ms(400, 600, "ran"),
    ];
    expect(snapToSentenceBoundary(420, ts, "The fox. Ran")).toBe(400);
  });

  it("returns target with empty timestamps", () => {
    expect(snapToSentenceBoundary(500, [], "anything")).toBe(500);
  });
});
