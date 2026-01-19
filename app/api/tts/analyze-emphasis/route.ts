import { NextResponse } from "next/server";
import { z } from "zod";
import { getBoardsAIService } from "@/src/lib/boards/ai-service";
import { emphasisTaggingPrompt } from "@/config/prompts/emphasis.prompt";

const requestSchema = z.object({
  projectId: z.string().min(1),
  segmentIndex: z.number().int().nonnegative(),
  text: z.string().min(1),
});

const emphasisResponseSchema = z.object({
  emphasisTags: z.array(
    z.object({
      wordIndex: z.number().int().nonnegative(),
      level: z.enum(["med", "high"]),
      tone: z.enum(["warm", "intense"]).optional(),
    })
  ),
});

type EmphasisData = {
  wordIndex: number;
  word: string;
  level: "med" | "high";
  tone?: "warm" | "intense";
};

/**
 * Validates and enforces emphasis constraints
 * - Total emphasis count ≤ 20% of word count
 * - High emphasis count ≤ 5% of word count
 * - No consecutive high-emphasis words (enforce 2+ word gap)
 */
function validateEmphasisConstraints(
  emphases: EmphasisData[],
  wordCount: number
): EmphasisData[] {
  if (emphases.length === 0) return emphases;

  const maxTotal = Math.ceil(wordCount * 0.2); // 20% total
  const maxHigh = Math.ceil(wordCount * 0.05); // 5% high

  // Sort by wordIndex
  const sorted = [...emphases].sort((a, b) => a.wordIndex - b.wordIndex);

  // Filter out emphases exceeding 20% total cap
  let filtered = sorted.slice(0, maxTotal);

  // Enforce high emphasis cap (5%)
  const highEmphases = filtered.filter((e) => e.level === "high");
  if (highEmphases.length > maxHigh) {
    // Keep first maxHigh high-emphasis words, convert rest to med
    const keptHigh = new Set(highEmphases.slice(0, maxHigh).map((e) => e.wordIndex));
    filtered = filtered.map((e) => {
      if (e.level === "high" && !keptHigh.has(e.wordIndex)) {
        return { ...e, level: "med" as const };
      }
      return e;
    });
  }

  // Enforce 2-word gap between high-emphasis words (at least 2 words in between)
  const finalFiltered: EmphasisData[] = [];
  let lastHighIndex = -4; // Start at -4 so first word can be high (0 - (-4) = 4 >= 3)

  for (const emphasis of filtered) {
    if (emphasis.level === "high") {
      if (emphasis.wordIndex - lastHighIndex >= 3) {
        finalFiltered.push(emphasis);
        lastHighIndex = emphasis.wordIndex;
      } else {
        // Too close to previous high, convert to med
        finalFiltered.push({ ...emphasis, level: "med" });
      }
    } else {
      finalFiltered.push(emphasis);
    }
  }

  return finalFiltered;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { text } = parsed.data;

  try {
    // Get emphasis tags from AI
    const aiService = getBoardsAIService();
    const prompt = emphasisTaggingPrompt(text);
    const result = await aiService.structuredComplete(
      prompt,
      emphasisResponseSchema,
      "tts-emphasis"
    );

    // Extract words from text
    const words = text
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    // Convert to full emphasis data with word strings
    const rawEmphases: EmphasisData[] = result.emphasisTags.map((tag) => ({
      wordIndex: tag.wordIndex,
      word: words[tag.wordIndex] || "",
      level: tag.level,
      tone: tag.tone,
    }));

    // Validate and enforce constraints
    const validatedEmphases = validateEmphasisConstraints(rawEmphases, words.length);

    return NextResponse.json({
      emphasisMarkers: validatedEmphases,
      totalWords: words.length,
      emphasisCount: validatedEmphases.length,
      highCount: validatedEmphases.filter((e) => e.level === "high").length,
      medCount: validatedEmphases.filter((e) => e.level === "med").length,
    });
  } catch (error) {
    console.error("[api/tts/analyze-emphasis] Error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to analyze emphasis" },
      { status: 500 }
    );
  }
}
