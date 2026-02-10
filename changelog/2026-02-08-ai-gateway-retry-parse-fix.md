# AI Gateway: Retry Now Covers JSON Parsing & Schema Validation - 2026-02-08

## Summary

Fixed a critical bug where malformed Gemini CLI output caused immediate 500 errors with no retry. The JSON parsing and schema validation steps were outside the retry block, so garbled AI responses were never retried — they failed on the first attempt regardless of retry configuration.

## Root Cause Analysis

### The Bug: Parse Failures Not Retried

**Error observed:**
```
SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)
    at JSON.parse (<anonymous>)
    at parseGeminiOutput (...)
    at fillElementDescriptions (...)
    at generateBoardPrompts (...)
```

**Pattern in `ai-gateway.ts`:**
```typescript
// BEFORE — retry only wraps the CLI call
const { rawResponse, tokens } = await withRetry(
  () => runGemini(prompt, { model, outputFormat }),  // ← retried
  { ...defaultRetryConfig, maxRetries },
  operation
);

// Parsing is OUTSIDE retry — SyntaxError here = immediate failure
let parsed = parseGeminiOutput<T>(rawResponse);  // ← NOT retried

// Schema validation also outside retry
if (schema) parsed = schema.parse(parsed);        // ← NOT retried
```

**Why it fails:**
- Gemini CLI can exit with code 0 but return garbled, truncated, or non-JSON output
- `runGemini` succeeds (no error thrown), so `withRetry` considers the operation successful
- `parseGeminiOutput` then throws `SyntaxError` on the garbled output
- This error is outside the retry block, so it propagates immediately as a 500

**Affected callers (all go through `aiGenerate`):**
- `src/lib/boards/prompts-service.ts` — board prompt generation (the failing call)
- `src/lib/boards/plan-service.ts` — board planning
- `src/lib/storyflow/viewport.ts` — viewport/camera analysis
- `src/lib/storyflow/ai.ts` — general AI generation
- `src/lib/storyflow/script-builder.ts` — script generation
- `app/api/ai/refine/route.ts` — topic refinement
- `app/api/tts/analyze-emphasis/route.ts` — emphasis analysis
- `app/api/projects/[id]/boards/regions/route.ts` — region detection

### Secondary Issue: Legacy Provider Using Raw JSON.parse

The `GeminiCLIProvider` class in `src/lib/services/ai/index.ts` used raw `JSON.parse()` instead of `parseGeminiOutput()`, missing all robustness features (markdown fence stripping, double-escape handling, BOM removal, etc.).

## Changes

### 1. `src/lib/services/ai/ai-gateway.ts` — Primary Fix

Moved `parseGeminiOutput()` and `schema.parse()` inside the `withRetry` block so the full cycle (CLI call + JSON parsing + schema validation) is retried on any failure.

**Before:**
```typescript
const { rawResponse, tokens } = await withRetry(
  () => runGemini(prompt, { model, outputFormat }),
  retryConfig, operation
);
let parsed = parseGeminiOutput<T>(rawResponse);     // outside retry
if (schema) parsed = schema.parse(parsed);           // outside retry
```

**After:**
```typescript
const { parsed, rawResponse, tokens } = await withRetry(
  async () => {
    const geminiResult = await runGemini(prompt, { model, outputFormat });
    let parsedValue = parseGeminiOutput<T>(geminiResult.rawResponse);  // inside retry
    if (schema) parsedValue = schema.parse(parsedValue);                // inside retry
    return { parsed: parsedValue, rawResponse: geminiResult.rawResponse, tokens: geminiResult.tokens };
  },
  retryConfig, operation
);
```

### 2. `src/lib/services/ai/index.ts` — Hardening

Replaced raw `JSON.parse()` with `parseGeminiOutput()` in the legacy `GeminiCLIProvider`:
- `complete()` method
- `structuredComplete()` method

## Additional Improvement: Boards Prompts Now Use Pro Model

Upgraded boards prompt generation (`src/lib/boards/prompts-service.ts`) to use the Pro tier model (`gemini-2.5-pro`) instead of the default Flash model (`gemini-2.5-flash`).

**Affected operations:**
- `boards-prompts-analysis` — Content topic/entity/tone extraction
- `boards-prompts-elements` — Element description generation

**Why:** Board prompts drive the visual quality of the entire storyboard. Using the more capable Pro model improves:
- Richer topic detection and entity extraction
- More detailed, coherent element descriptions
- Better thematic connections between elements

**Fallback chain:** If `gemini-2.5-pro` fails after retries, falls back to `gemini-2.5-flash` (configured in settings).

## Testing

- All 13 AI service tests pass (ai-gateway, gemini-wrapper, gemini-parser)
- All 12 boards pipeline tests pass (integration, API routes, build)
- No lint errors introduced
