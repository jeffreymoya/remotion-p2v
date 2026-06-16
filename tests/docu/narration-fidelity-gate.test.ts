/**
 * Narration Fidelity Gate — fail-fast tests.
 *
 * Usage:
 *   npx tsx tests/docu/narration-fidelity-gate.test.ts
 *
 */
import { gateNarrationFidelity } from "../../src/lib/docu/narration-fidelity-gate";
import type { Anchor } from "../../src/lib/shared/research/research-schema";
import type { SentenceDef } from "../../src/lib/docu/tts-pipeline";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

function s(text: string): SentenceDef {
  return { text, emphasis: ["word"], palette: "cool-tech" };
}

const ANCHORS: Anchor[] = [{
  id: "anc-001",
  kind: "narrative",
  claim: "A mortgage payment increased after rates rose.",
  detail: "A buyer saw mortgage affordability worsen after rates rose.",
  attribution: { work: "Test source", year: 2024, publisher: "Test" },
  citation: {
    url: "https://example.com/source",
    title: "Test source",
    accessedAt: "2026-06-15T00:00:00.000Z",
    verifierConfidence: "high",
    verifierNotes: "Test fixture anchor is verified.",
  },
  sourceTier: "secondary",
  status: "verified",
}];

// ── 3a: zero verified anchors → throw (defense-in-depth) ─────────────

async function run(): Promise<void> {
  await gateNarrationFidelity([s("The Fed raised interest rates today.")], []).then(
    () => { throw new Error("FAIL gate should have thrown for zero anchors"); },
    (e: Error) => {
      assert(e.message.includes("0 verified anchors"), "3a: throws on zero verified anchors", e.message);
    },
  );

  let calls = 0;
  const fakeStructuredCaller = async <T>(): Promise<T> => {
    calls++;
    if (calls === 1) {
      return { results: [
        { sentenceIndex: 0, supported: false, correctedText: "The payment rose after rates moved.", reason: "unsupported number" },
        { sentenceIndex: 1, supported: false, correctedText: "The buyer saw affordability worsen.", reason: "unsupported scene detail" },
      ] } as T;
    }
    if (calls === 2) {
      return { results: [{ sentenceIndex: 0, supported: false, correctedText: "The buyer saw affordability worsen after rates rose.", reason: "still too specific" }] } as T;
    }
    return { results: [{ sentenceIndex: 0, supported: true }] } as T;
  };

  const result = await gateNarrationFidelity([
    s("The payment jumped by an unsupported amount."),
    s("The buyer panicked because the Fed spoke at noon."),
  ], ANCHORS, {
    callStructured: fakeStructuredCaller,
  });

  assert(calls === 3, "3b: verifies after applying final correction", `calls=${calls}`);
  assert(result[0].text === "The buyer saw affordability worsen after rates rose.", "3b: returns final corrected text", result[0].text);
  assert(result[1].text === "The buyer saw affordability worsen.", "3b: keeps earlier corrected text", result[1].text);
}

run().finally(() => {
  console.log(`\n${passed} passed`);
});

