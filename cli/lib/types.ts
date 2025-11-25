import { z } from 'zod';

/**
 * AI Provider interface for all AI service implementations
 */
export interface AIProvider {
  name: string;
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  structuredComplete<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T>;
}

/**
 * Options for AI completion requests
 */
export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  model?: string;
}

/**
 * Configuration for AI providers
 */
export interface AIProviderConfig {
  name: string;
  cliCommand: string; // e.g., 'codex', 'claude', 'gemini'
  defaultModel?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Error thrown when Zod validation fails
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when AI provider fails
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

/**
 * Format Zod errors into a human-readable string
 */
export function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((e) => {
      const path = e.path.join('.');
      return `  - ${path || 'root'}: ${e.message}`;
    })
    .join('\n');
}
