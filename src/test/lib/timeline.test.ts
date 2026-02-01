import { describe, expect, it } from "vitest";

import { DEFAULT_ASPECT_RATIO, FPS, msToFrames } from "@/src/lib/constants";
import { normalizeTimeline, msToFrame } from "@/src/lib/utils";
import { TimelineSchema, type Timeline } from "@/src/lib/types";
import {
  buildAudioElement,
  buildBackgroundElement,
  buildTextElement,
  buildTimeline,
} from "@/src/test/factories";

describe("normalizeTimeline", () => {
  it("adds default aspect ratio", () => {
    const normalized = normalizeTimeline({
      shortTitle: "Test",
      elements: [],
      text: [],
      audio: [],
    });

    expect((normalized as Timeline).aspectRatio).toBe(DEFAULT_ASPECT_RATIO);
  });

  it("preserves existing aspect ratio", () => {
    const normalized = normalizeTimeline({
      shortTitle: "Test",
      aspectRatio: "9:16",
      elements: [],
      text: [],
      audio: [],
    });

    expect((normalized as Timeline).aspectRatio).toBe("9:16");
  });

  it("calculates duration from elements when missing", () => {
    const normalized = normalizeTimeline({
      shortTitle: "Test",
      elements: [
        {
          type: "background",
          startMs: 0,
          endMs: 5000,
          imageUrl: "test",
        },
      ],
      text: [],
      audio: [],
    });

    expect((normalized as Timeline).durationSeconds).toBe(5);
  });

  it("initializes optional arrays", () => {
    const normalized = normalizeTimeline({
      shortTitle: "Test",
      elements: [],
      text: [],
      audio: [],
    });

    const typed = normalized as Timeline;
    expect(typed.videoClips).toEqual([]);
    expect(typed.backgroundMusic).toEqual([]);
  });

  it("handles missing elements gracefully", () => {
    const normalized = normalizeTimeline({ shortTitle: "Test", text: [], audio: [] });

    expect(normalized).toBeDefined();
    expect((normalized as Timeline).elements).toEqual([]);
  });
});

describe("TimelineSchema", () => {
  it("validates a populated timeline", () => {
    const timeline = buildTimeline();
    expect(TimelineSchema.safeParse(timeline).success).toBe(true);
  });

  it("validates with background music", () => {
    const timeline: Timeline = {
      shortTitle: "Music",
      aspectRatio: "16:9",
      durationSeconds: 60,
      elements: [],
      text: [],
      audio: [],
      videoClips: [],
      backgroundMusic: [
        {
          type: "backgroundMusic",
          startMs: 0,
          endMs: 60_000,
          musicUrl: "/music.mp3",
          volume: 0.2,
        },
      ],
    };

    expect(TimelineSchema.safeParse(timeline).success).toBe(true);
  });

  it("validates with video clips", () => {
    const timeline: Timeline = {
      shortTitle: "Video",
      aspectRatio: "16:9",
      durationSeconds: 30,
      elements: [],
      text: [],
      audio: [],
      videoClips: [
        {
          type: "video",
          startMs: 0,
          endMs: 10_000,
          videoUrl: "/clip.mp4",
          volume: 0.5,
        },
      ],
      backgroundMusic: [],
    };

    expect(TimelineSchema.safeParse(timeline).success).toBe(true);
  });

  it("uses explicit duration when provided", () => {
    const timeline = buildTimeline({
      elements: [
        buildBackgroundElement({ startMs: 0, endMs: 15_000 }),
      ],
      durationSeconds: 20,
    });

    const parsed = TimelineSchema.parse(timeline);
    expect(parsed.durationSeconds).toBe(20);
  });
});

describe("Timing helpers", () => {
  it("msToFrame floors partial frames", () => {
    expect(msToFrame(1033, 30)).toBe(30);
  });

  it("msToFrames uses default FPS", () => {
    expect(msToFrames(1000)).toBe(FPS);
  });

  it("msToFrames handles large durations", () => {
    expect(msToFrames(3_600_000, 30)).toBe(108_000);
  });
});
