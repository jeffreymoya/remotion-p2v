import type { WordTimestamp } from "./types";

const STRONG_PUNCT = /[.!?]$/;
const WEAK_PUNCT = /[,;:]$/;

/**
 * Snap a target time (relative to the segment audio start) to the nearest
 * word-boundary that ends with sentence-style punctuation, within tolerance.
 *
 * Strong boundaries (`.`/`!`/`?`) are preferred. If none falls within tolerance,
 * weak boundaries (`,`/`;`/`:`) are tried. Falls back to the original target
 * when no candidate qualifies.
 *
 * Punctuation is read off the timestamp's `word` field first; when Google TTS
 * timestamps strip punctuation, the segment text is tokenized and the i-th
 * token is checked instead.
 */
export function snapToSentenceBoundary(
  targetMs: number,
  timestamps: WordTimestamp[],
  segmentText: string,
  toleranceMs = 300
): number {
  if (!timestamps.length) return targetMs;
  const tokens = segmentText.split(/\s+/).filter(Boolean);

  const strong: number[] = [];
  const weak: number[] = [];
  timestamps.forEach((ts, i) => {
    const word = ts.word ?? "";
    const token = tokens[i] ?? "";
    if (STRONG_PUNCT.test(word) || STRONG_PUNCT.test(token)) {
      strong.push(ts.endMs);
    } else if (WEAK_PUNCT.test(word) || WEAK_PUNCT.test(token)) {
      weak.push(ts.endMs);
    }
  });

  const nearest = (cands: number[]): number | null => {
    let best: number | null = null;
    let bestDist = Infinity;
    for (const v of cands) {
      const d = Math.abs(v - targetMs);
      if (d <= toleranceMs && d < bestDist) {
        best = v;
        bestDist = d;
      }
    }
    return best;
  };

  return nearest(strong) ?? nearest(weak) ?? targetMs;
}
