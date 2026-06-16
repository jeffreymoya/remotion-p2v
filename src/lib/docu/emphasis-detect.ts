/**
 * Deterministic emphasis-word detection for narration.
 *
 * Two independent, pure jobs:
 *  1. Matching — resolve emphasis phrases (possibly multi-word) to contiguous
 *     word-index ranges within a spoken word list. Replaces the single-token
 *     exact match that silently dropped multi-word phrases.
 *  2. Selection — score and prune raw emphasis candidates to the strongest
 *     1..N targets per sentence, following the kinetic-typography guidance:
 *     prefer numbers, money, percentages, dates, named entities and short risk
 *     phrases; reject lone filler words; cap density so emphasis stays
 *     meaningful ("if everything is emphasized, nothing is").
 */

/** Default maximum emphasised targets per sentence (doc: 1-3 per sentence). */
export const MAX_EMPHASIS_PER_SENTENCE = 3;

/**
 * Normalise a token for matching. Keeps digits plus `%` and `$` because those
 * carry emphasis meaning (rates, money); strips other punctuation and case.
 */
export function normalizeEmphasisToken(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9%$]/g, "");
}

/** Split text into normalised, non-empty tokens. */
export function tokenizeEmphasis(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normalizeEmphasisToken)
    .filter((token) => token.length > 0);
}

/**
 * Filler words that must never stand alone as an emphasis target. A multi-word
 * phrase that merely contains a stopword is still allowed.
 */
export const EMPHASIS_STOPWORDS: ReadonlySet<string> = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for",
  "with", "by", "is", "are", "was", "were", "be", "been", "being", "am", "do",
  "does", "did", "has", "have", "had", "it", "its", "this", "that", "these",
  "those", "as", "from", "into", "than", "then", "so", "very", "just", "really",
  "more", "most", "much", "such", "also", "about", "over", "under", "up", "down",
  "out", "off", "if", "we", "you", "they", "i", "he", "she", "them", "his",
  "her", "their", "our", "your", "my", "me", "us", "not", "no", "will", "would",
  "can", "could", "should", "may", "might", "there", "here",
]);

export interface PhraseMatch {
  /** Index of the first matched word. */
  readonly start: number;
  /** Index of the last matched word (inclusive). */
  readonly end: number;
}

/**
 * First contiguous match of `phrase` within `words` (both compared after
 * normalisation). Returns null when the phrase is empty or not found.
 */
export function matchPhrase(words: readonly string[], phrase: string): PhraseMatch | null {
  const phraseTokens = tokenizeEmphasis(phrase);
  if (phraseTokens.length === 0 || phraseTokens.length > words.length) return null;

  for (let i = 0; i <= words.length - phraseTokens.length; i++) {
    let matched = true;
    for (let j = 0; j < phraseTokens.length; j++) {
      if (words[i + j] !== phraseTokens[j]) {
        matched = false;
        break;
      }
    }
    if (matched) return { start: i, end: i + phraseTokens.length - 1 };
  }
  return null;
}

/**
 * Resolve emphasis phrases to a sorted, de-duplicated list of word indexes
 * within an already-normalised word list. Phrase-aware: a multi-word emphasis
 * highlights every word of the matched span.
 */
export function resolveEmphasisIndexes(
  normalizedWords: readonly string[],
  emphases: readonly string[],
): number[] {
  const indexes = new Set<number>();
  for (const phrase of emphases) {
    const match = matchPhrase(normalizedWords, phrase);
    if (!match) continue;
    for (let i = match.start; i <= match.end; i++) indexes.add(i);
  }
  return [...indexes].sort((a, b) => a - b);
}

const YEAR_RE = /\b\d{4}\b/;
const MONTH_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;

/**
 * Score an emphasis candidate. Higher is stronger; a score of 0 or less means
 * the candidate should be rejected (e.g. a lone filler word). Scored on the raw
 * (original-case) string so capitalisation and symbols remain visible.
 */
export function scoreEmphasisTarget(phrase: string): number {
  const tokens = tokenizeEmphasis(phrase);
  if (tokens.length === 0) return 0;

  // A single bare stopword carries no emphasis value.
  if (tokens.length === 1 && EMPHASIS_STOPWORDS.has(tokens[0])) return 0;

  const words = phrase.trim().split(/\s+/).filter(Boolean);
  let score = 1; // base value for any content word

  if (/[0-9]/.test(phrase)) score += 3; // concrete numbers
  if (/[$%]/.test(phrase)) score += 2; // money / rates
  if (YEAR_RE.test(phrase) || MONTH_RE.test(phrase)) score += 1.5; // dates
  if (words.length >= 2 && words.length <= 4) score += 1.5; // short risk / contrast phrase

  // Capitalised, non-leading words read as named entities.
  const proper = words.filter((word, i) => i > 0 && /^[A-Z]/.test(word)).length;
  score += Math.min(2, proper);

  // Very long spans are hard to read in fast cuts.
  if (words.length > 5) score -= 2;

  // Penalise candidates that are mostly filler.
  const stopRatio = tokens.filter((token) => EMPHASIS_STOPWORDS.has(token)).length / tokens.length;
  if (stopRatio >= 0.75) score -= 2;

  return score;
}

/**
 * Filter and rank raw emphasis candidates to the strongest unique targets,
 * capped at `max`. Drops rejected candidates (score <= 0) and de-duplicates by
 * normalised form. Equally-scored candidates keep their original order so the
 * result is stable.
 */
export function selectEmphasis(
  candidates: readonly string[],
  max: number = MAX_EMPHASIS_PER_SENTENCE,
): string[] {
  const seen = new Set<string>();
  const scored: Array<{ phrase: string; score: number; order: number }> = [];

  candidates.forEach((phrase, order) => {
    const key = tokenizeEmphasis(phrase).join(" ");
    if (key.length === 0 || seen.has(key)) return;
    const score = scoreEmphasisTarget(phrase);
    if (score <= 0) return;
    seen.add(key);
    scored.push({ phrase, score, order });
  });

  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  return scored.slice(0, Math.max(1, max)).map((entry) => entry.phrase);
}
