import { z } from "zod";
import type { Anchor } from "../shared/research/research-schema";
import { callStructured } from "./llm-client";
import { LLM_SEGMENT_PLAN, SENTENCES_PER_MINUTE } from "../config";
import { llmSegmentPlanPrompt } from "../prompts";
import type { DocuSegmentPlan } from "./segment-types";

const SegmentPlanSchema = z.object({
  index: z.number().int().min(0),
  title: z.string().min(1),
  role: z.enum(["hook", "context", "data", "consequence", "cta", "build", "turn"]),
  intent: z.string().min(1),
  targetSentenceCount: z.number().int().positive(),
  assignedAnchorIds: z.array(z.string()),
});

const SegmentPlanOutputSchema = z.object({
  segments: z.array(SegmentPlanSchema),
});

type SegmentPlanOutput = z.infer<typeof SegmentPlanOutputSchema>;

const FIVE_SEGMENT_DEFAULT_ROLES: Array<DocuSegmentPlan["role"]> = [
  "hook",
  "context",
  "data",
  "consequence",
  "cta",
];

function computeSentenceTargets(
  totalSentences: number,
  segmentCount: number,
): number[] {
  const base = Math.floor(totalSentences / segmentCount);
  const remainder = totalSentences - base * segmentCount;
  const targets: number[] = [];
  const mid = Math.floor(segmentCount / 2);

  for (let i = 0; i < segmentCount; i++) {
    const dist = Math.abs(i - mid);
    const extra = dist < Math.ceil(remainder / 2) ? 1 : 0;
    targets.push(base + extra);
  }

  return targets;
}

function buildSystemPrompt(segmentCount: number): string {
  return llmSegmentPlanPrompt(segmentCount, segmentCount === 5);
}

function buildUserPrompt(
  topic: string,
  totalSentences: number,
  segmentCount: number,
  anchors: readonly Anchor[],
): string {
  const verified = anchors.filter((a) => a.status === "verified");
  const sentenceTargets = computeSentenceTargets(totalSentences, segmentCount);

  const anchorLines = verified.map((a) =>
    `[id=${a.id}] ${a.claim} / ${a.detail}` +
    (a.attribution.year ? ` / ${a.attribution.year}` : "") +
    (a.attribution.person ? ` / ${a.attribution.person}` : "")
  ).join("\n");

  const defaultRoleHints = segmentCount === 5
    ? `\n\nDefault arc: ${FIVE_SEGMENT_DEFAULT_ROLES.map((r, i) => `segment ${i}=${r}`).join(", ")} — recommend following this unless research anchors suggest otherwise.`
    : "";

  return `Topic: ${topic}
Total sentences across all segments: ${totalSentences}
Number of segments: ${segmentCount}

Sentence counts per segment (index 0 to ${segmentCount - 1}):
${sentenceTargets.map((count, i) => `  segment ${i}: ${count} sentences`).join("\n")}

Research anchors (distribute these across segments by anchorId):
${anchorLines || "(no verified anchors)"}${defaultRoleHints}`;
}

export async function generateSegmentPlan(
  topic: string,
  totalSentences: number,
  segmentCount: number,
  anchors: readonly Anchor[],
  opts?: { verbose?: boolean },
): Promise<DocuSegmentPlan[]> {
  const system = buildSystemPrompt(segmentCount);
  const prompt = buildUserPrompt(topic, totalSentences, segmentCount, anchors);

  const raw: SegmentPlanOutput = await callStructured({
    schema: SegmentPlanOutputSchema.refine(
      (d) => d.segments.length === segmentCount,
      { message: `Expected ${segmentCount} segments` },
    ),
    system,
    prompt,
    runName: "docu/segment-plan",
    verbose: opts?.verbose,
    llm: LLM_SEGMENT_PLAN,
  });

  const sentenceTargets = computeSentenceTargets(totalSentences, segmentCount);

  return raw.segments
    .sort((a, b) => a.index - b.index)
    .map((seg, i) => ({
      ...seg,
      index: i,
      targetSentenceCount: sentenceTargets[i],
    }));
}

export { computeSentenceTargets };
