import { z } from "zod";
import { deepseekChatJson } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import type { GateNote } from "../gates/gate-types";
import type { CrossChapterGateResult } from "./proofread-types";
import { buildThroughLinePrompt } from "./proofreader-prompt";
import type { Protagonist } from "../longform-narration-prompt";

const ResultSchema = z.object({
  pass: z.boolean(),
  arcScore: z.number().min(0).max(3),
  weakness: z.string().nullable().optional(),
  fix: z.string().nullable().optional(),
  breakChapter: z.number().int().min(1).nullable().catch(null),
});

export interface ThroughLineGateResult {
  overall: CrossChapterGateResult;
  breakChapterIndex: number | null;
}

/**
 * LLM gate: checks that chapters form a connected arc, not disconnected essays.
 */
export async function runThroughLineGate(
  chapters: readonly string[],
  opts?: { verbose?: boolean; protagonist?: Protagonist },
): Promise<ThroughLineGateResult> {
  const messages = buildThroughLinePrompt(chapters, opts?.protagonist);
  const result = await deepseekChatJson(
    messages,
    ResultSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: opts?.verbose, runName: "proofread/through-line" },
  );

  const pass = result.arcScore >= 2;
  const notes: GateNote[] = [];

  if (!pass) {
    notes.push({
      gate: "through-line",
      severity: "block",
      evidence: `Arc score: ${result.arcScore}/3`,
      message: result.weakness ?? "Chapters read as disconnected essays rather than a connected arc",
      suggestion: result.fix ?? "Add connecting tissue between chapters — recurring imagery, a developing character, or a narrative question",
    });
  }

  const breakChapterIndex = result.breakChapter != null
    ? result.breakChapter - 1
    : null;

  return {
    overall: { gate: "through-line", pass, notes },
    breakChapterIndex,
  };
}
