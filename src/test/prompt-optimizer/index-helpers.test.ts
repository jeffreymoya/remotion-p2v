import { describe, expect, it } from "vitest";

import {
  assertWinner,
  buildShortlist,
  buildVariationResult,
  extractRationales,
  selectMedianSample,
} from "@/scripts/prompt-optimizer/index";
import { DIMENSION_NAMES, type DimensionName, type JudgeResult, type LoopResult, type VariationResult } from "@/src/lib/prompt-optimizer/types";

const aggregated = Object.fromEntries(DIMENSION_NAMES.map((dimension) => [dimension, 7])) as Record<
  DimensionName,
  number
>;

const judge: JudgeResult = {
  judge: "codex",
  failed: false,
  attempts: 1,
  dimensions: Object.fromEntries(
    DIMENSION_NAMES.map((dimension) => [dimension, { score: 7, rationale: `${dimension} was strong` }])
  ) as JudgeResult["dimensions"],
};

function result(loop: number, variation: number, overall: number): VariationResult {
  return {
    loop,
    variation,
    prompt: `prompt ${loop}-${variation}`,
    script: `script ${loop}-${variation}`,
    judgeResults: [judge],
    aggregated,
    overall,
    validJudgeCount: 1,
    skipped: false,
  };
}

describe("index helpers", () => {
  it("marks blank scripts as skipped", () => {
    const built = buildVariationResult(1, 1, "prompt", "", undefined, [], { validJudgeCount: 0 });

    expect(built.skipped).toBe(true);
    expect(built.skipReason).toBe("blank script");
  });

  it("guards winner aggregate invariants", () => {
    expect(() =>
      assertWinner(buildVariationResult(1, 1, "prompt", "script", undefined, [], { validJudgeCount: 0 }))
    ).toThrow(/no aggregate score/);
  });

  it("extracts one mutation feedback paragraph per successful judge", () => {
    const winner = assertWinner(result(1, 1, 8));

    expect(extractRationales(winner)).toHaveLength(1);
    expect(extractRationales(winner)[0]).toContain("speakability: speakability was strong");
  });

  it("selectMedianSample picks lower bound for N=2", () => {
    const samples = [
      { script: "script a", judgeResults: [], aggregate: { overall: 8, validJudgeCount: 1 } },
      { script: "script b", judgeResults: [], aggregate: { overall: 6, validJudgeCount: 1 } },
    ];

    expect(selectMedianSample(samples).script).toBe("script b");
  });

  it("selectMedianSample picks true median for N=3", () => {
    const samples = [
      { script: "script a", judgeResults: [], aggregate: { overall: 9, validJudgeCount: 1 } },
      { script: "script b", judgeResults: [], aggregate: { overall: 5, validJudgeCount: 1 } },
      { script: "script c", judgeResults: [], aggregate: { overall: 7, validJudgeCount: 1 } },
    ];

    expect(selectMedianSample(samples).script).toBe("script c");
  });

  it("selectMedianSample skips blank scripts before selecting median", () => {
    const samples = [
      { script: "", judgeResults: [], aggregate: { overall: 9, validJudgeCount: 1 } },
      { script: "script b", judgeResults: [], aggregate: { overall: 6, validJudgeCount: 1 } },
    ];

    expect(selectMedianSample(samples).script).toBe("script b");
  });

  it("selectMedianSample falls back to first sample when all invalid", () => {
    const samples = [
      { script: "", judgeResults: [], aggregate: { validJudgeCount: 0 } },
      { script: "  ", judgeResults: [], aggregate: { validJudgeCount: 0 } },
    ];

    expect(selectMedianSample(samples)).toBe(samples[0]);
  });

  it("shortlists top valid candidates across all loops", () => {
    const loops: LoopResult[] = [
      { loop: 1, winnerIndex: 0, variations: [result(1, 1, 6.5), result(1, 2, 9)] },
      { loop: 2, winnerIndex: 0, variations: [result(2, 1, 8)] },
    ];

    expect(buildShortlist(loops, 2)).toEqual([
      expect.objectContaining({ rank: 1, loop: 1, variation: 2, overall: 9 }),
      expect.objectContaining({ rank: 2, loop: 2, variation: 1, overall: 8 }),
    ]);
  });
});
