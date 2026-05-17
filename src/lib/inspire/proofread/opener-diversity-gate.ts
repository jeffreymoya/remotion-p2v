import type { GateNote } from "../gates/gate-types";
import type { CrossChapterGateResult } from "./proofread-types";

export interface OpenerDiversityResult {
  result: CrossChapterGateResult;
  conflictPairs: Array<{ earlierIdx: number; laterIdx: number }>;
}

const FORMULAIC_OPENER_PATTERNS =
  /^(we tend to|most of us|the most stubborn myth|perhaps the|there is a)/i;

function extractFirstSentence(chapter: string): string {
  const match = chapter.match(/^[^.!?\n]+[.!?]/);
  return (match ? match[0] : chapter.slice(0, 120)).trim();
}

function firstThreeWords(sentence: string): string {
  return sentence.toLowerCase().split(/\s+/).slice(0, 3).join(" ");
}

/**
 * Deterministic gate: detects repeated rhetorical opener patterns across chapters.
 * Flags pairs where both openers match a formulaic pattern or share the same first 3 words.
 */
export function runOpenerDiversityCheck(
  chapters: readonly string[],
): OpenerDiversityResult {
  const openers = chapters.map((ch) => extractFirstSentence(ch));
  const normalized = openers.map((o) => o.toLowerCase());
  const notes: GateNote[] = [];
  const conflictPairs: Array<{ earlierIdx: number; laterIdx: number }> = [];

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const bothFormulaic =
        FORMULAIC_OPENER_PATTERNS.test(normalized[i]) &&
        FORMULAIC_OPENER_PATTERNS.test(normalized[j]);

      const sameThreeWords =
        firstThreeWords(normalized[i]) === firstThreeWords(normalized[j]) &&
        firstThreeWords(normalized[i]).length > 0;

      if (bothFormulaic || sameThreeWords) {
        conflictPairs.push({ earlierIdx: i, laterIdx: j });
        notes.push({
          gate: "opener-diversity",
          severity: "block",
          evidence: `Chapter ${i + 1}: "${openers[i].slice(0, 60)}" vs Chapter ${j + 1}: "${openers[j].slice(0, 60)}"`,
          message: `Chapters ${i + 1} and ${j + 1} open with the same rhetorical pattern`,
          suggestion: `Rewrite the opener of Chapter ${j + 1} to use a distinct rhetorical structure`,
        });
      }
    }
  }

  const pass = conflictPairs.length === 0;

  return {
    result: { gate: "opener-diversity", pass, notes },
    conflictPairs,
  };
}
