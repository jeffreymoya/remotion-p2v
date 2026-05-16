import { z } from "zod";
import { deepseekChatJson } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import type { GateNote } from "../gates/gate-types";
import type { CrossChapterGateResult } from "./proofread-types";
import { buildInternalConsistencyPrompt } from "./proofreader-prompt";

const ResultSchema = z.object({
  pass: z.boolean(),
  inconsistencies: z.array(z.object({
    subject: z.string(),
    chapters: z.array(z.number()),
    evidence: z.string(),
    fix: z.string(),
  })),
});

/**
 * LLM gate: checks that recurring objects/characters stay consistent across chapters.
 */
export async function runInternalConsistencyGate(
  chapters: readonly string[],
  opts?: { verbose?: boolean },
): Promise<CrossChapterGateResult[]> {
  const messages = buildInternalConsistencyPrompt(chapters);
  const result = await deepseekChatJson(
    messages,
    ResultSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: opts?.verbose },
  );

  // Convert to per-chapter results
  const perChapter: CrossChapterGateResult[] = chapters.map((_, idx) => ({
    gate: "internal-consistency",
    pass: true,
    notes: [] as GateNote[],
  }));

  for (const inconsistency of result.inconsistencies) {
    for (const chIdx of inconsistency.chapters) {
      const normalized = chIdx - 1; // Convert 1-based to 0-based
      if (normalized >= 0 && normalized < perChapter.length) {
        perChapter[normalized].pass = false;
        perChapter[normalized].notes.push({
          gate: "internal-consistency",
          severity: "block",
          evidence: inconsistency.evidence,
          message: `Inconsistency in "${inconsistency.subject}" across chapters ${inconsistency.chapters.join(", ")}`,
          suggestion: inconsistency.fix,
        });
      }
    }
  }

  return perChapter;
}
