import { z } from 'zod';

/**
 * AI Provider interface for all AI service implementations
 */
export interface AIProvider {
  name: string;
  initialize(): Promise<void>;
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  structuredComplete<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T>;
  setPipelineStage?(stage: string): void;
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

