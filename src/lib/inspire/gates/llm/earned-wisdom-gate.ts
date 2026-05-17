import { z } from "zod";
import { EARNED_WISDOM_REQUIRED } from "../../../config";
import type { Gate, GateContext, GateNote, GateResult } from "../gate-types";
import { runLlmGateCall, type LlmGateRunnerOptions } from "./llm-gate-runner";

const UnearnedClaimSchema = z.object({
  claim: z.string(),
  missingScene: z.string(),
});

const EarnedWisdomResponseSchema = z.object({
  unearnedClaims: z.array(UnearnedClaimSchema).catch([]),
});

type EarnedWisdomResponse = z.infer<typeof EarnedWisdomResponseSchema>;

const SYSTEM_PROMPT = `For every general claim, aphorism, or reflective line in this chapter, determine whether it is earned.

A claim is "earned" if EITHER:
1. It is anchored to a concrete scene in this chapter (a specific person, place, moment), OR
2. It is supported by a verified citation — an attributed quote or research finding from a named author/work in the same paragraph.

If a wisdom statement has neither an earning scene nor a supporting citation, list it.

Return JSON only in this shape:
{
  "unearnedClaims": [
    {
      "claim": "<verbatim claim>",
      "missingScene": "<what concrete scene or citation is needed>"
    }
  ]
}`;

function toNotes(response: EarnedWisdomResponse): GateNote[] {
  if (!EARNED_WISDOM_REQUIRED || response.unearnedClaims.length === 0) {
    return [];
  }

  return response.unearnedClaims.map((claim) => ({
    gate: "earned_wisdom",
    severity: "block",
    evidence: claim.claim,
    message: "Reflective claim is not earned by a concrete scene in this chapter.",
    suggestion: claim.missingScene,
  }));
}

export function createEarnedWisdomGate(options?: LlmGateRunnerOptions): Gate {
  return {
    name: "earned_wisdom",
    kind: "llm",
    async run(narration: string, _ctx: GateContext): Promise<GateResult> {
      const response = await runLlmGateCall(
        SYSTEM_PROMPT,
        narration,
        EarnedWisdomResponseSchema,
        { ...options, gateName: "earned-wisdom" },
      );

      const notes = toNotes(response);

      return {
        gate: "earned_wisdom",
        pass: notes.length === 0,
        notes,
        metrics: {
          unearnedClaims: response.unearnedClaims.length,
        },
      };
    },
  };
}

export const earnedWisdomGate: Gate = createEarnedWisdomGate();