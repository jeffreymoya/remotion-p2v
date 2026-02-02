import { describe, it, expect, beforeEach, vi } from "vitest";

import { NotFoundError } from "@/app/api/lib";
import { buildSegment, buildScript } from "@/src/test/factories/script";
import { buildImageAsset } from "@/src/test/factories/asset";
import { buildProject } from "@/src/test/factories/project";
import { buildViewport, buildViewportKeyframe } from "@/src/test/factories/viewport";
import { buildTimeline as buildTimelineModule } from "@/src/lib/storyflow/timeline-builder";
import { DEFAULT_MUSIC_DUCKING, msToFrames } from "@/src/lib/constants";

const findByIdOrThrowMock = vi.hoisted(() => vi.fn());

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    project: {
      findByIdOrThrow: findByIdOrThrowMock,
    },
  },
}));

describe("timeline-builder", () => {
  const projectId = "project-timeline";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assembles timeline with assets, viewport animation, audio, and music", async () => {
    const segments = [
      buildSegment({
        index: 0,
        text: "Hello world",
        actualDuration: 2,
        audioUrl: `/projects/${projectId}/assets/audio/seg-1.mp3`,
        timestamps: [
          { word: "Hello", startMs: 0, endMs: 500 },
          { word: "world", startMs: 500, endMs: 1000 },
        ],
      }),
      buildSegment({
        index: 1,
        text: "Second segment", // 2 words => ensures word timing offsets
        actualDuration: 3,
        audioUrl: `/projects/${projectId}/assets/audio/seg-2.mp3`,
        timestamps: [
          { word: "Second", startMs: 0, endMs: 700 },
          { word: "segment", startMs: 700, endMs: 1400 },
        ],
      }),
    ];

    const script = buildScript({ projectId, title: "Timeline Title", segments });

    findByIdOrThrowMock.mockResolvedValue(
      buildProject({
        id: projectId,
        aspectRatio: "9:16",
        status: "SCRIPT_READY",
        script,
        assets: [
          buildImageAsset({
            projectId,
            path: `/projects/${projectId}/assets/images/key.jpg`,
            upscaledPath: `/projects/${projectId}/assets/images/key-upscaled.jpg`,
            metadata: { width: 1280, height: 720, format: "jpg" },
          }),
          {
            ...buildImageAsset({ projectId, type: "MUSIC", path: `/projects/${projectId}/assets/music/track.mp3` }),
            type: "MUSIC",
          },
        ],
        viewport: buildViewport({
          projectId,
          keyframes: [
            buildViewportKeyframe({ frameStart: 0, frameEnd: 90, viewport: { centerX: 0.5, centerY: 0.45, zoom: 1.1 } }),
          ],
        }),
        settings: {
          id: "settings-1",
          projectId,
          musicVolume: 0.5,
        },
      }) as unknown
    );

    const timeline = await buildTimelineModule(projectId);

    expect(timeline.title).toBe("Timeline Title");
    expect(timeline.aspectRatio).toBe("9:16");

    expect(timeline.text).toHaveLength(2);
    expect(timeline.text[0].startFrame).toBe(0);
    expect(timeline.text[0].endFrame).toBe(msToFrames(2000));
    expect(timeline.text[1].startFrame).toBe(msToFrames(2000));
    expect(timeline.text[1].endFrame).toBe(msToFrames(5000));
    expect(timeline.text[0].words[1]).toMatchObject({ text: "world", startMs: 500, endMs: 1000 });
    expect(timeline.text[1].words[0].startMs).toBeGreaterThan(timeline.text[0].words.at(-1)!.endMs);

    expect(timeline.audio).toHaveLength(2);
    expect(timeline.audio[0]).toMatchObject({
      audioUrl: `/projects/${projectId}/assets/audio/seg-1.mp3`,
      startFrame: 0,
      endFrame: msToFrames(2000),
    });
    expect(timeline.audio[1].startFrame).toBe(msToFrames(2000));

    expect(timeline.backgrounds).toHaveLength(1);
    expect(timeline.backgrounds[0].imageUrl).toBe(`/projects/${projectId}/assets/images/key-upscaled.jpg`);
    expect(timeline.backgrounds[0].startFrame).toBe(0);
    expect(timeline.backgrounds[0].endFrame).toBe(msToFrames(5000));
    expect(timeline.backgrounds[0].viewportAnimation?.imageWidth).toBe(1280);
    expect(timeline.backgrounds[0].viewportAnimation?.keyframes[0].viewport.zoom).toBeCloseTo(1.1);

    expect(timeline.music).toEqual({
      url: `/projects/${projectId}/assets/music/track.mp3`,
      volume: 0.5,
      ducking: DEFAULT_MUSIC_DUCKING,
    });
    expect(timeline.durationSeconds).toBe(6); // ceil(5s) + 1 buffer
  });

  it("throws when script is missing", async () => {
    findByIdOrThrowMock.mockResolvedValue({
      id: projectId,
      aspectRatio: "16:9",
      script: null,
      assets: [],
      viewport: null,
      settings: null,
    });

    await expect(buildTimelineModule(projectId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("omits music and uses placeholder background when no visual assets exist", async () => {
    const segments = [
      buildSegment({ index: 0, text: "Only text", estimatedDuration: 1, audioUrl: undefined }),
      buildSegment({ index: 1, text: "More narration", estimatedDuration: 1, audioUrl: undefined }),
    ];

    findByIdOrThrowMock.mockResolvedValue({
      id: projectId,
      name: "No assets",
      topic: null,
      status: "SCRIPT_READY",
      aspectRatio: "16:9",
      createdAt: new Date(),
      updatedAt: new Date(),
      script: buildScript({ projectId, segments }),
      assets: [],
      viewport: null,
      settings: { id: "settings-2", projectId },
    });

    const timeline = await buildTimelineModule(projectId);

    expect(timeline.music).toBeUndefined();
    expect(timeline.backgrounds).toHaveLength(1);
    expect(timeline.backgrounds[0].imageUrl).toBeUndefined();
    expect(timeline.backgrounds[0].videoUrl).toBeUndefined();
    expect(timeline.audio).toHaveLength(0);
    expect(timeline.durationSeconds).toBeGreaterThanOrEqual(3); // 2s total rounded + buffer
  });
});
