import type { GateNote } from "../gates/gate-types";
import { deepseekChat } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import { BANNED_LEXICON, BANNED_PHRASES } from "../gates/banned-phrases";
import type { PolarityArc, TargetFeeling } from "../longform-narration-prompt";

export interface RevisionInput {
  chapterTitle: string;
  chapterRole: string;
  chapterIntent: string;
  sceneSeed: string;
  topic: string;
  previousDraft: string;
  gateNotes: GateNote[];
  wordBudget: { min: number; max: number };
  targetFeeling?: TargetFeeling;
  recognitionMoment?: string;
  polarityArc?: PolarityArc;
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
      let prefix = `[${gate.toUpperCase()}]`;

      // Surface specific pattern-detector guidance for the three banned patterns
      if (gate === "genre_tells" && note.message.includes("Staccato run")) {
        prefix = `[STACCATO RUN]`;
        lines.push(`${prefix} "${note.evidence}" — ${note.message}. Fix: Combine the short sentences into flowing clauses with subordinate structure. Never march through clips of ≤8 words.`);
        continue;
      }
      if (gate === "genre_tells" && note.message.includes("Meta-narration")) {
        prefix = `[META-NARRATION]`;
        lines.push(`${prefix} "${note.evidence}" — ${note.message}. Fix: Remove the stage direction entirely. Let the argument land through evidence, not announcements.`);
        continue;
      }
      if (gate === "genre_tells" && note.message.includes("contrastive reveal")) {
        prefix = `[CONTRASTIVE REVEAL]`;
        lines.push(`${prefix} "${note.evidence}" — ${note.message}. Fix: Avoid the AI-tic contrastive reveal — don't write "X is not Y. X is Z." as two sentences. Fold the reframe into a single flowing sentence with an embedded clause.`);
        continue;
      }

      lines.push(`${prefix} "${note.evidence}" — ${note.message}. Fix: ${note.suggestion}`);
    }
  }
  return lines.join("\n");
}

function formatTargetFeeling(targetFeeling?: TargetFeeling): string {
  if (!targetFeeling) {
    return "a clearer, more emotionally legible dominant feeling";
  }

  const secondary = targetFeeling.secondary ? ` with ${targetFeeling.secondary}` : "";
  return `${targetFeeling.dominant}${secondary} at intensity ${targetFeeling.intensity}/3`;
}

function findStrongestMoment(notes: GateNote[]): string {
  const resonanceNote = notes.find((note) => note.gate === "resonance");
  return resonanceNote?.evidence ?? "No single sentence is landing strongly enough yet.";
}

function buildRevisionPrompt(input: RevisionInput): string {
  return `Your previous draft was reviewed. Rewrite toward the target emotion, not toward generic compliance.

Target feeling: ${formatTargetFeeling(input.targetFeeling)}
Recognition moment to create: ${input.recognitionMoment ?? "a quotable human recognition beat"}
Planned polarity arc: ${input.polarityArc ?? "not specified"}
Strongest current moment: ${findStrongestMoment(input.gateNotes)}

The chapter currently falls short in these ways:

${formatGateNotes(input.gateNotes)}

## Chapter context
Topic: "${input.topic}"
Title: "${input.chapterTitle}"
Role: ${input.chapterRole}
Intent: ${input.chapterIntent}
Scene seed: ${input.sceneSeed}

## Previous draft
${input.previousDraft}

## Instructions
Rewrite the chapter so the recognition moment is felt in-scene and the target feeling becomes legible.

Hard constraints: word budget ${input.wordBudget.min}–${input.wordBudget.max}; banned words ${BANNED_LEXICON.join(", ")}; banned phrases ${BANNED_PHRASES.join("; ")}; keep Flesch-Kincaid grade <= 11; keep direct "you" address <= 55%; deploy assigned anchors with verbatim quotes and attribution; use prosody marks ... / — / ( ) / paragraph breaks; no staccato runs (≤1 sentence of ≤8 words per 4-sentence window); no meta-narration; no two-part contrastive reveals.

Return ONLY the revised narration text — no JSON, no markdown fences, no explanations.`;
}

export async function reviseChapter(
  input: RevisionInput,
  options?: { verbose?: boolean },
): Promise<string> {
  const systemPrompt = `You are a senior narration writer revising a chapter for a long-form inspirational video. You write as a warm but argumentative essayist building a case from canonical sources. Each chapter opens with a misconception worth overturning, deploys verified quotes with attribution as structural proof, and hands the reader a new lens. Emotion rides inside flowing analytical prose — long sentences with subordinate clauses, embedded reframes, and specific attributions. You are direct, intellectually generous, and occasionally self-implicating, but never preachy.`;

  const result = await deepseekChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: buildRevisionPrompt(input) },
    ],
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: options?.verbose, runName: "refine/revise-chapter" },
  );

  return result.trim();
}
