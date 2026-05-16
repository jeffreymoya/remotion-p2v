import { z } from "zod";
import type { Gate, GateContext, GateResult, GateNote } from "../gate-types";
import { runLlmGateCall, type LlmGateRunnerOptions } from "./llm-gate-runner";

const SYSTEM_PROMPT = `You are reading one chapter from an inspirational long-form video script.
The chapter SHOULD commit to ONE controlling object, setting, or character
across its full length — that thing accumulates meaning as the chapter
progresses. A "controlling object" can be:
- a physical thing (a houseplant, a badge, a fountain pen)
- a setting (a kitchen at 6:14am, a workplace lobby)
- a recurring character (Maria, a grandfather)
- a recurring action (waiting for an elevator)

The chapter FAILS this gate if it swaps controlling object midstream.
Example failure: the chapter starts with "the badge" then drifts into
"the cage", "the fog", "the wall", "the wreckage", "the shrine" — five
different controlling images in one chapter. Each new image starts a
fresh metaphor instead of accumulating meaning on the original.

Identify whether the chapter does this.

OUTPUT (JSON only):
{
  "pass": true | false,
  "controllingObject": "<the chosen object, in plain English>",
  "swapPoints": [
    {
      "from": "<the original object>",
      "to": "<the new object>",
      "evidenceSentence": "<verbatim sentence where the swap occurs>"
    }
  ]
}

PASS if controllingObject is named and swapPoints is empty.
FAIL otherwise. List every swap.`;

const SwapPointSchema = z.object({
  from: z.string(),
  to: z.string(),
  evidenceSentence: z.string(),
});

const CohesionResponseSchema = z.object({
  pass: z.boolean(),
  controllingObject: z.string(),
  swapPoints: z.array(SwapPointSchema),
});

type CohesionResponse = z.infer<typeof CohesionResponseSchema>;

function toGateNotes(response: CohesionResponse): GateNote[] {
  if (response.pass || response.swapPoints.length === 0) return [];

  return response.swapPoints.map((swap) => ({
    gate: "cohesion",
    severity: "block" as const,
    evidence: swap.evidenceSentence,
    message: `Controlling object swaps from "${swap.from}" to "${swap.to}". Commit to one object and accumulate meaning on it.`,
    suggestion: `Remove or rewrite the sentence that introduces "${swap.to}". Build on "${response.controllingObject}" instead.`,
  }));
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
        options,
      );

      const notes = toGateNotes(response);

      return {
        gate: "cohesion",
        pass: response.pass && response.swapPoints.length === 0,
        notes,
        metrics: {
          controllingObject: response.controllingObject,
          swapCount: response.swapPoints.length,
        },
      };
    },
  };
}

export const cohesionGate: Gate = createCohesionGate();
