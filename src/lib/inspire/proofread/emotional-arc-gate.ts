import { z } from "zod";
import { deepseekChatJson } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import type { LongformPlan } from "../longform-narration-prompt";
import type { GateNote } from "../gates/gate-types";
import type { CrossChapterGateResult } from "./proofread-types";
import { buildEmotionalArcPrompt } from "./proofreader-prompt";

const EmotionalBeatSchema = z.object({
  chapter: z.number().int().min(1),
  emotion: z.string(),
  intensity: z.number().int().min(0).max(3),
});

const EmotionalArcResultSchema = z.object({
  achieved: z.array(EmotionalBeatSchema).catch([]),
  breakChapter: z.number().int().min(1).nullable().catch(null),
  weakness: z.string().nullable().optional().catch(null),
  fix: z.string().nullable().optional().catch(null),
});

type EmotionalArcResult = z.infer<typeof EmotionalArcResultSchema>;

function buildNotes(
  result: EmotionalArcResult,
  plan: LongformPlan,
  chapters: readonly string[],
): CrossChapterGateResult[] {
  return chapters.map((_, index) => {
    const achieved = result.achieved.find((beat) => beat.chapter === index + 1);
    const planned = plan.chapters[index]?.targetFeeling.intensity;
    const delta = achieved && planned ? Math.abs(achieved.intensity - planned) : 0;
    const isBreakChapter = result.breakChapter === index + 1;
    const finalIntensityMiss = index === chapters.length - 1 && (achieved?.intensity ?? 0) < 2;
    const pass = !isBreakChapter && !finalIntensityMiss && delta <= 1;

    const notes: GateNote[] = pass
      ? []
      : [
          {
            gate: "emotional-arc",
            severity: "block",
            evidence: `planned=${planned ?? "?"}, achieved=${achieved?.intensity ?? "?"} (${achieved?.emotion ?? "unknown"})`,
            message: result.weakness ?? "The achieved emotional arc misses the designed trajectory.",
            suggestion: result.fix ?? "Rewrite this chapter so its achieved feeling better matches the planned arc.",
          },
        ];

    return {
      gate: "emotional-arc",
      pass,
      notes,
    };
  });
}

export async function runEmotionalArcGate(
  chapters: readonly string[],
  plan: LongformPlan,
  opts?: { verbose?: boolean },
): Promise<{ overall: CrossChapterGateResult; perChapter: CrossChapterGateResult[] }> {
  const messages = buildEmotionalArcPrompt(chapters, plan);
  const result = await deepseekChatJson(
    messages,
    EmotionalArcResultSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: opts?.verbose, runName: "proofread/emotional-arc" },
  );

  const perChapter = buildNotes(result, plan, chapters);
  const pass = perChapter.every((chapter) => chapter.pass);
  const overallNotes = perChapter.flatMap((chapter) => chapter.notes);

  return {
    overall: {
      gate: "emotional-arc",
      pass,
      notes: overallNotes,
    },
    perChapter,
  };
}