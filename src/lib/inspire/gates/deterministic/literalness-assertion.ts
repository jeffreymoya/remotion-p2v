import type { GateNote } from "../gate-types";

export interface LiteralnessAssertionViolation {
  match: string;
  index: number;
}

/**
 * Detect literalness assertions: the author instructing the reader how to
 * decode imagery by explicitly stating something is/isn't metaphorical,
 * symbolic, figurative, etc. This is a technique class (like meta-narration),
 * not a list of banned phrases.
 *
 * Examples: "The drain is not metaphorical", "I mean that literally",
 * "This is not a metaphor".
 */
const LITERALNESS_ASSERTION_PATTERNS: RegExp[] = [
  /\b(?:is|isn'?t|are|aren'?t|was|wasn'?t)\s+not\s+(?:metaphorical|a\s+metaphor|symbolic|figurative|allegorical|an\s+allegory)\b/i,
  /\b(?:is|isn'?t|are|aren'?t)\s+(?:literal|meant\s+literally|to\s+be\s+taken\s+literally)\b/i,
  /\bI\s+mean\s+that\s+literally\b/i,
  /\bthis\s+is\s+(?:not\s+)?(?:a\s+)?(?:metaphor|symbol|allegory)\b/i,
];

export function detectLiteralnessAssertion(text: string): LiteralnessAssertionViolation[] {
  const violations: LiteralnessAssertionViolation[] = [];

  for (const pattern of LITERALNESS_ASSERTION_PATTERNS) {
    const global = new RegExp(pattern.source, "gi");
    let match: RegExpExecArray | null;
    while ((match = global.exec(text)) !== null) {
      violations.push({
        match: match[0],
        index: match.index,
      });
    }
  }

  return violations;
}

export function literalnessAssertionToNotes(violations: LiteralnessAssertionViolation[]): GateNote[] {
  return violations.map((v) => ({
    gate: "genre_tells",
    severity: "block" as const,
    evidence: v.match,
    message: `Literalness assertion detected: "${v.match}" — do not tell the reader how to decode imagery.`,
    suggestion: "Remove this phrase. Let the reader decide what is literal or figurative from the evidence presented.",
  }));
}
