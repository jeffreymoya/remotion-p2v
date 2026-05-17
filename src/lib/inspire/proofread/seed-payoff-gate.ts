import { z } from "zod";
import { deepseekChatJson } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import type { GateNote } from "../gates/gate-types";
import type { CrossChapterGateResult } from "./proofread-types";
import { buildSeedPayoffPrompt } from "./proofreader-prompt";

const ResultSchema = z.object({
  pass: z.boolean(),
  seeds: z.array(z.object({
    plantedInChapter: z.number(),
    seed: z.string(),
    paidOffInChapter: z.number().nullable(),
    fix: z.string().nullable(),
  })),
});

/**
 * LLM gate: checks that every seed planted in early chapters pays off later.
 */
export async function runSeedPayoffGate(
  chapters: readonly string[],
  opts?: { verbose?: boolean },
): Promise<CrossChapterGateResult[]> {
  const messages = buildSeedPayoffPrompt(chapters);
  const result = await deepseekChatJson(
    messages,
    ResultSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: opts?.verbose, runName: "proofread/seed-payoff" },
  );

  // Convert to per-chapter results
  const perChapter: CrossChapterGateResult[] = chapters.map((_, idx) => ({
    gate: "seed-payoff",
    pass: true,
    notes: [] as GateNote[],
  }));

  for (const seed of result.seeds) {
    if (seed.paidOffInChapter !== null) continue; // Paid off — no issue

    // Flag the chapter where the seed was planted
    const plantedIdx = seed.plantedInChapter - 1;
    if (plantedIdx >= 0 && plantedIdx < perChapter.length) {
      perChapter[plantedIdx].pass = false;
      perChapter[plantedIdx].notes.push({
        gate: "seed-payoff",
        severity: "block",
        evidence: `Seed: "${seed.seed}" planted in chapter ${seed.plantedInChapter}`,
        message: `Unpaid seed — "${seed.seed}" is never referenced again`,
        suggestion: seed.fix ?? "Pay off this seed in a later chapter or remove the forward reference",
      });
    }
  }

  return perChapter;
}
