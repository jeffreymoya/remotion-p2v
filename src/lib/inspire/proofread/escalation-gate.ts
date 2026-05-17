import { z } from "zod";
import { deepseekChatJson } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import type { GateNote } from "../gates/gate-types";
import type { CrossChapterGateResult } from "./proofread-types";
import { buildEscalationPrompt } from "./proofreader-prompt";

const ResultSchema = z.object({
  pass: z.boolean(),
  curve: z.array(z.number().min(0).max(3)),
  weakness: z.string().nullable().optional(),
  fix: z.string().nullable().optional(),
});

/**
 * LLM gate: checks that stakes/intensity rise across chapters.
 */
export async function runEscalationGate(
  chapters: readonly string[],
  opts?: { verbose?: boolean },
): Promise<CrossChapterGateResult[]> {
  const messages = buildEscalationPrompt(chapters);
  const result = await deepseekChatJson(
    messages,
    ResultSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: opts?.verbose, runName: "proofread/escalation" },
  );

  const curve = result.curve;
  const isNonDecreasing = curve.every((v, i) => i === 0 || v >= curve[i - 1]);
  const pass = isNonDecreasing && (curve.length === 0 || curve[curve.length - 1] >= 2);

  // Per-chapter: flag chapters where the curve drops or stays flat from prior
  const perChapter: CrossChapterGateResult[] = chapters.map((_, idx) => {
    const notes: GateNote[] = [];
    if (idx > 0 && idx < curve.length && curve[idx] < curve[idx - 1]) {
      notes.push({
        gate: "escalation",
        severity: "block",
        evidence: `Intensity drops from ${curve[idx - 1]} (ch ${idx}) to ${curve[idx]} (ch ${idx + 1})`,
        message: `Chapter ${idx + 1} drops in intensity/stakes`,
        suggestion: result.fix ?? "Raise the stakes or specificity in this chapter",
      });
    }
    return { gate: "escalation", pass: notes.length === 0, notes };
  });

  // If overall doesn't pass and no individual chapter flagged, flag the last flat chapter
  if (!pass && perChapter.every((c) => c.pass)) {
    const lastIdx = curve.length - 1;
    if (lastIdx >= 0 && lastIdx < perChapter.length) {
      perChapter[lastIdx].pass = false;
      perChapter[lastIdx].notes.push({
        gate: "escalation",
        severity: "block",
        evidence: `Curve: [${curve.join(", ")}] — ends at ${curve[lastIdx]}, needs ≥ 2`,
        message: result.weakness ?? "Stakes stay flat across chapters",
        suggestion: result.fix ?? "Raise intensity in later chapters so the curve is non-decreasing and ends ≥ 2",
      });
    }
  }

  return perChapter;
}
