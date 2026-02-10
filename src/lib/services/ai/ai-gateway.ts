import { z } from "zod";

import type { AiCallResult } from "./ai-logger";
import { aiLogger } from "./ai-logger";
import { parseGeminiOutput } from "@/src/lib/storyflow/gemini-parser";
import { runGemini } from "./gemini-wrapper";
import { withRetry } from "@/src/lib/utils/retry";

export type AiOutputFormat = "json" | "text";

export interface AiRequest<T> {
  prompt: string;
  projectId: string;
  operation: string;
  schema?: z.ZodSchema<T>;
  model?: string;
  outputFormat?: AiOutputFormat;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

const defaultRetryConfig = {
  maxRetries: 2,
  retryDelayMs: 2000,
  exponentialBackoff: true,
} as const;

export async function aiGenerate<T>(request: AiRequest<T>): Promise<AiCallResult<T>> {
  const {
    prompt,
    projectId,
    operation,
    schema,
    model,
    outputFormat = "json",
    maxRetries = defaultRetryConfig.maxRetries,
    metadata,
  } = request;

  return aiLogger.wrap<T>(
    { projectId, operation, provider: "gemini-cli", model, metadata },
    prompt,
    async () => {
      // Retry wraps the full cycle: CLI call + JSON parsing + schema validation.
      // Gemini CLI can return exit 0 with garbled output, so parse failures
      // must also trigger a retry rather than failing immediately.
      const { parsed, rawResponse, tokens } = await withRetry(
        async () => {
          const geminiResult = await runGemini(prompt, { model, outputFormat });

          let parsedValue: unknown =
            outputFormat === "json"
              ? parseGeminiOutput<T>(geminiResult.rawResponse)
              : ((geminiResult.rawResponse as unknown) as T);

          if (schema && outputFormat === "json") {
            try {
              parsedValue = schema.parse(parsedValue);
            } catch (err) {
              console.error(
                `[ai-gateway] Schema validation failed for ${operation}. Raw parsed:`,
                JSON.stringify(parsedValue).slice(0, 500)
              );
              throw err;
            }
          }

          return {
            parsed: parsedValue,
            rawResponse: geminiResult.rawResponse,
            tokens: geminiResult.tokens,
          };
        },
        { ...defaultRetryConfig, maxRetries },
        operation
      );

      const result = parsed as T;

      return { result, rawResponse, tokens };
    }
  );
}
