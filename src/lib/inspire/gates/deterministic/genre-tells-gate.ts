import type { Gate, GateContext, GateResult, GateNote } from "../gate-types";
import {
  BANNED_PHRASES,
  BANNED_OPENERS,
  BANNED_CLOSING_PATTERNS,
  buildBannedLexiconPatterns,
} from "../banned-phrases";
import { splitSentences } from "../../refine/text-metrics";
import { detectStaccatoRuns, staccatoRunsToNotes } from "./staccato-runs";
import { detectMetaNarration, metaNarrationToNotes } from "./meta-narration";
import { detectContrastiveReveal, contrastiveRevealToNotes } from "./contrastive-reveal";

export const genreTellsGate: Gate = {
  name: "genre_tells",
  kind: "deterministic",
  async run(narration: string, ctx: GateContext): Promise<GateResult> {
    const notes: GateNote[] = [];

    // 1. Banned lexicon (whole-word match, case-insensitive)
    const lexiconPatterns = buildBannedLexiconPatterns(ctx.allowWords);
    for (const pattern of lexiconPatterns) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(narration)) !== null) {
        const start = Math.max(0, match.index - 30);
        const end = Math.min(narration.length, match.index + match[0].length + 30);
        const evidence = narration.slice(start, end).replace(/\n/g, " ");
        notes.push({
          gate: "genre_tells",
          severity: "block",
          evidence,
          message: `Banned word: "${match[0]}"`,
          suggestion: `Remove or replace "${match[0]}" with concrete, non-motivational vocabulary.`,
        });
      }
    }

    // 2. Banned phrases (substring, case-insensitive)
    const lowerNarration = narration.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      const lowerPhrase = phrase.toLowerCase();
      let idx = lowerNarration.indexOf(lowerPhrase);
      while (idx !== -1) {
        const start = Math.max(0, idx - 20);
        const end = Math.min(narration.length, idx + phrase.length + 20);
        const evidence = narration.slice(start, end).replace(/\n/g, " ");
        notes.push({
          gate: "genre_tells",
          severity: "block",
          evidence,
          message: `Banned phrase: "${phrase}"`,
          suggestion: `Remove this clichéd phrase entirely and replace with concrete description.`,
        });
        idx = lowerNarration.indexOf(lowerPhrase, idx + 1);
      }
    }

    // 3. Banned openers (sentence-start regex)
    const sentences = splitSentences(narration);
    for (const sentence of sentences) {
      for (const opener of BANNED_OPENERS) {
        if (opener.test(sentence)) {
          notes.push({
            gate: "genre_tells",
            severity: "block",
            evidence: sentence.slice(0, 80),
            message: `Banned opener pattern: "${opener.source}"`,
            suggestion: `Start this sentence differently — avoid universalizing openers.`,
          });
        }
      }
    }

    // 4. Banned closing patterns (last 3 sentences)
    const lastThree = sentences.slice(-3);
    let consecutiveImperatives = 0;
    for (const sentence of lastThree) {
      for (const closingPattern of BANNED_CLOSING_PATTERNS.closingStarters) {
        if (closingPattern.test(sentence)) {
          notes.push({
            gate: "genre_tells",
            severity: "block",
            evidence: sentence.slice(0, 80),
            message: `Banned closing pattern: "${sentence.slice(0, 40)}..."`,
            suggestion: `End the chapter with observation or quiet reflection, not imperatives.`,
          });
        }
      }
      // Check for imperative mood (starts with a verb / "You + verb")
      if (/^(You\s+)?(will|must|should|can|need to|have to|go|do|don't|stop|start|keep|let|make|take|find|choose|remember|embrace)\b/i.test(sentence)) {
        consecutiveImperatives++;
      } else {
        consecutiveImperatives = 0;
      }
    }
    if (consecutiveImperatives >= 3) {
      notes.push({
        gate: "genre_tells",
        severity: "block",
        evidence: lastThree.map((s) => s.slice(0, 40)).join(" | "),
        message: "Three consecutive imperative sentences at chapter close (affirmation stack).",
        suggestion: "End with a quiet observation or open question, not stacked imperatives.",
      });
    }

    // 5. Staccato sentence runs
    const staccatoViolations = detectStaccatoRuns(narration);
    notes.push(...staccatoRunsToNotes(staccatoViolations));

    // 6. Meta-narration / stage direction
    const metaViolations = detectMetaNarration(narration);
    notes.push(...metaNarrationToNotes(metaViolations));

    // 7. Two-part contrastive reveal
    const contrastiveViolations = detectContrastiveReveal(narration);
    notes.push(...contrastiveRevealToNotes(contrastiveViolations));

    return {
      gate: "genre_tells",
      pass: notes.filter((n) => n.severity === "block").length === 0,
      notes,
      metrics: {
        bannedItemsFound: notes.length,
      },
    };
  },
};
