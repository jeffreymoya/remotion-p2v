import { z } from "zod";
import { deepseekChat } from "../deepseek";
import { CODE_GEN_TEMPERATURE, CODE_GEN_REASONING } from "../config";
import type { SentenceTiming } from "./sentence-segmenter";

// ── Clip plan schema ────────────────────────────────────────────────────
const ClipPlanItemSchema = z.object({
  query: z.string().min(1),
  sentenceIndexes: z.array(z.number().int().min(0)).min(1),
});

export const ClipPlanSchema = z.object({
  strategy: z.enum(["single", "multi"]),
  clips: z.array(ClipPlanItemSchema).min(1),
});

export type ClipPlan = z.infer<typeof ClipPlanSchema>;

const SYSTEM_PROMPT = `You are a video director choosing stock video clips for an inspirational narration video.

Given a narration and its sentence-level timings, decide how many background video clips to use and what Pixabay search queries to use for each.

## Strategy
- "single": One video clip for the entire narration. Use when the narration has a single cohesive theme or visual mood.
- "multi": Multiple clips, each covering a group of thematically related sentences. Use when the narration shifts topics or visual moods.

## Rules
1. Every sentence must be covered by exactly one clip (no gaps, no overlaps).
2. Sentence indexes must be contiguous within each clip group.
3. Queries should describe cinematic, atmospheric stock footage (nature, cityscapes, abstract, people in motion).
4. Prefer horizontal/landscape orientation footage.
5. Use 2-4 word queries for best Pixabay results.
6. For "single" strategy, clips array must have exactly 1 entry with ALL sentence indexes.

## Output
Return a JSON object matching this shape:
\`\`\`json
{
  "strategy": "single" | "multi",
  "clips": [
    { "query": "mountain sunrise timelapse", "sentenceIndexes": [0, 1, 2] }
  ]
}
\`\`\``;

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^[\s\n]*```(?:json)?\s*\n?/, "")
    .replace(/[\s\n]*```[\s\n]*$/, "")
    .trim();
}

export async function generateClipPlan(
  narration: string,
  sentences: SentenceTiming[],
  options?: { verbose?: boolean },
): Promise<ClipPlan> {
  const sentenceSummary = sentences
    .map(
      (s) =>
        `[${s.sentenceIndex}] ${s.startSeconds.toFixed(1)}s–${s.endSeconds.toFixed(1)}s: "${s.text}"`,
    )
    .join("\n");

  const userPrompt = `Here is the narration:

"""
${narration}
"""

Sentence timings:
${sentenceSummary}

Choose a video strategy and Pixabay search queries. Return ONLY the JSON.`;

  const raw = await deepseekChat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    CODE_GEN_TEMPERATURE,
    CODE_GEN_REASONING,
    { verbose: options?.verbose },
  );

  const cleaned = stripJsonFences(raw);
  const parsed = JSON.parse(cleaned);
  return ClipPlanSchema.parse(parsed);
}
