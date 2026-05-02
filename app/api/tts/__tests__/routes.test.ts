import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  script: {
    findByProjectIdOrThrow: vi.fn(),
    update: vi.fn(),
  },
}));

const ttsMocks = vi.hoisted(() => ({
  audioFileExists: vi.fn(),
  generateAudioForSegment: vi.fn(),
}));

const prismaJsonMocks = vi.hoisted(() => ({
  fromJsonArray: vi.fn(),
  toJsonArray: vi.fn(),
}));

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: prismaMock,
}));

vi.mock("@/src/lib/storyflow/tts", () => ({
  audioFileExists: ttsMocks.audioFileExists,
  generateAudioForSegment: ttsMocks.generateAudioForSegment,
}));

vi.mock("@/src/lib/storyflow/prisma-json", () => ({
  fromJsonArray: prismaJsonMocks.fromJsonArray,
  toJsonArray: prismaJsonMocks.toJsonArray,
}));

import { POST as postGenerate } from "../generate/route";
import { audioFileExists, generateAudioForSegment } from "@/src/lib/storyflow/tts";
import { toJsonArray } from "@/src/lib/storyflow/prisma-json";

describe("POST /api/tts/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.mocked(prismaJsonMocks.toJsonArray).mockImplementation((value) => value as never);
  });

  it("returns existing audio when already generated and not forced", async () => {
    vi.mocked(prismaJsonMocks.fromJsonArray).mockReturnValue([
      { index: 0, text: "Hello world", audioUrl: "/audio/existing.mp3" },
    ] as never);
    vi.mocked(prismaMock.script.findByProjectIdOrThrow).mockResolvedValue({ segments: [] } as never);
    vi.mocked(audioFileExists).mockResolvedValue(true);

    const req = new NextRequest("http://localhost:3000/api/tts/generate", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", segmentIndex: 0 }),
    });

    const res = await postGenerate(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.segment.audioUrl).toBe("/audio/existing.mp3");
    expect(generateAudioForSegment).not.toHaveBeenCalled();
    expect(prismaMock.script.update).not.toHaveBeenCalled();
    expect(audioFileExists).toHaveBeenCalledWith("proj-1", 0);
  });

  it("generates audio for the requested segment and updates the script", async () => {
    vi.mocked(prismaJsonMocks.fromJsonArray).mockReturnValue([
      { index: 0, text: "Generate this", audioUrl: null },
    ] as never);
    vi.mocked(prismaMock.script.findByProjectIdOrThrow).mockResolvedValue({ segments: [] } as never);
    vi.mocked(audioFileExists).mockResolvedValue(false);
    vi.mocked(generateAudioForSegment).mockResolvedValue({
      audioUrl: "/audio/generated.mp3",
      durationMs: 1500,
      timestamps: [{ word: "Generate", startMs: 0, endMs: 500 }],
    } as never);

    const req = new NextRequest("http://localhost:3000/api/tts/generate", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", segmentIndex: 0 }),
    });

    const res = await postGenerate(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.segment.audioUrl).toBe("/audio/generated.mp3");
    expect(body.segment.actualDuration).toBe(2);
    expect(generateAudioForSegment).toHaveBeenCalledWith("proj-1", expect.objectContaining({ index: 0 }));
    expect(prismaMock.script.update).toHaveBeenCalledWith({
      where: { projectId: "proj-1" },
      data: expect.objectContaining({ segments: expect.anything(), updatedAt: expect.any(Date) }),
    });
    expect(toJsonArray).toHaveBeenCalled();
  });

  it("returns 404 when the segment is missing", async () => {
    vi.mocked(prismaJsonMocks.fromJsonArray).mockReturnValue([] as never);
    vi.mocked(prismaMock.script.findByProjectIdOrThrow).mockResolvedValue({ segments: [] } as never);

    const req = new NextRequest("http://localhost:3000/api/tts/generate", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", segmentIndex: 99 }),
    });

    const res = await postGenerate(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
    expect(audioFileExists).not.toHaveBeenCalled();
    expect(generateAudioForSegment).not.toHaveBeenCalled();
  });

  it("returns 400 when body fails validation", async () => {
    const req = new NextRequest("http://localhost:3000/api/tts/generate", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await postGenerate(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });
});
