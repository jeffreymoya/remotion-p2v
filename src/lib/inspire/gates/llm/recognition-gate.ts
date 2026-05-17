import { z } from "zod";
import { RECOGNITION_REQUIRED } from "../../../config";
import type { Gate, GateContext, GateNote, GateResult } from "../gate-types";
import { runLlmGateCall, type LlmGateRunnerOptions } from "./llm-gate-runner";

const RecognitionResponseSchema = z.object({
  triggerSentence: z.string().nullable().catch(null),
  specificHumanMoment: z.boolean().catch(false),
  missing: z.string().nullable().catch(null),
});

type RecognitionResponse = z.infer<typeof RecognitionResponseSchema>;

const SYSTEM_PROMPT = `Is there a moment in this chapter where a listener might think "I've been there" or "I've done that"?

Quote the trigger sentence if it exists. The trigger must be a specific human moment, not a slogan or universalization.

If none exists, explain what concrete moment is missing.

Return JSON only in this shape:
{
  "triggerSentence": "<quoted sentence or null>",
  "specificHumanMoment": true,
  "missing": "<what is missing or null>"
}`;

function toNotes(response: RecognitionResponse, ctx: GateContext): GateNote[] {
  if (!RECOGNITION_REQUIRED) {
    return [];
  }

  if (response.triggerSentence && response.specificHumanMoment) {
    return [];
  }

  return [
    {
      gate: "recognition",
      severity: "block",
      evidence: response.triggerSentence ?? ctx.recognitionMoment ?? "No quotable recognition trigger found.",
      message: response.missing ?? "Chapter lacks a specific recognition moment that feels lived rather than declared.",
      suggestion: `Create a concrete, quotable moment that fulfills this brief: ${ctx.recognitionMoment ?? "a small human recognition beat"}.`,
    },
  ];
}

export function createRecognitionGate(options?: LlmGateRunnerOptions): Gate {
  return {
    name: "recognition",
    kind: "llm",
    async run(narration: string, ctx: GateContext): Promise<GateResult> {
      const response = await runLlmGateCall(
        SYSTEM_PROMPT,
        narration,
        RecognitionResponseSchema,
        { ...options, gateName: "recognition" },
      );

      const notes = toNotes(response, ctx);

      return {
        gate: "recognition",
        pass: notes.length === 0,
        notes,
        metrics: {
          hasTrigger: Boolean(response.triggerSentence),
          specificHumanMoment: response.specificHumanMoment,
        },
      };
    },
  };
}

export const recognitionGate: Gate = createRecognitionGate();