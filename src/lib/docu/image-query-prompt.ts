import { z } from "zod";
import { callStructured } from "./llm-client";
import { LLM_IMAGE_QUERY } from "../config";
import { llmSegmentImageQueryPrompt } from "../prompts";
import type { ImageQuery } from "./image-pipeline";
import type { DocuSegmentPlan } from "./segment-types";

export interface ShotContext {
  shotIndex: number;
  palette: "cool-tech" | "warm-real";
  sentenceText: string;
}

const PALETTE_FALLBACK_KEYWORD: Record<"cool-tech" | "warm-real", string> = {
  "cool-tech": "financial",
  "warm-real": "community",
};

const STOPWORDS = new Set([
  "the", "and", "for", "are", "was", "has", "been", "that", "this", "with",
  "from", "your", "have", "will", "they", "were", "when", "what", "their",
  "more", "than", "some", "into", "over", "each", "also", "very", "year",
  "rate", "just",
]);

const roleHints: Record<string, string> = {
  hook: "prefer striking, memorable imagery that grabs attention",
  context: "prefer institutional, system-level imagery — offices, trading floors, data centers",
  data: "prefer charts, trading floors, data screens, financial terminals, spreadsheets — visual data representations",
  consequence: "prefer human-scale imagery — families, homes, streets, storefronts, communities affected",
  cta: "prefer forward-looking, aspirational imagery — modern offices, city skylines, people working",
  build: "prefer process-oriented, construction-like imagery — growth, development, scale",
  turn: "prefer contrast imagery — before/after, two sides of street, opposing views",
};

function segmentSystemPrompt(plan: DocuSegmentPlan): string {
  const hint = roleHints[plan.role] ?? `focus on imagery appropriate for a "${plan.role}" segment`;
  return llmSegmentImageQueryPrompt({
    role: plan.role,
    title: plan.title,
    intent: plan.intent,
    hint,
  });
}

function deriveFallbackQuery(sentenceText: string, palette: "cool-tech" | "warm-real"): string {
  const words = sentenceText
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3); // stricter: drop short tokens like years ("2013")
  const contentWords = words.filter((w) => !STOPWORDS.has(w.toLowerCase()));
  const top = contentWords.slice(0, 3).join(" ");
  const paletteWord = PALETTE_FALLBACK_KEYWORD[palette];
  return top ? `${top} ${paletteWord}` : `${paletteWord} documentary`;
}

async function generateImageQueriesImpl(
  shots: ShotContext[],
  systemPrompt: string,
  runName: string,
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
    const result = await callStructured({
      schema: ImageQueryOutputSchema,
      system: systemPrompt,
      prompt: userPrompt,
      runName,
      verbose: opts?.verbose,
      llm: LLM_IMAGE_QUERY,
    });

    return result.shots
      .sort((a, b) => a.shotIndex - b.shotIndex)
      .map((s) => ({ slot: s.shotIndex, query: s.query, fallback: s.fallback }));
  } catch (err) {
    console.warn(
      `[${runName}] LLM call failed after retries (${err instanceof Error ? err.message : String(err)}); using palette-aware fallback queries`,
    );
    return shots.map((sh) => {
      const fb = deriveFallbackQuery(sh.sentenceText, sh.palette);
      return { slot: sh.shotIndex, query: fb, fallback: "documentary background" };
    });
  }
}

export async function generateSegmentImageQueries(
  plan: DocuSegmentPlan,
  shots: ShotContext[],
  opts?: { verbose?: boolean },
): Promise<ImageQuery[]> {
  return generateImageQueriesImpl(
    shots,
    segmentSystemPrompt(plan),
    `docu/image-queries/seg-${String(plan.index).padStart(2, "0")}`,
    opts,
  );
}
