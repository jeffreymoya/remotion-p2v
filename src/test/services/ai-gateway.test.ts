import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const wrapMock = vi.hoisted(() =>
  vi.fn(async (_context, _prompt, executor) => {
    const { result, rawResponse, tokens } = await executor();
    return { data: result, logId: "log-1", durationMs: 25, tokens, rawResponse };
  })
);

const runGeminiMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    rawResponse: '{"message":"hi"}',
    tokens: { prompt: 5, response: 7 },
    usedModel: "gemini-2.5-pro",
  })
);

const parseGeminiOutputMock = vi.hoisted(() =>
  vi.fn().mockReturnValue({ message: "hi" })
);

const withRetryMock = vi.hoisted(() =>
  vi.fn((operation) => operation())
);

vi.mock("@/src/lib/services/ai/ai-logger", () => ({
  aiLogger: { wrap: wrapMock },
}));

vi.mock("@/src/lib/services/ai/gemini-wrapper", () => ({
  runGemini: runGeminiMock,
}));

vi.mock("@/src/lib/storyflow/gemini-parser", () => ({
  parseGeminiOutput: parseGeminiOutputMock,
}));

vi.mock("@/src/lib/utils/retry", () => ({
  withRetry: withRetryMock,
}));

import { aiGenerate } from "@/src/lib/services/ai/ai-gateway";

describe("ai-gateway aiGenerate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wraps execution with retry, parsing, and schema validation for JSON output", async () => {
    const schema = z.object({ message: z.string() });

    const result = await aiGenerate({
      prompt: "hello",
      projectId: "proj-1",
      operation: "test/op",
      schema,
      metadata: { foo: "bar" },
    });

    expect(runGeminiMock).toHaveBeenCalledWith("hello", {
      model: undefined,
      outputFormat: "json",
    });
    expect(withRetryMock).toHaveBeenCalledWith(expect.any(Function), {
      maxRetries: 2,
      retryDelayMs: 2000,
      exponentialBackoff: true,
    }, "test/op");
    expect(parseGeminiOutputMock).toHaveBeenCalledWith('{"message":"hi"}');
    expect(wrapMock).toHaveBeenCalledWith(
      { projectId: "proj-1", operation: "test/op", provider: "gemini-cli", model: undefined, metadata: { foo: "bar" } },
      "hello",
      expect.any(Function)
    );
    expect(result.data).toEqual({ message: "hi" });
    expect(result.tokens).toEqual({ prompt: 5, response: 7 });
  });

  it("supports text output format and custom retry counts without JSON parsing", async () => {
    parseGeminiOutputMock.mockClear();
    runGeminiMock.mockResolvedValueOnce({
      rawResponse: "plain-text-response",
      tokens: undefined,
      usedModel: "gemini-2.5-flash",
    });

    const result = await aiGenerate<string>({
      prompt: "text prompt",
      projectId: "proj-2",
      operation: "text/op",
      outputFormat: "text",
      maxRetries: 5,
      model: "gemini-2.5-flash",
    });

    expect(runGeminiMock).toHaveBeenCalledWith("text prompt", {
      model: "gemini-2.5-flash",
      outputFormat: "text",
    });
    expect(withRetryMock).toHaveBeenCalledWith(expect.any(Function), {
      maxRetries: 5,
      retryDelayMs: 2000,
      exponentialBackoff: true,
    }, "text/op");
    expect(parseGeminiOutputMock).not.toHaveBeenCalled();
    expect(result.data).toBe("plain-text-response");
  });
});
