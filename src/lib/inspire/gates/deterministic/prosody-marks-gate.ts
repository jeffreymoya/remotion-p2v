import type { Gate, GateContext, GateResult, GateNote } from "../gate-types";
import {
  PROSODY_MIN_MARKS,
  PROSODY_MIN_DISTINCT_MARK_TYPES,
  PROSODY_MIN_LONG_PAUSES,
} from "../../../config";

type ProsodyMarkType = "ellipsis" | "dash" | "parenthetical" | "paragraph-break";

interface ProsodyMark {
  type: ProsodyMarkType;
  index: number;
}

function findProsodyMarks(narration: string): ProsodyMark[] {
  const marks: ProsodyMark[] = [];

  // Ellipsis variants (... / ... ... / ... ... ...)
  const ellipsisPattern = /\.{3,}/g;
  let match: RegExpExecArray | null;
  while ((match = ellipsisPattern.exec(narration)) !== null) {
    marks.push({ type: "ellipsis", index: match.index });
  }

  // Em-dash
  const dashPattern = /—/g;
  while ((match = dashPattern.exec(narration)) !== null) {
    marks.push({ type: "dash", index: match.index });
  }

  // Parentheticals
  const parenPattern = /\([^)]+\)/g;
  while ((match = parenPattern.exec(narration)) !== null) {
    marks.push({ type: "parenthetical", index: match.index });
  }

  // Paragraph breaks (double newline)
  const paraPattern = /\n\n+/g;
  while ((match = paraPattern.exec(narration)) !== null) {
    marks.push({ type: "paragraph-break", index: match.index });
  }

  return marks;
}

function countLongPauses(narration: string): number {
  return (narration.match(/\.{3}\s+\.{3}\s+\.{3}/g) ?? []).length;
}

export const prosodyMarksGate: Gate = {
  name: "prosody_marks",
  kind: "deterministic",
  async run(narration: string, _ctx: GateContext): Promise<GateResult> {
    const notes: GateNote[] = [];
    const marks = findProsodyMarks(narration);
    const distinctTypes = new Set(marks.map((m) => m.type));
    const longPauseCount = countLongPauses(narration);

    if (marks.length < PROSODY_MIN_MARKS) {
      notes.push({
        gate: "prosody_marks",
        severity: "block",
        evidence: `Found ${marks.length} prosody marks (need ≥${PROSODY_MIN_MARKS})`,
        message: `Only ${marks.length} prosody marks found. Minimum is ${PROSODY_MIN_MARKS} for pacing variety.`,
        suggestion: `Add pauses: "..." (short), "... ..." (medium), "... ... ..." (long), "—" (abrupt shift), "( )" (aside), paragraph breaks.`,
      });
    }

    if (distinctTypes.size < PROSODY_MIN_DISTINCT_MARK_TYPES) {
      notes.push({
        gate: "prosody_marks",
        severity: "warn",
        evidence: `Found ${distinctTypes.size} distinct mark types: [${[...distinctTypes].join(", ")}]`,
        message: `Only ${distinctTypes.size} distinct mark types (need ≥${PROSODY_MIN_DISTINCT_MARK_TYPES}).`,
        suggestion: `Use at least ${PROSODY_MIN_DISTINCT_MARK_TYPES} different prosody mark types for pacing variety.`,
      });
    }

    if (longPauseCount < PROSODY_MIN_LONG_PAUSES) {
      notes.push({
        gate: "prosody_marks",
        severity: "block",
        evidence: `Found ${longPauseCount} long-pause marks (need ≥${PROSODY_MIN_LONG_PAUSES})`,
        message: `No "... ... ..." long-pause mark found. At least one required per chapter for reflection beats.`,
        suggestion: `Add one "... ... ..." long pause before a major citation or inflection point, followed by a concrete question about the protagonist.`,
      });
    }

    return {
      gate: "prosody_marks",
      pass: notes.filter((n) => n.severity === "block").length === 0,
      notes,
      metrics: {
        totalMarks: marks.length,
        distinctTypes: distinctTypes.size,
        types: [...distinctTypes].join(", "),
        longPauseCount,
      },
    };
  },
};
