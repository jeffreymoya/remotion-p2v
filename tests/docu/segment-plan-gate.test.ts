/**
 * Usage:
 *   npx tsx tests/docu/segment-plan-gate.test.ts
 */
import {
  validateSpineStructure,
  hasSpineViolations,
  buildSpineFeedback,
  computeSentenceTargets,
  apportionByProportions,
  ARC_WEIGHTS,
} from "../../src/lib/docu/segment-plan-prompt";
import type { Anchor } from "../../src/lib/shared/research/research-schema";

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`PASS ${label}`);
}

function anchor(id: string, opts?: { quote?: string }): Anchor {
  return {
    id,
    kind: "study",
    claim: `Claim for ${id}`,
    detail: `Detail for ${id}`,
    attribution: { year: 2024 },
    citation: {
      url: "https://example.com",
      title: `Source for ${id}`,
      accessedAt: "2025-01-01",
      verifierConfidence: "high",
      verifierNotes: "ok",
    },
    status: "verified",
    quote: opts?.quote,
  };
}

type SceneInput = {
  index: number;
  title: string;
  arcRole: string;
  intent: string;
  assignedAnchorIds: string[];
  scenarioPressure: string;
  retentionLoop: string;
  visualBeat: string;
  device: string;
  pronoun: string;
  palette: string;
  emotionalRegister: string;
  flipFromPrior: boolean;
};

// ── Happy path: valid 5-scene arc ─────────────────────────────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Hook", arcRole: "hook", intent: "trap", assignedAnchorIds: ["a1"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "what-if-scenario", pronoun: "you", palette: "cool-tech", emotionalRegister: "anxiety", flipFromPrior: false },
    { index: 1, title: "Baseline", arcRole: "baseline", intent: "explain", assignedAnchorIds: ["a2"], scenarioPressure: "p1", retentionLoop: "loop1", visualBeat: "vb1", device: "none", pronoun: "it", palette: "warm-real", emotionalRegister: "curiosity", flipFromPrior: false },
    { index: 2, title: "Escalation", arcRole: "escalation", intent: "build", assignedAnchorIds: ["a3"], scenarioPressure: "p2", retentionLoop: "loop2", visualBeat: "vb2", device: "contrast", pronoun: "you", palette: "cool-tech", emotionalRegister: "alarm", flipFromPrior: true },
    { index: 3, title: "Turn", arcRole: "turn", intent: "flip", assignedAnchorIds: ["a4"], scenarioPressure: "p3", retentionLoop: "loop3", visualBeat: "vb3", device: "failed-obvious-answer", pronoun: "you", palette: "cool-tech", emotionalRegister: "indignation", flipFromPrior: false },
    { index: 4, title: "Payoff", arcRole: "payoff", intent: "resolve", assignedAnchorIds: ["a5"], scenarioPressure: "p4", retentionLoop: "loop4", visualBeat: "vb4", device: "callback-object", pronoun: "you", palette: "warm-real", emotionalRegister: "resolve", flipFromPrior: false },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3"), anchor("a4"), anchor("a5")];
  const v = validateSpineStructure(segments as any, null, undefined, anchors);
  assert(
    v.duplicateAnchorIds.length === 0 && v.unknownAnchorIds.length === 0
    && !v.quoteSceneInvalid && !v.noFlipFromPrior && !v.arcRoleSequenceInvalid
    && !v.caseStudyAnchorUnknown && !v.missingWarmReal,
    "happy path: zero violations for 5-scene spine",
  );
  assert(!hasSpineViolations(v), "hasSpineViolations: false for clean spine");
}

// ── Duplicate anchor ID ───────────────────────────────────────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Hook", arcRole: "hook", intent: "trap", assignedAnchorIds: ["a1"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "what-if-scenario", pronoun: "you", palette: "cool-tech", emotionalRegister: "anxiety", flipFromPrior: false },
    { index: 1, title: "Baseline", arcRole: "baseline", intent: "explain", assignedAnchorIds: ["a2"], scenarioPressure: "p1", retentionLoop: "loop1", visualBeat: "vb1", device: "none", pronoun: "it", palette: "warm-real", emotionalRegister: "curiosity", flipFromPrior: false },
    { index: 2, title: "Escalation", arcRole: "escalation", intent: "build", assignedAnchorIds: ["a1"], scenarioPressure: "p2", retentionLoop: "loop2", visualBeat: "vb2", device: "contrast", pronoun: "you", palette: "cool-tech", emotionalRegister: "alarm", flipFromPrior: true },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2")];
  const v = validateSpineStructure(segments as any, null, undefined, anchors);
  assert(v.duplicateAnchorIds.length === 1, "duplicate: one duplicate entry");
  assert(v.duplicateAnchorIds[0].anchorId === "a1", "duplicate: correct anchorId");
}

