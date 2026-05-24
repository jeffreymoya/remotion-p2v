import type { AnchorStrategy } from "./types";

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
 * Default anchor strategy: match the spec's anchorPhrase as consecutive
 * normalized tokens in the word timing sequence. Falls back to progressively
 * shorter prefixes when full-phrase match fails (e.g. TTS merged tokens).
 */
export const phraseAnchorStrategy: AnchorStrategy = (ctx) => {
  const { spec, wordTimings, fps } = ctx;

  const normalized = wordTimings.map((w) => normalizeToken(w.word));

  const fullTokens = spec.anchorPhrase
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);

  if (fullTokens.length === 0) {
    throw new Error(
      `overlay-resolver: anchorPhrase "${spec.anchorPhrase}" normalizes to empty tokens`,
    );
  }

  let matchIdx = findConsecutiveMatch(fullTokens, normalized);

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
