/**
 * Targeted brainstorm smoke test — calls brainstormCandidatesImpl directly
 * with a small candidate count to confirm thinking:disabled works without
 * hanging and returns complete, valid output.
 *
 * Does NOT run the full research pipeline (no corpus, no verification).
 *
 * Usage:  tsx --env-file=.env scripts/deepseek-brainstorm-smoke.ts
 * Target:  < 60s wall time for 5 candidates
 */

import { brainstormCandidatesImpl } from "../src/lib/shared/research/research-brainstorm";

const TOPIC = "adapting before you are forced to";
const TARGET_COUNT = 5;

async function main(): Promise<void> {
  console.log(`\nBrainstorm Smoke Test`);
  console.log(`  topic: "${TOPIC}"`);
  console.log(`  targetCount: ${TARGET_COUNT}`);
  console.log(`  model: deepseek-v4-pro`);
  console.log(`  thinking mode: disabled (via NARRATION_REASONING)`);
  console.log();

  const start = Date.now();

  let candidates;
  try {
    candidates = await brainstormCandidatesImpl(TOPIC, TARGET_COUNT, { verbose: true });
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`\n✗ FAILED after ${elapsed}s`);
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n✓ Completed in ${elapsed}s`);
  console.log(`  candidates received: ${candidates.length}`);
  console.log(`  expected: ${TARGET_COUNT}`);

  if (candidates.length !== TARGET_COUNT) {
    console.warn(`  ⚠ Candidate count mismatch (got ${candidates.length}, expected ${TARGET_COUNT})`);
  }

  const kinds = candidates.map((c) => c.kind);
  console.log(`  kinds: ${kinds.join(", ")}`);

  let allValid = true;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (!c.claim || c.claim.trim().length === 0) {
      console.error(`  ✗ candidate[${i}] has empty claim`);
      allValid = false;
    }
    if (!c.kind) {
      console.error(`  ✗ candidate[${i}] has no kind`);
      allValid = false;
    }
  }

  if (allValid) {
    console.log(`  ✓ All candidates structurally valid`);
  }

  console.log(`\nSample candidates:`);
  for (const c of candidates.slice(0, 3)) {
    console.log(`  [${c.kind}] ${c.claim.slice(0, 100)}`);
  }

  console.log(`\nResult: ${allValid ? "PASS ✓" : "FAIL ✗"}`);
  process.exit(allValid ? 0 : 1);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
