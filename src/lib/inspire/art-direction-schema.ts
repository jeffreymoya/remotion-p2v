import { z } from "zod";

export const NarrativeRoleSchema = z.enum([
  "hook",
  "setup",
  "tension",
  "reveal",
  "payoff",
  "hero-quote",
  "body",
  "transition",
]);

export const CaptionStyleSchema = z.enum(["word-by-word", "hero-quote"]);

export const KenBurnsDirectionSchema = z.enum([
  "zoom-in",
  "zoom-out",
  "pan-left",
  "pan-right",
]);

export const OverlayMoodSchema = z.enum(["warm", "cool", "dramatic", "neutral"]);

export const SentenceDirectiveSchema = z.object({
  sentenceIndex: z.number().int().min(0),
  narrativeRole: NarrativeRoleSchema,
  captionStyle: CaptionStyleSchema,
  emphasisWordIndexes: z.array(z.number().int().min(0)).max(2),
});

export const ClipDirectiveSchema = z.object({
  clipIndex: z.number().int().min(0),
  kenBurns: KenBurnsDirectionSchema,
  overlayMood: OverlayMoodSchema,
});

export const ArtDirectionSchema = z.object({
  schemaVersion: z.literal(1),
  clips: z.array(ClipDirectiveSchema),
  sentences: z.array(SentenceDirectiveSchema),
});

export type ArtDirection = z.infer<typeof ArtDirectionSchema>;
export type ClipDirective = z.infer<typeof ClipDirectiveSchema>;
export type SentenceDirective = z.infer<typeof SentenceDirectiveSchema>;
export type NarrativeRole = z.infer<typeof NarrativeRoleSchema>;
export type CaptionStyle = z.infer<typeof CaptionStyleSchema>;
export type KenBurnsDirection = z.infer<typeof KenBurnsDirectionSchema>;
export type OverlayMood = z.infer<typeof OverlayMoodSchema>;

interface SentenceBounds {
  sentenceIndex: number;
  tokenWordIndexes: number[];
}

export function validateArtDirectionBounds(
  ad: ArtDirection,
  clipCount: number,
  sentences: SentenceBounds[],
): string[] {
  const errors: string[] = [];

  for (const c of ad.clips) {
    if (c.clipIndex >= clipCount) {
      errors.push(`clip clipIndex ${c.clipIndex} out of bounds (clipCount=${clipCount})`);
    }
  }

  for (const s of ad.sentences) {
    const sent = sentences.find((x) => x.sentenceIndex === s.sentenceIndex);
    if (!sent) {
      errors.push(`sentenceIndex ${s.sentenceIndex} not found in narration`);
      continue;
    }
    for (const wi of s.emphasisWordIndexes) {
      if (wi >= sent.tokenWordIndexes.length) {
        errors.push(
          `emphasisWordIndex ${wi} out of bounds for sentence ${s.sentenceIndex} (wordCount=${sent.tokenWordIndexes.length})`,
        );
      }
    }
  }

  return errors;
}

/**
 * Quote sentences must always receive hero-quote treatment regardless of LLM output.
 * Matches both ASCII straight quotes and Unicode curly quotes.
 */
const QUOTE_PATTERN =
  /["“”‟″][^"“”‟″]{4,}["“”‟″]/;
const LEADING_QUOTE_PATTERN = /^["“”‟″]/;

export function isQuoteSentence(rawText: string): boolean {
  return QUOTE_PATTERN.test(rawText) || LEADING_QUOTE_PATTERN.test(rawText.trim());
}

interface DefaultBuilderClip {
  clipIndex: number;
}

interface DefaultBuilderSentence {
  sentenceIndex: number;
  text: string;
}

const DEFAULT_CYCLE: KenBurnsDirection[] = [
  "zoom-in",
  "zoom-out",
  "pan-left",
  "pan-right",
];

export function buildDefaultArtDirection(
  clips: DefaultBuilderClip[],
  sentences: DefaultBuilderSentence[],
): ArtDirection {
  return {
    schemaVersion: 1,
    clips: clips.map((c) => ({
      clipIndex: c.clipIndex,
      kenBurns: DEFAULT_CYCLE[c.clipIndex % DEFAULT_CYCLE.length],
      overlayMood: "neutral",
    })),
    sentences: sentences.map((s) => {
      const quoted = isQuoteSentence(s.text);
      return {
        sentenceIndex: s.sentenceIndex,
        narrativeRole: quoted ? "hero-quote" : "body",
        captionStyle: quoted ? "hero-quote" : "word-by-word",
        emphasisWordIndexes: [],
      };
    }),
  };
}

/**
 * Merge an LLM-produced ArtDirection with deterministic overrides for quote sentences,
 * and fill in defaults for any clip/sentence the LLM forgot.
 */
export function reconcileArtDirection(
  ad: ArtDirection,
  clips: DefaultBuilderClip[],
  sentences: DefaultBuilderSentence[],
): ArtDirection {
  const defaults = buildDefaultArtDirection(clips, sentences);

  const clipById = new Map(ad.clips.map((c) => [c.clipIndex, c]));
  const mergedClips = defaults.clips.map(
    (d) => clipById.get(d.clipIndex) ?? d,
  );

  const sentById = new Map(ad.sentences.map((s) => [s.sentenceIndex, s]));
  const mergedSentences = defaults.sentences.map((d) => {
    const fromLlm = sentById.get(d.sentenceIndex);
    if (!fromLlm) return d;
    const quoted = d.captionStyle === "hero-quote";
    if (quoted) {
      return {
        ...fromLlm,
        captionStyle: "hero-quote" as const,
        narrativeRole: "hero-quote" as const,
        emphasisWordIndexes: [],
      };
    }
    return fromLlm;
  });

  return {
    schemaVersion: 1,
    clips: mergedClips,
    sentences: mergedSentences,
  };
}
