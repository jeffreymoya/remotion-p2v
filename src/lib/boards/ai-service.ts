import { z } from "zod";
import { AIProviderFactory } from "@/src/lib/services/ai";
import type { AIProvider } from "@/src/lib/ai-types";

/**
 * AI service wrapper for boards functionality.
 * Provides unified interface to CLI AI providers with retry logic.
 */
export class BoardsAIService {
  private provider: AIProvider | null = null;

  /**
   * Initialize the AI provider
   */
  async initialize(): Promise<void> {
    if (!this.provider) {
      this.provider = await AIProviderFactory.getProviderWithFallback();
    }
  }

  /**
   * Get the current provider instance
   */
  private async getProvider(): Promise<AIProvider> {
    if (!this.provider) {
      await this.initialize();
    }
    return this.provider!;
  }

  /**
   * Complete a prompt and return raw text
   */
  async complete(prompt: string, stage?: string): Promise<string> {
    const provider = await this.getProvider();
    if (stage) {
      provider.setPipelineStage?.(stage);
    }
    return callWithRetry(
      async () => provider.complete(prompt),
      3,
      stage || "completion"
    );
  }

  /**
   * Complete a prompt with structured output validated by Zod schema
   */
  async structuredComplete<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    stage?: string
  ): Promise<T> {
    const provider = await this.getProvider();
    if (stage) {
      provider.setPipelineStage?.(stage);
    }
    return callWithRetry(
      async () => provider.structuredComplete(prompt, schema),
      3,
      stage || "structured-completion"
    );
  }

  /**
   * Complete a prompt and parse JSON response
   */
  async completeJson<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    stage?: string
  ): Promise<T> {
    const provider = await this.getProvider();
    if (stage) {
      provider.setPipelineStage?.(stage);
    }
    return callWithRetry(
      async () => {
        const raw = await provider.complete(prompt);
        const parsed = parseJsonFromLLM(raw);
        return schema.parse(parsed);
      },
      3,
      stage || "json-completion"
    );
  }
}

/**
 * Retry helper with exponential backoff
 */
export async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  label: string
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(
        `[AI] Attempt ${attempt}/${maxRetries} for ${label} failed. Retrying in ${delay}ms...`
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error(`[AI] Failed to complete ${label}`);
}

/**
 * Parse JSON from LLM response, handling markdown code blocks
 */
export function parseJsonFromLLM(raw: string): unknown {
  const trimmed = raw.trim();
  const clean = trimmed.startsWith("```")
    ? trimmed
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```$/, "")
        .trim()
    : trimmed;

  try {
    return JSON.parse(clean);
  } catch (error) {
    throw new Error(
      `[AI] Failed to parse LLM JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Singleton instance
let aiServiceInstance: BoardsAIService | null = null;

/**
 * Get or create singleton AI service instance
 */
export function getBoardsAIService(): BoardsAIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new BoardsAIService();
  }
  return aiServiceInstance;
}
