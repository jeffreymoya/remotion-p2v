import type { GateNote } from "../gates/gate-types";
import { deepseekChat } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import { BANNED_LEXICON, BANNED_PHRASES } from "../gates/banned-phrases";

export interface RevisionInput {
  chapterTitle: string;
  chapterRole: string;
  chapterIntent: string;
  sceneSeed: string;
  topic: string;
  previousDraft: string;
  gateNotes: GateNote[];
  wordBudget: { min: number; max: number };
}

function formatGateNotes(notes: GateNote[]): string {
  const grouped = new Map<string, GateNote[]>();
  for (const note of notes) {
    const existing = grouped.get(note.gate) ?? [];
    grouped.set(note.gate, [...existing, note]);
  }

  const lines: string[] = [];
  for (const [gate, gateNotes] of grouped) {
    for (const note of gateNotes) {
      lines.push(`[${gate.toUpperCase()}] "${note.evidence}" — ${note.message}. Fix: ${note.suggestion}`);
    }
  }
  return lines.join("\n");
}

function buildRevisionPrompt(input: RevisionInput): string {
  return `Your previous draft was reviewed. Address each issue below.

${formatGateNotes(input.gateNotes)}

## Constraints
- Banned words (never use): ${BANNED_LEXICON.join(", ")}
- Banned phrases (never use): ${BANNED_PHRASES.join("; ")}
- Word budget: ${input.wordBudget.min}–${input.wordBudget.max} words
- Flesch-Kincaid grade ≤ 8 (short sentences, common words)
- ≤ 30% of sentences may address the listener as "you"
- ≥ 2 named entities (people, places, specific objects)
- ≥ 1 dated moment (day, month, year, time expression)
- Use prosody marks: ... (pause), — (shift), ( ) (aside), paragraph breaks

## Do not
- Introduce new metaphors not in the original draft
- Abandon the controlling object or through-line from the original
- Exceed the word budget
- Add affirmation stacks at the end
- Use universalizing openers ("We've all been there", "Imagine", "Picture this")

## Chapter context
Topic: "${input.topic}"
Title: "${input.chapterTitle}"
Role: ${input.chapterRole}
Intent: ${input.chapterIntent}
Scene seed: ${input.sceneSeed}

## Previous draft
${input.previousDraft}

## Instructions
Rewrite the chapter addressing all issues above. Return ONLY the revised narration text — no JSON, no markdown fences, no explanations.`;
}

export async function reviseChapter(
  input: RevisionInput,
  options?: { verbose?: boolean },
): Promise<string> {
  const systemPrompt = `You are a senior narration writer revising a chapter for a long-form inspirational video. You write in the voice of an older person of accumulated experience telling stories to a friend over coffee. Inspiration arrives by accumulation, not by exhortation. You are warm, often self-deprecating, sometimes uncertain, and address the listener as a peer rather than a student. You prefer concrete observation over abstract claim.`;

  const result = await deepseekChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: buildRevisionPrompt(input) },
    ],
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: options?.verbose },
  );

  return result.trim();
}
