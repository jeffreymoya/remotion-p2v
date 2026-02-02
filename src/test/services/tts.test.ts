import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { stat } from "node:fs/promises";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Ensure env validation is skipped for settings/env imports
vi.hoisted(() => {
  process.env.SKIP_ENV_VALIDATION = "true";
});

const aiWrapMock = vi.hoisted(() =>
  vi.fn(async (_ctx, _prompt, executor) => {
    const { result, rawResponse, tokens } = await executor();
    return { data: result, logId: "log-1", durationMs: 10, tokens, rawResponse };
  })
);

const getSettingsMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    ai: {
      provider: "gemini-cli",
      model: "gemini-2.5-flash",
      fallbackModel: "gemini-2.5-flash-lite",
      proModel: "gemini-2.5-pro",
      proFallbackModel: "gemini-2.5-pro-lite",
      temperature: 0.7,
    },
    tts: { voice: "en-US-Chirp3-HD-Algieba", speakingRate: 1, pitch: 0 },
    render: { defaultQuality: "draft", defaultAspectRatio: "16:9" },
  })
);

const getProjectPathsMock = vi.hoisted(() =>
  vi.fn(() => ({ assetsAudio: mkdtempSync(path.join(tmpdir(), "tts-audio-")) }))
);

vi.mock("@/src/lib/services/ai", () => ({
  aiLogger: { wrap: aiWrapMock },
}));

vi.mock("@/src/lib/storyflow/settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("@/src/lib/paths", () => ({
  getProjectPaths: getProjectPathsMock,
}));

import { generateAudioForSegment } from "@/src/lib/storyflow/tts";

describe("generateAudioForSegment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes audio file using provider result and returns timestamps/duration", async () => {
    const buffer = Buffer.from([1, 2, 3]);
    aiWrapMock.mockResolvedValueOnce({
      data: { buffer, timestamps: [{ word: "hello", startMs: 0, endMs: 700 }] },
      logId: "log-1",
      durationMs: 10,
      tokens: { prompt: 1, response: 1 },
      rawResponse: "{}",
    });

    const result = await generateAudioForSegment("proj-1", {
      id: "seg-1",
      index: 0,
      text: "hello world",
      type: "segment",
      blueprintId: null,
    } as any);

    const audioDir = getProjectPathsMock.mock.results.at(-1)!.value.assetsAudio;
    const filePath = path.join(audioDir, "segment-0.mp3");
    const stats = await stat(filePath);

    expect(aiWrapMock).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: "proj-1", operation: "tts-generate", provider: "google-tts" }),
      "hello world",
      expect.any(Function)
    );
    expect(stats.isFile()).toBe(true);
    expect(readFileSync(filePath)).toEqual(buffer);
    expect(result.audioUrl).toBe("/projects/proj-1/assets/audio/segment-0.mp3");
    expect(result.durationMs).toBe(700);
    expect(result.timestamps).toEqual([{ word: "hello", startMs: 0, endMs: 700 }]);
  });

  it("falls back to mock synthesis when provider fails and still writes audio", async () => {
    aiWrapMock.mockRejectedValueOnce(new Error("google down"));

    const result = await generateAudioForSegment("proj-2", {
      id: "seg-2",
      index: 1,
      text: "foo bar",
      type: "segment",
      blueprintId: null,
    } as any);

    const audioDir = getProjectPathsMock.mock.results.at(-1)!.value.assetsAudio;
    const filePath = path.join(audioDir, "segment-1.mp3");
    const stats = await stat(filePath);

    expect(stats.isFile()).toBe(true);
    expect(readFileSync(filePath).length).toBeGreaterThan(0);
    // speakingRate 1.0 => 160 wpm => ~375ms per word, so 2 words ≈ 750ms
    expect(result.durationMs).toBeGreaterThanOrEqual(700);
    expect(result.timestamps.length).toBe(2);
  });
});
