import { z } from "zod";
import type { Anchor } from "../shared/research/research-schema";
import { callStructured } from "./llm-client";
import { LLM_SEGMENT_PLAN, SENTENCES_PER_MINUTE } from "../config";
import { llmSpinePrompt } from "../prompts";
import type { DocuSegmentPlan, SceneSpec, StorySpine, ArcRole } from "./segment-types";

const ArcRoleSchema = z.enum(["hook", "baseline", "escalation", "turn", "payoff"]);

const SceneSpecOutputSchema = z.object({
  index: z.number().int().min(0),
  title: z.string().min(1),
  role: z.enum(["hook", "context", "data", "consequence", "cta", "build", "turn"]).optional(),
  arcRole: ArcRoleSchema,
  intent: z.string().min(1),
  targetSentenceCount: z.number().int().positive().optional(),
  assignedAnchorIds: z.array(z.string()).optional().default([]),
  scenarioPressure: z.string().min(1),
  flipType: z.enum([
    "safety-to-danger",
    "complexity-to-lever",
    "profit-to-loss",
    "cheap-to-expensive",
    "expert-answer-to-fail",
    "random-to-incentive",
    "personal-mistake-to-structural-trap",
  ]).optional(),
  retentionLoop: z.string(),
  visualBeat: z.string().min(1),
  device: z.enum([
    "what-if-scenario",
    "countdown",
    "scale-compression",
    "contrast",
    "failed-obvious-answer",
    "callback-object",
    "rhetorical-question",
    "tricolon",
    "none",
  ]),
  pronoun: z.enum(["you", "we", "they", "it"]),
  palette: z.enum(["cool-tech", "warm-real"]),
  emotionalRegister: z.string().min(1),
  flipFromPrior: z.boolean(),
});

const SpineOutputSchema = z.object({
  schemaVersion: z.literal(2),
  primaryStructure: z.enum([
    "scenario-escalation",
    "disaster-simulation",
    "case-file-autopsy",
    "countdown",
    "comparison-gauntlet",
    "inside-the-machine",
    "experiment-challenge",
    "reveal-ladder",
  ]),
  viewerRole: z.string().min(1),
  caseStudyAgent: z.string().nullable().optional(),
  caseStudyAnchorId: z.string().nullable().optional(),
  scenarioPressure: z.string().min(1),
  hiddenSystem: z.string().min(1),
  centralFlip: z.string().min(1),
  viewerStake: z.string().min(1),
  retentionQuestion: z.string().min(1),
  quoteSceneIndex: z.number().int().nullable(),
  segments: z.array(SceneSpecOutputSchema),
});

type SpineOutput = z.infer<typeof SpineOutputSchema>;
type SceneSpecOutput = z.infer<typeof SceneSpecOutputSchema>;

const MAX_STRUCTURAL_RETRIES = 2;

// ── Structural validator ──────────────────────────────────────────────

export interface SpineViolations {
  duplicateAnchorIds: Array<{ anchorId: string; segmentIndices: number[] }>;
  unknownAnchorIds: Array<{ anchorId: string; segmentIndex: number }>;
  quoteSceneInvalid: boolean;
  noFlipFromPrior: boolean;
  arcRoleSequenceInvalid: boolean;
  arcRoleSequenceDetail: string;
  caseStudyAnchorUnknown: boolean;
  missingWarmReal: boolean;
}

