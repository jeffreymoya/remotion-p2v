import type { WordTiming } from "../audio-wav";
import type { DocuOverlay } from "../../components/docu/DocumentaryComposition";
import type { DocuPalette } from "../../components/docu/docu-tokens";

export interface OverlaySpec {
  type: "headline-card" | "kinetic-number";
  text: string;
  value?: number;
  unit?: "$" | "%" | "x" | "T" | "B";
  source?: string;
  palette: DocuPalette;
  /** First word(s) of the phrase as spoken in narration. Multi-word phrases matched consecutively. */
  anchorPhrase: string;
  /** How long to show the overlay after the anchor word is reached, in seconds. */
  holdSec: number;
  /** Seconds to shift the start relative to the anchor word. Negative = appear before. Default 0. */
  leadSec?: number;
}

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
 * Resolve overlay frame positions from narration word timings.
 *
 * Each overlay anchors to a phrase spoken by the narrator. Consecutive
 * token matching handles multi-word phrases; normalization handles
 * punctuation/case differences (e.g. "$800" → "800", "Fed's" → "feds").
 *
 * When the full phrase doesn't match (e.g. TTS merged "9.1 percent" into
 * a single token "9.1%"), the resolver falls back to progressively shorter
 * prefixes — anchoring on the longest matching prefix.
 *
 * Throws with diagnostic context if even the first word isn't found.
 */
export function resolveOverlays(
  specs: OverlaySpec[],
  wordTimings: WordTiming[],
  fps: number,
): DocuOverlay[] {
  const normalized = wordTimings.map((w) => normalizeToken(w.word));

  return specs.map((spec) => {
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
      // Fall back to progressively shorter prefixes
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

    const overlay: DocuOverlay = {
      type: spec.type,
      text: spec.text,
      palette: spec.palette,
      startFrame,
      endFrame,
    };
    if (spec.value !== undefined) overlay.value = spec.value;
    if (spec.unit !== undefined) overlay.unit = spec.unit;
    if (spec.source !== undefined) overlay.source = spec.source;
    return overlay;
  });
}
