import { z } from "zod";
import type { Gate, GateContext, GateResult, GateNote } from "../gate-types";
import { runLlmGateCall, type LlmGateRunnerOptions } from "./llm-gate-runner";
import { CANONICAL_WISDOM } from "./canonical-wisdom-corpus";

const DEFAULT_FRESHNESS_GATE_SEVERITY = "warn" as const;

function buildSystemPrompt(): string {
  const sourceList = CANONICAL_WISDOM.map(
    (s) =>
      `- ${s.author} — ${s.signaturePhrases.map((p) => `"${p}"`).join("; ")}`,
  ).join("\n");

  return `You are reading one chapter from an inspirational long-form video script.
Identify any sentence that paraphrases canonical self-help / wisdom-tradition
content, then presents the paraphrase as if it were the narrator's own
insight.

Canonical sources to flag (paraphrases of any of these):
${sourceList}

ALLOWED: explicit attribution to the same source. "As Viktor Frankl wrote in
1946..." is fine. The anchor pipeline produces those legitimately.
BANNED: paraphrase presented as personal revelation. "I realized that
between what happens to us and how we respond there's a space" is a
Frankl paraphrase masquerading as insight.

OUTPUT (JSON only):
{
  "pass": true | false,
  "paraphrases": [
    {
      "sentence": "<verbatim offending sentence>",
      "source": "<which canonical author this paraphrases>",
      "suggestion": "<what to do — either drop entirely or attribute explicitly>"
    }
  ]
}

PASS if paraphrases is empty.`;
}

const ParaphraseSchema = z.object({
  sentence: z.string(),
  source: z.string(),
  suggestion: z.string(),
});

const FreshnessResponseSchema = z.object({
  pass: z.boolean(),
  paraphrases: z.array(ParaphraseSchema),
});

type FreshnessResponse = z.infer<typeof FreshnessResponseSchema>;

function toGateNotes(response: FreshnessResponse, severity: "warn" | "block"): GateNote[] {
  if (response.pass || response.paraphrases.length === 0) return [];

  return response.paraphrases.map((p) => ({
    gate: "freshness",
    severity,
    evidence: p.sentence,
    message: `Paraphrases ${p.source} without attribution — presented as personal insight.`,
    suggestion: p.suggestion,
  }));
}

export function createFreshnessGate(options?: LlmGateRunnerOptions & { severity?: "warn" | "block" }): Gate {
  const severity = options?.severity ?? DEFAULT_FRESHNESS_GATE_SEVERITY;

  return {
    name: "freshness",
    kind: "llm",
    async run(narration: string, _ctx: GateContext): Promise<GateResult> {
      const response = await runLlmGateCall(
        buildSystemPrompt(),
        narration,
        FreshnessResponseSchema,
        { ...options, gateName: "freshness" },
      );

      const notes = toGateNotes(response, severity);
      const pass = response.paraphrases.length === 0;

      return {
        gate: "freshness",
        pass,
        notes,
        metrics: {
          paraphraseCount: response.paraphrases.length,
        },
      };
    },
  };
}

export const freshnessGate: Gate = createFreshnessGate();
