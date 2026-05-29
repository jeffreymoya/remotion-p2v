import { z } from "zod";
import { callStructured } from "./llm-client";
import { LLM_JUDGE } from "../config";
import type { SentenceDef } from "./tts-pipeline";

const MAX_RETRIES = 2;

// ── LLM judge ─────────────────────────────────────────────────────────

const VoiceJudgeSchema = z.object({
  passes: z.boolean(),
  flags: z.array(z.object({
    flag: z.string(),
    sentenceIndices: z.array(z.number().int().min(0)),
    explanation: z.string(),
  })),
  correctedSentences: z.array(z.object({
    index: z.number().int().min(0),
    correctedText: z.string(),
    reason: z.string(),
  })).optional(),
});

function buildSystemPrompt(): string {
  return `You are a voice-register judge for a Bloomberg-style infotainment documentary. You judge whether narration sounds like an animated infotainment explainer (GOOD) or like an econometrics abstract, financial journalism, or motivational monologue (BAD).

## Flags (mark any that apply)

1. "hook-no-scenario": The opening sentences do not put the viewer inside a scenario — they open with generic background, a definition, or "The economy is..."
2. "no-direct-address": Zero uses of "you" in the first 8 sentences.
3. "untranslated-jargon": Acronyms or technical terms appear without an inline translation (e.g. "QE" without "quantitative easing, or...").
4. "no-visual-beats": No lines naturally summon animation (meters, charts, flows, doors, contracts, dashboards).
5. "generic-uplift": Sentences use vague inspirational or self-help framing ("the power of compound interest changes everything") with no concrete scenario.
6. "institutions-only": Facts describe what institutions did with no translation to viewer stakes ("The Fed raised rates" with no "which means your mortgage...").

## Output Format (JSON only, no markdown fences)
{
  "passes": true/false,
  "flags": [{"flag": "hook-no-scenario", "sentenceIndices": [0, 1], "explanation": "..."}],
  "correctedSentences": [{"index": 2, "correctedText": "...", "reason": "..."}]
}

If the script passes, return passes=true, flags=[], correctedSentences=[].
Only propose corrections when the voice register is clearly wrong — do not rewrite for polish or preference. Keep corrections factually identical to the original (same claims, same numbers).`;
}

function buildUserPrompt(sentences: SentenceDef[]): string {
  const listing = sentences.map((s, i) => `[${i}] ${s.text}`).join("\n");
  return `## Full Narration Script (${sentences.length} sentences)
${listing}

Judge whether this reads like an animated infotainment explainer or like an academic abstract/news report.`;
}

export interface InfotainmentVoiceGateResult {
  passed: boolean;
  flags: Array<{ flag: string; sentenceIndices: number[]; explanation: string }>;
}

export async function gateInfotainmentVoice(
  sentences: SentenceDef[],
  opts?: { verbose?: boolean },
): Promise<{ sentences: SentenceDef[]; result: InfotainmentVoiceGateResult }> {
  let current = [...sentences];
  let lastFlags: Array<{ flag: string; sentenceIndices: number[]; explanation: string }> = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await callStructured({
      schema: VoiceJudgeSchema,
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(current),
      runName: `docu/infotainment-voice-gate/attempt-${attempt}`,
      verbose: opts?.verbose,
      llm: LLM_JUDGE,
    });

    lastFlags = result.flags;

    if (result.passes) {
      if (opts?.verbose) {
        console.log(`[infotainment-voice-gate] Voice check passed (attempt ${attempt})`);
      }
      return {
        sentences: current,
        result: { passed: true, flags: [] },
      };
    }

    // Apply corrections if provided
    if (result.correctedSentences && result.correctedSentences.length > 0) {
      const next = [...current];
      for (const corr of result.correctedSentences) {
        if (corr.index >= 0 && corr.index < next.length) {
          next[corr.index] = { ...next[corr.index], text: corr.correctedText };
        }
      }
      current = next;

      if (opts?.verbose) {
        console.log(
          `[infotainment-voice-gate] Attempt ${attempt}: ${result.correctedSentences.length} corrections applied ` +
          `(flags: ${result.flags.map((f) => f.flag).join(", ")})`,
        );
      }
    } else {
      if (opts?.verbose) {
        console.warn(
          `[infotainment-voice-gate] Attempt ${attempt}: flagged but no corrections — proceeding ` +
          `(flags: ${result.flags.map((f) => f.flag).join(", ")})`,
        );
      }
      break;
    }
  }

  // Log+pass — never block the render
  if (lastFlags.length > 0) {
    process.stderr.write(
      `[infotainment-voice-gate] Unresolved flags after ${MAX_RETRIES} attempts: ${lastFlags.map((f) => f.flag).join(", ")}\n`,
    );
  }

  return {
    sentences: current,
    result: { passed: lastFlags.length === 0, flags: lastFlags },
  };
}
