import { appendFile, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CliVersions, LoopResult, OptimizerConfig, ShortlistEntry, VariationResult } from "./types";

type RunJson = {
  runId: string;
  topic: string;
  topicContext: string;
  geo: "US";
  config: Omit<OptimizerConfig, "topic" | "topicContext" | "geo" | "maxContextHeadlines"> & {
    maxContextHeadlines: number;
  };
  cliVersions: CliVersions;
  runtimeNotes: string[];
  loopSummary: Array<{
    loop: number;
    winnerLoopVariation: string | null;
    winnerOverall: number | null;
    variationCount: number;
    validVariationCount: number;
    skippedVariations: string[];
  }>;
  shortlist: Array<{
    rank: number;
    loop: number;
    variation: number;
    overall: number;
    audioPath?: string;
    audioError?: string;
  }>;
  humanSelection: null;
  startedAt: string;
  completedAt: string | null;
};

export async function initRunDir(
  topic: string,
  config: OptimizerConfig,
  versions: CliVersions
): Promise<string> {
  const timestamp = formatTimestamp(new Date());
  const runId = `${timestamp}-${slugify(topic)}`;
  const runDir = path.join("logs", "prompt-optimizer", runId);

  await mkdir(path.join(runDir, "prompts"), { recursive: true });
  await mkdir(path.join(runDir, "scripts"), { recursive: true });
  await mkdir(path.join(runDir, "judgements"), { recursive: true });
  await mkdir(path.join(runDir, "shortlist"), { recursive: true });
  await mkdir(path.join(runDir, "loop1-pool"), { recursive: true });

  const runJson: RunJson = {
    runId,
    topic,
    topicContext: config.topicContext,
    geo: config.geo,
    config: {
      variationCount: config.variationCount,
      loopCount: config.loopCount,
      scriptSamplesPerVariation: config.scriptSamplesPerVariation,
      dimensionWeights: config.dimensionWeights,
      modelConfig: config.modelConfig,
      synthesize: config.synthesize,
      empirical: config.empirical,
      maxContextHeadlines: config.maxContextHeadlines,
    },
    cliVersions: versions,
    runtimeNotes: [],
    loopSummary: [],
    shortlist: [],
    humanSelection: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };

  await writeRunJson(runDir, runJson);
  await writeFile(
    path.join(runDir, "log.md"),
    `# Prompt Optimizer Run
**Topic**: ${topic}
**Run ID**: ${runId}
**Config**: ${config.variationCount} variations, ${config.loopCount} loops
**CLI Versions**: claude ${versions.claude}, codex ${versions.codex}, gemini ${versions.gemini}

---
`,
    "utf-8"
  );

  return runDir;
}

export async function writeVariationArtifacts(dir: string, result: VariationResult): Promise<void> {
  const base = `L${result.loop}-V${result.variation}`;
  await writeFile(path.join(dir, "prompts", `${base}.txt`), result.prompt, "utf-8");

  if (result.script?.trim()) {
    await writeFile(path.join(dir, "scripts", `${base}.txt`), result.script, "utf-8");
  } else {
    await writeFile(
      path.join(dir, "scripts", `${base}.error.txt`),
      result.scriptError ?? result.skipReason ?? "blank script",
      "utf-8"
    );
  }

  for (const judge of result.judgeResults) {
    const judgeBase = path.join(dir, "judgements", `${base}-${judge.judge}`);
    await writeFile(`${judgeBase}.json`, JSON.stringify(judge, null, 2), "utf-8");
    if (judge.failed) {
      await writeFile(
        `${judgeBase}.error.txt`,
        [`Error: ${judge.error ?? "unknown"}`, "", "Raw response:", judge.rawResponse ?? ""].join("\n"),
        "utf-8"
      );
    }
  }
}

