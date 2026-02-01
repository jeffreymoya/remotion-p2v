import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

process.env.SKIP_ENV_VALIDATION = "true";

const execFileMock = vi.hoisted(() => vi.fn());
const getSettingsMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    ai: {
      model: "gemini-2.5-flash",
      fallbackModel: "gemini-2.5-flash-lite",
      proModel: "gemini-2.5-pro",
      proFallbackModel: "gemini-2.5-pro-lite",
      provider: "gemini-cli",
      temperature: 0.7,
    },
    tts: { voice: "test", speakingRate: 1, pitch: 0 },
    render: { defaultQuality: "draft", defaultAspectRatio: "16:9" },
  })
);

const parseGeminiOutputMock = vi.hoisted(() => vi.fn());
const dbAiLoggerWrapMock = vi.hoisted(() =>
  vi.fn(async (_context, _prompt, executor) => {
    const { result, rawResponse, tokens } = await executor();
    return { data: result, logId: "log-1", durationMs: 15, tokens, rawResponse };
  })
);
const aiChildLoggerMock = vi.hoisted(() => ({
  warn: vi.fn(),
  info: vi.fn(),
}));

vi.mock("node:child_process", async () => {
  const actual = await import("node:child_process");
  return { ...actual, execFile: execFileMock, default: { ...actual, execFile: execFileMock } };
});

vi.mock("@/src/lib/storyflow/settings", () => ({
  getSettings: getSettingsMock,
}));

vi.mock("@/src/lib/storyflow/gemini-parser", () => ({
  parseGeminiOutput: parseGeminiOutputMock,
}));

vi.mock("@/src/lib/services/ai/ai-logger", () => ({
  aiLogger: { wrap: dbAiLoggerWrapMock },
}));

vi.mock("@/src/lib/logger", () => ({
  aiLogger: aiChildLoggerMock,
}));

import * as geminiWrapper from "@/src/lib/services/ai/gemini-wrapper";

describe("runGemini", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses primary model when call succeeds and parses token usage", async () => {
    execFileMock.mockImplementation((_cmd, _args, _options, callback) => {
      callback?.(null, { stdout: 'response\nusage: 3 prompt, 4 response' });
    });

    const result = await geminiWrapper.runGemini("prompt text");

    expect(execFileMock).toHaveBeenCalledWith(
      "gemini",
      ["--yolo", "--model", "gemini-2.5-flash", "--output-format", "json", "prompt text"],
      expect.objectContaining({ encoding: "utf-8" }),
      expect.any(Function)
    );
    expect(result).toEqual({
      rawResponse: 'response\nusage: 3 prompt, 4 response',
      tokens: { prompt: 3, response: 4 },
      usedModel: "gemini-2.5-flash",
    });
    expect(aiChildLoggerMock.warn).not.toHaveBeenCalled();
  });

  it("falls back to secondary model when primary fails", async () => {
    execFileMock
      .mockImplementationOnce((_cmd, _args, _options, callback) =>
        callback?.(new Error("primary failed"), { stdout: "" })
      )
      .mockImplementationOnce((_cmd, _args, _options, callback) =>
        callback?.(null, { stdout: "fallback response\nusage: 10 prompt, 2 response" })
      );

    const result = await geminiWrapper.runGemini("prompt text");

    expect(aiChildLoggerMock.warn).toHaveBeenCalledWith(
      expect.objectContaining({ primaryModel: "gemini-2.5-flash", fallbackModel: "gemini-2.5-flash-lite" }),
      "Primary model failed, trying fallback"
    );
    expect(aiChildLoggerMock.info).toHaveBeenCalledWith(
      { fallbackModel: "gemini-2.5-flash-lite" },
      "Used fallback model successfully"
    );
    expect(result.usedModel).toBe("gemini-2.5-flash-lite");
    expect(result.tokens).toEqual({ prompt: 10, response: 2 });
  });
});

describe("geminiCall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parseGeminiOutputMock.mockReturnValue({ message: "ok" });
  });

  it("wraps runGemini and parses JSON output", async () => {
    execFileMock.mockImplementation((_cmd, _args, _options, callback) =>
      callback?.(null, { stdout: '{"message":"ok"}\nusage: 1 prompt, 1 response' })
    );

    const result = await geminiWrapper.geminiCall<{ message: string }>(
      { projectId: "p1", operation: "op", provider: "gemini-cli" },
      "prompt"
    );

    expect(dbAiLoggerWrapMock).toHaveBeenCalledWith(
      { projectId: "p1", operation: "op", provider: "gemini-cli", model: undefined },
      "prompt",
      expect.any(Function)
    );
    expect(parseGeminiOutputMock).toHaveBeenCalledWith('{"message":"ok"}\nusage: 1 prompt, 1 response');
    expect(result.data).toEqual({ message: "ok" });
    expect(result.tokens).toEqual({ prompt: 1, response: 1 });
  });

  it("returns raw text when outputFormat is text", async () => {
    execFileMock.mockImplementation((_cmd, _args, _options, callback) =>
      callback?.(null, { stdout: "plain text output" })
    );

    const result = await geminiWrapper.geminiCall<string>(
      { projectId: "p1", operation: "op", provider: "gemini-cli" },
      "prompt",
      { outputFormat: "text" }
    );

    expect(parseGeminiOutputMock).not.toHaveBeenCalled();
    expect(result.data).toBe("plain text output");
  });
});
