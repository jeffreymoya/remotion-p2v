/**
 * Script Builder: Middle Beat Prompt
 *
 * Phase 3: Generate middle beats with emotion-based style modifiers
 */

import { PromptVariables } from '../../src/lib/prompt-manager';

export interface MiddleBeatPromptVariables extends PromptVariables {
  beatIndex: number;
  totalBeats: number;
  beatTitle: string;
  coreArgument: string;
  targetEmotion: string;
  microHook: string;
  estimatedDurationMs: number;
  targetWordCount: number;
  previousBeatText: string;
}

/**
 * Get style modifiers based on target emotion
 */
export const getStyleModifiersForEmotion = (emotion: string): string => {
  const modifiers: Record<string, string> = {
    curiosity: `- **Pattern interrupt:** Start with unexpected angle
- **Open loops:** Plant unanswered questions
- **Direct address:** Use "you" frequently`,
    anger: `- **Staccato rhythm:** Short punchy sentences
- **Concrete examples:** Specific cases of injustice
- **Rhetorical questions:** "How is this acceptable?"`,
    dread: `- **Slow pacing:** Let tension build
- **Sensory language:** Make them feel it
- **Foreshadowing:** Hint at what's coming`,
    hope: `- **Flowing sentences:** Smooth and uplifting
- **Future tense:** Paint possibility
- **Concrete analogies:** Make hope tangible`,
    surprise: `- **Short punch lines:** Deliver the twist concisely
- **Contrast:** Set up expectation then subvert
- **Pivot phrases:** "But here's what nobody expected..."`,
    validation: `- **Second person:** "You've felt this"
- **Shared experience:** Collective "we"
- **Recognition:** Name the unspoken feeling`,
    urgency: `- **Imperative mood:** "You need to understand"
- **Time pressure language:** "Right now..."
- **Statistics and facts:** Ground the urgency`,
    reflection: `- **Ambiguous questions:** No easy answers
- **Lyricism:** Almost poetic phrasing
- **Metaphor and imagery:** Paint a picture`,
  };

  const modifier = modifiers[emotion];
  if (!modifier) throw new Error(`Unknown emotion: "${emotion}". Must be one of: ${Object.keys(modifiers).join(', ')}`);
  return modifier;
};

/**
 * Middle beat prompt with emotion-based modifiers
 */
export const middleBeatPrompt = (vars: MiddleBeatPromptVariables): string => {
  const durationSeconds = vars.estimatedDurationMs / 1000;

  return `**Context:** You are writing beat ${vars.beatIndex} of ${vars.totalBeats} for a video script.
**Blueprint Beat:**
- Title: ${vars.beatTitle}
- Core Argument: ${vars.coreArgument}
- Target Emotion: ${vars.targetEmotion}
- Micro-Hook: ${vars.microHook}
- Duration: ${durationSeconds} seconds (~${vars.targetWordCount} words)

**Previous Content (for continuity):**
${vars.previousBeatText}

**Style Modifiers (AI-SELECTED based on emotion: ${vars.targetEmotion}):**
${getStyleModifiersForEmotion(vars.targetEmotion)}

**Additional Requirements:**
- **Bucket Brigades:** Use transitional phrases: "But here's the catch," "Now, you might be thinking..."
- **Concrete Analogies:** Don't just explain abstractions - give physical, visual comparisons.
- **Varying Pace:** Mix long flowing sentences with sudden short punches.
- **Continue the Thread:** Reference or callback to the hook's open loop if relevant.

Write approximately ${vars.targetWordCount} words.
Return ONLY the script text, no JSON wrapping.`;
};