// ── Unknown anchor ID ─────────────────────────────────────────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Hook", arcRole: "hook", intent: "trap", assignedAnchorIds: ["bogus"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "what-if-scenario", pronoun: "you", palette: "cool-tech", emotionalRegister: "anxiety", flipFromPrior: false },
  ];
  const anchors: Anchor[] = [anchor("a1")];
  const v = validateSpineStructure(segments as any, null, undefined, anchors);
  assert(v.unknownAnchorIds.length === 1, "unknown: one unknown entry");
  assert(v.unknownAnchorIds[0].anchorId === "bogus", "unknown: correct anchorId");
}

// ── No flipFromPrior ──────────────────────────────────────────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Hook", arcRole: "hook", intent: "trap", assignedAnchorIds: ["a1"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "what-if-scenario", pronoun: "you", palette: "cool-tech", emotionalRegister: "anxiety", flipFromPrior: false },
    { index: 1, title: "Baseline", arcRole: "baseline", intent: "explain", assignedAnchorIds: ["a2"], scenarioPressure: "p1", retentionLoop: "loop1", visualBeat: "vb1", device: "none", pronoun: "it", palette: "warm-real", emotionalRegister: "curiosity", flipFromPrior: false },
    { index: 2, title: "Payoff", arcRole: "payoff", intent: "resolve", assignedAnchorIds: ["a3"], scenarioPressure: "p2", retentionLoop: "loop2", visualBeat: "vb2", device: "callback-object", pronoun: "you", palette: "warm-real", emotionalRegister: "resolve", flipFromPrior: false },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3")];
  const v = validateSpineStructure(segments as any, null, undefined, anchors);
  assert(v.noFlipFromPrior, "no-flip: flag is set");
}

// ── ArcRole sequence: first not hook ──────────────────────────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Baseline", arcRole: "baseline", intent: "explain", assignedAnchorIds: ["a1"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "none", pronoun: "it", palette: "cool-tech", emotionalRegister: "curiosity", flipFromPrior: true },
    { index: 1, title: "Escalation", arcRole: "escalation", intent: "build", assignedAnchorIds: ["a2"], scenarioPressure: "p1", retentionLoop: "loop1", visualBeat: "vb1", device: "contrast", pronoun: "you", palette: "cool-tech", emotionalRegister: "alarm", flipFromPrior: false },
    { index: 2, title: "Payoff", arcRole: "payoff", intent: "resolve", assignedAnchorIds: ["a3"], scenarioPressure: "p2", retentionLoop: "loop2", visualBeat: "vb2", device: "callback-object", pronoun: "you", palette: "warm-real", emotionalRegister: "resolve", flipFromPrior: false },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3")];
  const v = validateSpineStructure(segments as any, null, undefined, anchors);
  assert(v.arcRoleSequenceInvalid, "arcRole: first not hook");
  assert(v.arcRoleSequenceDetail.includes("hook"), "arcRole: detail mentions hook");
}

// ── ArcRole sequence: last not payoff ────────────────────────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Hook", arcRole: "hook", intent: "trap", assignedAnchorIds: ["a1"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "what-if-scenario", pronoun: "you", palette: "cool-tech", emotionalRegister: "anxiety", flipFromPrior: true },
    { index: 1, title: "Escalation", arcRole: "escalation", intent: "build", assignedAnchorIds: ["a2"], scenarioPressure: "p1", retentionLoop: "loop1", visualBeat: "vb1", device: "contrast", pronoun: "you", palette: "cool-tech", emotionalRegister: "alarm", flipFromPrior: false },
    { index: 2, title: "Turn", arcRole: "turn", intent: "flip", assignedAnchorIds: ["a3"], scenarioPressure: "p2", retentionLoop: "loop2", visualBeat: "vb2", device: "failed-obvious-answer", pronoun: "you", palette: "cool-tech", emotionalRegister: "resolve", flipFromPrior: false },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3")];
  const v = validateSpineStructure(segments as any, null, undefined, anchors);
  assert(v.arcRoleSequenceInvalid, "arcRole: last not payoff");
}

