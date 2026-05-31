import type { AnchorStrategy } from "./types";
import { toSpokenForm } from "../../shared/numeric-normalize";

export function normalizeToken(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findConsecutiveMatch(
  phraseTokens: string[],
  normalized: string[],
): number {
  const len = phraseTokens.length;
  for (let i = 0; i <= normalized.length - len; i++) {
    let j = 0;
    for (; j < len; j++) {
      if (normalized[i + j] !== phraseTokens[j]) break;
    }
    if (j === len) return i;
  }
  return -1;
}

/**
 * Levenshtein distance with early exit once it exceeds `max`. Bounded `max`
 * keeps this cheap (used only for ≤1 fuzzy matching).
 */
function levenshteinWithin(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      curr.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return false;
    prev = curr;
  }
  return prev[b.length] <= max;
}

/**
 * Like `findConsecutiveMatch`, but tolerates a Levenshtein ≤1 drift per token
 * (e.g. contraction/inflection residue). Restricted to tokens of length ≥4 so a
 * one-character edit cannot equate two distinct short tokens.
 */
function findFuzzyConsecutiveMatch(
  phraseTokens: string[],
  normalized: string[],
): number {
  const len = phraseTokens.length;
  for (let i = 0; i <= normalized.length - len; i++) {
    let j = 0;
    for (; j < len; j++) {
      const a = phraseTokens[j];
      const b = normalized[i + j];
      if (a === b) continue;
      if (a.length >= 4 && b.length >= 4 && levenshteinWithin(a, b, 1)) continue;
      break;
    }
    if (j === len) return i;
  }
  return -1;
}

/**
 * Default anchor strategy: match the spec's anchorPhrase as consecutive
 * normalized tokens in the word timing sequence. Falls back to progressively
 * shorter prefixes when full-phrase match fails (e.g. TTS merged tokens).
 */
export const phraseAnchorStrategy: AnchorStrategy = (ctx) => {
  const { spec, wordTimings, fps } = ctx;

  const normalized = wordTimings.map((w) => normalizeToken(w.word));

  // Spoken-form the anchorPhrase only: TTS word timings are already spelled-out
  // spoken words, so expanding "$2.5T" → "two point five trillion dollars" on
  // the phrase side lets it align to the spoken token stream. Expanding the
  // word-timing side instead would break the 1:1 index→frame mapping.
  const fullTokens = toSpokenForm(spec.anchorPhrase)
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);

  if (fullTokens.length === 0) {
    throw new Error(
      `overlay-resolver: anchorPhrase "${spec.anchorPhrase}" normalizes to empty tokens`,
    );
  }

  let matchIdx = findConsecutiveMatch(fullTokens, normalized);

  // Edit-distance fallback (≤1 per token) before degrading to prefix truncation.
  if (matchIdx === -1) {
    matchIdx = findFuzzyConsecutiveMatch(fullTokens, normalized);
    if (matchIdx !== -1) {
      console.warn(
        `overlay-resolver: fuzzy-matched anchorPhrase "${spec.anchorPhrase}" ` +
        `(edit-distance ≤1 per token against TTS word timings)`,
      );
    }
  }

  if (matchIdx === -1) {
    for (let keep = fullTokens.length - 1; keep >= 1; keep--) {
      const prefix = fullTokens.slice(0, keep);
      matchIdx = findConsecutiveMatch(prefix, normalized);
      if (matchIdx !== -1) {
        console.warn(
          `overlay-resolver: truncated anchorPhrase "${spec.anchorPhrase}" → "${spec.anchorPhrase.split(/\s+/).slice(0, keep).join(" ")}" ` +
          `(trailing tokens not found in TTS word timings)`,
        );
        break;
      }
    }
  }

  if (matchIdx === -1) {
    const nearby = normalized
      .filter((w) => w.includes(fullTokens[0]))
      .slice(0, 5)
      .join(", ");
    throw new Error(
      `overlay-resolver: phrase "${spec.anchorPhrase}" not found in wordTimings. ` +
        `Tokens containing "${fullTokens[0]}": [${nearby || "none"}]`,
    );
  }

  const anchorSec = wordTimings[matchIdx].startSeconds;
  const lead = spec.leadSec ?? 0;
  const startFrame = Math.floor((anchorSec + lead) * fps);
  const endFrame = Math.ceil((anchorSec + lead + spec.holdSec) * fps);

  return { startFrame, endFrame };
};
