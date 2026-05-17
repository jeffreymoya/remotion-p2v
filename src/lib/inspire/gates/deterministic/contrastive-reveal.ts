import { splitSentences } from "../../refine/text-metrics";
import type { GateNote } from "../gate-types";

export interface ContrastiveRevealViolation {
  sentenceA: string;
  sentenceB: string;
  index: number;
}

/**
 * Detect the AI-tic two-part contrastive reveal:
 * "[X] is/was/are/were not [Y]. [X] is/was/are/were [Z]."
 *
 * Two consecutive sentences where the first negates and the second affirms
 * with the same subject and verb pattern. Reframes must occur inside a single
 * sentence with an embedded clause, not as twin clipped beats.
 */
export function detectContrastiveReveal(text: string): ContrastiveRevealViolation[] {
  const sentences = splitSentences(text);
  const violations: ContrastiveRevealViolation[] = [];

  for (let i = 0; i < sentences.length - 1; i++) {
    const current = sentences[i];
    const next = sentences[i + 1];

    const negation = parseNegation(current);
    if (!negation) continue;

    const affirmation = parseAffirmation(next);
    if (!affirmation) continue;

    // Check if subjects match (case-insensitive, normalized)
    if (normalizeSubject(negation.subject) === normalizeSubject(affirmation.subject)) {
      violations.push({
        sentenceA: current,
        sentenceB: next,
        index: i,
      });
    }
  }

  return violations;
}

export function contrastiveRevealToNotes(violations: ContrastiveRevealViolation[]): GateNote[] {
  return violations.map((v) => ({
    gate: "genre_tells",
    severity: "block" as const,
    evidence: `"${v.sentenceA.slice(0, 50)}..." + "${v.sentenceB.slice(0, 50)}..."`,
    message: `Two-part contrastive reveal at sentence ${v.index + 1}: negation followed by parallel affirmation. This is a banned AI-tic pattern.`,
    suggestion: "Fold the reframe into a single flowing sentence with an embedded clause (e.g., '...is not X but Y, because...'). Never use twin clipped beats.",
  }));
}

// ── Pattern matchers ──────────────────────────────────────────────────────

const NEGATION_PATTERN = /^(.+?)\s+(is|was|are|were|isn't|wasn't|aren't|weren't)\s+not\s+/i;
const NEGATION_PATTERN_ALT = /^(.+?)\s+(is|was|are|were)n['']t\s+/i;

const AFFIRMATION_PATTERN = /^(.+?)\s+(is|was|are|were)\s+(?!not\b)/i;

interface ParsedClause {
  subject: string;
  verb: string;
}

function parseNegation(sentence: string): ParsedClause | null {
  const match = sentence.match(NEGATION_PATTERN) ?? sentence.match(NEGATION_PATTERN_ALT);
  if (!match) return null;
  return { subject: match[1], verb: match[2] };
}

function parseAffirmation(sentence: string): ParsedClause | null {
  const match = sentence.match(AFFIRMATION_PATTERN);
  if (!match) return null;
  return { subject: match[1], verb: match[2] };
}

function normalizeSubject(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
