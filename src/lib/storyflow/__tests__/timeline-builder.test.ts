import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    project: {
      findByIdOrThrow: vi.fn(),
    },
  },
}));

import { storyflowPrisma } from "../prisma";
import { buildTimeline } from "../timeline-builder";
import { sec } from "@/src/lib/types/units";
import { FPS, msToFrames } from "../../constants";

function makeProject(overrides: Record<string, unknown>) {
  return {
    id: "proj-1",
    aspectRatio: "16:9",
    script: {
      title: "Test",
      segments: [
        {
          index: 0,
          text: "First sentence. Trailing tail.",
          actualDuration: sec(2),
          timestamps: [
            { word: "First", startMs: 0, endMs: 400 },
            { word: "sentence.", startMs: 400, endMs: 900 },
            { word: "Trailing", startMs: 900, endMs: 1400 },
            { word: "tail.", startMs: 1400, endMs: 2000 },
          ],
        },
        {
          index: 1,
          text: "Second segment all the way through.",
          actualDuration: sec(3),
          timestamps: [
            { word: "Second", startMs: 0, endMs: 500 },
            { word: "segment", startMs: 500, endMs: 1000 },
            { word: "all", startMs: 1000, endMs: 1300 },
            { word: "the", startMs: 1300, endMs: 1500 },
            { word: "way", startMs: 1500, endMs: 1800 },
            { word: "through.", startMs: 1800, endMs: 3000 },
          ],
        },
      ],
    },
    assets: [
      {
        id: "asset-a",
        projectId: "proj-1",
        type: "IMAGE",
        filename: "a.jpg",
        path: "/img/a.jpg",
        metadata: { width: 1920, height: 1080 },
        upscaled: false,
        upscaledPath: null,
        createdAt: new Date(),
      },
      {
        id: "asset-b",
        projectId: "proj-1",
        type: "IMAGE",
        filename: "b.jpg",
        path: "/img/b.jpg",
        metadata: { width: 1920, height: 1080 },
        upscaled: false,
        upscaledPath: null,
        createdAt: new Date(),
      },
    ],
    viewport: null,
    settings: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildTimeline backgrounds", () => {
  it("emits a single background when no mappings are present (legacy)", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue(
      makeProject({ assetMappings: null }) as never
    );

    const timeline = await buildTimeline("proj-1");
    expect(timeline.backgrounds).toHaveLength(1);
    expect(timeline.backgrounds[0].imageUrl).toBe("/img/a.jpg");
    expect(timeline.backgrounds[0].startFrame).toBe(0);
    // Single background spans entire duration
    expect(timeline.backgrounds[0].endFrame).toBe(msToFrames(5000));
  });

  it("emits one background per mapped segment", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue(
      makeProject({
        assetMappings: {
          0: { assetId: "asset-a" },
          1: { assetId: "asset-b" },
        },
      }) as never
    );

    const timeline = await buildTimeline("proj-1");
    expect(timeline.backgrounds).toHaveLength(2);
    expect(timeline.backgrounds[0].imageUrl).toBe("/img/a.jpg");
    expect(timeline.backgrounds[1].imageUrl).toBe("/img/b.jpg");
  });

  it("overlaps adjacent backgrounds with different assets for cross-fade", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue(
      makeProject({
        assetMappings: {
          0: { assetId: "asset-a" },
          1: { assetId: "asset-b" },
        },
      }) as never
    );

    const timeline = await buildTimeline("proj-1");
    const [first, second] = timeline.backgrounds;
    // second.startFrame is shifted earlier than first.endFrame so they overlap
    expect(second.startFrame).toBeLessThan(first.endFrame);
    expect(first.exitTransition).toBe("fade");
    expect(second.enterTransition).toBe("fade");
  });

  it("emits viewportAnimation keyframes when mapping has a viewport", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue(
      makeProject({
        assetMappings: {
          0: {
            assetId: "asset-a",
            viewport: {
              start: { centerX: 0.2, centerY: 0.3, zoom: 1 },
              end: { centerX: 0.7, centerY: 0.5, zoom: 1.6 },
              easing: "easeOut",
            },
          },
          1: { assetId: "asset-b" },
        },
      }) as never
    );

    const timeline = await buildTimeline("proj-1");
    const animation = timeline.backgrounds[0].viewportAnimation;
    expect(animation?.enabled).toBe(true);
    expect(animation?.keyframes).toHaveLength(2);
    expect(animation?.keyframes[0].viewport).toEqual({
      centerX: 0.2,
      centerY: 0.3,
      zoom: 1,
    });
    expect(animation?.keyframes[1].viewport).toEqual({
      centerX: 0.7,
      centerY: 0.5,
      zoom: 1.6,
    });
    expect(animation?.keyframes[1].easing).toBe("easeOut");
    // Second segment has no viewport mapping
    expect(timeline.backgrounds[1].viewportAnimation).toBeUndefined();
  });

  it("snaps non-final segment endings to nearby sentence boundaries", async () => {
    // Segment 0 has actualDuration 2.0s; its last word "tail." ends at 2000ms,
    // and "sentence." ends at 900ms. The natural end at 2000ms is already at a
    // sentence boundary, so no shift. Test the off-boundary case directly:
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue(
      makeProject({
        // Override segment 0 to end at 1100ms but with sentence end at 900ms
        script: {
          title: "Test",
          segments: [
            {
              index: 0,
              text: "Short sentence. word",
              actualDuration: sec(1.1),
              timestamps: [
                { word: "Short", startMs: 0, endMs: 400 },
                { word: "sentence.", startMs: 400, endMs: 900 },
                { word: "word", startMs: 900, endMs: 1100 },
              ],
            },
            {
              index: 1,
              text: "Next.",
              actualDuration: sec(1),
              timestamps: [{ word: "Next.", startMs: 0, endMs: 1000 }],
            },
          ],
        },
        assetMappings: {
          0: { assetId: "asset-a" },
          1: { assetId: "asset-b" },
        },
      }) as never
    );

    const timeline = await buildTimeline("proj-1");
    // Segment 0 natural end = 1100ms; sentence-end at 900ms is within 300ms tolerance
    expect(timeline.backgrounds[0].endFrame).toBe(msToFrames(900));
  });

  it("emits enterTransition=blur for the first background and the last exit", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue(
      makeProject({
        assetMappings: {
          0: { assetId: "asset-a" },
          1: { assetId: "asset-b" },
        },
      }) as never
    );

    const timeline = await buildTimeline("proj-1");
    expect(timeline.backgrounds[0].enterTransition).toBe("blur");
    expect(timeline.backgrounds.at(-1)?.exitTransition).toBe("blur");
  });

  it("uses constant FPS for frame conversion", () => {
    expect(FPS).toBe(30);
  });
});