export async function writeLoopSummary(dir: string, loop: LoopResult): Promise<void> {
  await appendFile(path.join(dir, "log.md"), buildLoopMarkdown(loop), "utf-8");

  await updateRunJson(dir, (runJson) => {
    const winner =
      loop.winnerIndex === null ? undefined : loop.variations[loop.winnerIndex];
    const summary = {
      loop: loop.loop,
      winnerLoopVariation: winner ? `L${winner.loop}-V${winner.variation}` : null,
      winnerOverall: winner?.overall ?? null,
      variationCount: loop.variations.length,
      validVariationCount: loop.variations.filter((variation) => variation.aggregated && variation.overall).length,
      skippedVariations: loop.variations
        .filter((variation) => variation.skipped || variation.aggregated === undefined)
        .map((variation) => `L${variation.loop}-V${variation.variation}`),
    };
    runJson.loopSummary = runJson.loopSummary.filter((item) => item.loop !== loop.loop);
    runJson.loopSummary.push(summary);
    runJson.loopSummary.sort((a, b) => a.loop - b.loop);
    return runJson;
  });
}

export async function writeLoop1Pool(dir: string, variations: VariationResult[]): Promise<void> {
  await mkdir(path.join(dir, "loop1-pool"), { recursive: true });
  for (const variation of variations) {
    if (variation.script?.trim()) {
      await writeFile(
        path.join(dir, "loop1-pool", `L${variation.loop}-V${variation.variation}.txt`),
        variation.script,
        "utf-8"
      );
    }
  }
}

export async function finalizeRun(
  dir: string,
  shortlist: ShortlistEntry[],
  allLoops: LoopResult[],
  config: OptimizerConfig
): Promise<void> {
  void config;
  await mkdir(path.join(dir, "shortlist"), { recursive: true });

  for (const entry of shortlist) {
    const candidatePath = path.join(dir, "shortlist", `candidate-${entry.rank}.txt`);
    await copyFile(path.join(dir, entry.scriptPath), candidatePath);

    if (entry.rank === 1) {
      await copyFile(path.join(dir, entry.promptPath), path.join(dir, "winning-prompt.txt"));
      await copyFile(path.join(dir, entry.scriptPath), path.join(dir, "winning-script.txt"));
    }
  }

  await writeShortlistSummary(dir, shortlist);
  await appendFile(path.join(dir, "log.md"), buildShortlistMarkdown(shortlist), "utf-8");

  await updateRunJson(dir, (runJson) => {
    runJson.shortlist = shortlist.map(({ rank, loop, variation, overall, audioPath, audioError }) => ({
      rank,
      loop,
      variation,
      overall,
      audioPath,
      audioError,
    }));
    runJson.completedAt = new Date().toISOString();
    runJson.loopSummary = allLoops.map((loop) => {
      const winner = loop.winnerIndex === null ? undefined : loop.variations[loop.winnerIndex];
      return {
        loop: loop.loop,
        winnerLoopVariation: winner ? `L${winner.loop}-V${winner.variation}` : null,
        winnerOverall: winner?.overall ?? null,
        variationCount: loop.variations.length,
        validVariationCount: loop.variations.filter((variation) => variation.aggregated && variation.overall).length,
        skippedVariations: loop.variations
          .filter((variation) => variation.skipped || variation.aggregated === undefined)
          .map((variation) => `L${variation.loop}-V${variation.variation}`),
      };
    });
    return runJson;
  });
}

export async function appendRuntimeNote(dir: string, note: string): Promise<void> {
  await updateRunJson(dir, (runJson) => {
    if (!runJson.runtimeNotes.includes(note)) {
      runJson.runtimeNotes.push(note);
    }
    return runJson;
  });
  await appendFile(path.join(dir, "log.md"), `\nRuntime note: ${note}\n`, "utf-8");
}

