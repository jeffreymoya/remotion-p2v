/**
 * Usage:
 *   npx tsx tests/docu/segment-plan-gate.test.ts
 */
import {
  validateSegmentPlanStructure,
  hasViolations,
  buildSegmentPlanFeedback,
} from "../../src/lib/docu/segment-plan-prompt";
import type { Anchor } from "../../src/lib/shared/research/research-schema";

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`PASS ${label}`);
}

function anchor(id: string): Anchor {
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
  };
}

type SegmentInput = {
  index: number;
  title: string;
  role: string;
  intent: string;
  assignedAnchorIds: string[];
};

// ── Happy path ────────────────────────────────────────────────────────

{
  const segments: SegmentInput[] = [
    { index: 0, title: "Hook", role: "hook", intent: "grab", assignedAnchorIds: ["a1"] },
    { index: 1, title: "Context", role: "context", intent: "explain", assignedAnchorIds: ["a2"] },
    { index: 2, title: "CTA", role: "cta", intent: "close", assignedAnchorIds: ["a3"] },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3")];
  const v = validateSegmentPlanStructure(segments as any, anchors);
  assert(
    v.duplicateAnchorIds.length === 0 && v.unknownAnchorIds.length === 0 && v.missingArcRoles.length === 0,
    "happy path: zero violations",
  );
  assert(!hasViolations(v), "hasViolations: false for clean plan");
}

// ── Duplicate anchor ID ───────────────────────────────────────────────

{
  const segments: SegmentInput[] = [
    { index: 0, title: "Hook", role: "hook", intent: "grab", assignedAnchorIds: ["a1"] },
    { index: 1, title: "Context", role: "context", intent: "explain", assignedAnchorIds: ["a2"] },
    { index: 2, title: "Data", role: "data", intent: "show", assignedAnchorIds: ["a1"] },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2")];
  const v = validateSegmentPlanStructure(segments as any, anchors);
  assert(v.duplicateAnchorIds.length === 1, "duplicate: one duplicate entry");
  assert(v.duplicateAnchorIds[0].anchorId === "a1", "duplicate: correct anchorId");
  assert(
    v.duplicateAnchorIds[0].segmentIndices.length === 2 &&
    v.duplicateAnchorIds[0].segmentIndices.includes(0) &&
    v.duplicateAnchorIds[0].segmentIndices.includes(2),
    "duplicate: correct segmentIndices",
  );
  assert(hasViolations(v), "hasViolations: true for duplicates");
}

// ── Unknown anchor ID ─────────────────────────────────────────────────

{
  const segments: SegmentInput[] = [
    { index: 0, title: "Hook", role: "hook", intent: "grab", assignedAnchorIds: ["bogus"] },
  ];
  const anchors: Anchor[] = [anchor("a1")];
  const v = validateSegmentPlanStructure(segments as any, anchors);
  assert(v.unknownAnchorIds.length === 1, "unknown: one unknown entry");
  assert(v.unknownAnchorIds[0].anchorId === "bogus", "unknown: correct anchorId");
  assert(v.unknownAnchorIds[0].segmentIndex === 0, "unknown: correct segmentIndex");
}

// ── Missing "hook" ────────────────────────────────────────────────────

{
  const segments: SegmentInput[] = [
    { index: 0, title: "Context", role: "context", intent: "explain", assignedAnchorIds: ["a1"] },
    { index: 1, title: "Data", role: "data", intent: "show", assignedAnchorIds: ["a2"] },
    { index: 2, title: "CTA", role: "cta", intent: "close", assignedAnchorIds: ["a3"] },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3")];
  const v = validateSegmentPlanStructure(segments as any, anchors);
  assert(v.missingArcRoles.length === 1, "missing-hook: one missing role");
  assert(v.missingArcRoles[0] === "hook", "missing-hook: correct role");
}

// ── Missing "cta" ─────────────────────────────────────────────────────

{
  const segments: SegmentInput[] = [
    { index: 0, title: "Hook", role: "hook", intent: "grab", assignedAnchorIds: ["a1"] },
    { index: 1, title: "Context", role: "context", intent: "explain", assignedAnchorIds: ["a2"] },
    { index: 2, title: "Data", role: "data", intent: "show", assignedAnchorIds: ["a3"] },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2"), anchor("a3")];
  const v = validateSegmentPlanStructure(segments as any, anchors);
  assert(v.missingArcRoles.length === 1, "missing-cta: one missing role");
  assert(v.missingArcRoles[0] === "cta", "missing-cta: correct role");
}

// ── Small plan (2 segments) — arc sanity skipped ─────────────────────

{
  const segments: SegmentInput[] = [
    { index: 0, title: "Intro", role: "context", intent: "explain", assignedAnchorIds: ["a1"] },
    { index: 1, title: "Outro", role: "data", intent: "show", assignedAnchorIds: ["a2"] },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2")];
  const v = validateSegmentPlanStructure(segments as any, anchors);
  assert(v.missingArcRoles.length === 0, "small-plan: arc sanity skipped (<3 segments)");
}

// ── Combined: duplicate + unknown ─────────────────────────────────────

{
  const segments: SegmentInput[] = [
    { index: 0, title: "Hook", role: "hook", intent: "grab", assignedAnchorIds: ["a1", "bogus"] },
    { index: 1, title: "Data", role: "data", intent: "show", assignedAnchorIds: ["a1"] },
    { index: 2, title: "CTA", role: "cta", intent: "close", assignedAnchorIds: ["a2"] },
  ];
  const anchors: Anchor[] = [anchor("a1"), anchor("a2")];
  const v = validateSegmentPlanStructure(segments as any, anchors);
  assert(v.duplicateAnchorIds.length === 1, "combined: one duplicate");
  assert(v.unknownAnchorIds.length === 1, "combined: one unknown");
  assert(v.missingArcRoles.length === 0, "combined: no missing roles");
}

// ── buildSegmentPlanFeedback ──────────────────────────────────────────

{
  const feedback = buildSegmentPlanFeedback({
    duplicateAnchorIds: [{ anchorId: "anc-001", segmentIndices: [0, 2] }],
    unknownAnchorIds: [{ anchorId: "anc-999", segmentIndex: 1 }],
    missingArcRoles: ["hook", "cta"],
  });
  assert(feedback.includes("anc-001"), "feedback: includes duplicate anchor ID");
  assert(feedback.includes("anc-999"), "feedback: includes unknown anchor ID");
  assert(feedback.includes("hook") && feedback.includes("cta"), "feedback: includes missing roles");
  assert(feedback.startsWith("Structural violations"), "feedback: starts with header");
}

{
  const feedback = buildSegmentPlanFeedback({
    duplicateAnchorIds: [],
    unknownAnchorIds: [],
    missingArcRoles: [],
  });
  assert(feedback === "", "feedback: empty for no violations");
}

console.log("\nAll segment-plan-gate tests passed.");
