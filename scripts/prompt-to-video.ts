import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import type { TrendingTopic, TopicSuggestion } from "@/src/lib/storyflow/discovery";
import { fetchTrendingTopics } from "@/src/lib/storyflow/discovery";

import { deepseekCall } from "./prompt-to-video/deepseek";
import {
  normalizeRunId,
  parseCompositionSpec,
  writeCompositionArtifacts,
} from "./prompt-to-video/composition";
import {
  parseAnimationPlan,
  writeAnimationPlanArtifacts,
} from "./prompt-to-video/animation-plan";
import type {
  PipelineConfig,
  ScriptFormat,
  ScriptSegment,
  Stage1Output,
  Stage2Output,
  Stage3Output,
  Stage4Output,
} from "./prompt-to-video/types";

interface Stage1Result {
  title: string;
  angle: string;
  description: string;
  viralPotential: number;
  hookType: string;
}

const PROMPTS_DIR = path.join(__dirname, "prompt-to-video", "prompts");

const DEFAULT_COUNT = 3;
const DEFAULT_GEO = "US";
const DEFAULT_OUT_DIR = "pipeline-output";
const SCRIPT_DURATION_MINUTES = 3;
const SCRIPT_BEATS_COUNT = 10;
const WORDS_PER_SECOND = 2.5;

const TRAFFIC_SUFFIXES: Record<string, number> = {
  K: 1_000,
  M: 1_000_000,
  B: 1_000_000_000,
};

function parseTrafficMagnitude(traffic: string | null): number {
  if (!traffic) return 0;
  const cleaned = traffic.replace(/[+,]/g, "").trim();
  const match = cleaned.match(/^([\d.]+)\s*([KMB])?$/i);
  if (!match) return 0;
  const value = Number.parseFloat(match[1]);
  const suffix = (match[2] || "").toUpperCase();
  const multiplier = TRAFFIC_SUFFIXES[suffix] ?? 1;
  return value * multiplier;
}

function selectTopTopics(topics: TrendingTopic[], count: number): TrendingTopic[] {
  const ranked = topics
    .map((t) => ({ topic: t, magnitude: parseTrafficMagnitude(t.traffic) }))
    .sort((a, b) => b.magnitude - a.magnitude);
  return ranked.slice(0, count).map((r) => r.topic);
}

