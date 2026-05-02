import "dotenv/config";

import { pathToFileURL } from "node:url";

import { aggregateScores, selectWinner } from "@/src/lib/prompt-optimizer/evaluator";
import { finalizeRun, initRunDir, appendRuntimeNote, writeLoop1Pool, writeLoopSummary, writeVariationArtifacts } from "@/src/lib/prompt-optimizer/logger";
import { generateInitialVariations, generateMutations } from "@/src/lib/prompt-optimizer/meta-prompter";
import { runPreflight } from "@/src/lib/prompt-optimizer/preflight";
import { getRubricSummary } from "@/src/lib/prompt-optimizer/rubric";
import { generateScript } from "@/src/lib/prompt-optimizer/script-generator";
import { synthesizeShortlist } from "@/src/lib/prompt-optimizer/synthesizer";
import { pickTopic } from "@/src/lib/prompt-optimizer/topic-picker";
import {
  DEFAULT_DIMENSION_WEIGHTS,
  DIMENSION_NAMES,
  getDefaultModelConfig,
  type DimensionName,
  type JudgeResult,
  type LoopResult,
  type ShortlistEntry,
  type VariationResult,
  type WinnerResult,
} from "@/src/lib/prompt-optimizer/types";
import { evaluateScript } from "@/src/lib/prompt-optimizer/evaluator";

type ParsedArgs = {
  variations: number;
  loops: number;
  samples: number;
  synthesize: boolean;
  empirical: boolean;
  topic?: number;
};

type ScriptSample = {
  script: string;
  judgeResults: JudgeResult[];
  aggregate: AggregateResult;
};

type AggregateResult = {
  aggregated?: Record<DimensionName, number>;
  overall?: number;
  validJudgeCount: number;
};

export function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    variations: 5,
    loops: 3,
    samples: 2,
    synthesize: true,
    empirical: false,
  };

  for (let index = 2; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--variations" || arg === "--loops" || arg === "--topic" || arg === "--samples") {
      const value = argv[index + 1];
      const parsed = Number.parseInt(value, 10);
      if (!value || !Number.isInteger(parsed) || parsed < 1) {
        throw new Error(`${arg} requires an integer value >= 1.\n${usage()}`);
      }
      if (arg === "--variations") args.variations = parsed;
      if (arg === "--loops") args.loops = parsed;
      if (arg === "--topic") args.topic = parsed;
      if (arg === "--samples") args.samples = parsed;
      index++;
    } else if (arg === "--no-synthesize") {
      args.synthesize = false;
    } else if (arg === "--empirical") {
      args.empirical = true;
    } else {
      console.warn(`Ignoring unknown flag: ${arg}`);
    }
  }

  return args;
}

export function buildVariationResult(
  loop: number,
  variation: number,
  prompt: string,
  script: string,
  scriptError: string | undefined,
  judgeResults: JudgeResult[],
  aggregate: AggregateResult
): VariationResult {
  const skipped = script.trim() === "" || aggregate.aggregated === undefined;
  return {
    loop,
    variation,
    prompt,
    script,
    scriptError,
    judgeResults,
    aggregated: aggregate.aggregated,
    overall: aggregate.overall,
    validJudgeCount: aggregate.validJudgeCount,
    skipped,
    skipReason: script.trim() === "" ? "blank script" : aggregate.aggregated === undefined ? "codex failed" : undefined,
  };
}

export function extractRationales(winner: WinnerResult): string[] {
  return winner.judgeResults
    .filter((judge) => !judge.failed && judge.dimensions)
    .map((judge) =>
      DIMENSION_NAMES.map((dimension) => `${dimension}: ${judge.dimensions?.[dimension].rationale}`).join(". ")
    );
}

