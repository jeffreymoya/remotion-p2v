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

    // Final-chapter closing questions are intentional — not unpaid seeds
    if (seed.plantedInChapter >= chapters.length) continue;

    // Route to last chapter (has most latitude to pay off)
    const targetIdx = chapters.length - 1;
    perChapter[targetIdx].pass = false;
    perChapter[targetIdx].notes.push({
      gate: "seed-payoff",
      severity: "block",
      evidence: `Seed: "${seed.seed}" planted in chapter ${seed.plantedInChapter}`,
      message: `Unpaid seed — "${seed.seed}" is never referenced again`,
      suggestion: seed.fix ?? `Chapter ${chapters.length} should pay off this seed from chapter ${seed.plantedInChapter}`,
    });
  }

  return perChapter;
}
