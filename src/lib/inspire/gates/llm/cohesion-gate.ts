import { z } from "zod";
import type { Gate, GateContext, GateResult, GateNote } from "../gate-types";
import { runLlmGateCall, type LlmGateRunnerOptions } from "./llm-gate-runner";

const SYSTEM_PROMPT = `You are reading one chapter from an inspirational long-form video script.

Judge whether the chapter has an emotional through-line that accumulates rather than stacking separate exemplars under the same theme.

The chapter fails if:
- it loses the emotional through-line midstream
- it adds extra biographical examples whose removal would not change the chapter's meaning
- it feels like multiple mini-essays pressed together instead of one accumulation

Return JSON only in this shape:
{
  "emotionalThroughLine": "<one sentence>",
  "accumulationBroken": true,
  "swapPoints": [
    {
      "exemplar": "<new example or detour>",
      "evidenceSentence": "<verbatim sentence>",
      "whyDisposable": "<why this example is disposable>"
    }
  ]
}`;

const SwapPointSchema = z.object({
  exemplar: z.string(),
  evidenceSentence: z.string(),
  whyDisposable: z.string(),
});

const CohesionResponseSchema = z.object({
  emotionalThroughLine: z.string().catch(""),
  accumulationBroken: z.boolean().catch(false),
  swapPoints: z.array(SwapPointSchema).catch([]),
});

type CohesionResponse = z.infer<typeof CohesionResponseSchema>;

function toGateNotes(response: CohesionResponse): GateNote[] {
  if (!response.accumulationBroken && response.swapPoints.length === 0) return [];

  return response.swapPoints.map((swap) => ({
    gate: "cohesion",
    severity: "block" as const,
    evidence: swap.evidenceSentence,
    message: `Chapter introduces an extra exemplar (${swap.exemplar}) instead of deepening one emotional through-line.`,
    suggestion: `Cut or compress ${swap.exemplar}. Keep building on this through-line: ${response.emotionalThroughLine}. ${swap.whyDisposable}`,
  }));
}

function buildFallbackNote(response: CohesionResponse): GateNote[] {
  if (!response.accumulationBroken || response.swapPoints.length > 0) {
    return [];
  }

  return [
    {
      gate: "cohesion",
      severity: "block",
      evidence: response.emotionalThroughLine,
      message: "Chapter loses its emotional accumulation even without a single obvious swap point.",
      suggestion: `Re-center the narration around one emotional through-line: ${response.emotionalThroughLine}.`,
    },
  ];
}

export function createCohesionGate(options?: LlmGateRunnerOptions): Gate {
  return {
    name: "cohesion",
    kind: "llm",
    async run(narration: string, _ctx: GateContext): Promise<GateResult> {
      const response = await runLlmGateCall(
        SYSTEM_PROMPT,
        narration,
        CohesionResponseSchema,
        { ...options, gateName: "cohesion" },
      );

      const notes = [...toGateNotes(response), ...buildFallbackNote(response)];

      return {
        gate: "cohesion",
        pass: !response.accumulationBroken && response.swapPoints.length === 0,
        notes,
        metrics: {
          emotionalThroughLine: response.emotionalThroughLine,
          accumulationBroken: response.accumulationBroken,
          swapCount: response.swapPoints.length,
        },
      };
    },
  };
}

export const cohesionGate: Gate = createCohesionGate();
