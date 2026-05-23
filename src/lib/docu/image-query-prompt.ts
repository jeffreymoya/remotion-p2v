import { z } from "zod";
import { deepseekChatJson } from "../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../config";
import type { ImageQuery } from "./image-pipeline";

export interface ShotContext {
  shotIndex: number;
  palette: "cool-tech" | "warm-real";
  sentenceText: string;
}

const SYSTEM_PROMPT = `You are a stock photo search specialist for a Bloomberg-style documentary. Given shot contexts (palette + sentence text), produce image search queries optimized for finding relevant landscape-orientation photographs.

## Rules
1. Produce exactly N queries, one per shot (shot count is stated below).
2. 2–4 word queries, concrete nouns/adjectives, no motion verbs (running, flying, walking).
3. Palette mapping:
   - "cool-tech" → offices/trading floors/institutions/charts/data centres/financial districts/boardrooms
   - "warm-real" → families/homes/streets/grocery stores/residential neighborhoods/kitchens/parks
4. Vary imagery across consecutive shots for the same sentence.
5. "fallback" is a simpler/broader version of "query".

## Output
Return JSON only, no markdown fences.
Shape: { "shots": [{ "shotIndex": 0, "query": "federal reserve building", "fallback": "government building" }, ...] }`;

function deriveFallbackQuery(sentenceText: string): string {
  const words = sentenceText
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const contentWords = words.filter(
    (w) => !["the", "and", "for", "are", "was", "has", "been", "that", "this", "with", "from", "your", "have", "will", "they", "were", "when", "what", "their", "more", "than", "some", "into", "over", "each", "also", "very", "been", "year", "rate", "just"].includes(w.toLowerCase()),
  );
  return contentWords.slice(0, 2).join(" ") || "documentary background";
}

export async function generateImageQueries(
  shots: ShotContext[],
  opts?: { verbose?: boolean },
): Promise<ImageQuery[]> {
  const ImageQueryOutputSchema = z.object({
    shots: z.array(z.object({
      shotIndex: z.number().int().min(0),
      query: z.string().min(1),
      fallback: z.string().min(1),
    })),
  }).refine(
    (d) => d.shots.length === shots.length,
    { message: `Expected ${shots.length} shots but got {actual}` },
  );

  const shotLines = shots.map((sh) =>
    `[shot ${sh.shotIndex}] palette="${sh.palette}" sentence: "${sh.sentenceText}"`
  ).join("\n");

  const userPrompt = `Shot count: ${shots.length}\n\n${shotLines}\n\nProduce exactly ${shots.length} image queries.`;

  try {
    const result = await deepseekChatJson(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      ImageQueryOutputSchema,
      CODE_GEN_TEMPERATURE,
      NARRATION_REASONING,
      { runName: "docu/image-queries", verbose: opts?.verbose },
    );

    return result.shots
      .sort((a, b) => a.shotIndex - b.shotIndex)
      .map((s) => ({ slot: s.shotIndex, query: s.query, fallback: s.fallback }));
  } catch (err) {
    console.warn(
      `[docu/image-queries] LLM call failed (${err instanceof Error ? err.message : String(err)}); using derived fallback queries`,
    );
    return shots.map((sh) => {
      const fb = deriveFallbackQuery(sh.sentenceText);
      return { slot: sh.shotIndex, query: fb, fallback: "documentary background" };
    });
  }
}
