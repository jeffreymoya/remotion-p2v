import { z } from "zod";
import { deepseekChatJson } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import type { GateNote } from "../gates/gate-types";
import type { CrossChapterGateResult } from "./proofread-types";
import { buildThroughLinePrompt } from "./proofreader-prompt";

const ResultSchema = z.object({
  pass: z.boolean(),
  arcScore: z.number().min(0).max(3),
  weakness: z.string().nullable().optional(),
  fix: z.string().nullable().optional(),
});

/**
 * LLM gate: checks that chapters form a connected arc, not disconnected essays.
 */
export async function runThroughLineGate(
  chapters: readonly string[],
  opts?: { verbose?: boolean },
): Promise<CrossChapterGateResult> {
  const messages = buildThroughLinePrompt(chapters);
  const result = await deepseekChatJson(
    messages,
    ResultSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: opts?.verbose },
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

  return { gate: "through-line", pass, notes };
}
