/**
 * Story Structure Gate — tests for deterministic checks on assembled narration.
 *
 * Usage:
 *   npx tsx tests/docu/story-structure-gate.test.ts
 */
import {
  checkStructureDeterministic,
  type StructureViolation,
} from "../../src/lib/docu/story-structure-gate";
import type { SentenceDef } from "../../src/lib/docu/tts-pipeline";
import type { StorySpine, SceneSpec, ArcRole } from "../../src/lib/docu/segment-types";

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`PASS ${label}`);
}

function s(text: string): SentenceDef {
  return { text, emphasis: ["word"], palette: "cool-tech" };
}

function makeScene(overrides: Partial<SceneSpec> & { arcRole: ArcRole }): SceneSpec {
  return {
    index: 0,
    title: "Test Scene",
    intent: "Test intent",
    targetSentenceCount: 3,
    assignedAnchorIds: [],
    arcRole: overrides.arcRole,
    scenarioPressure: "test pressure",
    retentionLoop: "what happens next?",
    visualBeat: "chart bending",
    device: "none",
    pronoun: "you",
    palette: "cool-tech",
    emotionalRegister: "neutral",
    flipFromPrior: false,
    ...overrides,
  };
}

function makeSpine(segments: SceneSpec[]): StorySpine {
  return {
    schemaVersion: 2,
    primaryStructure: "scenario-escalation",
    viewerRole: "viewer",
    scenarioPressure: "global pressure",
    hiddenSystem: "hidden system",
    centralFlip: "central flip",
    viewerStake: "viewer stake",
    retentionQuestion: "main question",
    quoteSceneIndex: null,
    segments,
  };
}

// ── Happy path: all checks pass ──────────────────────────────────────

{
  const scenes: SceneSpec[] = [
    makeScene({ index: 0, arcRole: "hook", pronoun: "you", targetSentenceCount: 3 }),
    makeScene({ index: 1, arcRole: "escalation", pronoun: "they", flipFromPrior: true, targetSentenceCount: 3 }),
    makeScene({ index: 2, arcRole: "payoff", pronoun: "you", targetSentenceCount: 3 }),
  ];
  const sentences = [
    s("You open the app and your balance is zero."),
    s("Three banks rejected the same loan request."),
    s("The algorithm flags your account silently."),
    s("They tried the same approach at scale."),
    s("The system processed $4.2 billion in one weekend."),
    s("No human reviewed a single transaction."),
    s("Now you see the lever they pulled."),
    s("Your next move determines the outcome."),
    s("The door opens or it locks — permanently."),
  ];
  const spine = makeSpine(scenes);
  const violations = checkStructureDeterministic(sentences, spine);
  assert(violations.length === 0, "happy-path: no violations");
}

// ── Hook opens with setup phrase ─────────────────────────────────────

{
  const scenes: SceneSpec[] = [
    makeScene({ index: 0, arcRole: "hook", pronoun: "you", targetSentenceCount: 2 }),
    makeScene({ index: 1, arcRole: "payoff", pronoun: "they", flipFromPrior: true, targetSentenceCount: 2 }),
  ];
  const sentences = [
    s("Welcome to this overview of inflation."),
    s("Prices rise every year on average."),
    s("They adjust rates accordingly."),
    s("The cycle repeats."),
  ];
  const spine = makeSpine(scenes);
  const violations = checkStructureDeterministic(sentences, spine);
  assert(violations.some((v) => v.check === "hook-no-setup"), "hook-setup-phrase: flagged");
}

// ── Missing pronoun diversity ────────────────────────────────────────

{
  const scenes: SceneSpec[] = [
    makeScene({ index: 0, arcRole: "hook", pronoun: "you", targetSentenceCount: 2, flipFromPrior: true }),
    makeScene({ index: 1, arcRole: "payoff", pronoun: "you", targetSentenceCount: 2 }),
  ];
  const sentences = [
    s("You open the statement."),
    s("The number shocks you."),
    s("You check again."),
    s("Still the same."),
  ];
  const spine = makeSpine(scenes);
  const violations = checkStructureDeterministic(sentences, spine);
  assert(violations.some((v) => v.check === "pronoun-diversity"), "pronoun-diversity: flagged");
}

// ── No flip ──────────────────────────────────────────────────────────

{
  const scenes: SceneSpec[] = [
    makeScene({ index: 0, arcRole: "hook", pronoun: "you", targetSentenceCount: 2 }),
    makeScene({ index: 1, arcRole: "payoff", pronoun: "they", targetSentenceCount: 2 }),
  ];
  const sentences = [
    s("You open the door."),
    s("Nothing happens."),
    s("They leave the building."),
    s("The end."),
  ];
  const spine = makeSpine(scenes);
  const violations = checkStructureDeterministic(sentences, spine);
  assert(violations.some((v) => v.check === "no-flip"), "no-flip: flagged");
}

// ── Empty scene ──────────────────────────────────────────────────────

{
  const scenes: SceneSpec[] = [
    makeScene({ index: 0, arcRole: "hook", pronoun: "you", targetSentenceCount: 2, flipFromPrior: true }),
    makeScene({ index: 1, arcRole: "escalation", pronoun: "they", targetSentenceCount: 0 }),
    makeScene({ index: 2, arcRole: "payoff", pronoun: "we", targetSentenceCount: 2 }),
  ];
  const sentences = [
    s("You check the balance."),
    s("It's gone."),
    // scene 1 is empty (targetSentenceCount=0)
    s("We rebuild from here."),
    s("The system resets."),
  ];
  const spine = makeSpine(scenes);
  const violations = checkStructureDeterministic(sentences, spine);
  assert(violations.some((v) => v.check === "empty-scene"), "empty-scene: flagged");
}

// ── Quote scene missing quote ────────────────────────────────────────

{
  const scenes: SceneSpec[] = [
    makeScene({ index: 0, arcRole: "hook", pronoun: "you", targetSentenceCount: 2 }),
    makeScene({ index: 1, arcRole: "payoff", pronoun: "they", flipFromPrior: true, targetSentenceCount: 2 }),
  ];
  const sentences = [
    s("You see the number drop."),
    s("The loss is real."),
    s("They restructured the entire division."),
    s("Nobody was warned."),
  ];
  const spine = makeSpine(scenes);
  spine.quoteSceneIndex = 1; // scene 1 has no quoted sentence
  const violations = checkStructureDeterministic(sentences, spine);
  assert(violations.some((v) => v.check === "quote-scene-missing-quote"), "quote-scene-missing-quote: flagged");
}

// ── Quote scene with actual quote passes ─────────────────────────────

{
  const scenes: SceneSpec[] = [
    makeScene({ index: 0, arcRole: "hook", pronoun: "you", targetSentenceCount: 2 }),
    makeScene({ index: 1, arcRole: "payoff", pronoun: "they", flipFromPrior: true, targetSentenceCount: 2 }),
  ];
  const sentences = [
    s("You see the number drop."),
    s("The loss is real."),
    s('Jamie Dimon said "this is unprecedented in modern banking."'),
    s("Nobody was warned."),
  ];
  const spine = makeSpine(scenes);
  spine.quoteSceneIndex = 1;
  const violations = checkStructureDeterministic(sentences, spine);
  assert(!violations.some((v) => v.check === "quote-scene-missing-quote"), "quote-present: not flagged");
}

console.log("\nAll story-structure-gate tests passed.");
