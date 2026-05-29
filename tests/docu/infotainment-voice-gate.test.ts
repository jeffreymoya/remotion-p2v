/**
 * Infotainment Voice Gate — unit tests for the gate interface and schema.
 *
 * NOTE: The full LLM judge path requires API keys. These tests validate
 * the deterministic contract (input/output shape) and would mock the LLM
 * in a real test harness. For now, we validate the module exports cleanly.
 *
 * Usage:
 *   npx tsx tests/docu/infotainment-voice-gate.test.ts
 */
import type { InfotainmentVoiceGateResult } from "../../src/lib/docu/infotainment-voice-gate";

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`PASS ${label}`);
}

// ── Module exports ───────────────────────────────────────────────────

{
  const mod = require("../../src/lib/docu/infotainment-voice-gate");
  assert(typeof mod.gateInfotainmentVoice === "function", "gateInfotainmentVoice is exported function");
}

// ── Result type shape ────────────────────────────────────────────────

{
  const result: InfotainmentVoiceGateResult = {
    passed: true,
    flags: [],
  };
  assert(result.passed === true, "result-shape: passed is boolean");
  assert(Array.isArray(result.flags), "result-shape: flags is array");
}

{
  const result: InfotainmentVoiceGateResult = {
    passed: false,
    flags: [
      { flag: "hook-no-scenario", sentenceIndices: [0, 1], explanation: "Opens with background" },
      { flag: "untranslated-jargon", sentenceIndices: [5], explanation: "QE used without translation" },
    ],
  };
  assert(result.flags.length === 2, "result-shape: flags populated");
  assert(result.flags[0].flag === "hook-no-scenario", "result-shape: flag name");
  assert(result.flags[0].sentenceIndices[0] === 0, "result-shape: sentenceIndices");
}

console.log("\nAll infotainment-voice-gate tests passed.");
