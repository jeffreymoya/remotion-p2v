import { deepseekChat } from "../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../config";
import type { ClipPlan } from "./video-query-prompt";

export interface ArtDirectionSentenceInput {
  sentenceIndex: number;
  text: string;
  tokenWordIndexes: number[];
}
import {
  ArtDirectionSchema,
  buildDefaultArtDirection,
  reconcileArtDirection,
  validateArtDirectionBounds,
} from "./art-direction-schema";
import type { ArtDirection } from "./art-direction-schema";

const SYSTEM_PROMPT = `You are an expert motion graphic art director for long-form YouTube video (10–15 minutes). This is NOT short-form content. Pacing is deliberate and visuals carry meaning over many seconds at a time.

Analyze each sentence and assign:
1. narrativeRole — what structural function the sentence plays in the story
2. captionStyle — "hero-quote" for sentences containing quoted speech, "word-by-word" otherwise
3. emphasisWordIndexes — 0 to 2 emotionally landing words per sentence (indexes into the sentence's words, 0-based)
4. Per-clip: kenBurns direction + overlayMood

## QUOTE DETECTION (mandatory rule)
If a sentence text contains double-quoted speech (surrounded by " " or " "), it MUST receive:
  captionStyle: "hero-quote"
  narrativeRole: "hero-quote"
  emphasisWordIndexes: [] (the quote speaks for itself)

## NARRATIVE ROLE RUBRIC (defaults — override when the specific content demands it)

hook: Opening line. Disrupts assumptions.
  → emphasisWordIndexes: 1-2 disruptive words ("isn't", "never", "wrong")
  → kenBurns: "zoom-out"  overlayMood: "dramatic" or "cool"

setup: Builds context before tension or reveal.
  → emphasisWordIndexes: 0-1 words
  → kenBurns: "zoom-in" or "pan-left"  overlayMood: "neutral" or "warm"

tension: Pivot sentence. Often contains "but", "yet", "however", "instead", "except".
  → emphasisWordIndexes: 1 pivot word
  → kenBurns: "pan-right"  overlayMood: "dramatic" or "moody"

reveal: The insight. The "so" or "the truth is" sentence.
  → emphasisWordIndexes: 1-2 nouns naming the insight
  → kenBurns: "zoom-out"  overlayMood: "warm" or "reflective"

payoff: Final punchy landing line (≤10 words).
  → emphasisWordIndexes: 1 final word ("you", "now", "start", "free")
  → kenBurns: "zoom-in"  overlayMood: "warm"

body: Informational content between structural beats. Common in long-form.
  → emphasisWordIndexes: 0-1 words (only if genuinely important)
  → kenBurns: "pan-left" or "zoom-in"  overlayMood: "neutral"

transition: Connective tissue. No narrative weight.
  → emphasisWordIndexes: []
  → overlayMood: inherit from surrounding context

hero-quote: Quoted speech that commands the screen.
  → captionStyle: "hero-quote" (REQUIRED)
  → emphasisWordIndexes: []

## KEN BURNS SEMANTIC GUIDE
zoom-in:  calm, building, intimacy, approaching
zoom-out: expansive, revelation, pulling back for perspective
pan-left: forward motion, progression
pan-right: reflection, contrast, "but..."

## OVERLAY MOOD & COLOR GRADING GUIDE
Each mood applies a distinct color grade (CSS filter) plus optional gradient overlays:
- "warm": golden highlights, slight saturation boost — comfort, hope, nostalgia
- "cool": blue-shifted, slightly desaturated — objectivity, distance, contemplation
- "dramatic": high contrast, crushed shadows — tension, stakes, confrontation
- "neutral": no grading — informational body content
- "moody": heavily desaturated, dark shadows, slight blue push — introspection, weight, gravity
- "reflective": sepia-tinted, soft — memory, looking back, gentle wisdom
- "melancholic": very desaturated, blue shadows — sadness, loss, longing
- "ethereal": slight overexposure, purple tint, low contrast — dreamlike, transcendent, surreal

Use "moody" or "melancholic" for heavy emotional beats. Use "reflective" for memoir or nostalgia content. Use "ethereal" for transcendent moments or abstract ideas. Vary moods across clips for visual storytelling.

## EMPHASIS WORD GUIDE
Pick words that carry contrast ("isn't", "but", "never") or are the payoff noun.
NOT articles, prepositions, conjunctions, or forms of "to be".
Maximum 2 per sentence. [] is valid.

## OUTPUT
Return JSON only, no markdown fences. Every clip listed below must have a directive. Every sentence listed below must have a directive.
Shape:
{
  "schemaVersion": 1,
  "clips": [
    { "clipIndex": 0, "kenBurns": "zoom-out", "overlayMood": "dramatic" }
  ],
  "sentences": [
    { "sentenceIndex": 0, "narrativeRole": "hook", "captionStyle": "word-by-word", "emphasisWordIndexes": [2] }
  ]
}`;

