import type { z } from "zod";
import { llmChatJson } from "../llm-provider";
import {
  CODE_GEN_TEMPERATURE,
  NARRATION_REASONING,
  LLM_DEFAULT_MAX_RETRIES,
  type LlmCallConfig,
} from "../config";

export async function callStructured<T>(args: {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  runName?: string;
  verbose?: boolean;
  maxRetries?: number;
  llm?: LlmCallConfig;
}): Promise<T> {
  const maxRetries = args.maxRetries ?? args.llm?.maxRetries ?? LLM_DEFAULT_MAX_RETRIES;
  const temperature = args.llm?.temperature ?? CODE_GEN_TEMPERATURE;
  const reasoning = args.llm?.reasoning
    ? {
        effort: (args.llm.reasoning.effort ?? NARRATION_REASONING.effort) as "low" | "medium" | "high",
        thinking: { type: (args.llm.reasoning.thinking ?? NARRATION_REASONING.thinking.type) as "enabled" | "disabled" },
      }
    : NARRATION_REASONING;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await llmChatJson(
        [
          { role: "system", content: args.system },
          { role: "user", content: args.prompt },
        ],
        args.schema,
        temperature,
        reasoning,
        {
          runName: args.runName,
          verbose: args.verbose,
          maxTokens: args.llm?.maxTokens,
          model: args.llm?.model,
          provider: args.llm?.provider,
        },
      );
    } catch (err) {
      lastError = err;
      if (attempt <= maxRetries) {
        process.stderr.write(
          `[callStructured] attempt ${attempt} failed, retrying...\n`,
        );
      }
    }
  }

  throw lastError;
}
