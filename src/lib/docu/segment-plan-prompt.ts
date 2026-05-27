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
  targetSentenceCount: z.number().int().positive().optional(),
  assignedAnchorIds: z.array(z.string()).optional().default([]),
});

const SegmentPlanOutputSchema = z.object({
  segments: z.array(SegmentPlanSchema),
});

type SegmentPlanOutput = z.infer<typeof SegmentPlanOutputSchema>;
type SegmentPlanSegment = z.infer<typeof SegmentPlanSchema>;

const MAX_STRUCTURAL_RETRIES = 2;

// ── Structural validator ──────────────────────────────────────────────

export interface SegmentPlanViolations {
  duplicateAnchorIds: Array<{ anchorId: string; segmentIndices: number[] }>;
  unknownAnchorIds: Array<{ anchorId: string; segmentIndex: number }>;
  missingArcRoles: Array<"hook" | "cta">;
}

export function validateSegmentPlanStructure(
  segments: SegmentPlanSegment[],
  anchors: readonly Anchor[],
): SegmentPlanViolations {
  const v: SegmentPlanViolations = {
    duplicateAnchorIds: [],
    unknownAnchorIds: [],
    missingArcRoles: [],
  };

  const anchorIdSet = new Set(anchors.map((a) => a.id));

  // 1. Anchor uniqueness: each anchor must appear in at most one segment
  const anchorToSegmentIndices = new Map<string, number[]>();
  for (const seg of segments) {
    for (const aid of seg.assignedAnchorIds) {
      const indices = anchorToSegmentIndices.get(aid) ?? [];
      indices.push(seg.index);
      anchorToSegmentIndices.set(aid, indices);
    }
  }
  for (const [anchorId, segmentIndices] of anchorToSegmentIndices) {
    if (segmentIndices.length > 1) {
      v.duplicateAnchorIds.push({ anchorId, segmentIndices });
    }
  }

  // 2. Unknown IDs: any assignedAnchorId not in the anchor list
  for (const seg of segments) {
    for (const aid of seg.assignedAnchorIds) {
      if (!anchorIdSet.has(aid)) {
        // Avoid duplicate entries for the same anchor ID in the same segment
        if (!v.unknownAnchorIds.some((u) => u.anchorId === aid && u.segmentIndex === seg.index)) {
          v.unknownAnchorIds.push({ anchorId: aid, segmentIndex: seg.index });
        }
      }
    }
  }

  // 3. Arc sanity (only when ≥ 3 segments): require ≥1 hook and ≥1 cta
  if (segments.length >= 3) {
    const roles = new Set(segments.map((s) => s.role));
    if (!roles.has("hook")) v.missingArcRoles.push("hook");
    if (!roles.has("cta")) v.missingArcRoles.push("cta");
  }

  return v;
}

export function hasViolations(v: SegmentPlanViolations): boolean {
  return (
    v.duplicateAnchorIds.length > 0 ||
    v.unknownAnchorIds.length > 0 ||
    v.missingArcRoles.length > 0
  );
}

export function buildSegmentPlanFeedback(v: SegmentPlanViolations): string {
  const lines: string[] = [];

  if (v.duplicateAnchorIds.length > 0) {
    const entries = v.duplicateAnchorIds.map((d) =>
      `"${d.anchorId}" in segments ${d.segmentIndices.join(", ")}`
    ).join("; ");
    lines.push(`- Duplicate anchor IDs (each anchor must appear in exactly one segment): ${entries}`);
  }

  if (v.unknownAnchorIds.length > 0) {
    const entries = v.unknownAnchorIds.map((u) =>
      `"${u.anchorId}" in segment ${u.segmentIndex}`
    ).join("; ");
    lines.push(`- Unknown anchor IDs (not in the anchor list): ${entries}`);
  }

  if (v.missingArcRoles.length > 0) {
    const roles = v.missingArcRoles.join(", ");
    lines.push(`- Missing arc roles: ${roles} — plan must contain at least one of each when segmentCount >= 3.`);
  }

  if (lines.length === 0) return "";
  return `Structural violations from previous attempt — fix these:\n${lines.join("\n")}`;
}

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
  let feedbackContext = "";
  let raw: SegmentPlanOutput | null = null;

  for (let attempt = 1; attempt <= MAX_STRUCTURAL_RETRIES + 1; attempt++) {
    const prompt = buildUserPrompt(topic, totalSentences, segmentCount, anchors) +
      (attempt > 1 ? "\n\n" + feedbackContext : "");

    raw = await callStructured({
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

    const violations = validateSegmentPlanStructure(raw.segments, anchors);
    if (!hasViolations(violations)) break;

    if (attempt <= MAX_STRUCTURAL_RETRIES) {
      process.stderr.write(
        `[docu/segment-plan] structural violations — retrying (${attempt}/${MAX_STRUCTURAL_RETRIES})...\n`
      );
      feedbackContext = buildSegmentPlanFeedback(violations);
    } else {
      console.warn(
        `[docu/segment-plan] structural violations after ${MAX_STRUCTURAL_RETRIES} retries — returning plan anyway`
      );
      if (opts?.verbose) {
        for (const d of violations.duplicateAnchorIds) {
          console.warn(`  duplicate anchor "${d.anchorId}" in segments ${d.segmentIndices.join(", ")}`);
        }
        for (const u of violations.unknownAnchorIds) {
          console.warn(`  unknown anchor "${u.anchorId}" in segment ${u.segmentIndex}`);
        }
        for (const r of violations.missingArcRoles) {
          console.warn(`  missing arc role: ${r}`);
        }
      }
    }
  }

  const result = raw!;
  const sentenceTargets = computeSentenceTargets(totalSentences, segmentCount);

  return result.segments
    .sort((a, b) => a.index - b.index)
    .map((seg, i) => ({
      ...seg,
      index: i,
      targetSentenceCount: sentenceTargets[i],
    }));
}

export { computeSentenceTargets };
