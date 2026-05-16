/**
 * Capture fresh LLM gate fixtures by running each gate once against curated inputs.
 *
 * Usage: npm run gates:capture-llm
 *
 * Writes captured (input, response) pairs to tests/inspire/gates/llm/__fixtures__/
 * for replay in CI tests without spending API credits.
 */
import fs from "node:fs";
import path from "node:path";
import { createCohesionGate } from "../src/lib/inspire/gates/llm/cohesion-gate";
import { createAttentionCurveGate } from "../src/lib/inspire/gates/llm/attention-curve-gate";
import { createFreshnessGate } from "../src/lib/inspire/gates/llm/freshness-gate";
import type { GateContext } from "../src/lib/inspire/gates/gate-types";

const SHARED_FIXTURES_DIR = path.join(__dirname, "..", "tests/inspire/gates/__fixtures__");
const LLM_FIXTURES_DIR = path.join(__dirname, "..", "tests/inspire/gates/llm/__fixtures__");

const mariaSample = fs.readFileSync(path.join(SHARED_FIXTURES_DIR, "maria-sample.txt"), "utf-8");
const resilienceSeg01 = fs.readFileSync(
  path.join(SHARED_FIXTURES_DIR, "resilience-seg-01-narration.txt"),
  "utf-8",
);

const defaultCtx: GateContext = {
  topic: "resilience",
  slug: "resilience-seg-01",
  chapterIndex: 0,
  chapterCount: 2,
  chapterRole: "open",
  priorChapters: [],
};

async function main(): Promise<void> {
  console.log("Capturing LLM gate fixtures...\n");
  fs.mkdirSync(LLM_FIXTURES_DIR, { recursive: true });

  // ── Cohesion gate ──────────────────────────────────────────────────
  console.log("  Cohesion gate — maria-sample...");
  const cohesionGate = createCohesionGate({ verbose: true });
  const cohesionMaria = await cohesionGate.run(mariaSample, defaultCtx);
  console.log("  Cohesion gate — resilience-seg-01...");
  const cohesionResilience = await cohesionGate.run(resilienceSeg01, defaultCtx);

  // ── Attention-curve gate ───────────────────────────────────────────
  console.log("  Attention-curve gate — maria-sample...");
  const attentionGate = createAttentionCurveGate({ verbose: true });
  const attentionMaria = await attentionGate.run(mariaSample, defaultCtx);
  console.log("  Attention-curve gate — resilience-seg-01...");
  const attentionResilience = await attentionGate.run(resilienceSeg01, defaultCtx);

  // ── Freshness gate ─────────────────────────────────────────────────
  console.log("  Freshness gate — maria-sample...");
  const freshGate = createFreshnessGate({ verbose: true });
  const freshnessMaria = await freshGate.run(mariaSample, defaultCtx);
  console.log("  Freshness gate — resilience-seg-01...");
  const freshnessResilience = await freshGate.run(resilienceSeg01, defaultCtx);

  // ── Write fixtures ─────────────────────────────────────────────────
  // Note: We save gate results as fixtures. For proper replay, the fixture
  // files store the raw JSON that the LLM would return (the parsed schema output).
  // In practice, re-run this script and manually inspect/edit the fixture JSONs.

  console.log("\n  Gate results (review and copy relevant JSON to fixture files):");
  console.log("\n  Cohesion — maria:", JSON.stringify(cohesionMaria, null, 2));
  console.log("\n  Cohesion — resilience:", JSON.stringify(cohesionResilience, null, 2));
  console.log("\n  Attention — maria:", JSON.stringify(attentionMaria, null, 2));
  console.log("\n  Attention — resilience:", JSON.stringify(attentionResilience, null, 2));
  console.log("\n  Freshness — maria:", JSON.stringify(freshnessMaria, null, 2));
  console.log("\n  Freshness — resilience:", JSON.stringify(freshnessResilience, null, 2));

  console.log("\nDone. Review output above and update fixture JSON files manually.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
