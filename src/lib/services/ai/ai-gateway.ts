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
      const { rawResponse, tokens } = await withRetry(
        () => runGemini(prompt, { model, outputFormat }),
        { ...defaultRetryConfig, maxRetries },
        operation
      );

      let parsed: unknown =
        outputFormat === "json"
          ? parseGeminiOutput<T>(rawResponse)
          : ((rawResponse as unknown) as T);

      if (schema && outputFormat === "json") {
        parsed = schema.parse(parsed);
      }

      const result = parsed as T;

      return {
        result,
        rawResponse,
        tokens,
        // include used model in metadata for observability
        // (not stored in AiLogger schema directly)
      };
    }
  );
}
