/**
 * Narration Fidelity Gate — fail-fast tests.
 *
 * Usage:
 *   npx tsx tests/docu/narration-fidelity-gate.test.ts
 *
 * Note: The no-improvement (3b) and retries-exhausted (3c) paths
 * require mocking callStructured, which this project's tsx-script
 * test harness does not support. Those paths are verified via
 * structural review of the gate function.
 */
import { gateNarrationFidelity } from "../../src/lib/docu/narration-fidelity-gate";
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

// ── 3a: zero verified anchors → throw (defense-in-depth) ─────────────

gateNarrationFidelity([s("The Fed raised interest rates today.")], []).then(
  () => { throw new Error("FAIL gate should have thrown for zero anchors"); },
  (e: Error) => {
    assert(e.message.includes("0 verified anchors"), "3a: throws on zero verified anchors", e.message);
  },
).finally(() => {
  console.log(`\n${passed} passed`);
});

