/**
 * Centralized Prompt Library
 *
 * All AI prompts for the video generation pipeline.
 * Each stage has its own prompt file with typed variables.
 */

// Export all prompt modules
export * from './refine.prompt';
export * from './script.prompt';
export * from './emphasis.prompt';
export * from './boards-plan.prompt';
export * from './boards-image.prompt';
export * from './boards-region.prompt';
export * from './script-builder-blueprint.prompt';
export * from './script-builder-hook.prompt';
export * from './script-builder-middle.prompt';
export * from './script-builder-turn.prompt';
export * from './script-builder-segment.prompt';

// Re-export prompt manager utilities
export { renderPrompt, formatList, formatKeyValue, section, createPrompt, PromptBuilder } from '../../src/lib/prompt-manager';
export type { PromptVariables } from '../../src/lib/prompt-manager';
