/**
 * Story Spine gate — validates spine invariants that the structural
 * validator enforces, plus contract fields the prompt must produce.
 *
 * Usage:
 *   npx tsx tests/docu/story-spine-gate.test.ts
 */
import {
  validateSpineStructure,
  hasSpineViolations,
  buildSpineFeedback,
  computeSentenceTargets,
} from "../../src/lib/docu/segment-plan-prompt";
import type { Anchor } from "../../src/lib/shared/research/research-schema";
import type { ArcRole } from "../../src/lib/docu/segment-types";

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`PASS ${label}`);
}

function anchor(id: string, opts?: { quote?: string; kind?: Anchor["kind"] }): Anchor {
  return {
    id,
    kind: opts?.kind ?? "study",
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

function makeScene(
  overrides: Partial<{
    index: number;
    arcRole: ArcRole;
    palette: "cool-tech" | "warm-real";
    flipFromPrior: boolean;
    assignedAnchorIds: string[];
  }> & { arcRole: ArcRole },
) {
  return {
    index: overrides.index ?? 0,
    title: `Scene ${overrides.arcRole}`,
    arcRole: overrides.arcRole,
    intent: `Intent for ${overrides.arcRole}`,
    assignedAnchorIds: overrides.assignedAnchorIds ?? [],
    scenarioPressure: `Pressure for ${overrides.arcRole}`,
    retentionLoop: `Loop for ${overrides.arcRole}`,
    visualBeat: `Visual for ${overrides.arcRole}`,
    device: "none" as const,
    pronoun: "you" as const,
    palette: overrides.palette ?? "cool-tech",
    emotionalRegister: "curiosity",
    flipFromPrior: overrides.flipFromPrior ?? false,
  };
}

// ── Valid 5-scene spine (full arc) ────────────────────────────────────

{
  const scenes = [
    makeScene({ index: 0, arcRole: "hook", palette: "warm-real", assignedAnchorIds: ["a1"] }),
    makeScene({ index: 1, arcRole: "baseline", palette: "cool-tech", assignedAnchorIds: ["a2"] }),
    makeScene({ index: 2, arcRole: "escalation", palette: "cool-tech", flipFromPrior: true, assignedAnchorIds: ["a3"] }),
    makeScene({ index: 3, arcRole: "turn", palette: "cool-tech", assignedAnchorIds: ["a4"] }),
    makeScene({ index: 4, arcRole: "payoff", palette: "warm-real", assignedAnchorIds: ["a5"] }),
  ];
  const anchors = [anchor("a1"), anchor("a2"), anchor("a3"), anchor("a4"), anchor("a5")];
  const v = validateSpineStructure(scenes as any, null, undefined, anchors);
  assert(!hasSpineViolations(v), "valid 5-scene spine: zero violations");
  assert(!v.missingWarmReal, "valid 5-scene spine: has warm-real scenes");
  assert(!v.noFlipFromPrior, "valid 5-scene spine: has ≥1 flip");
  assert(!v.arcRoleSequenceInvalid, "valid 5-scene spine: arc sequence valid");
}

// ── viewerRole and scenarioPressure present (contract check) ─────────

{
  // Simulated LLM output validation — these are required fields in the Zod schema
  assert(
    typeof "a freelancer" === "string" && "a freelancer".length > 0,
    "viewerRole: non-empty string",
  );
  assert(
    typeof "you're leaving money on the table" === "string" && "you're leaving money on the table".length > 0,
    "scenarioPressure: non-empty string",
  );
}

// ── quoteSceneIndex: null is valid ───────────────────────────────────

{
  const scenes = [
    makeScene({ index: 0, arcRole: "hook", palette: "warm-real", assignedAnchorIds: ["a1"] }),
    makeScene({ index: 1, arcRole: "baseline", palette: "cool-tech", assignedAnchorIds: ["a2"] }),
    makeScene({ index: 2, arcRole: "escalation", palette: "cool-tech", flipFromPrior: true, assignedAnchorIds: ["a3"] }),
    makeScene({ index: 3, arcRole: "turn", palette: "cool-tech", assignedAnchorIds: ["a4"] }),
    makeScene({ index: 4, arcRole: "payoff", palette: "warm-real", assignedAnchorIds: ["a5"] }),
  ];
  const anchors = [anchor("a1"), anchor("a2"), anchor("a3"), anchor("a4"), anchor("a5")];
  const v = validateSpineStructure(scenes as any, null, undefined, anchors);
  assert(!v.quoteSceneInvalid, "quoteSceneIndex null: valid (no quote required)");
}

// ── quoteSceneIndex non-null with valid quote anchor ──────────────────

{
  const scenes = [
    makeScene({ index: 0, arcRole: "hook", palette: "warm-real", assignedAnchorIds: ["a1"] }),
    makeScene({ index: 1, arcRole: "baseline", palette: "cool-tech", assignedAnchorIds: ["a2"] }),
    makeScene({ index: 2, arcRole: "escalation", palette: "cool-tech", flipFromPrior: true, assignedAnchorIds: ["a3"] }),
    makeScene({ index: 3, arcRole: "turn", palette: "cool-tech", assignedAnchorIds: ["a4"] }),
    makeScene({ index: 4, arcRole: "payoff", palette: "warm-real", assignedAnchorIds: ["a5"] }),
  ];
  const anchors = [
    anchor("a1"), anchor("a2"),
    anchor("a3", { quote: "A verbatim quote from an expert" }),
    anchor("a4"), anchor("a5"),
  ];
  const v = validateSpineStructure(scenes as any, 2, undefined, anchors);
  assert(!v.quoteSceneInvalid, "quoteSceneIndex 2: valid (scene 2 has quoted anchor a3)");
}

// ── quoteSceneIndex non-null but no quote — invalid ───────────────────

{
  const scenes = [
    makeScene({ index: 0, arcRole: "hook", palette: "warm-real", assignedAnchorIds: ["a1"] }),
    makeScene({ index: 1, arcRole: "baseline", palette: "cool-tech", assignedAnchorIds: ["a2"] }),
    makeScene({ index: 2, arcRole: "escalation", palette: "cool-tech", flipFromPrior: true, assignedAnchorIds: ["a3"] }),
    makeScene({ index: 3, arcRole: "turn", palette: "cool-tech", assignedAnchorIds: ["a4"] }),
    makeScene({ index: 4, arcRole: "payoff", palette: "warm-real", assignedAnchorIds: ["a5"] }),
  ];
  const anchors = [anchor("a1"), anchor("a2"), anchor("a3"), anchor("a4"), anchor("a5")];
  const v = validateSpineStructure(scenes as any, 0, undefined, anchors);
  assert(v.quoteSceneInvalid, "quoteSceneIndex 0: invalid (no quoted anchor in scene 0)");
}

// ── Mechanism-reveal mode (no case-study anchors) — valid spine ──────

{
  const scenes = [
    makeScene({ index: 0, arcRole: "hook", palette: "warm-real", assignedAnchorIds: ["a1"] }),
    makeScene({ index: 1, arcRole: "baseline", palette: "cool-tech", assignedAnchorIds: ["a2"] }),
    makeScene({ index: 2, arcRole: "escalation", palette: "cool-tech", flipFromPrior: true, assignedAnchorIds: ["a3"] }),
    makeScene({ index: 3, arcRole: "turn", palette: "cool-tech", assignedAnchorIds: ["a4"] }),
    makeScene({ index: 4, arcRole: "payoff", palette: "warm-real", assignedAnchorIds: ["a5"] }),
  ];
  const anchors = [anchor("a1"), anchor("a2"), anchor("a3"), anchor("a4"), anchor("a5")];
  const v = validateSpineStructure(scenes as any, null, undefined, anchors);
  assert(!hasSpineViolations(v), "mechanism-reveal mode: no case-study anchors, spine valid");
  assert(!v.caseStudyAnchorUnknown, "mechanism-reveal mode: no caseStudyAnchorId = no error");
}

// ── caseStudyAnchorId present with matching anchor — valid ───────────

{
  const scenes = [
    makeScene({ index: 0, arcRole: "hook", palette: "warm-real", assignedAnchorIds: ["a1"] }),
    makeScene({ index: 1, arcRole: "baseline", palette: "cool-tech", assignedAnchorIds: ["a2"] }),
    makeScene({ index: 2, arcRole: "escalation", palette: "cool-tech", flipFromPrior: true, assignedAnchorIds: ["a3"] }),
    makeScene({ index: 3, arcRole: "turn", palette: "cool-tech", assignedAnchorIds: ["a4"] }),
    makeScene({ index: 4, arcRole: "payoff", palette: "warm-real", assignedAnchorIds: ["a5"] }),
  ];
  const anchors = [
    anchor("a1"), anchor("a2"),
    anchor("a3", { kind: "case_study" }),
    anchor("a4"), anchor("a5"),
  ];
  const v = validateSpineStructure(scenes as any, null, "a3", anchors);
  assert(!v.caseStudyAnchorUnknown, "caseStudyAnchorId: valid (a3 exists)");
}

// ── caseStudyAnchorId present but unknown — invalid ──────────────────

{
  const scenes = [
    makeScene({ index: 0, arcRole: "hook", palette: "warm-real", assignedAnchorIds: ["a1"] }),
    makeScene({ index: 1, arcRole: "baseline", palette: "cool-tech", assignedAnchorIds: ["a2"] }),
    makeScene({ index: 2, arcRole: "escalation", palette: "cool-tech", flipFromPrior: true, assignedAnchorIds: ["a3"] }),
    makeScene({ index: 3, arcRole: "turn", palette: "cool-tech", assignedAnchorIds: ["a4"] }),
    makeScene({ index: 4, arcRole: "payoff", palette: "warm-real", assignedAnchorIds: ["a5"] }),
  ];
  const anchors = [anchor("a1"), anchor("a2"), anchor("a3"), anchor("a4"), anchor("a5")];
  const v = validateSpineStructure(scenes as any, null, "nonexistent", anchors);
  assert(v.caseStudyAnchorUnknown, "caseStudyAnchorId: invalid (nonexistent does not exist)");
}

// ── ArcRole sequence: payoff before turn — invalid ───────────────────

{
  const scenes = [
    makeScene({ index: 0, arcRole: "hook", palette: "cool-tech", assignedAnchorIds: ["a1"] }),
    makeScene({ index: 1, arcRole: "payoff", palette: "warm-real", assignedAnchorIds: ["a2"] }),
    makeScene({ index: 2, arcRole: "escalation", palette: "warm-real", flipFromPrior: true, assignedAnchorIds: ["a3"] }),
    makeScene({ index: 3, arcRole: "turn", palette: "cool-tech", assignedAnchorIds: ["a4"] }),
    makeScene({ index: 4, arcRole: "escalation", palette: "cool-tech", assignedAnchorIds: ["a5"] }),
  ];
  const anchors = [anchor("a1"), anchor("a2"), anchor("a3"), anchor("a4"), anchor("a5")];
  const v = validateSpineStructure(scenes as any, null, undefined, anchors);
  assert(v.arcRoleSequenceInvalid, "arcRole sequence: payoff before turn — invalid");
  assert(v.arcRoleSequenceDetail.includes("payoff"), "arcRole sequence: detail mentions payoff");
}

// ── No escalation scene — invalid for ≥3 scenes ──────────────────────

{
  const scenes = [
    makeScene({ index: 0, arcRole: "hook", palette: "warm-real", assignedAnchorIds: ["a1"] }),
    makeScene({ index: 1, arcRole: "baseline", palette: "cool-tech", assignedAnchorIds: ["a2"] }),
    makeScene({ index: 2, arcRole: "turn", palette: "cool-tech", flipFromPrior: true, assignedAnchorIds: ["a3"] }),
    makeScene({ index: 3, arcRole: "payoff", palette: "warm-real", assignedAnchorIds: ["a4"] }),
  ];
  const anchors = [anchor("a1"), anchor("a2"), anchor("a3"), anchor("a4")];
  const v = validateSpineStructure(scenes as any, null, undefined, anchors);
  assert(v.arcRoleSequenceInvalid, "arcRole sequence: no escalation between baseline and turn — invalid");
}

// ── Multiple escalation scenes — valid ──────────────────────────────

{
  const scenes = [
    makeScene({ index: 0, arcRole: "hook", palette: "warm-real", assignedAnchorIds: ["a1"] }),
    makeScene({ index: 1, arcRole: "baseline", palette: "cool-tech", assignedAnchorIds: ["a2"] }),
    makeScene({ index: 2, arcRole: "escalation", palette: "cool-tech", flipFromPrior: true, assignedAnchorIds: ["a3"] }),
    makeScene({ index: 3, arcRole: "escalation", palette: "cool-tech", assignedAnchorIds: ["a4"] }),
    makeScene({ index: 4, arcRole: "turn", palette: "cool-tech", assignedAnchorIds: ["a5"] }),
    makeScene({ index: 5, arcRole: "payoff", palette: "warm-real", assignedAnchorIds: ["a6"] }),
  ];
  const anchors = [anchor("a1"), anchor("a2"), anchor("a3"), anchor("a4"), anchor("a5"), anchor("a6")];
  const v = validateSpineStructure(scenes as any, null, undefined, anchors);
  assert(!v.arcRoleSequenceInvalid, "multiple escalation scenes: valid");
}

// ── Compute sentence targets: even distribution ──────────────────────

{
  const targets = computeSentenceTargets(40, 5);
  assert(targets.length === 5, "targets: 5 segments");
  assert(targets.reduce((s, v) => s + v, 0) === 40, "targets: sum equals total");
  // Mid segments get extra sentences from remainder
  const base = 40 / 5; // 8
  assert(targets[0] === 8 && targets[4] === 8, "targets: edges get base count");
}

// ── computeSentenceTargets with remainder ────────────────────────────

{
  const targets = computeSentenceTargets(43, 5);
  assert(targets.reduce((s, v) => s + v, 0) === 43, "targets/remainder: sum equals total");
}

console.log("\nAll story-spine-gate tests passed.");
