import { describe, expect, it } from "vitest";

import { aggregateScores, selectWinner } from "@/src/lib/prompt-optimizer/evaluator";
import { DEFAULT_DIMENSION_WEIGHTS, DIMENSION_NAMES, type DimensionName, type JudgeResult, type VariationResult } from "@/src/lib/prompt-optimizer/types";

function judge(judgeName: "codex" | "claude", score: number): JudgeResult {
  return {
    judge: judgeName,
    failed: false,
    attempts: 1,
    dimensions: Object.fromEntries(
      DIMENSION_NAMES.map((dimension) => [dimension, { score, rationale: `${dimension} rationale` }])
    ) as JudgeResult["dimensions"],
  };
}

function variation(overrides: Partial<VariationResult>): VariationResult {
  return {
    loop: 1,
    variation: 1,
    prompt: "prompt",
    script: "script",
    judgeResults: [],
    validJudgeCount: 1,
    skipped: false,
    aggregated: Object.fromEntries(DIMENSION_NAMES.map((dimension) => [dimension, 7])) as Record<DimensionName, number>,
    overall: 7,
    ...overrides,
  };
}

describe("aggregateScores", () => {
  it("aggregates with claude-only when codex fails", () => {
    const result = aggregateScores([judge("claude", 9)], DEFAULT_DIMENSION_WEIGHTS);

    expect(result.validJudgeCount).toBe(1);
    expect(result.aggregated?.speakability).toBe(9);
    expect(result.overall).toBe(9);
  });

  it("averages successful judges and applies weights", () => {
    const result = aggregateScores([judge("codex", 8), judge("claude", 6)], DEFAULT_DIMENSION_WEIGHTS);

    expect(result.validJudgeCount).toBe(2);
    expect(result.aggregated?.speakability).toBe(7);
    expect(result.overall).toBe(7);
  });
});

describe("selectWinner", () => {
  it("uses judge count before hook and speakability tie-breaks", () => {
    const winner = selectWinner(
      [
        variation({
          variation: 1,
          validJudgeCount: 1,
          aggregated: { ...variation({}).aggregated!, hook_strength: 10, speakability: 10 },
        }),
        variation({
          variation: 2,
          validJudgeCount: 2,
          aggregated: { ...variation({}).aggregated!, hook_strength: 7, speakability: 7 },
        }),
      ],
      DEFAULT_DIMENSION_WEIGHTS
    );

    expect(winner).toBe(1);
  });

  it("falls back to lower variation index for exact ties", () => {
    const winner = selectWinner(
      [variation({ variation: 2 }), variation({ variation: 1 })],
      DEFAULT_DIMENSION_WEIGHTS
    );

    expect(winner).toBe(1);
  });
});
