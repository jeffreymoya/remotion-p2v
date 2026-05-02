import { buildJudgePrompt, JudgeResponseSchema } from "./rubric";
import { runClaudeJson, runCodexJson } from "./cli-runner";
import { DIMENSION_NAMES, type CliRuntimeContext, type DimensionName, type JudgeResult, type OptimizerModelConfig, type VariationResult } from "./types";

export async function evaluateScript(
  script: string,
  topic: string,
  modelConfig: OptimizerModelConfig,
  runtime?: CliRuntimeContext
): Promise<JudgeResult[]> {
  const prompt = buildJudgePrompt(script, topic);

  const [codex, claude] = await Promise.allSettled([
    runCodexJson(prompt, JudgeResponseSchema, modelConfig.codexJudgeModel, runtime),
    runClaudeJson(prompt, "", JudgeResponseSchema, modelConfig.claudeJudgeModel),
  ]);

  if (codex.status === "rejected" && claude.status === "rejected") {
    throw new Error(
      `All judges failed:\n  codex: ${errorMessage(codex.reason)}\n  claude: ${errorMessage(claude.reason)}`
    );
  }

  return [
    codex.status === "fulfilled"
      ? {
          judge: "codex",
          dimensions: codex.value.data.dimensions,
          failed: false,
          rawResponse: codex.value.rawResponse,
          attempts: codex.value.attempts,
        }
      : {
          judge: "codex",
          failed: true,
          error: errorMessage(codex.reason),
          rawResponse: rawResponseFromError(codex.reason),
          attempts: attemptsFromError(codex.reason),
        },
    claude.status === "fulfilled"
      ? {
          judge: "claude",
          dimensions: claude.value.data.dimensions,
          failed: false,
          rawResponse: claude.value.rawResponse,
          attempts: claude.value.attempts,
        }
      : {
          judge: "claude",
          failed: true,
          error: errorMessage(claude.reason),
          rawResponse: rawResponseFromError(claude.reason),
          attempts: attemptsFromError(claude.reason),
        },
  ];
}

export function aggregateScores(
  results: JudgeResult[],
  weights: Record<DimensionName, number>
): {
  aggregated?: Record<DimensionName, number>;
  overall?: number;
  validJudgeCount: number;
} {
  const successful = results.filter((result) => !result.failed && result.dimensions);

  if (successful.length === 0) {
    return { validJudgeCount: 0 };
  }

  const aggregated = Object.fromEntries(
    DIMENSION_NAMES.map((dimension) => {
      const sum = successful.reduce((total, result) => total + (result.dimensions?.[dimension].score ?? 0), 0);
      return [dimension, sum / successful.length];
    })
  ) as Record<DimensionName, number>;

  const totalWeight = DIMENSION_NAMES.reduce((total, dimension) => total + weights[dimension], 0);
  const overall =
    DIMENSION_NAMES.reduce((total, dimension) => total + aggregated[dimension] * weights[dimension], 0) /
    totalWeight;

  return { aggregated, overall, validJudgeCount: successful.length };
}

export function selectWinner(
  variations: VariationResult[],
  weights: Record<DimensionName, number>
): number | null {
  void weights;
  let winnerIndex: number | null = null;

  variations.forEach((variation, index) => {
    if (variation.skipped || variation.aggregated === undefined || variation.overall === undefined) {
      return;
    }

    if (winnerIndex === null) {
      winnerIndex = index;
      return;
    }

    const current = variations[winnerIndex];
    if (compareVariations(variation, current) < 0) {
      winnerIndex = index;
    }
  });

  return winnerIndex;
}

function compareVariations(a: VariationResult, b: VariationResult): number {
  if (a.overall !== b.overall) return (b.overall ?? 0) - (a.overall ?? 0);
  if (a.validJudgeCount !== b.validJudgeCount) return b.validJudgeCount - a.validJudgeCount;
  if (a.aggregated?.hook_strength !== b.aggregated?.hook_strength) {
    return (b.aggregated?.hook_strength ?? 0) - (a.aggregated?.hook_strength ?? 0);
  }
  if (a.aggregated?.speakability !== b.aggregated?.speakability) {
    return (b.aggregated?.speakability ?? 0) - (a.aggregated?.speakability ?? 0);
  }
  return a.variation - b.variation;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function rawResponseFromError(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "rawResponse" in error
    ? String((error as { rawResponse?: unknown }).rawResponse ?? "")
    : undefined;
}

function attemptsFromError(error: unknown): number {
  return typeof error === "object" && error !== null && "attempts" in error
    ? Number((error as { attempts?: unknown }).attempts) || 2
    : 2;
}
