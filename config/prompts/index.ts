/**
 * Centralized Prompt Library
 *
 * All AI prompts for the video generation pipeline.
 * Each stage has its own prompt file with typed variables.
 */

// Export all prompt modules
export * from './discover.prompt';
export * from './refine.prompt';
export * from './script.prompt';
export * from './gather.prompt';
export * from './emphasis.prompt';

// Re-export prompt manager utilities
export { renderPrompt, formatList, formatKeyValue, section, createPrompt, PromptBuilder } from '../../cli/lib/prompt-manager';
export type { PromptVariables } from '../../cli/lib/prompt-manager';
