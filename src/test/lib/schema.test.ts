import { describe, expect, it } from "vitest";

import {
  AspectRatioSchema,
  AudioElementSchema,
  BackgroundElementSchema,
  BackgroundMusicElementSchema,
  TextElementSchema,
  TimelineSchema,
  VideoClipElementSchema,
} from "@/src/lib/types";
import { DEFAULT_ASPECT_RATIO } from "@/src/lib/constants";
import {
  buildAudioElement,
  buildBackgroundElement,
  buildTextElement,
  buildTimeline,
} from "@/src/test/factories";

describe("AspectRatioSchema", () => {
  it("accepts supported ratios", () => {
    expect(AspectRatioSchema.parse("16:9")).toBe("16:9");
    expect(AspectRatioSchema.parse("9:16")).toBe("9:16");
  });

  it("rejects unsupported ratios", () => {
    expect(() => AspectRatioSchema.parse("4:3" as any)).toThrow();
  });
});

describe("TimelineSchema", () => {
  it("validates a complete timeline", () => {
    const timeline = buildTimeline();
    const result = TimelineSchema.safeParse(timeline);

    expect(result.success).toBe(true);
  });

  it("rejects invalid aspect ratios", () => {
    const result = TimelineSchema.safeParse(
      buildTimeline({ aspectRatio: "4:3" as any })
    );

    expect(result.success).toBe(false);
  });

  it("fills defaults for optional collections", () => {
    const minimal = buildTimeline({
      elements: [],
      text: [],
      audio: [],
      durationSeconds: 1,
    });
    const parsed = TimelineSchema.parse(minimal);

    expect(parsed.videoClips).toEqual([]);
    expect(parsed.backgroundMusic).toEqual([]);
    expect(parsed.aspectRatio).toBe(DEFAULT_ASPECT_RATIO);
  });
});

describe("BackgroundElementSchema", () => {
  it("validates image-based backgrounds", () => {
    const element = buildBackgroundElement({ videoUrl: undefined });
    const result = BackgroundElementSchema.safeParse(element);

    expect(result.success).toBe(true);
  });

  it("validates video-based backgrounds", () => {
    const element = buildBackgroundElement({
      imageUrl: undefined,
      videoUrl: "/video.mp4",
    });

    expect(BackgroundElementSchema.safeParse(element).success).toBe(true);
  });

  it("rejects backgrounds without media", () => {
    const element = buildBackgroundElement({
      imageUrl: undefined,
      videoUrl: undefined,
    });

    const result = BackgroundElementSchema.safeParse(element as any);
    expect(result.success).toBe(false);
  });
});

describe("TextElementSchema", () => {
  it("validates text with words array", () => {
    const element = buildTextElement({
      words: [
        {
          text: "Hi",
          startMs: 0,
          endMs: 500,
          startFrame: 0,
          endFrame: 15,
        },
      ],
    });

    expect(TextElementSchema.safeParse(element).success).toBe(true);
  });
});

describe("AudioElementSchema", () => {
  it("validates audio elements", () => {
    const element = buildAudioElement();
    expect(AudioElementSchema.safeParse(element).success).toBe(true);
  });
});

describe("VideoClipElementSchema", () => {
  it("validates video clips", () => {
    const clip = {
      type: "video" as const,
      startMs: 0,
      endMs: 1_000,
      videoUrl: "/video.mp4",
      volume: 0.5,
    };

    expect(VideoClipElementSchema.safeParse(clip).success).toBe(true);
  });
});

describe("BackgroundMusicElementSchema", () => {
  it("validates music elements", () => {
    const music = {
      type: "backgroundMusic" as const,
      startMs: 0,
      endMs: 60_000,
      musicUrl: "/music.mp3",
      volume: 0.2,
    };

    expect(BackgroundMusicElementSchema.safeParse(music).success).toBe(true);
  });
});
