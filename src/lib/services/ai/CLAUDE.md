# AI Services

## Architecture

```
gemini-wrapper.ts    → Executes Gemini CLI, handles model fallback
gemini-parser.ts     → Extracts JSON from CLI output (in src/lib/storyflow/)
ai-logger.ts         → Database-backed call logging with timing + token tracking
```

## Making AI Calls

```typescript
import { geminiCall } from "./gemini-wrapper";
import { parseGeminiOutput } from "@/src/lib/storyflow/gemini-parser";

const { rawResponse, tokensUsed } = await geminiCall(prompt, {
  outputFormat: "json",
  modelTier: "default",  // or "pro"
});
const parsed = parseGeminiOutput(rawResponse);
const validated = myZodSchema.parse(parsed);
```

## Rules

- ALL Gemini interactions go through `geminiCall()`. Never use `execFile`/`spawn` to call `gemini` directly.
- JSON parsing always uses `parseGeminiOutput()` — it handles markdown fences, double-escaping, and wrapper formats. Do NOT write custom JSON extraction.
- For retries, use `withRetry` from `@/src/lib/utils/retry`. Do NOT implement retry loops in this directory.
- Model selection comes from `@/src/lib/storyflow/settings.ts` via `getSettings()`. Do NOT hardcode model names.
- Gemini CLI flags: only `--yolo`, `--model`, `--output-format`. Do NOT use `--temperature` or other API-style params.

## Logging

Wrap AI calls with `AiLogger` to track calls in the database:

```typescript
import { AiLogger } from "./ai-logger";
const logger = AiLogger.getInstance();
const result = await logger.logCall(context, () => geminiCall(prompt, options));
```

## Do NOT

- Create new AI wrapper files — extend `gemini-wrapper.ts` if needed.
- Duplicate retry/backoff logic — use the shared helpers in `@/src/lib/utils/retry`; boards AI already uses them.
- Parse Gemini output manually — `gemini-parser.ts` covers all edge cases.