export function selectMedianSample(samples: ScriptSample[]): ScriptSample {
  const valid = samples.filter((s) => s.script.trim() !== "" && s.aggregate.overall !== undefined);
  if (valid.length === 0) return samples[0];
  const sorted = [...valid].sort((a, b) => (a.aggregate.overall ?? 0) - (b.aggregate.overall ?? 0));
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

export function assertWinner(result: VariationResult): WinnerResult {
  if (result.aggregated === undefined || result.overall === undefined) {
    throw new Error(
      `Invariant violation: selected winner L${result.loop}-V${result.variation} has no aggregate score`
    );
  }
  return result as WinnerResult;
}

export function buildShortlist(loopResults: LoopResult[], k = 3): ShortlistEntry[] {
  return loopResults
    .flatMap((result) => result.variations)
    .filter((variation): variation is WinnerResult => !variation.skipped && variation.aggregated !== undefined && variation.overall !== undefined)
    .sort(
      (a, b) =>
        b.overall - a.overall ||
        b.validJudgeCount - a.validJudgeCount ||
        b.aggregated.hook_strength - a.aggregated.hook_strength ||
        b.aggregated.speakability - a.aggregated.speakability ||
        a.loop - b.loop ||
        a.variation - b.variation
    )
    .slice(0, k)
    .map((winner, index) => ({
      rank: index + 1,
      loop: winner.loop,
      variation: winner.variation,
      overall: winner.overall,
      scriptPath: `scripts/L${winner.loop}-V${winner.variation}.txt`,
      promptPath: `prompts/L${winner.loop}-V${winner.variation}.txt`,
    }));
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const versions = await runPreflight({ synthesize: args.synthesize, topic: args.topic });
  const { topic, context } = await pickTopic("US", 5, args.topic);
  const modelConfig = getDefaultModelConfig();

  const config = {
    variationCount: args.variations,
    loopCount: args.loops,
    scriptSamplesPerVariation: args.samples,
    geo: "US" as const,
    topic,
    topicContext: context,
    maxContextHeadlines: 5,
    dimensionWeights: DEFAULT_DIMENSION_WEIGHTS,
    modelConfig,
    synthesize: args.synthesize,
    empirical: args.empirical,
  };

  const runDir = await initRunDir(topic, config, versions);
  const runtime = {
    addRuntimeNote: (note: string) => appendRuntimeNote(runDir, note),
  };
  const rubricSummary = getRubricSummary();
  const loopResults: LoopResult[] = [];
  let previousWinner: WinnerResult | null = null;

  for (let loop = 1; loop <= config.loopCount; loop++) {
    console.log(`\nLoop ${loop}/${config.loopCount}: generating prompt variations...`);
    const prompts =
      previousWinner === null
        ? await generateInitialVariations(topic, context, rubricSummary, config.variationCount, config.modelConfig)
        : await generateMutations(
            previousWinner.prompt,
            previousWinner.aggregated,
            extractRationales(previousWinner),
            rubricSummary,
            config.variationCount,
            config.modelConfig
          );

    const variationResults: VariationResult[] = [];

    for (let index = 0; index < prompts.length; index++) {
      const variation = index + 1;
      const scriptSamples: ScriptSample[] = [];
      for (let s = 0; s < config.scriptSamplesPerVariation; s++) {
        const sampleLabel = config.scriptSamplesPerVariation > 1 ? ` [${s + 1}/${config.scriptSamplesPerVariation}]` : "";
        console.log(`L${loop}-V${variation}: generating script${sampleLabel}...`);
        const script = (await generateScript(prompts[index], config.modelConfig)).text;
        console.log(`L${loop}-V${variation}: judging${sampleLabel}...`);
        const judgeResults = await evaluateScript(script, topic, config.modelConfig, runtime);
        const aggregate = aggregateScores(judgeResults, config.dimensionWeights);
        scriptSamples.push({ script, judgeResults, aggregate });
      }
      const { script, judgeResults, aggregate } = selectMedianSample(scriptSamples);
      const result = buildVariationResult(loop, variation, prompts[index], script, undefined, judgeResults, aggregate);

      variationResults.push(result);
      await writeVariationArtifacts(runDir, result);
    }

    const winnerIndex = selectWinner(variationResults, config.dimensionWeights);
    if (winnerIndex === null) {
      throw new Error(`Loop ${loop} produced no valid variations. See ${runDir} for partial artifacts.`);
    }

    const loopResult: LoopResult = { loop, variations: variationResults, winnerIndex };
    loopResults.push(loopResult);
    await writeLoopSummary(runDir, loopResult);

    if (loop === 1) {
      await writeLoop1Pool(runDir, variationResults);
    }

    previousWinner = assertWinner(variationResults[winnerIndex]);
  }

  const shortlist = buildShortlist(loopResults, 3);
  await finalizeRun(runDir, shortlist, loopResults, config);

  if (config.synthesize) {
    await synthesizeShortlist(runDir, shortlist, config.empirical);
  }

  printCompletionSummary(runDir, shortlist, config.synthesize, config.empirical);
}

export function printCompletionSummary(
  runDir: string,
  shortlist: ShortlistEntry[],
  synthesize: boolean,
  empirical: boolean
): void {
  console.log("\nRun complete.\n");
  console.log("Shortlist (top available candidates across all loops):");
  shortlist.forEach((entry) => {
    const artifact = synthesize
      ? entry.audioPath
        ? `${runDir}/${entry.audioPath}`
        : entry.audioError
          ? `synthesis failed: ${entry.audioError}`
          : `${runDir}/shortlist/candidate-${entry.rank}.mp3`
      : `${runDir}/shortlist/candidate-${entry.rank}.txt`;
    console.log(`  ${entry.rank}. L${entry.loop}-V${entry.variation}  overall=${entry.overall.toFixed(2)}  ${artifact}`);
  });
  if (empirical) {
    console.log(`\nLoop-1 pool (baseline comparison): ${runDir}/loop1-pool/`);
  }
  if (synthesize) {
    console.log("\nListen to each candidate audio. Pick the one you would post.");
  }
  console.log(`Run dir: ${runDir}`);
}

function usage(): string {
  return "Usage: npx tsx scripts/prompt-optimizer/index.ts [--variations N] [--loops N] [--samples N] [--topic N] [--no-synthesize] [--empirical]";
}

const entrypoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entrypoint) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
