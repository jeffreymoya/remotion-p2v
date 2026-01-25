#!/usr/bin/env node
import { test } from "node:test";
import assert from "node:assert/strict";

import { parseGeminiTokenUsage } from "../gemini-wrapper";
import { categorizeError, estimateTokens } from "../ai-logger";

test("estimateTokens ~4 chars per token", () => {
  assert.equal(estimateTokens("1234"), 1);
  assert.equal(estimateTokens("12345"), 2);
  assert.equal(estimateTokens("12345678"), 2);
});

test("categorizeError maps known substrings", () => {
  assert.equal(categorizeError(new Error("rate limit exceeded")), "RATE_LIMIT");
  assert.equal(categorizeError("Timeout while calling provider"), "TIMEOUT");
  assert.equal(categorizeError("JSON parse failed"), "PARSE_ERROR");
  assert.equal(categorizeError("Network unreachable"), "NETWORK_ERROR");
  assert.equal(categorizeError("Something else"), "UNKNOWN");
});

test("parseGeminiTokenUsage parses usage lines", () => {
  const sample = "usage: 123 prompt, 456 response";
  const parsed = parseGeminiTokenUsage(sample);
  assert.deepEqual(parsed, { prompt: 123, response: 456 });

  const none = parseGeminiTokenUsage("no usage info");
  assert.equal(none, undefined);
});