export function validateSpineStructure(
  segments: SceneSpecOutput[],
  quoteSceneIndex: number | null,
  caseStudyAnchorId: string | null | undefined,
  anchors: readonly Anchor[],
): SpineViolations {
  const v: SpineViolations = {
    duplicateAnchorIds: [],
    unknownAnchorIds: [],
    quoteSceneInvalid: false,
    noFlipFromPrior: false,
    arcRoleSequenceInvalid: false,
    arcRoleSequenceDetail: "",
    caseStudyAnchorUnknown: false,
    missingWarmReal: false,
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

  // 2. Unknown IDs
  for (const seg of segments) {
    for (const aid of seg.assignedAnchorIds) {
      if (!anchorIdSet.has(aid)) {
        if (!v.unknownAnchorIds.some((u) => u.anchorId === aid && u.segmentIndex === seg.index)) {
          v.unknownAnchorIds.push({ anchorId: aid, segmentIndex: seg.index });
        }
      }
    }
  }

  // 3. quoteSceneIndex validity
  if (quoteSceneIndex !== null) {
    if (quoteSceneIndex < 0 || quoteSceneIndex >= segments.length) {
      v.quoteSceneInvalid = true;
    } else {
      const sceneAnchorIds = new Set(segments[quoteSceneIndex].assignedAnchorIds);
      const hasQuote = anchors.some(
        (a) => sceneAnchorIds.has(a.id) && typeof a.quote === "string" && a.quote.length > 0,
      );
      if (!hasQuote) {
        v.quoteSceneInvalid = true;
      }
    }
  }

  // 4. flipFromPrior: ≥1 scene must have it
  if (!segments.some((s) => s.flipFromPrior)) {
    v.noFlipFromPrior = true;
  }

  // 5. ArcRole sequence (only when ≥ 3 segments)
  if (segments.length >= 3) {
    const arcRoles = segments.map((s) => s.arcRole);
    if (arcRoles[0] !== "hook") {
      v.arcRoleSequenceInvalid = true;
      v.arcRoleSequenceDetail = "First scene must be 'hook'";
    }
    if (arcRoles[arcRoles.length - 1] !== "payoff") {
      v.arcRoleSequenceInvalid = true;
      v.arcRoleSequenceDetail = "Last scene must be 'payoff'";
    }
    const hookIdx = arcRoles.indexOf("hook");
    const baselineIdx = arcRoles.indexOf("baseline");
    const turnIdx = arcRoles.indexOf("turn");
    const payoffIdx = arcRoles.indexOf("payoff");
    const hasEscalation = arcRoles.includes("escalation");

    if (!hasEscalation && arcRoles.length >= 3) {
      v.arcRoleSequenceInvalid = true;
      v.arcRoleSequenceDetail = "At least one 'escalation' scene required";
    }
    if (payoffIdx >= 0 && turnIdx >= 0 && payoffIdx < turnIdx) {
      v.arcRoleSequenceInvalid = true;
      v.arcRoleSequenceDetail = "'payoff' must appear after 'turn'";
    }
    if (baselineIdx >= 0 && turnIdx >= 0 && !arcRoles.slice(baselineIdx, turnIdx).includes("escalation")) {
      // Only flag if we have both baseline and turn but no escalation between
    }
  }

  // 6. caseStudyAnchorId must exist
  if (caseStudyAnchorId && !anchorIdSet.has(caseStudyAnchorId)) {
    v.caseStudyAnchorUnknown = true;
  }

  // 7. At least one scene must be warm-real
  if (!segments.some((s) => s.palette === "warm-real")) {
    v.missingWarmReal = true;
  }

  return v;
}

export function hasSpineViolations(v: SpineViolations): boolean {
  return (
    v.duplicateAnchorIds.length > 0 ||
    v.unknownAnchorIds.length > 0 ||
    v.quoteSceneInvalid ||
    v.noFlipFromPrior ||
    v.arcRoleSequenceInvalid ||
    v.caseStudyAnchorUnknown ||
    v.missingWarmReal
  );
}

export function buildSpineFeedback(v: SpineViolations): string {
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

  if (v.quoteSceneInvalid) {
    lines.push("- quoteSceneIndex references a segment with no quoted anchor. Set to null or point to a segment that has an anchor with a quote field.");
  }

  if (v.noFlipFromPrior) {
    lines.push("- No scene has flipFromPrior: true. At least one scene must flip or intensify its emotional register.");
  }

  if (v.arcRoleSequenceInvalid) {
    lines.push(`- ArcRole sequence invalid: ${v.arcRoleSequenceDetail}. Required: hook first, payoff last, at least one escalation between baseline and turn, no payoff before turn.`);
  }

  if (v.caseStudyAnchorUnknown) {
    lines.push("- caseStudyAnchorId does not match any anchor in the list.");
  }

  if (v.missingWarmReal) {
    lines.push("- No scene uses palette 'warm-real'. At least one scene (baseline or payoff) must use warm-real for human-consequence content.");
  }

  if (lines.length === 0) return "";
  return `Structural violations from previous attempt — fix these:\n${lines.join("\n")}`;
}

// ── Sentence target computation ───────────────────────────────────────

export const ARC_WEIGHTS: Record<ArcRole, number> = {
  hook:       0.08,
  baseline:   0.15,
  escalation: 0.37,
  turn:       0.25,
  payoff:     0.15,
};

export function computeSentenceTargets(
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

export function apportionByProportions(
  totalSentences: number,
  rawProportions: number[],
): number[] {
  const total = rawProportions.reduce((s, p) => s + p, 0);
  const normalised = rawProportions.map((p) => p / total);

  const targets: number[] = normalised.map((w) =>
    Math.max(1, Math.floor(totalSentences * w))
  );

  let remainder = totalSentences - targets.reduce((s, t) => s + t, 0);
  const priority = normalised
    .map((w, idx) => ({ idx, w }))
    .sort((a, b) => b.w - a.w);

  for (const { idx } of priority) {
    if (remainder === 0) break;
    targets[idx] += remainder > 0 ? 1 : -1;
    remainder += remainder > 0 ? -1 : 1;
  }

  return targets;
}

// ── Spine generation ──────────────────────────────────────────────────

function buildUserPrompt(
  topic: string,
  totalSentences: number,
  segmentCount: number,
  anchors: readonly Anchor[],
): string {
  const verified = anchors.filter((a) => a.status === "verified");
  const sentenceTargets = computeSentenceTargets(totalSentences, segmentCount);

  const anchorLines = verified.map((a) =>
    `[${a.id}] (${a.kind}${a.sourceTier ? `, ${a.sourceTier}` : ""}) ${a.claim} / ${a.detail}` +
    (a.attribution.year ? ` / ${a.attribution.year}` : "") +
    (a.attribution.person ? ` / ${a.attribution.person}` : "") +
    (a.quote ? `\n    QUOTE: "${a.quote}"` : "")
  ).join("\n");

  return `Topic: ${topic}
Total sentences across all segments: ${totalSentences}
Number of segments: ${segmentCount}

Sentence counts per segment (index 0 to ${segmentCount - 1}):
${sentenceTargets.map((count, i) => `  segment ${i}: ${count} sentences`).join("\n")}

Research anchors (distribute these across segments by anchorId):
${anchorLines || "(no verified anchors)"}`;
}

export async function generateSpine(
  topic: string,
  totalSentences: number,
  segmentCount: number,
  anchors: readonly Anchor[],
  opts?: { verbose?: boolean },
): Promise<StorySpine> {
  const system = llmSpinePrompt(segmentCount);
  let feedbackContext = "";
  let raw: SpineOutput | null = null;

  for (let attempt = 1; attempt <= MAX_STRUCTURAL_RETRIES + 1; attempt++) {
    const prompt = buildUserPrompt(topic, totalSentences, segmentCount, anchors) +
      (attempt > 1 ? "\n\n" + feedbackContext : "");

    raw = await callStructured({
      schema: SpineOutputSchema.refine(
        (d) => d.segments.length === segmentCount,
        { message: `Expected ${segmentCount} segments` },
      ),
      system,
      prompt,
      runName: "docu/spine",
      verbose: opts?.verbose,
      llm: LLM_SEGMENT_PLAN,
    });

    const violations = validateSpineStructure(
      raw.segments,
      raw.quoteSceneIndex,
      raw.caseStudyAnchorId,
      anchors,
    );
    if (!hasSpineViolations(violations)) break;

    if (attempt <= MAX_STRUCTURAL_RETRIES) {
      process.stderr.write(
        `[docu/spine] structural violations — retrying (${attempt}/${MAX_STRUCTURAL_RETRIES})...\n`
      );
      feedbackContext = buildSpineFeedback(violations);
    } else {
      console.warn(
        `[docu/spine] structural violations after ${MAX_STRUCTURAL_RETRIES} retries — returning spine anyway`
      );
      if (opts?.verbose) {
        for (const d of violations.duplicateAnchorIds) {
          console.warn(`  duplicate anchor "${d.anchorId}" in segments ${d.segmentIndices.join(", ")}`);
        }
        for (const u of violations.unknownAnchorIds) {
          console.warn(`  unknown anchor "${u.anchorId}" in segment ${u.segmentIndex}`);
        }
        if (violations.quoteSceneInvalid) console.warn(`  quoteSceneIndex invalid`);
        if (violations.noFlipFromPrior) console.warn(`  no flipFromPrior`);
        if (violations.arcRoleSequenceInvalid) console.warn(`  arcRole sequence: ${violations.arcRoleSequenceDetail}`);
        if (violations.caseStudyAnchorUnknown) console.warn(`  caseStudyAnchorId unknown`);
        if (violations.missingWarmReal) console.warn(`  missing warm-real scene`);
      }
    }
  }

  const result = raw!;
  const sortedOutputs = [...result.segments].sort((a, b) => a.index - b.index);

  const llmProportions = sortedOutputs.map((seg) =>
    seg.targetSentenceCount ?? ARC_WEIGHTS[seg.arcRole as ArcRole],
  );
  const sentenceTargets = apportionByProportions(totalSentences, llmProportions);

  const segments: SceneSpec[] = sortedOutputs.map((seg, i) => ({
    index: i,
    title: seg.title,
    role: seg.role,
    arcRole: seg.arcRole as ArcRole,
    intent: seg.intent,
    targetSentenceCount: sentenceTargets[i],
    assignedAnchorIds: seg.assignedAnchorIds,
    scenarioPressure: seg.scenarioPressure,
    flipType: seg.flipType,
    retentionLoop: seg.retentionLoop,
    visualBeat: seg.visualBeat,
    device: seg.device,
    pronoun: seg.pronoun,
    palette: seg.palette,
    emotionalRegister: seg.emotionalRegister,
    flipFromPrior: seg.flipFromPrior,
  }));

  // Scaling guard: warn when a single escalation segment exceeds ~35% of total sentences
  const escalationCap = Math.max(20, Math.round(totalSentences * 0.35));
  for (const seg of segments) {
    if (seg.arcRole === "escalation" && seg.targetSentenceCount > escalationCap) {
      process.stderr.write(
        `[docu/spine] WARNING: escalation segment "${seg.title}" has ${seg.targetSentenceCount} sentences` +
        ` (cap=${escalationCap} for ${totalSentences} total). Consider increasing --segments to split the escalation phase.\n`,
      );
    }
  }

  return {
    schemaVersion: 2,
    primaryStructure: result.primaryStructure,
    viewerRole: result.viewerRole,
    caseStudyAgent: result.caseStudyAgent ?? undefined,
    caseStudyAnchorId: result.caseStudyAnchorId ?? undefined,
    scenarioPressure: result.scenarioPressure,
    hiddenSystem: result.hiddenSystem,
    centralFlip: result.centralFlip,
    viewerStake: result.viewerStake,
    retentionQuestion: result.retentionQuestion,
    quoteSceneIndex: result.quoteSceneIndex,
    segments,
  };
}
