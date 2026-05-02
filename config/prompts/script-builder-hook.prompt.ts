/**
 * Script Builder: Hook Prompt (Beat 1)
 *
 * Phase 3: Generate the opening hook with staccato rhythm
 */

import { PromptVariables } from '../../src/lib/prompt-manager';

export interface HookPromptVariables extends PromptVariables {
  beatTitle: string;
  coreArgument: string;
  targetEmotion: string;
  microHook: string;
  estimatedDurationMs: number;
  targetWordCount: number;
}

/**
 * Hook prompt for Beat 1 - staccato rhythm, direct address
 */
export const hookPrompt = (vars: HookPromptVariables): string => {
  const durationSeconds = vars.estimatedDurationMs / 1000;

  return `**Context:** You are writing the OPENING HOOK of a video script.
**Blueprint Beat:**
- Title: ${vars.beatTitle}
- Core Argument: ${vars.coreArgument}
- Target Emotion: ${vars.targetEmotion}
- Micro-Hook: ${vars.microHook}
- Duration: ${durationSeconds} seconds (~${vars.targetWordCount} words)

**Style Modifiers (STRICTLY FOLLOW):**
- **Staccato Rhythm:** Use short, punchy sentences. "It wasn't a mistake. It was a choice."
- **Direct Address:** Speak directly to the viewer's unspoken fears or desires. Make them feel seen.
- **Pattern Interrupt:** Start with a bold claim, then immediately pivot to a story or question.
- **No Fluff:** Do NOT use "In this video, we will discuss..." - just START.
- **Open Loop:** Plant a question that won't be answered until later.

Write approximately ${vars.targetWordCount} words.
Return ONLY the script text, no JSON wrapping.`;
};
