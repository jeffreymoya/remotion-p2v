import { describe, it, expect } from "vitest";

import {
  parseGeminiOutput,
  stripMarkdownBlocks,
  unescapeJsonString,
} from "@/src/lib/storyflow/gemini-parser";

describe("gemini-parser helpers", () => {
  it("strips markdown code fences", () => {
    const text = "```json\n{\"foo\":1}\n```";
    expect(stripMarkdownBlocks(text)).toBe('{"foo":1}');
  });

  it("unescapes common JSON escape sequences", () => {
    expect(unescapeJsonString("\\\"hello\\nworld\\\"")).toBe('"hello\nworld"');
  });
});

describe("parseGeminiOutput", () => {
  it("parses direct JSON", () => {
    const parsed = parseGeminiOutput<{ hello: string }>('{ "hello": "world" }');
    expect(parsed).toEqual({ hello: "world" });
  });

  it("parses markdown-fenced JSON", () => {
    const parsed = parseGeminiOutput<{ ok: boolean }>("```json\n{ \"ok\": true }\n```");
    expect(parsed).toEqual({ ok: true });
  });

  it("parses wrapper format containing stringified JSON", () => {
    const parsed = parseGeminiOutput<{ name: string }>('{"response":"{\\"name\\":\\"Gemini\\"}"}');
    expect(parsed).toEqual({ name: "Gemini" });
  });

  it("parses double-escaped JSON payloads", () => {
    const parsed = parseGeminiOutput<{ status: string }>(
      '{\\"status\\":\\"ok\\",\\"meta\\":{\\"lines\\":\\"a\\\\nb\\"}}'
    );
    expect(parsed).toEqual({ status: "ok", meta: { lines: "a\nb" } });
  });

  it("escapes raw newlines inside string values to allow parsing", () => {
    const parsed = parseGeminiOutput<{ note: string }>(
      '{ "note": "line1\nline2" }'
    );
    expect(parsed).toEqual({ note: "line1\nline2" });
  });
});
