import { describe, expect, it, vi, beforeAll } from "vitest";

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    aiCallLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/src/lib/storyflow/settings", () => ({ getSettings: () => ({ ai: { provider: "gemini-cli", model: "test", fallbackModel: "test" } }) }));

import { categorizeError, estimateTokens } from "@/src/lib/services/ai/ai-logger";
import { parseGeminiTokenUsage } from "@/src/lib/services/ai/gemini-wrapper";

beforeAll(() => {
  process.env.SKIP_ENV_VALIDATION = "true";
});

describe("estimateTokens", () => {
  it("estimates ~4 chars per token", () => {
    expect(estimateTokens("1234")).toBe(1);
    expect(estimateTokens("12345")).toBe(2);
    expect(estimateTokens("12345678")).toBe(2);
  });
});

describe("categorizeError", () => {
  it("maps known substrings", () => {
    expect(categorizeError(new Error("rate limit exceeded"))).toBe("RATE_LIMIT");
    expect(categorizeError("Timeout while calling provider")).toBe("TIMEOUT");
    expect(categorizeError("JSON parse failed")).toBe("PARSE_ERROR");
    expect(categorizeError("Network unreachable")).toBe("NETWORK_ERROR");
  });

  it("returns UNKNOWN for other errors", () => {
    expect(categorizeError("Something else")).toBe("UNKNOWN");
  });
});

describe("parseGeminiTokenUsage", () => {
  it("parses usage lines", () => {
    const parsed = parseGeminiTokenUsage("usage: 123 prompt, 456 response");
    expect(parsed).toEqual({ prompt: 123, response: 456 });
  });

  it("returns undefined when usage missing", () => {
    expect(parseGeminiTokenUsage("no usage info")).toBeUndefined();
  });
});
