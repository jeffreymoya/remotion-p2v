/**
 * Gate smoke tests — runs all deterministic gates against the two fixtures
 * and verifies expected pass/fail outcomes.
 *
 * Usage: tsx tests/inspire/gates/gate-tests.ts
 */
import fs from "node:fs";
import path from "node:path";
import { genreTellsGate } from "../../../src/lib/inspire/gates/deterministic/genre-tells-gate";
import { sermonRatioGate } from "../../../src/lib/inspire/gates/deterministic/sermon-ratio-gate";
import { specificityGate } from "../../../src/lib/inspire/gates/deterministic/specificity-gate";
import { simplicityGate } from "../../../src/lib/inspire/gates/deterministic/simplicity-gate";
import { prosodyMarksGate } from "../../../src/lib/inspire/gates/deterministic/prosody-marks-gate";
import {
  ALL_DETERMINISTIC_GATES,
  runGates,
} from "../../../src/lib/inspire/gates/run-gates";
import type { GateContext } from "../../../src/lib/inspire/gates/gate-types";
import { LongformPlanSchema } from "../../../src/lib/inspire/longform-narration-prompt";

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");

const resilienceSeg01 = fs.readFileSync(
  path.join(FIXTURES_DIR, "resilience-seg-01-narration.txt"),
  "utf-8",
);

const mariaSample = fs.readFileSync(
  path.join(FIXTURES_DIR, "maria-sample.txt"),
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

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

async function main(): Promise<void> {
  console.log("\n━━ Gate Tests ━━\n");

  // ── Genre-tells gate ──────────────────────────────────────────────
  console.log("Genre-tells gate:");
  const genreRes = await genreTellsGate.run(resilienceSeg01, defaultCtx);
  assert(!genreRes.pass, "resilience seg-01 FAILS genre-tells gate");
  assert(
    genreRes.notes.filter((n) => n.severity === "block").length >= 5,
    `resilience seg-01 has ≥5 banned items (got ${genreRes.notes.filter((n) => n.severity === "block").length})`,
  );

  const genreMaria = await genreTellsGate.run(mariaSample, defaultCtx);
  assert(genreMaria.pass, "maria sample PASSES genre-tells gate");

  // ── Sermon-ratio gate ──────────────────────────────────────────────
  console.log("\nSermon-ratio gate:");
  const sermonRes = await sermonRatioGate.run(resilienceSeg01, defaultCtx);
  assert(!sermonRes.pass, "resilience seg-01 FAILS sermon-ratio gate");
  const ratio = Number(sermonRes.metrics?.ratio ?? 0);
  assert(ratio > 30, `resilience seg-01 direct-address ratio >30% (got ${ratio}%)`);

  const sermonMaria = await sermonRatioGate.run(mariaSample, defaultCtx);
  assert(sermonMaria.pass, "maria sample PASSES sermon-ratio gate");

  // ── Specificity gate ──────────────────────────────────────────────
  console.log("\nSpecificity gate:");
  const specMaria = await specificityGate.run(mariaSample, defaultCtx);
  assert(specMaria.pass, "maria sample PASSES specificity gate");
  assert(
    Number(specMaria.metrics?.namedEntities ?? 0) >= 2,
    `maria sample has ≥2 named entities (got ${specMaria.metrics?.namedEntities})`,
  );

  // ── Simplicity gate ──────────────────────────────────────────────
  console.log("\nSimplicity gate:");
  const simpMaria = await simplicityGate.run(mariaSample, defaultCtx);
  assert(simpMaria.pass, "maria sample PASSES simplicity gate");
  const fk = Number(simpMaria.metrics?.fkGrade ?? 99);
  assert(fk <= 8, `maria sample FK grade ≤8 (got ${fk})`);

  // ── Prosody-marks gate ──────────────────────────────────────────────
  console.log("\nProsody-marks gate:");
  const prosRes = await prosodyMarksGate.run(resilienceSeg01, defaultCtx);
  assert(prosRes.pass, "resilience seg-01 PASSES prosody-marks gate");

  const prosMaria = await prosodyMarksGate.run(mariaSample, defaultCtx);
  assert(prosMaria.pass, "maria sample PASSES prosody-marks gate");

  // ── Aggregate: floor gates only ───────────────────────────────────
  console.log("\nAggregate (deterministic — includes genre-tells + sermon-ratio):");
  const floorRes = await runGates(resilienceSeg01, defaultCtx, ALL_DETERMINISTIC_GATES);
  assert(!floorRes.pass, "resilience seg-01 FAILS deterministic aggregate (genre-tells/sermon-ratio now blocking)");

  const floorMaria = await runGates(mariaSample, defaultCtx, ALL_DETERMINISTIC_GATES);
  assert(floorMaria.pass, "maria sample PASSES deterministic aggregate");

  // ── Plan schema: anchor cap ────────────────────────────────────────
  console.log("\nPlan schema anchor cap:");
  const validPlan = LongformPlanSchema.safeParse({
    segmentCount: 1,
    chapters: [
      {
        title: "Chapter 1",
        role: "open",
        intent: "Open on one scene",
        sceneSeed: "A kitchen before dawn",
        targetFeeling: { dominant: "recognition", intensity: 2 },
        recognitionMoment: "The mug going cold in her hands",
        polarityArc: "low-to-high",
        anchorIds: ["anchor-1"],
      },
    ],
  });
  assert(validPlan.success, "plan schema accepts one anchor per chapter");

  const invalidPlan = LongformPlanSchema.safeParse({
    segmentCount: 1,
    chapters: [
      {
        title: "Chapter 1",
        role: "open",
        intent: "Open on one scene",
        sceneSeed: "A kitchen before dawn",
        targetFeeling: { dominant: "recognition", intensity: 2 },
        recognitionMoment: "The mug going cold in her hands",
        polarityArc: "low-to-high",
        anchorIds: ["anchor-1", "anchor-2"],
      },
    ],
  });
  assert(!invalidPlan.success, "plan schema rejects more than one anchor per chapter");

  // ── Summary ──────────────────────────────────────────────────────
  console.log(`\n━━ Results: ${passed} passed, ${failed} failed ━━\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