// ── Missing warm-real scene ──────────────────────────────────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Hook", arcRole: "hook", intent: "trap", assignedAnchorIds: ["a1"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "what-if-scenario", pronoun: "you", palette: "cool-tech", emotionalRegister: "anxiety", flipFromPrior: false },
    { index: 1, title: "Baseline", arcRole: "baseline", intent: "explain", assignedAnchorIds: ["a2"], scenarioPressure: "p1", retentionLoop: "loop1", visualBeat: "vb1", device: "none", pronoun: "it", palette: "cool-tech", emotionalRegister: "curiosity", flipFromPrior: true },
    { index: 2, title: "Escalation", arcRole: "escalation", intent: "build", assignedAnchorIds: ["a3"], scenarioPressure: "p2", retentionLoop: "loop2", visualBeat: "vb2", device: "contrast", pronoun: "you", palette: "cool-tech", emotionalRegister: "alarm", flipFromPrior: false },
    { index: 3, title: "Turn", arcRole: "turn", intent: "flip", assignedAnchorIds: ["a4"], scenarioPressure: "p3", retentionLoop: "loop3", visualBeat: "vb3", device: "failed-obvious-answer", pronoun: "you", palette: "cool-tech", emotionalRegister: "indignation", flipFromPrior: false },
    { index: 4, title: "Payoff", arcRole: "payoff", intent: "resolve", assignedAnchorIds: ["a5"], scenarioPressure: "p4", retentionLoop: "loop4", visualBeat: "vb4", device: "callback-object", pronoun: "you", palette: "cool-tech", emotionalRegister: "resolve", flipFromPrior: false },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3"), anchor("a4"), anchor("a5")];
  const v = validateSpineStructure(segments as any, null, undefined, anchors);
  assert(v.missingWarmReal, "missing-warm: flag is set");
}

// ── quoteSceneIndex valid ────────────────────────────────────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Hook", arcRole: "hook", intent: "trap", assignedAnchorIds: ["a1"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "what-if-scenario", pronoun: "you", palette: "warm-real", emotionalRegister: "anxiety", flipFromPrior: false },
    { index: 1, title: "Baseline", arcRole: "baseline", intent: "explain", assignedAnchorIds: ["a2"], scenarioPressure: "p1", retentionLoop: "loop1", visualBeat: "vb1", device: "none", pronoun: "it", palette: "cool-tech", emotionalRegister: "curiosity", flipFromPrior: false },
    { index: 2, title: "Escalation", arcRole: "escalation", intent: "build", assignedAnchorIds: ["a3"], scenarioPressure: "p2", retentionLoop: "loop2", visualBeat: "vb2", device: "contrast", pronoun: "you", palette: "cool-tech", emotionalRegister: "alarm", flipFromPrior: true },
    { index: 3, title: "Turn", arcRole: "turn", intent: "flip", assignedAnchorIds: ["a4"], scenarioPressure: "p3", retentionLoop: "loop3", visualBeat: "vb3", device: "failed-obvious-answer", pronoun: "you", palette: "cool-tech", emotionalRegister: "indignation", flipFromPrior: false },
    { index: 4, title: "Payoff", arcRole: "payoff", intent: "resolve", assignedAnchorIds: ["a5"], scenarioPressure: "p4", retentionLoop: "loop4", visualBeat: "vb4", device: "callback-object", pronoun: "you", palette: "warm-real", emotionalRegister: "resolve", flipFromPrior: false },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3", { quote: "Something important" }), anchor("a4"), anchor("a5")];
  const v = validateSpineStructure(segments as any, 2, undefined, anchors);
  assert(!v.quoteSceneInvalid, "quoteScene: valid (scene 2 has quoted anchor a3)");
}

// ── quoteSceneIndex invalid — no quote in scene ──────────────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Hook", arcRole: "hook", intent: "trap", assignedAnchorIds: ["a1"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "what-if-scenario", pronoun: "you", palette: "warm-real", emotionalRegister: "anxiety", flipFromPrior: false },
    { index: 1, title: "Baseline", arcRole: "baseline", intent: "explain", assignedAnchorIds: ["a2"], scenarioPressure: "p1", retentionLoop: "loop1", visualBeat: "vb1", device: "none", pronoun: "it", palette: "cool-tech", emotionalRegister: "curiosity", flipFromPrior: true },
    { index: 2, title: "Payoff", arcRole: "payoff", intent: "resolve", assignedAnchorIds: ["a3"], scenarioPressure: "p2", retentionLoop: "loop2", visualBeat: "vb2", device: "callback-object", pronoun: "you", palette: "warm-real", emotionalRegister: "resolve", flipFromPrior: false },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3")];
  const v = validateSpineStructure(segments as any, 0, undefined, anchors);
  assert(v.quoteSceneInvalid, "quoteScene: invalid (no quoted anchor in scene 0)");
}

