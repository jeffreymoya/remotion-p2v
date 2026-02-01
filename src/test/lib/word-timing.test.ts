import { describe, expect, it } from "vitest";

import { FPS, msToFrames } from "@/src/lib/constants";
import { msToFrame } from "@/src/lib/utils";
import { generateAudioElements, generateTextElements } from "@/src/lib/build-utils";
import { buildSegment } from "@/src/test/factories";

describe("msToFrame / msToFrames", () => {
  it("converts milliseconds to frames", () => {
    expect(msToFrame(1000, 30)).toBe(30);
  });

  it("floors partial frames", () => {
    expect(msToFrame(1033, 30)).toBe(30);
  });

  it("supports different FPS values", () => {
    expect(msToFrame(1000, 24)).toBe(24);
    expect(msToFrame(1000, 60)).toBe(60);
  });

  it("handles zero and small durations", () => {
    expect(msToFrame(0, 30)).toBe(0);
    expect(msToFrame(1, 30)).toBe(0);
  });

  it("handles large durations", () => {
    expect(msToFrame(3_600_000, 30)).toBe(108_000);
  });

  it("uses project FPS constant", () => {
    const expected = Math.floor((2000 * FPS) / 1000);
    expect(msToFrame(2000, FPS)).toBe(expected);
  });
});

describe("word timestamp helpers", () => {
  it("applies intro offset while preserving durations", () => {
    const INTRO_OFFSET_MS = 1000;
    const word = { word: "Test", startMs: 100, endMs: 600 };

    const offset = {
      ...word,
      startMs: word.startMs + INTRO_OFFSET_MS,
      endMs: word.endMs + INTRO_OFFSET_MS,
    };

    expect(offset.startMs).toBe(1100);
    expect(offset.endMs - offset.startMs).toBe(word.endMs - word.startMs);
  });

  it("maps basic word timestamps", () => {
    const timestamps = [
      { word: "Hello", startMs: 0, endMs: 500 },
      { word: "world", startMs: 500, endMs: 1000 },
    ];

    const words = timestamps.map((ts) => ({
      text: ts.word,
      startMs: ts.startMs,
      endMs: ts.endMs,
    }));

    expect(words).toHaveLength(2);
    expect(words[1].text).toBe("world");
  });
});

describe("build-utils helpers", () => {
  it("generates audio elements with offsets", () => {
    const audioManifest = [
      { path: "segment-1.mp3", durationMs: 1000 },
      { path: "segment-2.mp3", durationMs: 500 },
    ];

    const audio = generateAudioElements(audioManifest, "project-1", (ms) => msToFrames(ms, 30));

    expect(audio[0].startFrame).toBeGreaterThanOrEqual(msToFrames(1000, 30));
  });

  it("generates text elements with word timings", async () => {
    const segments = [
      buildSegment({
        index: 0,
        text: "Hello world",
        timestamps: [
          { word: "Hello", startMs: 0, endMs: 500 },
          { word: "world", startMs: 500, endMs: 1000 },
        ],
      }),
    ];

    const audioManifest = [
      {
        path: "segment-1.mp3",
        durationMs: 1000,
        wordTimestamps: segments[0].timestamps,
      },
    ];

    const audioElements = generateAudioElements(audioManifest, "project-1", (ms) => msToFrames(ms, FPS));

    const text = await generateTextElements(
      segments as any,
      audioElements,
      audioManifest as any,
      {},
      (ms) => msToFrames(ms, FPS),
      0
    );

    expect(text[0].words?.[0].startFrame).toBeGreaterThanOrEqual(0);
    expect(text[0].words?.[1].endFrame).toBeGreaterThan(0);
  });
});
