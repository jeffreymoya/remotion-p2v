import type { GateNote } from "../gate-types";

export interface MetaNarrationViolation {
  match: string;
  index: number;
}

const META_NARRATION_PATTERNS: RegExp[] = [
  /\bwhat I want you to feel\b/i,
  /\bwhat matters here is\b/i,
  /\bthe paradigm shift is\b/i,
  /\bthe takeaway is\b/i,
  /\bthe lesson here is\b/i,
  /\bthe point is\b/i,
  /\bhere's the thing\b/i,
  /\bhere is the thing\b/i,
  /\bthe actual mechanism\b/i,
  /\bthe receipt\b/i,
  /\bthis is what .{0,20} looks like\b/i,
  /\bwhat you (should|need to) feel\b/i,
  /\bthe cost\b(?! of)/i,
  /\bthe inspirational version\b/i,
  /\bwhat (I|we) (are|were) really (saying|talking about)\b/i,
];

/**
 * Detect meta-narration / stage direction: the author announcing what the
 * chapter is doing or telling the audience what to feel. These phrases break
 * the essayist register by making the rhetorical machinery visible.
 */
export function detectMetaNarration(text: string): MetaNarrationViolation[] {
  const violations: MetaNarrationViolation[] = [];

  for (const pattern of META_NARRATION_PATTERNS) {
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

export function metaNarrationToNotes(violations: MetaNarrationViolation[]): GateNote[] {
  return violations.map((v) => ({
    gate: "genre_tells",
    severity: "block" as const,
    evidence: v.match,
    message: `Meta-narration detected: "${v.match}" — do not announce the rhetorical move or tell the listener what to feel.`,
    suggestion: "Remove this phrase entirely. Let the argument land through evidence and structure, not through stage direction.",
  }));
}
