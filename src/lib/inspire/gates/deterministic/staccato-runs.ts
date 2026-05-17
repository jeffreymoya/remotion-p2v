import { splitSentences } from "../../refine/text-metrics";
import type { GateNote } from "../gate-types";

export interface StaccatoViolation {
  windowStart: number;
  sentences: string[];
}

/**
 * Detect staccato sentence runs: any 4-sentence window containing ≥2 sentences
 * of ≤8 words is a violation. Prose must flow through clauses, not march
 * through clips.
 */
export function detectStaccatoRuns(text: string): StaccatoViolation[] {
  const sentences = splitSentences(text);
  const violations: StaccatoViolation[] = [];

  if (sentences.length < 4) return violations;

  for (let i = 0; i <= sentences.length - 4; i++) {
    const window = sentences.slice(i, i + 4);
    const shortCount = window.filter(
      (s) => countWords(s) <= 8,
    ).length;

    if (shortCount >= 2) {
      violations.push({
        windowStart: i,
        sentences: window,
      });
    }
  }

  return deduplicateOverlapping(violations);
}

export function staccatoRunsToNotes(violations: StaccatoViolation[]): GateNote[] {
  return violations.map((v) => ({
    gate: "genre_tells",
    severity: "block" as const,
    evidence: v.sentences.map((s) => s.slice(0, 40)).join(" | "),
    message: `Staccato run: ${v.sentences.filter((s) => countWords(s) <= 8).length} sentences of ≤8 words in a 4-sentence window (starting at sentence ${v.windowStart + 1}).`,
    suggestion: "Combine short sentences into flowing clauses with subordinate structure. Avoid the clipped-beat cadence.",
  }));
}

function countWords(sentence: string): number {
  return sentence
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function deduplicateOverlapping(violations: StaccatoViolation[]): StaccatoViolation[] {
  if (violations.length === 0) return violations;

  const result: StaccatoViolation[] = [violations[0]];
  for (let i = 1; i < violations.length; i++) {
    const prev = result[result.length - 1];
    // Skip if this window overlaps with the previous by ≥3 sentences
    if (violations[i].windowStart - prev.windowStart < 3) continue;
    result.push(violations[i]);
  }
  return result;
}
