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

const aiGenerateMock = vi.hoisted(() => vi.fn());
const emphasisPromptMock = vi.hoisted(() => vi.fn(() => "mock-emphasis-prompt"));

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

vi.mock("@/src/lib/services/ai", () => ({
  aiGenerate: aiGenerateMock,
}));

vi.mock("@/config/prompts/emphasis.prompt", () => ({
  emphasisTaggingPrompt: emphasisPromptMock,
}));

import { NotFoundError } from "@/app/api/lib";
import { GET as GET_GENERATE_ALL, POST as POST_GENERATE_ALL } from "../generate-all/route";
import { POST as POST_GENERATE } from "../generate/route";
import { POST as POST_ANALYZE } from "../analyze-emphasis/route";
import { audioFileExists, generateAudioForSegment } from "@/src/lib/storyflow/tts";
import { fromJsonArray, toJsonArray } from "@/src/lib/storyflow/prisma-json";
import { aiGenerate } from "@/src/lib/services/ai";
import { emphasisTaggingPrompt } from "@/config/prompts/emphasis.prompt";

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

    const res = await POST_GENERATE(req);
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

    const res = await POST_GENERATE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.segment.audioUrl).toBe("/audio/generated.mp3");
    expect(body.segment.actualDuration).toBe(2); // Math.round(1500 / 1000)
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

    const res = await POST_GENERATE(req);
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

    const res = await POST_GENERATE(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/tts/generate-all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.mocked(prismaJsonMocks.toJsonArray).mockImplementation((value) => value as never);
  });

  it("generates missing audio segments and updates the script", async () => {
    vi.mocked(prismaJsonMocks.fromJsonArray).mockReturnValue([
      { index: 0, text: "has audio", audioUrl: "/audio/existing.mp3" },
      { index: 1, text: "needs audio", audioUrl: null },
    ] as never);
    vi.mocked(prismaMock.script.findByProjectIdOrThrow).mockResolvedValue({ segments: [] } as never);
    vi.mocked(generateAudioForSegment).mockResolvedValue({
      audioUrl: "/audio/generated.mp3",
      durationMs: 2000,
      timestamps: [],
    } as never);
    vi.mocked(prismaMock.script.update).mockResolvedValue({ id: "script-1" } as never);

    const req = new NextRequest("http://localhost:3000/api/tts/generate-all", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1" }),
    });

    const res = await POST_GENERATE_ALL(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(body.generated).toBe(1);
    expect(body.total).toBe(2);
    expect(generateAudioForSegment).toHaveBeenCalledTimes(1);
    expect(prismaMock.script.update).toHaveBeenCalled();
  });

  it("returns SSE stream when stream=true is requested", async () => {
    vi.mocked(prismaJsonMocks.fromJsonArray).mockReturnValue([
      { index: 0, text: "stream me", audioUrl: null },
    ] as never);
    vi.mocked(prismaMock.script.findByProjectIdOrThrow).mockResolvedValue({ segments: [] } as never);
    vi.mocked(generateAudioForSegment).mockResolvedValue({
      audioUrl: "/audio/generated.mp3",
      durationMs: 1200,
      timestamps: [],
    } as never);
    vi.mocked(prismaMock.script.update).mockResolvedValue({ id: "script-1" } as never);

    const res = await GET_GENERATE_ALL(
      new Request("http://localhost:3000/api/tts/generate-all?projectId=proj-1&stream=true")
    );

    expect(res.headers.get("content-type")).toBe("text/event-stream");
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let chunk = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunk += decoder.decode(value);
    }

    expect(chunk).toContain("data:");
    expect(chunk).toContain("\"type\":\"complete\"");
    expect(prismaMock.script.update).toHaveBeenCalled();
  });

  it("returns 400 when query validation fails", async () => {
    const res = await GET_GENERATE_ALL(new Request("http://localhost:3000/api/tts/generate-all"));
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("VALIDATION_ERROR");
  });

  it("returns 404 when script is not found", async () => {
    vi.mocked(prismaMock.script.findByProjectIdOrThrow).mockRejectedValue(
      new NotFoundError("Script", "missing")
    );

    const req = new NextRequest("http://localhost:3000/api/tts/generate-all", {
      method: "POST",
      body: JSON.stringify({ projectId: "missing" }),
    });

    const res = await POST_GENERATE_ALL(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
  });
});

describe("POST /api/tts/analyze-emphasis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns constrained emphasis markers from AI output", async () => {
    vi.mocked(aiGenerate).mockResolvedValue({
      data: {
        emphasisTags: [
          { wordIndex: 0, level: "high" },
          { wordIndex: 2, level: "high" },
          { wordIndex: 4, level: "med" },
        ],
      },
    } as never);
    const text = "one two three four five six seven eight nine ten";

    const req = new NextRequest("http://localhost:3000/api/tts/analyze-emphasis", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", segmentIndex: 1, text }),
    });

    const res = await POST_ANALYZE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(aiGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "proj-1",
        operation: "tts-emphasis",
        prompt: "mock-emphasis-prompt",
        metadata: { segmentIndex: 1 },
      })
    );
    expect(emphasisTaggingPrompt).toHaveBeenCalledWith(text);
    expect(body.emphasisMarkers).toHaveLength(2); // capped to 20% of words (ceil(10*0.2)=2)
    expect(body.highCount).toBe(1); // only one high emphasis after constraint
    expect(body.medCount).toBe(1);
    expect(body.totalWords).toBe(10);
  });

  it("returns 400 when body validation fails", async () => {
    const req = new NextRequest("http://localhost:3000/api/tts/analyze-emphasis", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST_ANALYZE(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });
});
