/**
 * LLM gate fixture-replay tests.
 *
 * These tests stub deepseekChatJson to return captured fixture responses,
 * then verify gate pass/fail logic, schema parsing, and note generation.
 *
 * Usage: tsx tests/inspire/gates/llm/llm-gate-tests.ts
 */
import fs from "node:fs";
import path from "node:path";
import type { ZodType } from "zod";
import type { GateContext } from "../../../../src/lib/inspire/gates/gate-types";
import type { ChatFn } from "../../../../src/lib/inspire/gates/llm/llm-gate-runner";
import { createCohesionGate } from "../../../../src/lib/inspire/gates/llm/cohesion-gate";
import { createAttentionCurveGate } from "../../../../src/lib/inspire/gates/llm/attention-curve-gate";
import { createFreshnessGate } from "../../../../src/lib/inspire/gates/llm/freshness-gate";

// ── Load fixtures ───────────────────────────────────────────────────────

const GATE_FIXTURES_DIR = path.join(__dirname, "__fixtures__");
const SHARED_FIXTURES_DIR = path.join(__dirname, "..", "__fixtures__");

const cohesionFixtures = JSON.parse(
  fs.readFileSync(path.join(GATE_FIXTURES_DIR, "cohesion-gate-fixtures.json"), "utf-8"),
);
const attentionCurveFixtures = JSON.parse(
  fs.readFileSync(path.join(GATE_FIXTURES_DIR, "attention-curve-fixtures.json"), "utf-8"),
);
const freshnessFixtures = JSON.parse(
  fs.readFileSync(path.join(GATE_FIXTURES_DIR, "freshness-gate-fixtures.json"), "utf-8"),
);

const mariaSample = fs.readFileSync(
  path.join(SHARED_FIXTURES_DIR, "maria-sample.txt"),
  "utf-8",
);
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

// ── Stub chat function factory ──────────────────────────────────────────

function createStubChatFn(fixture: unknown): ChatFn {
  return async <T>(
    _messages: unknown[],
    schema: ZodType<T>,
    _temperature: number,
    _reasoning: unknown,
  ): Promise<T> => {
    return schema.parse(fixture);
  };
}

// ── Test harness ────────────────────────────────────────────────────────

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

// ── Tests ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n━━ LLM Gate Tests (fixture replay) ━━\n");

  // ── Cohesion gate ──────────────────────────────────────────────────
  console.log("Cohesion gate:");
  {
    const gate = createCohesionGate({ chatFn: createStubChatFn(cohesionFixtures["maria-sample"]) });
    const result = await gate.run(mariaSample, defaultCtx);
    assert(result.pass, "maria-sample PASSES cohesion gate");
    assert(result.notes.length === 0, "maria-sample has no blocking notes");
    assert(
      result.metrics?.controllingObject === "the pothos (Maria's houseplant)",
      `controllingObject = "${result.metrics?.controllingObject}"`,
    );
  }
  {
    const gate = createCohesionGate({ chatFn: createStubChatFn(cohesionFixtures["resilience-seg-01"]) });
    const result = await gate.run(resilienceSeg01, defaultCtx);
    assert(!result.pass, "resilience-seg-01 FAILS cohesion gate");
    assert(
      result.notes.length >= 4,
      `resilience-seg-01 has ≥4 swap points (got ${result.notes.length})`,
    );
  }

  // ── Attention-curve gate ───────────────────────────────────────────
  console.log("\nAttention-curve gate:");
  {
    const gate = createAttentionCurveGate({ chatFn: createStubChatFn(attentionCurveFixtures["maria-sample"]) });
    const result = await gate.run(mariaSample, defaultCtx);
    assert(result.pass, "maria-sample PASSES attention_curve gate");
    assert(result.notes.length === 0, "maria-sample has no blocking notes");
    assert(
      (result.metrics?.endPullScore as number) >= 2,
      `endPullScore >= 2 (got ${result.metrics?.endPullScore})`,
    );
  }
  {
    const gate = createAttentionCurveGate({ chatFn: createStubChatFn(attentionCurveFixtures["resilience-seg-01"]) });
    const result = await gate.run(resilienceSeg01, defaultCtx);
    assert(!result.pass, "resilience-seg-01 FAILS attention_curve gate");
    assert(result.notes.length === 1, "resilience-seg-01 has 1 blocking note");
    assert(
      (result.metrics?.endPullScore as number) < (result.metrics?.midPullScore as number),
      `endPullScore < midPullScore (${result.metrics?.endPullScore} < ${result.metrics?.midPullScore})`,
    );
  }

  // ── Freshness gate ─────────────────────────────────────────────────
  console.log("\nFreshness gate:");
  {
    const gate = createFreshnessGate({ chatFn: createStubChatFn(freshnessFixtures["maria-sample"]), severity: "block" });
    const result = await gate.run(mariaSample, defaultCtx);
    assert(result.pass, "maria-sample PASSES freshness gate");
    assert(result.notes.length === 0, "maria-sample has no paraphrase notes");
  }
  {
    const gate = createFreshnessGate({ chatFn: createStubChatFn(freshnessFixtures["resilience-seg-01"]), severity: "block" });
    const result = await gate.run(resilienceSeg01, defaultCtx);
    assert(!result.pass, "resilience-seg-01 FAILS freshness gate");
    assert(
      result.notes.length === 2,
      `resilience-seg-01 has 2 paraphrase notes (got ${result.notes.length})`,
    );
    assert(
      result.notes.some((n) => n.evidence.includes("supposed to break")),
      "Frankl paraphrase flagged",
    );
  }
  {
    // With severity=warn, gate still fails but notes are warn-level
    const gate = createFreshnessGate({ chatFn: createStubChatFn(freshnessFixtures["resilience-seg-01"]), severity: "warn" });
    const result = await gate.run(resilienceSeg01, defaultCtx);
    assert(!result.pass, "resilience-seg-01 still returns pass=false with severity=warn");
    assert(
      result.notes.every((n) => n.severity === "warn"),
      "all notes are severity=warn when configured as warn",
    );
  }

  // ── Summary ────────────────────────────────────────────────────────
  console.log(`\n━━ Results: ${passed} passed, ${failed} failed ━━\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
