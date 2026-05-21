import type { GateNote } from "../gates/gate-types";
import { deepseekChat } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import { BANNED_LEXICON, BANNED_PHRASES } from "../gates/banned-phrases";
import type { PolarityArc, TargetFeeling, Protagonist } from "../longform-narration-prompt";
import {
  ARCHETYPES,
  DEFAULT_ARCHETYPE,
  getRoleGuidance,
} from "../narration-archetypes";
import type { NarrationArchetype } from "../narration-archetypes";

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
  priorChapters?: readonly string[];
  protagonist?: Protagonist;
  controllingObject?: string;
  archetype?: NarrationArchetype;
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

      if (gate === "citation-fidelity") {
        prefix = `[CITATION FABRICATION]`;
        lines.push(
          `${prefix} "${note.evidence}" — This quote has no verified anchor in the research bundle.` +
          ` REQUIRED: Remove the fabricated quote entirely.` +
          ` If the underlying point matters, restate it as your own argument — no quotation marks, no attribution.` +
          ` Do NOT substitute a different quote or invent a new source name.`
        );
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

function formatPriorChaptersContext(priorChapters?: readonly string[]): string {
  if (!priorChapters || priorChapters.length === 0) return "";

  const spans = priorChapters.map((c, i) => {
    const opener = c.slice(0, 80);
    const endpoint = c.slice(-300);
    return `Chapter ${i + 1} opener: ${opener}\nChapter ${i + 1} endpoint: ...${endpoint}`;
  });

  return `\n\n## Context already established — do not repeat these opener patterns or author attributions\n${spans.join("\n\n")}`;
}

function formatProtagonistContext(protagonist?: Protagonist, controllingObject?: string): string {
  if (!protagonist) return "";
  const lines = [
    `\n\n## Protagonist (persists across all chapters)`,
    `Name: ${protagonist.name}`,
    `Situation: ${protagonist.situation}`,
    `Controlling image: ${protagonist.controllingImage}`,
    `Transformation: ${protagonist.transformationBefore} → ${protagonist.transformationAfter}`,
  ];
  if (controllingObject) {
    lines.push(`This chapter's controlling object: ${controllingObject}`);
  }
  return lines.join("\n");
}

function formatArchetypeContext(
  archetype: NarrationArchetype | undefined,
  role: string,
): string {
  const key = archetype ?? DEFAULT_ARCHETYPE;
  const arche = ARCHETYPES[key];
  const roleGuidance = getRoleGuidance(key, role) ?? "Open in a way that fits this chapter's role.";
  return `\n\n## Archetype: ${key}
${arche.description}
Narrative arc: ${arche.narrativeArc}
Opener for this chapter (role "${role}"): ${roleGuidance}
Hook preference: ${arche.hookPreference}
Close preference: ${arche.closePreference}`;
}

function buildRevisionPrompt(input: RevisionInput): string {
  const priorContext = formatPriorChaptersContext(input.priorChapters);
  const protagonistContext = formatProtagonistContext(input.protagonist, input.controllingObject);
  const archetypeContext = formatArchetypeContext(input.archetype, input.chapterRole);

  return `Your previous draft was reviewed. Rewrite toward the target emotion, not toward generic compliance.
${archetypeContext}

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
Scene seed: ${input.sceneSeed}${protagonistContext}${priorContext}

## Previous draft
${input.previousDraft}

## Instructions
Rewrite the chapter so the recognition moment is felt in-scene and the target feeling becomes legible. Keep ${input.protagonist?.name ?? "the protagonist"} in scene — the controlling object must appear in the opening and recur.

Hard constraints: word budget ${input.wordBudget.min}–${input.wordBudget.max}; banned words ${BANNED_LEXICON.join(", ")}; banned phrases ${BANNED_PHRASES.join("; ")}; keep Flesch-Kincaid grade <= 11; keep direct "you" address <= 35%; deploy assigned anchors with verbatim quotes and attribution; use prosody marks ... / — / ( ) / paragraph breaks AND include at least one "... ... ..." long pause followed by a concrete question about the protagonist's situation; no staccato runs (≤1 sentence of ≤8 words per 4-sentence window); no meta-narration; no two-part contrastive reveals.

Return ONLY the revised narration text — no JSON, no markdown fences, no explanations.`;
}

export async function reviseChapter(
  input: RevisionInput,
  options?: { verbose?: boolean },
): Promise<string> {
  const archetypeKey = input.archetype ?? DEFAULT_ARCHETYPE;
  const archeDescription = ARCHETYPES[archetypeKey].description;
  const systemPrompt = `You are a senior narration writer revising a chapter for a long-form inspirational video. The script follows the "${archetypeKey}" archetype: ${archeDescription} Each chapter opens in a way that fits its role under this archetype (the user prompt specifies the exact opener approach), deploys verified quotes with attribution as structural proof when relevant, and hands the reader a new lens by chapter's end. Emotion rides inside flowing prose — long sentences with subordinate clauses, embedded reframes, and specific attributions. You are direct, intellectually generous, and occasionally self-implicating, but never preachy.`;

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