async function loadTemplate(name: string): Promise<string> {
  const filePath = path.join(PROMPTS_DIR, `${name}.txt`);
  return fs.readFile(filePath, "utf-8");
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

function parseArgv(argv: string[]): PipelineConfig {
  const config: PipelineConfig = {
    count: DEFAULT_COUNT,
    geo: DEFAULT_GEO,
    outDir: DEFAULT_OUT_DIR,
    verbose: false,
    studio: false,
    runId: null,
    fromStage4: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--count":
        config.count = Number.parseInt(next, 10);
        i++;
        break;
      case "--geo":
        config.geo = next;
        i++;
        break;
      case "--out-dir":
        config.outDir = next;
        i++;
        break;
      case "--verbose":
        config.verbose = true;
        break;
      case "--studio":
        config.studio = true;
        break;
      case "--run-id":
        config.runId = next;
        i++;
        break;
      case "--from-stage4":
        config.fromStage4 = next;
        i++;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (Number.isNaN(config.count) || config.count < 1) {
    throw new Error("--count must be a positive integer");
  }

  if (config.fromStage4 && !config.studio) {
    throw new Error(
      "--from-stage4 requires --studio (Stage 5+6 are gated on --studio mode)"
    );
  }

  return config;
}

function log(config: PipelineConfig, ...args: unknown[]): void {
  if (config.verbose) {
    console.error("[verbose]", ...args);
  }
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

// --- Stage implementations ---

async function stage1Generalize(
  topic: TrendingTopic,
  template: string,
  config: PipelineConfig
): Promise<Stage1Output> {
  const newsHeadlines = topic.newsItems
    .map((n) => `- ${n.title}`)
    .join("\n") || "(no headlines available)";

  const prompt = fillTemplate(template, {
    query: topic.query,
    traffic: topic.traffic ?? "unknown",
    newsHeadlines,
  });

  log(config, `[stage 1] Generalizing: "${topic.query}" ...`);
  log(config, "[stage 1] prompt:", prompt.substring(0, 300));

  const raw = await deepseekCall(prompt, { effort: "low", verbose: config.verbose, logPrefix: "stage1-generalize" });
  log(config, "[stage 1] raw response:", raw.substring(0, 500));

  let suggestions: Stage1Result[];
  try {
    const cleaned = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    suggestions = JSON.parse(cleaned);
  } catch {
    throw new Error(`Stage 1: failed to parse JSON for topic "${topic.query}". Raw: ${raw.substring(0, 200)}`);
  }

  if (!Array.isArray(suggestions)) {
    throw new Error(`Stage 1: expected JSON array, got: ${typeof suggestions}`);
  }

  const mapped: TopicSuggestion[] = suggestions.map((s, i) => ({
    id: `${topic.query}-${i}-${Date.now()}`,
    title: s.title,
    angle: s.angle,
    description: s.description,
    viralPotential: s.viralPotential,
  }));

  return { topic, suggestions: mapped };
}

async function stage2Script(
  output: Stage1Output,
  template: string,
  config: PipelineConfig
): Promise<Stage2Output> {
  const best = output.suggestions.reduce((a, b) =>
    b.viralPotential > a.viralPotential ? b : a
  );

  const secondsPerBeat = Math.round(
    (SCRIPT_DURATION_MINUTES * 60) / SCRIPT_BEATS_COUNT
  );
  const wordsPerBeat = Math.round(secondsPerBeat * WORDS_PER_SECOND);

  const hookType = (best as unknown as Stage1Result).hookType ?? "Hidden mechanism";

  const prompt = fillTemplate(template, {
    query: output.topic.query,
    title: best.title,
    angle: best.angle,
    hookType,
    durationMinutes: String(SCRIPT_DURATION_MINUTES),
    secondsPerBeat: String(secondsPerBeat),
    wordsPerBeat: String(wordsPerBeat),
  });

  log(config, `[stage 2] Script: "${best.title}" ...`);
  log(config, "[stage 2] prompt:", prompt.substring(0, 300));

  const raw = await deepseekCall(prompt, { effort: "medium", verbose: config.verbose, logPrefix: "stage2-script" });
  log(config, "[stage 2] raw response:", raw.substring(0, 500));

  interface Stage2Result {
    format: ScriptFormat;
    script: string;
  }

  let result: Stage2Result;
  try {
    const cleaned = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    result = JSON.parse(cleaned);
  } catch {
    throw new Error(`Stage 2: failed to parse JSON for angle "${best.title}". Raw: ${raw.substring(0, 200)}`);
  }

  if (!result.script || !result.format) {
    throw new Error("Stage 2: missing 'script' or 'format' in response");
  }

  const validFormats: ScriptFormat[] = [
    "myth-vs-reality",
    "investigation",
    "explainer",
    "decision-framework",
  ];
  if (!validFormats.includes(result.format)) {
    throw new Error(
      `Stage 2: unknown format "${result.format}". Expected one of: ${validFormats.join(", ")}`
    );
  }

  return {
    topic: output.topic,
    angle: best,
    script: result.script,
    format: result.format,
  };
}

async function stage3Segments(
  output: Stage2Output,
  template: string,
  config: PipelineConfig
): Promise<Stage3Output> {
  const prompt = fillTemplate(template, {
    script: output.script,
  });

  log(config, `[stage 3] Segmenting: "${output.angle.title}" ...`);
  log(config, "[stage 3] prompt:", prompt.substring(0, 300));

  const raw = await deepseekCall(prompt, { effort: "low", verbose: config.verbose, logPrefix: "stage3-segment" });
  log(config, "[stage 3] raw response:", raw.substring(0, 500));

  interface Stage3Result {
    groups: ScriptSegment[];
  }

  let result: Stage3Result;
  try {
    const cleaned = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    result = JSON.parse(cleaned);
  } catch {
    throw new Error(`Stage 3: failed to parse JSON for "${output.angle.title}". Raw: ${raw.substring(0, 200)}`);
  }

  if (!Array.isArray(result.groups) || result.groups.length === 0) {
    throw new Error("Stage 3: missing or empty 'groups' array");
  }

  for (const g of result.groups) {
    if (!g.label || !g.beat || !g.text || typeof g.durationSec !== "number") {
      throw new Error(`Stage 3: segment missing required fields: ${JSON.stringify(g)}`);
    }
  }

  return { script: output, groups: result.groups };
}

const VISUAL_REQUIREMENTS: Record<string, string> = {
  hook: "Text callout — key phrase only (3-6 words), not full sentence",
  promise: "Text callout — key phrase only (3-6 words), not full sentence",
  context: "Graph, table, or side-by-side layout showing the current situation",
  baseline: "Diagram or animation explaining the simple version",
  mechanism: "Diagram or animation showing what's actually happening underneath",
  evidence: "Graph, table, or side-by-side layout with data comparison",
  tradeoffs: "Split-screen or contrast layout showing both sides",
  framework: "Bold text + rule-of-thumb callout with decision tree or checklist",
  judgment: "Bold text + rule-of-thumb callout",
  closing: "Text callout — key phrase only, closing the loop",
};

function resolveVisualRequirement(group: ScriptSegment): string {
  const beat = group.beat.toLowerCase();
  for (const [key, visual] of Object.entries(VISUAL_REQUIREMENTS)) {
    if (beat.includes(key)) return visual;
  }
  return "Diagram or animation supporting the narration";
}

async function stage4RemotionPrompt(
  output: Stage3Output,
  template: string,
  config: PipelineConfig,
  sceneIndex: number,
  totalScenes: number
): Promise<Stage4Output> {
  const totalDurationSec = output.groups.reduce((sum, g) => sum + g.durationSec, 0);
  const totalDurationFrames = Math.round(totalDurationSec * 30);

  const groupSummaries = output.groups
    .map((g) => `- ${g.label}: ${g.text.substring(0, 80)}...`)
    .join("\n");

  const prompt = fillTemplate(template, {
    topic: output.script.topic.query,
    format: output.script.format,
    sceneNumber: String(sceneIndex),
    totalScenes: String(totalScenes),
    beatLabel: "full script",
    beatDescription: `All ${output.groups.length} beats: ${output.groups.map((g) => g.label).join(", ")}`,
    segmentText: groupSummaries,
    segmentDurationSec: String(totalDurationSec),
    segmentDurationFrames: String(totalDurationFrames),
    requiredVisual: "Complete Remotion composition with all narrative beats",
    allGroups: output.groups
      .map(
        (g) =>
          `[${g.label}] ${g.text} (${g.durationSec}s) — ${resolveVisualRequirement(g)}`
      )
      .join("\n\n"),
  });

  log(config, `[stage 4] Remotion prompt: "${output.script.angle.title}" ...`);
  log(config, "[stage 4] prompt:", prompt.substring(0, 300));

  const raw = await deepseekCall(prompt, { effort: "high", verbose: config.verbose, logPrefix: "stage4-remotion-prompt" });
  log(config, "[stage 4] raw response:", raw.substring(0, 500));

  return {
    script: output.script,
    groups: output.groups,
    remotionPrompt: raw,
  };
}

function concatenatePrompts(allOutputs: Stage4Output[]): string {
  const lines: string[] = [];
  lines.push("# Video Prompt — Auto-Generated by remotion-p2v");
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push(`# Scenes: ${allOutputs.length}`);
  lines.push("");

  let cumulativeFrames = 0;

  for (let i = 0; i < allOutputs.length; i++) {
    const output = allOutputs[i];
    const totalDuration = output.groups.reduce((sum, g) => sum + g.durationSec, 0);
    const totalFrames = Math.round(totalDuration * 30);
    const startFrame = cumulativeFrames;
    const endFrame = startFrame + totalFrames;

    lines.push(`---`);
    lines.push(`## Scene ${i + 1}: ${output.script.angle.title}`);
    lines.push(`Format: ${output.script.format}`);
    lines.push(`Frames: ${startFrame}—${endFrame} (${totalDuration}s)`);
    if (i > 0) {
      lines.push(`Transition in: fade or wipe from scene ${i}`);
    }
    lines.push("");

    const trimmed = output.remotionPrompt.trim();
    if (trimmed) {
      lines.push(trimmed);
    } else {
      lines.push("[No prompt generated for this scene]");
    }

    lines.push("");
    cumulativeFrames = endFrame;
  }

  return lines.join("\n");
}

function summarizeScenesForComposition(allOutputs: Stage4Output[]): string {
  const blocks: string[] = [];
  let sceneIdx = 0;

  for (const output of allOutputs) {
    for (const group of output.groups) {
      sceneIdx++;
      const durationFrames = Math.round(group.durationSec * 30);
      blocks.push(
        [
          `Scene ${sceneIdx}`,
          `topic: ${output.script.topic.query}`,
          `title: ${output.script.angle.title}`,
          `beat: ${group.beat}`,
          `label: ${group.label}`,
          `durationSec: ${group.durationSec}`,
          `durationFrames: ${durationFrames}`,
          `text: ${group.text}`,
        ].join("\n")
      );
    }
  }

  return blocks.join("\n\n");
}

async function stage5CompositionSpec(
  allOutputs: Stage4Output[],
  template: string,
  config: PipelineConfig,
  runId: string
) {
  const totalGroups = allOutputs.reduce(
    (sum, output) => sum + output.groups.length,
    0
  );
  const prompt = fillTemplate(template, {
    sceneCount: String(totalGroups),
    sceneSummaries: summarizeScenesForComposition(allOutputs),
    remotionPrompt: concatenatePrompts(allOutputs),
  });

  log(config, "[stage 5] composition spec prompt:", prompt.substring(0, 500));
  const raw = await deepseekCall(prompt, { effort: "medium", verbose: config.verbose, logPrefix: "stage5-composition-spec" });
  log(config, "[stage 5] raw response:", raw.substring(0, 500));

  try {
    return parseCompositionSpec(raw, runId, allOutputs);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Stage 5: failed to parse generated composition JSON. ${message}`);
  }
}

async function stage6AnimationPlan(
  run: ReturnType<typeof parseCompositionSpec>,
  template: string,
  config: PipelineConfig
) {
  const sceneSpecs = run.scenes
    .map((scene) => {
      const callouts = scene.visual.callouts
        .map((c, i) => `  callout-${i}: "${c}"`)
        .join("\n");
      const roleNote = (() => {
        switch (scene.visual.role) {
          case "hook-card":
            return "elements available: header, headline, body, footer";
          case "mechanism-diagram":
            return `elements available: header, headline, footer, callout-0 through callout-${scene.visual.callouts.length - 1}`;
          case "evidence-comparison":
            return "elements available: header, headline, footer, callout-0, callout-1";
          case "tradeoff-split":
            return "elements available: header, headline, footer, callout-0, callout-1, callout-2, callout-3";
          case "payoff-callout":
            return "elements available: header, headline, body, footer";
          default:
            return "elements available: header, headline, body, footer";
        }
      })();

      return [
        `sceneId: ${scene.id}`,
        `visualRole: ${scene.visual.role}`,
        `durationFrames: ${scene.durationFrames}`,
        `headline: "${scene.visual.headline}"`,
        `callouts:`,
        callouts || "  (none)",
        roleNote,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  const prompt = fillTemplate(template, { sceneSpecs });

  log(config, "[stage 6] animation plan prompt:", prompt.substring(0, 500));
  const raw = await deepseekCall(prompt, { effort: "high", verbose: config.verbose, logPrefix: "stage6-animation-plan" }, "You are an expert motion designer planning frame-level animation timing for data-driven video compositions.");
  log(config, "[stage 6] raw response:", raw.substring(0, 500));

  try {
    return parseAnimationPlan(raw, run.runId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Stage 6: failed to parse animation plan JSON. ${message}`);
  }
}

// --- Main ---

async function main(): Promise<void> {
  const config = parseArgv(process.argv);
  const runId = normalizeRunId(config.runId);

  console.error(`prompt-to-video: geo=${config.geo} count=${config.count} out=${config.outDir}`);

  if (config.fromStage4) {
    console.error(`Loading Stage 4 cache: ${config.fromStage4}`);
    const cached = await fs.readFile(config.fromStage4, "utf-8");
    const allStage4: Stage4Output[] = JSON.parse(cached);
    if (!Array.isArray(allStage4) || allStage4.length === 0) {
      throw new Error("--from-stage4 file must contain a non-empty array of Stage4Output");
    }

    const compositionTpl = await loadTemplate("composition-spec");
    const animationPlanTpl = await loadTemplate("animation-plan");

    const run = await stage5CompositionSpec(allStage4, compositionTpl, config, runId!);
    const { compositionPath, pointerPath } = await writeCompositionArtifacts(
      run,
      config.outDir
    );
    console.error(
      `Studio composition: prompt-to-video-${run.runId} (${run.scenes.length} scenes)`
    );
    console.error(`Composition artifact: ${compositionPath}`);
    console.error(`Studio pointer: ${pointerPath}`);

    const animationPlan = await stage6AnimationPlan(run, animationPlanTpl, config);
    const { planPath } = await writeAnimationPlanArtifacts(animationPlan, run.runId);
    console.error(
      `Animation plan: ${animationPlan.scenes.length} scenes, ${animationPlan.scenes.reduce((sum, s) => sum + s.elements.length, 0)} element timelines`
    );
    console.error(`Animation plan artifact: ${planPath}`);
    return;
  }

  const [generalizeTpl, scriptTpl, segmentTpl, remotionTpl, compositionTpl, animationPlanTpl] =
    await Promise.all([
      loadTemplate("generalize"),
      loadTemplate("script"),
      loadTemplate("segment-group"),
      loadTemplate("remotion-prompt"),
      config.studio ? loadTemplate("composition-spec") : Promise.resolve(""),
      config.studio ? loadTemplate("animation-plan") : Promise.resolve(""),
    ]);

  const allTopics = await fetchTrendingTopics(config.geo);
  if (allTopics.length === 0) {
    console.error("No trending topics found for geo:", config.geo);
    process.exit(1);
  }

  const topics = selectTopTopics(allTopics, config.count);
  console.error(`Fetched ${allTopics.length} topics, selected top ${topics.length}`);
  for (const t of topics) {
    console.error(`  - ${t.query} (${t.traffic ?? "?"})`);
  }

  const allStage4: Stage4Output[] = [];
  const totalScenes = topics.length;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    console.error(`\n--- Topic ${i + 1}/${topics.length}: ${topic.query} ---`);

    const stage1 = await stage1Generalize(topic, generalizeTpl, config);
    console.error(`  Stage 1: ${stage1.suggestions.length} suggestions`);

    const stage2 = await stage2Script(stage1, scriptTpl, config);
    console.error(`  Stage 2: script (${stage2.format}, ${stage2.script.length} chars)`);

    const stage3 = await stage3Segments(stage2, segmentTpl, config);
    console.error(`  Stage 3: ${stage3.groups.length} segments`);

    const stage4 = await stage4RemotionPrompt(stage3, remotionTpl, config, i + 1, totalScenes);
    console.error(`  Stage 4: remotion prompt (${stage4.remotionPrompt.length} chars)`);

    allStage4.push(stage4);
  }

  const masterPrompt = concatenatePrompts(allStage4);
  await fs.mkdir(config.outDir, { recursive: true });
  const outPath = path.join(config.outDir, `${timestamp()}-video-prompt.txt`);
  await fs.writeFile(outPath, masterPrompt, "utf-8");

  console.error(`\nDone. Output: ${outPath} (${masterPrompt.length} chars)`);

  const stage4CachePath = path.join(config.outDir, `${runId}-stage4.json`);
  await fs.writeFile(stage4CachePath, JSON.stringify(allStage4), "utf-8");
  console.error(`Stage 4 cache: ${stage4CachePath}`);

  if (config.studio) {
    const run = await stage5CompositionSpec(allStage4, compositionTpl, config, runId);
    const { compositionPath, pointerPath } = await writeCompositionArtifacts(
      run,
      config.outDir
    );
    console.error(
      `Studio composition: prompt-to-video-${run.runId} (${run.scenes.length} scenes)`
    );
    console.error(`Composition artifact: ${compositionPath}`);
    console.error(`Studio pointer: ${pointerPath}`);

    const animationPlan = await stage6AnimationPlan(run, animationPlanTpl, config);
    const { planPath } = await writeAnimationPlanArtifacts(animationPlan, run.runId);
    console.error(
      `Animation plan: ${animationPlan.scenes.length} scenes, ${animationPlan.scenes.reduce((sum, s) => sum + s.elements.length, 0)} element timelines`
    );
    console.error(`Animation plan artifact: ${planPath}`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
