import { z } from "zod";
import { SENSORY_MIN_CHANNELS } from "../../../config";
import type { Gate, GateContext, GateNote, GateResult } from "../gate-types";
import { runLlmGateCall, type LlmGateRunnerOptions } from "./llm-gate-runner";

const SensoryChannelSchema = z.object({
  channel: z.enum(["sight", "sound", "smell", "touch", "temperature", "weight"]),
  evidence: z.string(),
});

const SensoryPresenceResponseSchema = z.object({
  invokedChannels: z.array(SensoryChannelSchema).catch([]),
});

type SensoryPresenceResponse = z.infer<typeof SensoryPresenceResponseSchema>;

const SYSTEM_PROMPT = `List the sensory channels actually invoked with a specific image in this chapter: sight, sound, smell, touch, temperature, weight.

Only count channels when the chapter gives an image or felt detail. Mere abstract naming does not count.

Return JSON only in this shape:
{
  "invokedChannels": [
    { "channel": "sound", "evidence": "<verbatim evidence>" }
  ]
}`;

function toNotes(response: SensoryPresenceResponse): GateNote[] {
  if (response.invokedChannels.length >= SENSORY_MIN_CHANNELS) {
    return [];
  }

  const evidence = response.invokedChannels
    .map((channel) => `${channel.channel}: ${channel.evidence}`)
    .join(" | ");

  return [
    {
      gate: "sensory_presence",
      severity: "warn",
      evidence: evidence || "No concrete sensory channels detected.",
      message: `Only ${response.invokedChannels.length} sensory channel(s) invoked; need at least ${SENSORY_MIN_CHANNELS}. (Advisory — not blocking.)`,
      suggestion: "Consider grounding the chapter in physical detail the listener can see, hear, feel, smell, or carry in their body.",
    },
  ];
}

export function createSensoryPresenceGate(options?: LlmGateRunnerOptions): Gate {
  return {
    name: "sensory_presence",
    kind: "llm",
    async run(narration: string, _ctx: GateContext): Promise<GateResult> {
      const response = await runLlmGateCall(
        SYSTEM_PROMPT,
        narration,
        SensoryPresenceResponseSchema,
        { ...options, gateName: "sensory-presence" },
      );

      const notes = toNotes(response);

      return {
        gate: "sensory_presence",
        pass: notes.length === 0,
        notes,
        metrics: {
          invokedChannels: response.invokedChannels.length,
          channels: response.invokedChannels.map((channel) => channel.channel).join(", "),
        },
      };
    },
  };
}

export const sensoryPresenceGate: Gate = createSensoryPresenceGate();