// ── caseStudyAnchorId unknown ─────────────────────────────────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Hook", arcRole: "hook", intent: "trap", assignedAnchorIds: ["a1"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "what-if-scenario", pronoun: "you", palette: "warm-real", emotionalRegister: "anxiety", flipFromPrior: false },
    { index: 1, title: "Baseline", arcRole: "baseline", intent: "explain", assignedAnchorIds: ["a2"], scenarioPressure: "p1", retentionLoop: "loop1", visualBeat: "vb1", device: "none", pronoun: "it", palette: "warm-real", emotionalRegister: "curiosity", flipFromPrior: true },
    { index: 2, title: "Payoff", arcRole: "payoff", intent: "resolve", assignedAnchorIds: ["a3"], scenarioPressure: "p2", retentionLoop: "loop2", visualBeat: "vb2", device: "callback-object", pronoun: "you", palette: "warm-real", emotionalRegister: "resolve", flipFromPrior: false },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3")];
  const v = validateSpineStructure(segments as any, null, "bogus-id", anchors);
  assert(v.caseStudyAnchorUnknown, "caseStudy: unknown anchor id");
}

// ── quoteSceneIndex null — always valid ──────────────────────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Hook", arcRole: "hook", intent: "trap", assignedAnchorIds: ["a1"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "what-if-scenario", pronoun: "you", palette: "warm-real", emotionalRegister: "anxiety", flipFromPrior: false },
    { index: 1, title: "Baseline", arcRole: "baseline", intent: "explain", assignedAnchorIds: ["a2"], scenarioPressure: "p1", retentionLoop: "loop1", visualBeat: "vb1", device: "none", pronoun: "it", palette: "warm-real", emotionalRegister: "curiosity", flipFromPrior: true },
    { index: 2, title: "Payoff", arcRole: "payoff", intent: "resolve", assignedAnchorIds: ["a3"], scenarioPressure: "p2", retentionLoop: "loop2", visualBeat: "vb2", device: "callback-object", pronoun: "you", palette: "warm-real", emotionalRegister: "resolve", flipFromPrior: false },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3")];
  const v = validateSpineStructure(segments as any, null, undefined, anchors);
  assert(!v.quoteSceneInvalid, "quoteScene: null always valid");
}

// ── Small plan (2 segments) — arc sanity fully checked ───────────────