export async function writeShortlistSummary(dir: string, shortlist: ShortlistEntry[]): Promise<void> {
  const lines = [
    "# Shortlist",
    "",
    "| Rank | Candidate | Loop | Var | Overall | Audio |",
    "|------|-----------|------|-----|---------|-------|",
    ...shortlist.map((entry) => {
      const audio = entry.audioPath ?? (entry.audioError ? `error: ${entry.audioError}` : "pending");
      return `| ${entry.rank} | candidate-${entry.rank} | L${entry.loop} | V${entry.variation} | ${entry.overall.toFixed(2)} | ${audio} |`;
    }),
    "",
    "Listen to each audio file and pick the best one by ear.",
    "Human selection: null",
    "",
  ];
  await writeFile(path.join(dir, "shortlist", "shortlist.md"), lines.join("\n"), "utf-8");

  await updateRunJson(dir, (runJson) => {
    runJson.shortlist = shortlist.map(({ rank, loop, variation, overall, audioPath, audioError }) => ({
      rank,
      loop,
      variation,
      overall,
      audioPath,
      audioError,
    }));
    return runJson;
  });
}

export async function updateRunJson(dir: string, updater: (runJson: RunJson) => RunJson): Promise<void> {
  const runJson = JSON.parse(await readFile(path.join(dir, "run.json"), "utf-8")) as RunJson;
  await writeRunJson(dir, updater(runJson));
}

async function writeRunJson(dir: string, runJson: RunJson): Promise<void> {
  await writeFile(path.join(dir, "run.json"), `${JSON.stringify(runJson, null, 2)}\n`, "utf-8");
}

function buildLoopMarkdown(loop: LoopResult): string {
  const winner = loop.winnerIndex === null ? undefined : loop.variations[loop.winnerIndex];
  const rows = loop.variations.map((variation) => {
    const status = winner === variation ? "winner" : variation.skipped ? `skipped: ${variation.skipReason}` : variation.aggregated ? "valid" : "skipped: codex failed";
    const codex = judgeOverall(variation, "codex");
    const claude = judgeOverall(variation, "claude");
    const overall = variation.overall === undefined ? "-" : variation.overall.toFixed(2);
    return `| L${variation.loop}-V${variation.variation} | ${overall} | ${codex} | ${claude} | ${variation.validJudgeCount}/2 | ${status} |`;
  });

  return `
## Loop ${loop.loop}

| Variation | Overall | codex | claude | Judges | Status |
|-----------|---------|-------|--------|--------|--------|
${rows.join("\n")}

**Winner**: ${winner ? `L${winner.loop}-V${winner.variation} (overall: ${winner.overall?.toFixed(2)})` : "none"}

${winner ? buildWinnerRationales(winner) : ""}
---
`;
}

function buildWinnerRationales(winner: VariationResult): string {
  const sections = winner.judgeResults
    .filter((judge) => !judge.failed && judge.dimensions)
    .map((judge) => {
      const lines = Object.entries(judge.dimensions ?? {}).map(
        ([dimension, score]) => `- ${dimension} (${score.score}): ${score.rationale}`
      );
      return `**${judge.judge}**\n${lines.join("\n")}`;
    });

  return `### L${winner.loop}-V${winner.variation} Rationales (winner only)

${sections.join("\n\n")}
`;
}

function buildShortlistMarkdown(shortlist: ShortlistEntry[]): string {
  return `
## Shortlist

| Rank | Candidate | Loop | Var | Overall | Audio |
|------|-----------|------|-----|---------|-------|
${shortlist
  .map((entry) => `| ${entry.rank} | candidate-${entry.rank} | L${entry.loop} | V${entry.variation} | ${entry.overall.toFixed(2)} | ${entry.audioPath ?? "pending"} |`)
  .join("\n")}

Listen to each audio file and pick the best one by ear.
Human selection: null
`;
}

function judgeOverall(variation: VariationResult, judgeName: "codex" | "claude"): string {
  const judge = variation.judgeResults.find((result) => result.judge === judgeName);
  if (!judge || judge.failed || !judge.dimensions) return "-";
  const scores = Object.values(judge.dimensions).map((dimension) => dimension.score);
  return (scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(2);
}

function formatTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "topic";
}
