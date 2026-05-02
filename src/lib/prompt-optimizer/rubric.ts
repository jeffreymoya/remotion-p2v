import { z } from "zod";

import {
  DEFAULT_DIMENSION_WEIGHTS,
  DIMENSION_NAMES,
  type DimensionName,
  type DimensionScore,
} from "./types";

const dimensionScoreSchema = z
  .object({
    score: z.number().min(1).max(10),
    rationale: z.string().min(1),
  })
  .strict();

export const JudgeResponseSchema: z.ZodSchema<{
  dimensions: Record<DimensionName, DimensionScore>;
}> = z
  .object({
    dimensions: z
      .object({
        speakability: dimensionScoreSchema,
        rhythm_variation: dimensionScoreSchema,
        conversational_authenticity: dimensionScoreSchema,
        hook_strength: dimensionScoreSchema,
        emotional_arc: dimensionScoreSchema,
        audience_retention: dimensionScoreSchema,
        coherence_flow: dimensionScoreSchema,
        memorability: dimensionScoreSchema,
      })
      .strict(),
  })
  .strict();

const DESCRIPTIONS: Record<DimensionName, string> = {
  speakability: "Natural when read aloud. No awkward phrasing or tongue-twisters.",
  rhythm_variation: "Mix of sentence lengths and pacing. Not monotonous.",
  conversational_authenticity: "Sounds like a person talking, not a blog post.",
  hook_strength: "First ~30 words grab attention and plant an open loop.",
  emotional_arc: "Clear emotional progression, not flat.",
  audience_retention: "Curiosity gaps, bucket brigades, pattern interrupts.",
  coherence_flow: "Smooth transitions, logical progression.",
  memorability: "Lasting impression, strong close, quotable moments.",
};

export function getRubricSummary(): string {
  return [
    "Dimensions (name: weight - description):",
    ...DIMENSION_NAMES.map(
      (name) => `- ${name}: ${DEFAULT_DIMENSION_WEIGHTS[name].toFixed(1)} - ${DESCRIPTIONS[name]}`
    ),
  ].join("\n");
}

export function buildJudgePrompt(script: string, topic: string): string {
  return `You are evaluating a narration script for a short-form video about: ${topic}

--- SCRIPT ---
${script}
--- END ---

Score each dimension from 1-10 using these anchors:
  3 = A script a professional would reject outright
  5 = Acceptable but generic; would not embarrass anyone
  7 = Noticeably better than average; a producer would prefer this
  9 = Exceptional; this dimension is a real strength of the script
Reserve 1-2 and 9-10 for genuine outliers only.

Include a one-sentence rationale for each score.

Dimensions:
1. speakability: ${DESCRIPTIONS.speakability}
2. rhythm_variation: ${DESCRIPTIONS.rhythm_variation}
3. conversational_authenticity: ${DESCRIPTIONS.conversational_authenticity}
4. hook_strength: ${DESCRIPTIONS.hook_strength}
5. emotional_arc: ${DESCRIPTIONS.emotional_arc}
6. audience_retention: ${DESCRIPTIONS.audience_retention}
7. coherence_flow: ${DESCRIPTIONS.coherence_flow}
8. memorability: ${DESCRIPTIONS.memorability}

Return ONLY valid JSON (no markdown fences, no preamble):
{
  "dimensions": {
    "speakability": { "score": <1-10>, "rationale": "<one sentence>" },
    "rhythm_variation": { "score": <1-10>, "rationale": "<one sentence>" },
    "conversational_authenticity": { "score": <1-10>, "rationale": "<one sentence>" },
    "hook_strength": { "score": <1-10>, "rationale": "<one sentence>" },
    "emotional_arc": { "score": <1-10>, "rationale": "<one sentence>" },
    "audience_retention": { "score": <1-10>, "rationale": "<one sentence>" },
    "coherence_flow": { "score": <1-10>, "rationale": "<one sentence>" },
    "memorability": { "score": <1-10>, "rationale": "<one sentence>" }
  }
}`;
}
