import { z } from "zod";
import { callStructured } from "./llm-client";
import { LLM_NARRATION, NARRATION_BATCH_SIZE } from "../config";
import { llmNarrationSegmentPrompt } from "../prompts";
import type { Anchor } from "../shared/research/research-schema";
import type { SentenceDef } from "./tts-pipeline";
import type { DocuSegmentPlan } from "./segment-types";
import type { DocuPalette } from "../../components/docu/docu-tokens";

const SENTENCE_SCHEMA = z.object({
  text: z.string().min(1),
  emphasis: z.array(z.string()).min(1).max(4),
  palette: z.enum(["cool-tech", "warm-real"]),
});

function narrationSchema(batchSize: number) {
  return z.object({
    sentences: z.array(SENTENCE_SCHEMA).length(batchSize),
  });
}

function buildSegmentSystemPrompt(
  plan: DocuSegmentPlan,
  assignedAnchors: readonly Anchor[],
  batchSize: number,
): string {
  return llmNarrationSegmentPrompt({
    role: plan.role,
    title: plan.title,
    intent: plan.intent,
    anchorCount: assignedAnchors.length,
    batchSize,
  });
}

function anchorToLines(anchors: readonly Anchor[]): string {
  return anchors.map((a, i) =>
    `[anc-${i + 1}] ${a.claim} / ${a.detail}` +
    (a.attribution.year ? ` / ${a.attribution.year}` : "") +
    (a.attribution.person ? ` / ${a.attribution.person}` : "")
  ).join("\n");
}

function mapToSentenceDefs(
  sentences: Array<{ text: string; emphasis: string[]; palette: string }>,
): SentenceDef[] {
  return sentences.map((s) => ({
    text: s.text,
    emphasis: s.emphasis,
    palette: s.palette as DocuPalette,
  }));
}

function lastNSentences(sentences: SentenceDef[], n: number): string {
  return sentences.slice(-n).map((s) => s.text).join(" ");
}

export async function generateSegmentNarration(
  topic: string,
  plan: DocuSegmentPlan,
  assignedAnchors: readonly Anchor[],
  priorSegmentContext: string,
  opts?: { verbose?: boolean },
): Promise<SentenceDef[]> {
  const targetCount = plan.targetSentenceCount;
  const batchSizes: number[] = [];
  let remaining = targetCount;

  while (remaining > 0) {
    const size = Math.min(remaining, NARRATION_BATCH_SIZE);
    batchSizes.push(size);
    remaining -= size;
  }

  const verified = assignedAnchors.filter((a) => a.status === "verified");
  const allSentences: SentenceDef[] = [];

  for (let bi = 0; bi < batchSizes.length; bi++) {
    const batchSize = batchSizes[bi];
    const system = buildSegmentSystemPrompt(plan, verified, batchSize);

    let priorContext: string;
    if (bi === 0 && priorSegmentContext) {
      priorContext = priorSegmentContext;
    } else if (allSentences.length > 0) {
      priorContext = lastNSentences(allSentences, 2);
    } else {
      priorContext = "";
    }

    const userPrompt = `Topic: ${topic}
Segment: ${plan.title} (${plan.role})
Segment intent: ${plan.intent}
Batch ${bi + 1} of ${batchSizes.length}: produce exactly ${batchSize} sentences.
${priorContext ? `\nContinue naturally from prior context: "${priorContext}"` : ""}
${bi === 0 && !priorContext ? `\nThis is the first batch of the segment — establish the segment's opening.` : ""}

Research anchors:
${anchorToLines(verified)}`;

    const result = await callStructured({
      schema: narrationSchema(batchSize),
      system,
      prompt: userPrompt,
      runName: `docu/narration/seg-${String(plan.index).padStart(2, "0")}-batch-${bi + 1}`,
      verbose: opts?.verbose,
      llm: LLM_NARRATION,
    });

    allSentences.push(...mapToSentenceDefs(result.sentences));
  }

  if (allSentences.length !== targetCount) {
    throw new Error(
      `Segment ${plan.index} narration: expected ${targetCount} sentences but got ${allSentences.length}`,
    );
  }

  return allSentences;
}