interface PromptInput {
  narration: string;
  sentences: ArtDirectionSentenceInput[];
  clipPlan: ClipPlan;
}

function buildUserPrompt({ narration, sentences, clipPlan }: PromptInput): string {
  const clipSummary = clipPlan.clips
    .map(
      (c, i) =>
        `[clip ${i}] query="${c.queries[0]}" sentences=[${c.sentenceIndexes.join(", ")}]`,
    )
    .join("\n");

  const sentenceSummary = sentences
    .map((s) => {
      const words = s.tokenWordIndexes.map((_, idx) => idx);
      return `[${s.sentenceIndex}] (wordCount=${words.length}) "${s.text}"`;
    })
    .join("\n");

  return `Narration:
"""
${narration}
"""

Clips:
${clipSummary}

Sentences (wordCount tells you the valid emphasisWordIndexes range, 0..wordCount-1):
${sentenceSummary}

Assign art direction. Return ONLY the JSON object.`;
}

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^[\s\n]*```(?:json)?\s*\n?/, "")
    .replace(/[\s\n]*```[\s\n]*$/, "")
    .trim();
}

interface GenerateOptions {
  verbose?: boolean;
}

export async function generateArtDirection(
  input: PromptInput,
  options?: GenerateOptions,
): Promise<ArtDirection> {
  const clipDefaults = input.clipPlan.clips.map((_, i) => ({ clipIndex: i }));
  const sentenceDefaults = input.sentences.map((s) => ({
    sentenceIndex: s.sentenceIndex,
    text: s.text,
  }));

  const fallback = (): ArtDirection =>
    buildDefaultArtDirection(clipDefaults, sentenceDefaults);

  let raw: string;
  try {
    raw = await deepseekChat(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
      CODE_GEN_TEMPERATURE,
      NARRATION_REASONING,
      { verbose: options?.verbose },
    );
  } catch (err) {
    console.warn(
      `  [artdirect] LLM call failed (${err instanceof Error ? err.message : String(err)}); using defaults`,
    );
    return fallback();
  }

  let parsed: ArtDirection;
  try {
    const cleaned = stripJsonFences(raw);
    parsed = ArtDirectionSchema.parse(JSON.parse(cleaned));
  } catch (err) {
    console.warn(
      `  [artdirect] failed to parse LLM output (${err instanceof Error ? err.message : String(err)}); using defaults`,
    );
    return fallback();
  }

  const sentenceBounds = input.sentences.map((s) => ({
    sentenceIndex: s.sentenceIndex,
    tokenWordIndexes: s.tokenWordIndexes,
  }));
  const boundErrors = validateArtDirectionBounds(
    parsed,
    input.clipPlan.clips.length,
    sentenceBounds,
  );
  if (boundErrors.length > 0) {
    for (const e of boundErrors) {
      console.warn(`  [artdirect] bound error: ${e}`);
    }
    console.warn(`  [artdirect] using reconciled directives where bounds failed`);
  }

  return reconcileArtDirection(parsed, clipDefaults, sentenceDefaults);
}
