import { z } from "zod";
import {
  RESONANCE_MIN_INTENSITY,
} from "../../../config";
import type { Gate, GateContext, GateNote, GateResult } from "../gate-types";
import { runLlmGateCall, type LlmGateRunnerOptions } from "./llm-gate-runner";

const EMOTIONS = [
  "ache",
  "tenderness",
  "grief",
  "awe",
  "defiance",
  "recognition",
  "hope",
  "release",
  "wonder",
  "sorrow",
  "resolve",
  "bittersweet",
] as const;

const ResonanceResponseSchema = z.object({
  emotion: z.string().catch(""),
  intensity: z.number().int().min(0).max(3).catch(0),
  strongestReactionQuote: z.string().catch(""),
  matchesTarget: z.boolean().catch(false),
  defensibleSubstitute: z.boolean().catch(false),
  explanation: z.string().catch(""),
});

type ResonanceResponse = z.infer<typeof ResonanceResponseSchema>;

function buildPrompt(ctx: GateContext): string {
  const targetFeeling = ctx.targetFeeling?.dominant ?? "(no target provided)";

  return `Read this chapter as a sympathetic stranger.

Name the dominant emotion using exactly one word from this vocabulary:
${EMOTIONS.join(", ")}.

Target feeling: ${targetFeeling}

Decide whether the named emotion matches the target feeling. If it does not match exactly but is a defensible substitute, set defensibleSubstitute to true and explain why.

Quote the single sentence that produces the strongest reaction.

Return JSON only in this shape:
{
  "emotion": "recognition",
  "intensity": 2,
  "strongestReactionQuote": "<verbatim sentence>",
  "matchesTarget": true,
  "defensibleSubstitute": false,
  "explanation": "<short reason>"
}`;
}

function toNotes(response: ResonanceResponse, ctx: GateContext): GateNote[] {
  const notes: GateNote[] = [];
  const hitsIntensity = response.intensity >= RESONANCE_MIN_INTENSITY;
  const allowedEmotion = EMOTIONS.includes(response.emotion as (typeof EMOTIONS)[number]);
  const matchesTarget = !ctx.targetFeeling
    || response.matchesTarget
    || response.defensibleSubstitute;

  if (!allowedEmotion) {
    notes.push({
      gate: "resonance",
      severity: "block",
      evidence: response.strongestReactionQuote || response.explanation || "No allowed resonance label returned.",
      message: `Gate did not return an allowed resonance label. Received "${response.emotion || "(empty)"}".`,
      suggestion: `Identify the chapter's dominant feeling using one of: ${EMOTIONS.join(", ")}.`,
    });
  }

  if (!hitsIntensity) {
    notes.push({
      gate: "resonance",
      severity: "block",
      evidence: response.strongestReactionQuote,
      message: `Chapter lands at intensity ${response.intensity}/3 for ${response.emotion}; need at least ${RESONANCE_MIN_INTENSITY}/3.`,
      suggestion: `Sharpen the chapter around a more vulnerable, quotable moment that earns ${ctx.targetFeeling?.dominant ?? "a clearer dominant emotion"}.`,
    });
  }

  if (!matchesTarget) {
    notes.push({
      gate: "resonance",
      severity: "block",
      evidence: response.strongestReactionQuote,
      message: `Chapter reads as ${response.emotion}, not ${ctx.targetFeeling?.dominant ?? "the planned feeling"}. ${response.explanation}`,
      suggestion: `Rebuild the scene around the planned recognition moment so the dominant feeling resolves as ${ctx.targetFeeling?.dominant ?? "the target emotion"}.`,
    });
  }

  return notes;
}

export function createResonanceGate(options?: LlmGateRunnerOptions): Gate {
  return {
    name: "resonance",
    kind: "llm",
    async run(narration: string, ctx: GateContext): Promise<GateResult> {
      const response = await runLlmGateCall(
        buildPrompt(ctx),
        narration,
        ResonanceResponseSchema,
        { ...options, gateName: "resonance" },
      );

      const notes = toNotes(response, ctx);

      return {
        gate: "resonance",
        pass: notes.length === 0,
        notes,
        metrics: {
          emotion: response.emotion,
          intensity: response.intensity,
          matchesTarget: response.matchesTarget || response.defensibleSubstitute,
        },
      };
    },
  };
}

export const resonanceGate: Gate = createResonanceGate();