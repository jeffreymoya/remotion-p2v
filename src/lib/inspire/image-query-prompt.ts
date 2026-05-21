import { z } from "zod";
import { deepseekChat } from "../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../config";

export const ImageQueryPlanSchema = z.object({
  clips: z.array(
    z.object({
      clipIndex: z.number().int().min(0),
      query: z.string().min(1),
    }),
  ),
});

export type ImageQueryPlan = z.infer<typeof ImageQueryPlanSchema>;

const SYSTEM_PROMPT = `You are a stock photo search specialist. Given clip narration context, produce concise image search queries optimized for finding relevant landscape-orientation photographs on Pexels.

## Rules
1. Use 2-4 word queries focusing on concrete nouns and adjectives.
2. Avoid motion verbs (running, flying, walking) — these are still images.
3. Prefer visually distinct, specific subjects over abstract concepts.
4. For abstract narration (discipline, growth, purpose), use metaphorical concrete imagery: "open road sunrise", "compass map adventure", "plant seedling soil".
5. For factual/data-driven narration, use imagery related to the subject matter.

## Output
Return JSON only, no markdown fences.
Shape: { "clips": [{ "clipIndex": 0, "query": "mountain sunrise golden" }] }`;

interface ClipContext {
  clipIndex: number;
  narrationExcerpt: string;
  originalQuery: string;
}

interface GenerateOptions {
  verbose?: boolean;
}

export async function generateImageQueries(
  clips: ClipContext[],
  options?: GenerateOptions,
): Promise<ImageQueryPlan> {
  const userPrompt = clips
    .map(
      (c) =>
        `[clip ${c.clipIndex}] original_query="${c.originalQuery}" narration: "${c.narrationExcerpt}"`,
    )
    .join("\n");

  let raw: string;
  try {
    raw = await deepseekChat(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      CODE_GEN_TEMPERATURE,
      NARRATION_REASONING,
      { verbose: options?.verbose, runName: "image-query" },
    );
  } catch (err) {
    console.warn(
      `  [image-query] LLM call failed (${err instanceof Error ? err.message : String(err)}); using original queries`,
    );
    return {
      clips: clips.map((c) => ({ clipIndex: c.clipIndex, query: c.originalQuery })),
    };
  }

  try {
    const cleaned = raw
      .replace(/^[\s\n]*```(?:json)?\s*\n?/, "")
      .replace(/[\s\n]*```[\s\n]*$/, "")
      .trim();
    return ImageQueryPlanSchema.parse(JSON.parse(cleaned));
  } catch {
    return {
      clips: clips.map((c) => ({ clipIndex: c.clipIndex, query: c.originalQuery })),
    };
  }
}
