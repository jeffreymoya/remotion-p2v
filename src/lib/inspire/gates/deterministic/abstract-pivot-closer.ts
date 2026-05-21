import type { GateNote } from "../gate-types";
import { splitSentences } from "../../refine/text-metrics";

/**
 * Detects banned closing techniques:
 * 1. Contrastive question: "The question is not X but Y" (any phrasing)
 * 2. Stacked imperative affirmations: 3+ consecutive short imperative sentences
 * 3. Abstract noun chain: closing with consecutive abstract nouns without grounding image
 */

const CONTRASTIVE_QUESTION_PATTERNS = [
  /\bthe question is not\b.*\bbut\b/i,
  /\bnot whether\b.*\bbut\b/i,
  /\bnot about\b.*\bbut\b/i,
  /\bisn't whether\b.*\bit's whether\b/i,
  /\bisn't about\b.*\bit's about\b/i,
  /\bnot if\b.*\bbut\b/i,
];

const ABSTRACT_NOUNS = new Set([
  "courage", "agency", "meaning", "choice", "freedom", "purpose",
  "hope", "grace", "resilience", "strength", "wisdom", "power",
  "authenticity", "vulnerability", "truth", "beauty", "love",
  "compassion", "possibility", "transformation", "liberation",
  "wholeness", "becoming", "presence", "abundance", "alignment",
]);

const SHORT_IMPERATIVE_PATTERN = /^(You\s+)?(will|must|should|can|need to|have to|go|do|don't|stop|start|keep|let|make|take|find|choose|remember|embrace|believe|trust|hold|carry|walk|step|rise|breathe|know)\b/i;

export function detectAbstractPivotCloser(narration: string): GateNote[] {
  const sentences = splitSentences(narration);
  if (sentences.length < 2) return [];

  const notes: GateNote[] = [];
  const lastTwo = sentences.slice(-2);

  // 1. Contrastive question closer
  for (const sentence of lastTwo) {
    for (const pattern of CONTRASTIVE_QUESTION_PATTERNS) {
      if (pattern.test(sentence)) {
        notes.push({
          gate: "genre_tells",
          severity: "block",
          evidence: sentence.slice(0, 100),
          message: `Abstract pivot closer: contrastive rhetorical question replaces concrete image`,
          suggestion: `Close with a specific image, a dateable action the protagonist takes, or a single unanswered concrete question — not a contrastive abstraction.`,
        });
        break;
      }
    }
  }

  // 2. Abstract noun chain: last sentence is 60%+ abstract nouns
  const lastSentence = sentences[sentences.length - 1];
  const lastWords = lastSentence.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, ""));
  const abstractCount = lastWords.filter(w => ABSTRACT_NOUNS.has(w)).length;
  if (lastWords.length > 3 && abstractCount / lastWords.length > 0.4) {
    notes.push({
      gate: "genre_tells",
      severity: "block",
      evidence: lastSentence.slice(0, 100),
      message: `Abstract pivot closer: closing sentence chains abstract nouns without grounding image`,
      suggestion: `Close with a concrete image or action, not a chain of abstract concepts.`,
    });
  }

  return notes;
}