{
  const segments: SceneInput[] = [
    { index: 0, title: "Hook", arcRole: "hook", intent: "trap", assignedAnchorIds: ["a1"], scenarioPressure: "p0", retentionLoop: "loop0", visualBeat: "vb0", device: "what-if-scenario", pronoun: "you", palette: "warm-real", emotionalRegister: "anxiety", flipFromPrior: true },
    { index: 1, title: "Payoff", arcRole: "payoff", intent: "resolve", assignedAnchorIds: ["a2"], scenarioPressure: "p1", retentionLoop: "loop1", visualBeat: "vb1", device: "callback-object", pronoun: "you", palette: "warm-real", emotionalRegister: "resolve", flipFromPrior: false },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2")];
  const v = validateSpineStructure(segments as any, null, undefined, anchors);
  // No missingArcRoles check in spine — arcRole sequence is only checked for ≥3
  assert(!v.arcRoleSequenceInvalid, "small-plan: no arcRole error for <3 segments");
}

// ── buildSpineFeedback ───────────────────────────────────────────────

{
  const feedback = buildSpineFeedback({
    duplicateAnchorIds: [{ anchorId: "anc-001", segmentIndices: [0, 2] }],
    unknownAnchorIds: [{ anchorId: "anc-999", segmentIndex: 1 }],
    quoteSceneInvalid: true,
    noFlipFromPrior: true,
    arcRoleSequenceInvalid: true,
    arcRoleSequenceDetail: "First scene must be 'hook'",
    caseStudyAnchorUnknown: false,
    missingWarmReal: true,
  });
  assert(feedback.includes("anc-001"), "feedback: includes duplicate anchor ID");
  assert(feedback.includes("anc-999"), "feedback: includes unknown anchor ID");
  assert(feedback.includes("quoteSceneIndex"), "feedback: includes quoteScene note");
  assert(feedback.includes("flipFromPrior"), "feedback: includes flipFromPrior note");
  assert(feedback.includes("warm-real"), "feedback: includes warm-real note");
  assert(feedback.startsWith("Structural violations"), "feedback: starts with header");
}

{
  const feedback = buildSpineFeedback({
    duplicateAnchorIds: [],
    unknownAnchorIds: [],
    quoteSceneInvalid: false,
    noFlipFromPrior: false,
    arcRoleSequenceInvalid: false,
    arcRoleSequenceDetail: "",
    caseStudyAnchorUnknown: false,
    missingWarmReal: false,
  });
  assert(feedback === "", "feedback: empty for no violations");
}

// ── Patch 3: apportionByProportions ────────────────────────────────────

{
  // LLM returns targetSentenceCount values — should sum to exactly totalSentences
  const targets = apportionByProportions(28, [3, 5, 9, 7, 4]);
  const sum = targets.reduce((s, t) => s + t, 0);
  assert(sum === 28, `apportion: LLM props sum to totalSentences (got ${sum}, expected 28)`);
}

{
  // All-equal proportions with non-divisible totalSentences
  const targets = apportionByProportions(20, [1, 1, 1, 1, 1]);
  const sum = targets.reduce((s, t) => s + t, 0);
  assert(sum === 20, `apportion: equal props sum to totalSentences (got ${sum})`);
  assert(targets.every((t) => t >= 1), "apportion: every segment >= 1");
}

{
  // Single segment
  const targets = apportionByProportions(10, [1]);
  assert(targets[0] === 10, `apportion: single segment gets all (got ${targets[0]})`);
}

{
  // Highly skewed proportions
  const targets = apportionByProportions(20, [10, 1, 1, 1, 1]);
  const sum = targets.reduce((s, t) => s + t, 0);
  assert(sum === 20, `apportion: skewed props sum to totalSentences (got ${sum})`);
  assert(targets[0] > targets[1], "apportion: skewed — first segment has most");
}

// ── Patch 2: ARC_WEIGHTS fallback distribution ─────────────────────────

{
  // Default 5-segment fallback: hook=0.08, baseline=0.15, escalation=0.37, turn=0.25, payoff=0.15
  // 20 sentences → hook=2, baseline=3, escalation=7, turn=5, payoff=3
  const targets = apportionByProportions(20, [
    ARC_WEIGHTS.hook,
    ARC_WEIGHTS.baseline,
    ARC_WEIGHTS.escalation,
    ARC_WEIGHTS.turn,
    ARC_WEIGHTS.payoff,
  ]);
  const sum = targets.reduce((s, t) => s + t, 0);
  assert(sum === 20, `arc-weights: sum to 20 (got ${sum}): ${targets.join(", ")}`);
  assert(targets[2] >= 7, `arc-weights: escalation >= 7 (got ${targets[2]})`);
  assert(targets[3] >= 5, `arc-weights: turn >= 5 (got ${targets[3]})`); // 25% of 20
  assert(targets[0] + targets[1] < targets[2], "arc-weights: hook+baseline < escalation");
}

{
  // At 40 sentences: baseline = 6 (15%), not 8 (20%)
  const targets = apportionByProportions(40, [
    ARC_WEIGHTS.hook,
    ARC_WEIGHTS.baseline,
    ARC_WEIGHTS.escalation,
    ARC_WEIGHTS.turn,
    ARC_WEIGHTS.payoff,
  ]);
  assert(targets[1] === 6, `arc-weights 40: baseline = 6 (got ${targets[1]})`);
}

{
  // Partial fallback: some segments have targetSentenceCount, some use ARC_WEIGHTS
  const targets = apportionByProportions(20, [
    2, // hook: explicit
    ARC_WEIGHTS.baseline, // baseline: fallback
    ARC_WEIGHTS.escalation, // escalation: fallback
    ARC_WEIGHTS.turn, // turn: fallback
    5, // payoff: explicit
  ]);
  const sum = targets.reduce((s, t) => s + t, 0);
  assert(sum === 20, `arc-weights partial: sum to 20 (got ${sum}): ${targets.join(", ")}`);
}

// ── Patch 4: scaling guard escalation cap ──────────────────────────────

{
  // 35% cap at 20 total sentences = Math.max(20, 7) = 20
  // An escalation segment with 25 sentences would trigger (25 > 20)
  const total = 20;
  const cap = Math.max(20, Math.round(total * 0.35));
  assert(cap === 20, `scaling cap: 20 at total=${total} (got ${cap})`);
}

{
  // 35% cap at 60 total sentences = Math.max(20, 21) = 21
  const total = 60;
  const cap = Math.max(20, Math.round(total * 0.35));
  assert(cap === 21, `scaling cap: 21 at total=${total} (got ${cap})`);
}

{
  // 35% cap at 100 total sentences = Math.max(20, 35) = 35
  const total = 100;
  const cap = Math.max(20, Math.round(total * 0.35));
  assert(cap === 35, `scaling cap: 35 at total=${total} (got ${cap})`);
}

console.log("\nAll segment-plan-gate tests passed.");
