import { z } from "zod";
import { callStructured } from "./llm-client";
import { LLM_METRIC } from "../config";
import type { Anchor } from "../shared/research/research-schema";
import { traceableChain, textOnlyAssetSummary } from "../tracing";
import type { SentenceDef } from "./tts-pipeline";

const MAX_CORRECTION_ROUNDS = 2;

type StructuredCaller = typeof callStructured;

const FidelityResponseSchema = z.object({
  results: z.array(z.object({
    sentenceIndex: z.number().int().min(0),
    supported: z.boolean(),
    reason: z.string().optional(),
    correctedText: z.string().optional(),
  })),
});

function buildVerifierSystemPrompt(): string {
  return `You are a citation-fidelity auditor for a Bloomberg-style documentary. Your job is to verify that every narration sentence is factually supported by at least one verified research anchor. Return JSON only, no markdown fences.

## Rules
1. For each sentence, determine if its factual claims (numbers, dates, institution names, causal claims, attributions) can be traced to at least one anchor in the provided list.
2. Paraphrased claims are acceptable — the sentence doesn't need to repeat the anchor verbatim, but the core factual assertion must match.
3. Sentences that introduce entirely new factual claims not present in any anchor are UNSUPPORTED.
4. Narrative transitions, rhetorical questions, hooks, and purely descriptive language that makes no factual claim are SUPPORTED by default.
5. For each unsupported sentence, provide a "reason" explaining which claim cannot be traced.
6. For each unsupported sentence, provide a "correctedText" that keeps the sentence's narrative role but grounds its factual content in the available anchors. Do not introduce new facts — only rephrase to stay within what the anchors attest.

## Output Format
{ "results": [{ "sentenceIndex": 0, "supported": true }, { "sentenceIndex": 3, "supported": false, "reason": "Claims QE reduced unemployment by 2.1% but no anchor contains this statistic", "correctedText": "QE reduced unemployment — though the exact magnitude remains debated among economists" }] }`;
}

function anchorListing(anchors: readonly Anchor[]): string {
  return anchors
    .filter((a) => a.status === "verified")
    .map((a) =>
      `[${a.id}] ${a.claim} / ${a.detail}` +
      (a.attribution.year ? ` / ${a.attribution.year}` : "") +
      (a.attribution.person ? ` / ${a.attribution.person}` : "")
    )
    .join("\n");
}

function sentenceListing(sentences: SentenceDef[]): string {
  return sentences.map((s, i) => `[${i}] ${s.text}`).join("\n");
}

async function gateNarrationFidelity_impl(
  sentences: SentenceDef[],
  verifiedAnchors: readonly Anchor[],
  opts?: { verbose?: boolean; callStructured?: StructuredCaller },
): Promise<SentenceDef[]> {
  if (verifiedAnchors.length === 0) {
    throw new Error(
      `[narration-fidelity] Called with 0 verified anchors — gate cannot verify anything. ` +
      `This should have been caught upstream.`
    );
  }

  let current = [...sentences];
  let previousFlaggedCount = Infinity;
  const structuredCall = opts?.callStructured ?? callStructured;

  for (let attempt = 1; attempt <= MAX_CORRECTION_ROUNDS + 1; attempt++) {
    const userPrompt = `## Verified Research Anchors
${anchorListing(verifiedAnchors)}

## Narration Sentences
${sentenceListing(current)}

Verify each sentence. Return a result for EVERY sentence (sentenceIndex 0 through ${current.length - 1}).`;

    const result = await structuredCall({
      schema: FidelityResponseSchema,
      system: buildVerifierSystemPrompt(),
      prompt: userPrompt,
      runName: `docu/narration-fidelity-gate/attempt-${attempt}`,
      verbose: opts?.verbose,
      llm: LLM_METRIC,
    });

    const resultMap = new Map(result.results.map((r) => [r.sentenceIndex, r]));
    const flagged: Array<{ index: number; reason: string; corrected: string }> = [];

    for (const r of result.results) {
      if (!r.supported && r.correctedText) {
        flagged.push({ index: r.sentenceIndex, reason: r.reason ?? "unsupported", corrected: r.correctedText });
      }
    }

    if (flagged.length === 0) {
      if (opts?.verbose) {
        console.log(`[narration-fidelity] All ${current.length} sentences verified — 0 flagged`);
      }
      return current;
    }

    if (opts?.verbose) {
      console.log(
        `[narration-fidelity] Attempt ${attempt}/${MAX_CORRECTION_ROUNDS + 1}: ${flagged.length} sentences flagged` +
        flagged.map((f) => `\n  [${f.index}] ${f.reason}`).join("")
      );
    }

    if (attempt > MAX_CORRECTION_ROUNDS) {
      throw new Error(
        `[narration-fidelity] ${MAX_CORRECTION_ROUNDS} correction rounds exhausted — narration still contains ` +
        `unsupported sentences. Fix research anchors or tighten narration prompt.`
      );
    }

    if (flagged.length >= previousFlaggedCount && attempt > 1) {
      throw new Error(
        `[narration-fidelity] Attempt ${attempt}: corrector made 0 progress — ` +
        `${flagged.length} sentences remain unsupported. Aborting to prevent GIGO.`
      );
    }
    previousFlaggedCount = flagged.length;

    const next = [...current];
    for (const f of flagged) {
      next[f.index] = { ...next[f.index], text: f.corrected };
    }
    current = next;
  }

  throw new Error("[narration-fidelity] unreachable retry state");
}

export const gateNarrationFidelity = traceableChain(gateNarrationFidelity_impl, "gateNarrationFidelity", {
  processInputs: (inputs) => (textOnlyAssetSummary(inputs) as Record<string, unknown>) ?? {},
  processOutputs: (outputs) => (textOnlyAssetSummary(outputs) as Record<string, unknown>) ?? {},
});
