import { z } from "zod";
import { deepseekChatJson } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import type { AnchorKind, RawCandidate } from "./research-schema";
import { AnchorKindSchema, RawCandidateSchema } from "./research-schema";

const BrainstormResponseSchema = z.object({
  candidates: z.array(RawCandidateSchema),
});

function buildBrainstormPrompt(
  topic: string,
  targetCount: number,
  opts?: {
    excludeKinds?: AnchorKind[];
    priorRejections?: string[];
  },
): string {
  const kindList = AnchorKindSchema.options
    .filter((k) => !opts?.excludeKinds?.includes(k))
    .join(", ");

  const rejectionClause = opts?.priorRejections?.length
    ? `\n\nDo NOT propose any of these previously rejected claims (or minor rephrasings of them):\n${opts.priorRejections.map((r) => `- ${r}`).join("\n")}`
    : "";

  const canonicalWarning = `\nAvoid overused canonical-wisdom figures (Viktor Frankl, Eckhart Tolle, Ryan Holiday, Brené Brown, Marcus Aurelius) unless you can cite a specific, non-famous passage or lesser-known work. Prefer lesser-known researchers, real people from oral histories, or obscure primary sources.`;

  return `You are a research assistant preparing real-world anchors for a long-form narrated video about: "${topic}".

Brainstorm ${targetCount} candidate anchors. Each must be a REAL, verifiable claim — not invented.

Anchor kinds to include: ${kindList}
Ensure diversity: at least one candidate of each available kind.

For each candidate, provide:
- kind: one of [${kindList}]
- claim: a one-sentence factual summary
- detail: 2-5 sentences of usable specifics (dates, names, numbers)
- attributionGuess: { person?, work?, year?, publisher? }
- quote: verbatim quote text (only for primary_quote or book_excerpt kinds)
- queryHint: a web search query likely to surface a credible source for this claim
${canonicalWarning}${rejectionClause}

Return JSON: { "candidates": [ ... ] }`;
}

export async function brainstormCandidates(
  topic: string,
  targetCount: number,
  opts?: {
    verbose?: boolean;
    excludeKinds?: AnchorKind[];
    priorRejections?: string[];
  },
): Promise<RawCandidate[]> {
  const prompt = buildBrainstormPrompt(topic, targetCount, opts);

  const result = await deepseekChatJson(
    [
      { role: "system", content: "You are a meticulous research assistant. Return only valid JSON." },
      { role: "user", content: prompt },
    ],
    BrainstormResponseSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: opts?.verbose, maxTokens: 16384 },
  );

  if (opts?.verbose) {
    process.stderr.write(
      `[brainstorm] received ${result.candidates.length} candidates\n`,
    );
  }

  return result.candidates;
}
