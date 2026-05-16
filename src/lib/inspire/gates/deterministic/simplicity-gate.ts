import fs from "node:fs";
import path from "node:path";
import type { Gate, GateContext, GateResult, GateNote } from "../gate-types";
import {
  extractWords,
  countSyllables,
  splitSentences,
  fleschKincaidGrade,
  isAbstractNominalization,
} from "../../refine/text-metrics";
import {
  SIMPLICITY_FK_GRADE_MAX,
  SIMPLICITY_UNCOMMON_WORD_PCT_MAX,
} from "../../../config";

// Load common-words vocabulary once
const COMMON_WORDS_PATH = path.join(__dirname, "../common-words.json");
let commonWordsSet: Set<string> | null = null;

function getCommonWords(): Set<string> {
  if (commonWordsSet) return commonWordsSet;
  const raw = fs.readFileSync(COMMON_WORDS_PATH, "utf-8");
  const words: string[] = JSON.parse(raw);
  commonWordsSet = new Set(words.map((w) => w.toLowerCase()));
  return commonWordsSet;
}

export const simplicityGate: Gate = {
  name: "simplicity",
  kind: "deterministic",
  async run(narration: string, _ctx: GateContext): Promise<GateResult> {
    const notes: GateNote[] = [];

    // 1. Flesch-Kincaid grade
    const fkGrade = fleschKincaidGrade(narration);
    if (fkGrade > SIMPLICITY_FK_GRADE_MAX) {
      notes.push({
        gate: "simplicity",
        severity: "block",
        evidence: `FK grade: ${fkGrade.toFixed(1)}`,
        message: `Flesch-Kincaid grade ${fkGrade.toFixed(1)} exceeds maximum ${SIMPLICITY_FK_GRADE_MAX}. Text is too complex for conversational narration.`,
        suggestion: `Shorten sentences, use simpler words, break complex clauses. Target grade ≤${SIMPLICITY_FK_GRADE_MAX}.`,
      });
    }

    // 2. Uncommon word percentage
    const words = extractWords(narration);
    const commonWords = getCommonWords();
    const uncommonWords: string[] = [];
    for (const word of words) {
      const lower = word.toLowerCase();
      if (lower.length > 2 && !commonWords.has(lower)) {
        uncommonWords.push(word);
      }
    }
    const uncommonPct = words.length > 0 ? (uncommonWords.length / words.length) * 100 : 0;
    if (uncommonPct > SIMPLICITY_UNCOMMON_WORD_PCT_MAX) {
      const examples = [...new Set(uncommonWords)].slice(0, 8);
      notes.push({
        gate: "simplicity",
        severity: "warn",
        evidence: `${uncommonPct.toFixed(1)}% uncommon words. Examples: ${examples.join(", ")}`,
        message: `Uncommon word percentage ${uncommonPct.toFixed(1)}% exceeds ${SIMPLICITY_UNCOMMON_WORD_PCT_MAX}% threshold.`,
        suggestion: `Replace jargon and academic vocabulary with everyday words. Examples to fix: ${examples.join(", ")}.`,
      });
    }

    // 3. Abstract-nominalization stacks (≥3 in a single sentence = block)
    const sentences = splitSentences(narration);
    for (const sentence of sentences) {
      const sentenceWords = extractWords(sentence);
      const nominalizations = sentenceWords.filter(isAbstractNominalization);
      if (nominalizations.length >= 3) {
        notes.push({
          gate: "simplicity",
          severity: "block",
          evidence: sentence.slice(0, 80),
          message: `${nominalizations.length} abstract nominalizations in one sentence: ${nominalizations.join(", ")}`,
          suggestion: `Break this sentence apart. Replace abstract nouns with verbs or concrete descriptions.`,
        });
      }
    }

    return {
      gate: "simplicity",
      pass: notes.filter((n) => n.severity === "block").length === 0,
      notes,
      metrics: {
        fkGrade: Math.round(fkGrade * 10) / 10,
        uncommonWordPct: Math.round(uncommonPct * 10) / 10,
        wordCount: words.length,
        sentenceCount: sentences.length,
      },
    };
  },
};
