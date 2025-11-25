/**
 * Script Generation Prompts
 *
 * Stage 4: Generate video scripts with public speaking techniques
 */

import { PromptVariables } from '../../cli/lib/prompt-manager';

export interface ScriptPromptVariables extends PromptVariables {
  title: string;             // Refined video title
  description?: string;      // Video description
  targetDuration: number;    // Target duration in seconds
  minSegments?: number;      // Minimum number of segments
  maxSegments?: number;      // Maximum number of segments
  keyAngles?: string[];      // Key topics to cover
  hooks?: string[];          // Opening hooks to use
}

/**
 * Main prompt for generating a video script
 */
export const generateScriptPrompt = (vars: ScriptPromptVariables): string => {
  const minSegments = vars.minSegments || 8;
  const maxSegments = vars.maxSegments || 12;
  const keyAnglesSection = vars.keyAngles && vars.keyAngles.length > 0
    ? `\n\nKey Angles to Cover:\n${vars.keyAngles.map((angle, i) => `${i + 1}. ${angle}`).join('\n')}`
    : '';
  const hooksSection = vars.hooks && vars.hooks.length > 0
    ? `\n\nSuggested Opening Hooks:\n${vars.hooks.map((hook, i) => `${i + 1}. ${hook}`).join('\n')}`
    : '';

  return `Generate a compelling ${vars.targetDuration}-second video script for YouTube about: "${vars.title}"

Description: ${vars.description || 'No description provided'}${keyAnglesSection}${hooksSection}

Requirements:
- Create ${minSegments}-${maxSegments} segments that total approximately ${vars.targetDuration} seconds
- Use public speaking techniques: hooks, storytelling, examples, call-to-action
- First segment should be a strong hook (10-15 seconds)
- Last segment should be a conclusion with CTA (15-20 seconds)
- Middle segments should flow logically, building on each other
- Each segment should be self-contained but connect to the narrative
- Include speaking notes for each segment (tone, pacing, emphasis)
- Estimate duration for each segment in milliseconds

Return as JSON with array of segments.`;
};

/**
 * Alternative prompt for educational/tutorial scripts
 */
export const generateTutorialScriptPrompt = (vars: ScriptPromptVariables): string => {
  return `Generate a step-by-step tutorial script for: "${vars.title}"

Description: ${vars.description || 'No description provided'}

Requirements:
- Create a clear, easy-to-follow tutorial structure
- Start with "what you'll learn" overview
- Break down into numbered steps
- Include examples and common mistakes to avoid
- End with a summary and next steps
- Target duration: ${vars.targetDuration} seconds
- Include timing estimates for each step

Make it beginner-friendly and actionable.`;
};

/**
 * Prompt for storytelling-based scripts
 */
export const generateStoryScriptPrompt = (vars: ScriptPromptVariables): string => {
  return `Generate a narrative-driven video script about: "${vars.title}"

Description: ${vars.description || 'No description provided'}

Requirements:
- Use storytelling structure: setup, conflict, resolution
- Start with a compelling hook or anecdote
- Include real-world examples or case studies
- Build emotional connection with the audience
- Weave in educational content naturally
- End with a memorable takeaway
- Target duration: ${vars.targetDuration} seconds
- Include pacing notes for dramatic effect

Tell a story that educates and entertains.`;
};
