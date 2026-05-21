import type { GateNote } from "../gate-types";
import { splitSentences } from "../../refine/text-metrics";

/**
 * Detects paradigm-challenge openers: first sentence of a chapter uses
 * collective-address framing ("we", "us", "most people", "many of us")
 * combined with a negation or correction claim, before any named person
 * or scene is established.
 */

const COLLECTIVE_PRONOUNS = /\b(we|us|our|most people|many of us|most of us|all of us|everyone|we've|we're|we all)\b/i;
const CORRECTION_SIGNALS = /\b(wrong|lie|myth|sold|nobody|no one|don't tell|misunderstood|misled|deceived|fooled|tricked|mistaken|false|illusion|delusion|never told|won't tell|been told|taught wrong|got it backwards|been sold)\b/i;

export function detectParadigmChallengeOpener(narration: string): GateNote[] {
  const sentences = splitSentences(narration);
  if (sentences.length === 0) return [];

  const firstSentence = sentences[0];
  const hasCollective = COLLECTIVE_PRONOUNS.test(firstSentence);
  const hasCorrection = CORRECTION_SIGNALS.test(firstSentence);

  if (hasCollective && hasCorrection) {
    return [
      {
        gate: "genre_tells",
        severity: "block",
        evidence: firstSentence.slice(0, 100),
        message: `Paradigm-challenge opener: collective address + correction claim before scene`,
        suggestion: `Open in scene — place a named person in a specific moment before any collective address or correction claim.`,
      },
    ];
  }

  return [];
}
