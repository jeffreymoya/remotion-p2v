/**
 * Script Builder: Turn/Reflection Prompt (Final Beat)
 *
 * Phase 3: Generate the final beat with lyrical style and reflection
 */

import { PromptVariables } from '../../src/lib/prompt-manager';

export interface TurnPromptVariables extends PromptVariables {
  beatTitle: string;
  coreArgument: string;
  targetEmotion: string;
  microHook: string;
  estimatedDurationMs: number;
  targetWordCount: number;
  allPreviousBeatText: string;
}

/**
 * Turn/reflection prompt for final beat - lyrical, reflective
 */
export const turnPrompt = (vars: TurnPromptVariables): string => {
  const durationSeconds = vars.estimatedDurationMs / 1000;

  return `**Context:** You are writing the FINAL BEAT of a video script - the reflection and conclusion.
**Blueprint Beat:**
- Title: ${vars.beatTitle}
- Core Argument: ${vars.coreArgument}
- Target Emotion: ${vars.targetEmotion}
- Micro-Hook: ${vars.microHook}
- Duration: ${durationSeconds} seconds (~${vars.targetWordCount} words)

**Full Script So Far:**
${vars.allPreviousBeatText}

**Style Modifiers (STRICTLY FOLLOW):**
- **Slower Pacing:** Use intentional repetition. "They didn't want money. They wanted power. Pure, unchecked power."
- **The Ambiguous Mirror:** Turn the camera back on the viewer. Ask a question with no easy answer.
- **Lyricism:** The final paragraph should feel almost poetic. NO generic summaries like "In conclusion."
- **Close the Loop:** Callback to the opening hook - resolve or reframe it.
- **Final Line:** End with a sentence that LINGERS. A quiet punch.

Write approximately ${vars.targetWordCount} words.
Return ONLY the script text, no JSON wrapping.`;
};
