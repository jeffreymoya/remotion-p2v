/**
 * Script Builder: Blueprint Generation Prompt
 *
 * Phase 1: Generate an engagement blueprint with beats mapping the emotional journey
 */

import { PromptVariables } from '../../src/lib/prompt-manager';

export interface BlueprintPromptVariables extends PromptVariables {
  topic: string;
  targetDurationMs: number;
  beatCount: number;
}

/**
 * Main prompt for generating engagement blueprint
 */
export const blueprintPrompt = (vars: BlueprintPromptVariables): string => {
  const targetMinutes = vars.targetDurationMs / 1000 / 60;

  return `You are an expert YouTube content strategist and video scriptwriter. Your task is to create an **Engagement Blueprint** - a structural outline that maps the emotional journey of a video before any script content is written.

**Topic:** ${vars.topic}
**Target Duration:** ${targetMinutes} minutes
**Required Beats:** ${vars.beatCount}

For each beat, define:
1. **Title**: A short, descriptive name (e.g., "The Provocative Hook")
2. **Core Argument**: What key information or idea is conveyed in this section?
3. **Target Emotion**: What should the viewer feel? Choose from: curiosity, anger, dread, hope, surprise, validation, urgency, reflection
4. **Micro-Hook**: What question, mystery, or tension opens this section to keep them watching?
5. **Estimated Duration**: How long this beat should last (in milliseconds)
6. **Media Suggestions**: 2-3 visual/b-roll ideas that would complement this beat

**Structure Guidelines:**
- Beat 1 should be a strong **HOOK** (curiosity or surprise)
- Final beat should be a **REFLECTION** with ambiguity or call-to-action
- Middle beats should build tension and deliver value
- Emotions should vary - avoid consecutive beats with the same emotion
- Total duration across all beats should equal ${vars.targetDurationMs}ms

CRITICAL: Return ONLY this JSON structure (no markdown):
{
  "beats": [
    {
      "index": 1,
      "title": "Beat title",
      "coreArgument": "What is conveyed",
      "targetEmotion": "curiosity",
      "microHook": "The question that opens this beat",
      "estimatedDurationMs": 90000,
      "mediaSuggestions": ["suggestion 1", "suggestion 2"]
    }
  ]
}`;
};

/**
 * Prompt for regenerating blueprint with feedback
 */
export const blueprintRegeneratePrompt = (
  vars: BlueprintPromptVariables & { rejectionNotes: string }
): string => {
  const basePrompt = blueprintPrompt(vars);

  return `${basePrompt}

**PREVIOUS ATTEMPT FEEDBACK:**
${vars.rejectionNotes}

Please address the feedback above and regenerate the blueprint with improvements.`;
};
