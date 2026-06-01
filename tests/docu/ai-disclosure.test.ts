/**
 * Unit tests for the AI-disclosure decision helper (Step 3 / YPP Backlog 5).
 *
 * Usage:
 *   npx tsx tests/docu/ai-disclosure.test.ts
 */

import {
  decideAiDisclosure,
  NOT_LEGAL_ADVICE,
  type DisclosureSignals,
} from "../../src/lib/docu/ai-disclosure";

let failures = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  } else {
    console.log(`PASS ${label}`);
  }
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    failures++;
    console.error(`FAIL ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  } else {
    console.log(`PASS ${label}`);
  }
}

// ── Default pipeline reality → no disclosure ──────────────────────────────────

{
  const { disclosure, triggers } = decideAiDisclosure({});
  assertEqual(disclosure.containsSyntheticPeopleVoicesOrEvents, false, "default: no disclosure required");
  assertEqual(triggers.length, 0, "default: no triggers");
  assert(disclosure.recommendedStudioAnswer.startsWith("No"), "default: studio answer No");
  assert(disclosure.rationale.includes("does not apply"), "default: rationale says not applicable");
}

// ── Synthetic narration voice alone never triggers ────────────────────────────

{
  const { disclosure, triggers } = decideAiDisclosure({ syntheticNarrationVoice: true });
  assertEqual(disclosure.containsSyntheticPeopleVoicesOrEvents, false, "tts-only: no disclosure");
  assertEqual(triggers.length, 0, "tts-only: no triggers");
  assert(
    disclosure.rationale.includes("synthetic narration voiceover"),
    "tts-only: rationale notes narration was considered",
  );
  assert(
    disclosure.rationale.includes("not a realistic synthetic depiction"),
    "tts-only: rationale explains exclusion",
  );
}

// ── Each triggering signal flips the decision ─────────────────────────────────

{
  const cases: Array<{ flag: keyof DisclosureSignals; fragment: string; label: string }> = [
    { flag: "syntheticRealisticPeople", fragment: "realistic people", label: "synthetic-people" },
    { flag: "alteredRealEventFootage", fragment: "altered footage", label: "altered-footage" },
    { flag: "syntheticRealisticScenes", fragment: "generated realistic scene", label: "synthetic-scenes" },
    { flag: "fabricatedRealPersonSpeech", fragment: "say or do something", label: "fabricated-speech" },
    { flag: "clonedVoiceOfRealPerson", fragment: "cloned voice", label: "cloned-voice" },
  ];
  for (const c of cases) {
    const { disclosure, triggers } = decideAiDisclosure({ [c.flag]: true });
    assertEqual(disclosure.containsSyntheticPeopleVoicesOrEvents, true, `${c.label}: disclosure required`);
    assertEqual(triggers.length, 1, `${c.label}: exactly one trigger`);
    assert(disclosure.recommendedStudioAnswer.startsWith("Yes"), `${c.label}: studio answer Yes`);
    assert(disclosure.rationale.includes(c.fragment), `${c.label}: rationale names the trigger`);
  }
}

// ── Multiple triggers list with Oxford-comma join ─────────────────────────────

{
  const { disclosure, triggers } = decideAiDisclosure({
    syntheticRealisticPeople: true,
    alteredRealEventFootage: true,
    clonedVoiceOfRealPerson: true,
  });
  assertEqual(triggers.length, 3, "multi: three triggers");
  assertEqual(disclosure.containsSyntheticPeopleVoicesOrEvents, true, "multi: disclosure required");
  assert(disclosure.rationale.includes(", and "), "multi: Oxford-comma join in rationale");
}

{
  const { disclosure } = decideAiDisclosure({
    syntheticRealisticPeople: true,
    clonedVoiceOfRealPerson: true,
  });
  assert(
    disclosure.rationale.includes("avatars and a cloned voice"),
    "two-triggers: 'a and b' join (no comma)",
    disclosure.rationale,
  );
}

// ── Not-legal-advice caveat is always carried into the rationale ──────────────

{
  const yes = decideAiDisclosure({ syntheticRealisticScenes: true }).disclosure;
  const no = decideAiDisclosure({}).disclosure;
  assert(yes.rationale.includes(NOT_LEGAL_ADVICE), "caveat: present when disclosing");
  assert(no.rationale.includes(NOT_LEGAL_ADVICE), "caveat: present when not disclosing");
}

// ── Deterministic ─────────────────────────────────────────────────────────────

{
  const inp: DisclosureSignals = { syntheticRealisticPeople: true, syntheticNarrationVoice: true };
  const a = JSON.stringify(decideAiDisclosure(inp));
  const b = JSON.stringify(decideAiDisclosure(inp));
  assertEqual(a, b, "determinism: identical output");
}

// ── Summary ────────────────────────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
console.log("\nAll ai-disclosure tests passed.");
