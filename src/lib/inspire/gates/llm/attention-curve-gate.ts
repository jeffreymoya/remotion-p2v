import { z } from "zod";
import type { Gate, GateContext, GateResult, GateNote } from "../gate-types";
import { runLlmGateCall, type LlmGateRunnerOptions } from "./llm-gate-runner";

const SYSTEM_PROMPT = `You are reading one chapter from an inspirational long-form video script
intended for a 12-15 minute video. The END of the chapter must pull the
listener forward harder than the MIDDLE did. Pull can come from:
- an open question whose answer hasn't been given
- an unresolved tension the listener wants resolved
- a shift to a new scene the listener wants to follow
- a planted seed referenced as "later" or "we'll come back to"
- a small, specific image the listener wants to dwell on

The chapter FAILS this gate if it ends weaker than it starts — flat
restatement, abstract summary, an affirmation stack, a generic call to
action. A chapter that closes on "You will not break. Walk toward it.
The fog will lift." has zero forward pull.

OUTPUT (JSON only):
{
  "pass": true | false,
  "midPullScore": 0-3,
  "endPullScore": 0-3,
  "weakness": "<one short sentence if endPullScore < midPullScore, else empty string>"
}

PASS if endPullScore >= midPullScore AND endPullScore >= 2.`;

const AttentionCurveResponseSchema = z.object({
  pass: z.boolean(),
  midPullScore: z.number().min(0).max(3),
  endPullScore: z.number().min(0).max(3),
  weakness: z.string(),
});

type AttentionCurveResponse = z.infer<typeof AttentionCurveResponseSchema>;

function toGateNotes(response: AttentionCurveResponse): GateNote[] {
  if (response.pass) return [];

  const weakness = response.weakness || "Chapter ending has less forward pull than the midpoint.";

  return [
    {
      gate: "attention_curve",
      severity: "block" as const,
      evidence: `midPullScore=${response.midPullScore}, endPullScore=${response.endPullScore}`,
      message: weakness,
      suggestion:
        "End the chapter with an open question, unresolved tension, a planted seed, or a specific image that pulls the listener forward. Avoid flat restatement, affirmation stacks, or generic calls to action.",
    },
  ];
}

export function createAttentionCurveGate(options?: LlmGateRunnerOptions): Gate {
  return {
    name: "attention_curve",
    kind: "llm",
    async run(narration: string, _ctx: GateContext): Promise<GateResult> {
      const response = await runLlmGateCall(
        SYSTEM_PROMPT,
        narration,
        AttentionCurveResponseSchema,
        { ...options, gateName: "attention-curve" },
      );

      const pass = response.endPullScore >= response.midPullScore && response.endPullScore >= 2;
      const notes = pass ? [] : toGateNotes({ ...response, pass: false });

      return {
        gate: "attention_curve",
        pass,
        notes,
        metrics: {
          midPullScore: response.midPullScore,
          endPullScore: response.endPullScore,
        },
      };
    },
  };
}

export const attentionCurveGate: Gate = createAttentionCurveGate();
