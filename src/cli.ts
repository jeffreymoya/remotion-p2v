import fs from "node:fs";
import path from "node:path";
import { parseScript } from "./lib/parse-script";
import { deepseekChat, DeepSeekError } from "./lib/deepseek";
import { buildPrompt } from "./lib/build-prompt";
import { buildCompositionPrompt } from "./lib/build-composition-prompt";
import { writeComposition, regenerateBarrel } from "./lib/write-composition";
import { buildSceneJsonPrompt } from "./lib/build-scene-json-prompt";
import { writeSceneJson, SceneJsonValidationError } from "./lib/write-scene-json";
import {
  PROMPT_GEN_TEMPERATURE,
  CODE_GEN_TEMPERATURE,
  PROMPT_GEN_REASONING,
  CODE_GEN_REASONING,
  IMAGE_FETCH_TEMPERATURE,
  IMAGE_FETCH_REASONING,
  NARRATIVE_CHECK_TEMPERATURE,
  NARRATIVE_CHECK_REASONING,
  IMAGES_DIR,
  DEEPSEEK_RESPONSES_DIR,
  OUTPUT_DIR,
  BARREL_PATH,
  EXEMPLAR_COUNT,
  SCENE_JSON_DIR,
} from "./lib/config";
import type { ImageFetchItem } from "./lib/build-image-fetch-prompt";
import {
  buildImageFetchPrompt,
  parseImageFetchResponse,
} from "./lib/build-image-fetch-prompt";
import { downloadImages, type DownloadResult } from "./lib/download-images";
import {
  buildNarrativeCheckPrompt,
  parseNarrativeCheckResponse,
} from "./lib/build-narrative-check-prompt";

process.loadEnvFile();

const SCRIPT_PATH = "script.txt";
const EXEMPLARS_DIR = "examples/prompts";

type Phase = "narrative" | "prompt" | "images" | "code";
const PHASES: Phase[] = ["narrative", "prompt", "images", "code"];

function parsePhase(value: string | undefined): Phase | undefined {
  if (value === "narrative" || value === "prompt" || value === "images" || value === "code") {
    return value;
  }
  return undefined;
}

function parseArgs(): { segmentIndex: number; from: Phase; only?: Phase; verbose: boolean } {
  const args = process.argv.slice(2);
  let segmentIndex = 0;
  let from: Phase = parsePhase(process.env.npm_config_from) ?? "narrative";
  let only = parsePhase(process.env.npm_config_only);
  let verbose = false;

  for (const arg of args) {
    if (arg.startsWith("--from=")) {
      const phase = arg.split("=")[1];
      const parsedPhase = parsePhase(phase);
      if (parsedPhase) {
        from = parsedPhase;
      } else {
        console.error(`Unknown phase: ${phase}. Use --from=narrative|prompt|images|code`);
        process.exit(1);
      }
    } else if (arg.startsWith("--only=")) {
      const phase = arg.split("=")[1];
      const parsedPhase = parsePhase(phase);
      if (parsedPhase) {
        only = parsedPhase;
      } else {
        console.error(`Unknown phase: ${phase}. Use --only=narrative|prompt|images|code`);
        process.exit(1);
      }
    } else if (arg === "--verbose" || arg === "-v") {
      verbose = true;
    } else if (!arg.startsWith("--")) {
      const n = parseInt(arg, 10);
      if (!isNaN(n) && n >= 0) segmentIndex = n;
    }
  }

  return { segmentIndex, from, only, verbose };
}

function shouldRunPhase(phase: Phase, from: Phase, only: Phase | undefined): boolean {
  if (only) {
    return phase === only;
  }

  return PHASES.indexOf(phase) >= PHASES.indexOf(from);
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function mergeDownloadResults(
  items: ImageFetchItem[],
  results: DownloadResult[],
): ImageFetchItem[] {
  const byLabel = new Map(results.map((result) => [result.label, result]));
  return items.map((item) => {
    const result = byLabel.get(item.label);
    if (!result) {
      return item;
    }

    const resolvedItem: ImageFetchItem = {
      ...item,
      image_url: result.ok ? (result.url ?? "") : (item.image_url ?? ""),
      source_url: result.ok
        ? (result.sourceUrl ?? item.source_url ?? "")
        : (item.source_url ?? ""),
    };

    if (result.ok) {
      resolvedItem.resolved_path = result.path;
      delete resolvedItem.resolution_error;
    } else {
      resolvedItem.resolution_error = result.error ?? "image resolution failed";
      delete resolvedItem.resolved_path;
    }

    return resolvedItem;
  });
}

function loadExemplars(): string[] {
  if (!fs.existsSync(EXEMPLARS_DIR)) {
    console.error(`Exemplars directory not found: ${EXEMPLARS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(EXEMPLARS_DIR)
    .filter((f) => f.endsWith(".txt"))
    .sort()
    .slice(0, EXEMPLAR_COUNT);

  if (files.length === 0) {
    console.error(`No exemplar files found in ${EXEMPLARS_DIR}`);
    process.exit(1);
  }

  return files.map((f) =>
    fs.readFileSync(path.join(EXEMPLARS_DIR, f), "utf-8").trim(),
  );
}

function loadCodeImageItems(imagePlanPath: string): ImageFetchItem[] {
  if (!fs.existsSync(imagePlanPath)) {
    console.warn(
      `Image plan not found: ${imagePlanPath}. Code generation will rely on the prompt only.`,
    );
    return [];
  }

  try {
    const raw = fs.readFileSync(imagePlanPath, "utf-8");
    const items = parseImageFetchResponse(raw);
    const availableItems = items.filter(
      (item) => !item.resolution_error && (item.cutout_path || item.resolved_path),
    );
    const skipped = items.length - availableItems.length;

    console.log(
      `Loaded image asset manifest: ${imagePlanPath} (${availableItems.length} available${skipped > 0 ? `, ${skipped} skipped` : ""})\n`,
    );
    return availableItems;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `Could not parse image plan: ${imagePlanPath} (${message}). Code generation will rely on the prompt only.`,
    );
    return [];
  }
}

function makeRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function makeDeepSeekResponseRecorder(
  label: string,
  filePath: string,
  verbose: boolean,
): (text: string) => void {
  let started = false;
  fs.writeFileSync(filePath, "", "utf-8");

  return (text: string) => {
    fs.appendFileSync(filePath, text, "utf-8");

    if (verbose && !started) {
      process.stdout.write(`  Stream (${label}): `);
      started = true;
    }
    if (verbose) {
      process.stdout.write(text);
    }
  };
}

function makeDeepSeekThinkingRecorder(filePath: string): (text: string) => void {
  fs.writeFileSync(filePath, "", "utf-8");

  return (text: string) => {
    fs.appendFileSync(filePath, text, "utf-8");
  };
}

function makeDeepSeekRecorders(
  label: string,
  responsePath: string,
  thinkingPath: string,
  verbose: boolean,
): {
  onChunk: (text: string) => void;
  onReasoningChunk: (text: string) => void;
} {
  return {
    onChunk: makeDeepSeekResponseRecorder(label, responsePath, verbose),
    onReasoningChunk: makeDeepSeekThinkingRecorder(thinkingPath),
  };
}

async function main(): Promise<void> {
  const { segmentIndex, from, only, verbose } = parseArgs();

  if (!fs.existsSync(SCRIPT_PATH)) {
    console.error(`Script file not found: ${SCRIPT_PATH}`);
    process.exit(1);
  }

  const rawScript = fs.readFileSync(SCRIPT_PATH, "utf-8");
  const segments = parseScript(rawScript);

  if (segments.length === 0) {
    console.error("No segments found in script.txt");
    process.exit(1);
  }

  if (segmentIndex >= segments.length) {
    console.error(
      `Segment index ${segmentIndex} out of range (0-${segments.length - 1})`,
    );
    process.exit(1);
  }

  const segment = segments[segmentIndex];
  const slug = toSlug(segment.title);

  console.log(`Processing segment ${segmentIndex}/${segments.length - 1}: "${segment.title}"`);
  console.log(`  Timeline: ${segment.startSeconds}s - ${segment.endSeconds}s`);
  if (only) {
    console.log(`  Running only phase: ${only}`);
  } else {
    console.log(`  Starting from phase: ${from}`);
  }
  console.log("");

  const promptsDir = "prompts";
  if (!fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true });
  }
  const promptPath = path.join(promptsDir, `${slug}.txt`);
  const imagePlanPath = path.join(promptsDir, `${slug}-images.json`);
  const narrativePath = path.join(promptsDir, `${slug}-narrative.txt`);
  const deepseekResponseDir = path.join(
    DEEPSEEK_RESPONSES_DIR,
    `${makeRunId()}-${slug}`,
  );
  fs.mkdirSync(deepseekResponseDir, { recursive: true });
  console.log(`  Saving DeepSeek responses: ${deepseekResponseDir}\n`);

  // ── Phase: narrative ──
  if (shouldRunPhase("narrative", from, only)) {
    console.log("Phase 0: Scoring and enhancing segment narrative...");
    const { system: narSystem, user: narUser } = buildNarrativeCheckPrompt(segment);

    let narResponse: string;
    try {
      narResponse = await deepseekChat(
        [
          { role: "system", content: narSystem },
          { role: "user", content: narUser },
        ],
        NARRATIVE_CHECK_TEMPERATURE,
        NARRATIVE_CHECK_REASONING,
        {
          verbose,
          ...makeDeepSeekRecorders(
            "narrative",
            path.join(deepseekResponseDir, "00-narrative.response.txt"),
            path.join(deepseekResponseDir, "00-narrative.thinking.txt"),
            verbose,
          ),
        },
      );
    } catch (err) {
      if (err instanceof DeepSeekError) {
        console.error(`DeepSeek API error (narrative check): ${err.message}`);
        process.exit(1);
      }
      throw err;
    }

    if (verbose) process.stdout.write("\n");

    const { totalScore, enhancedNarrative } = parseNarrativeCheckResponse(narResponse);
    console.log(`  Narrative rubric score: ${totalScore}/20`);

    if (totalScore < 14) {
      console.warn(`  ⚠ Score below 14/20 — narrative may produce a weak composition.`);
    }

    fs.writeFileSync(narrativePath, narResponse, "utf-8");
    console.log(`  Saved narrative check: ${narrativePath}`);

    if (enhancedNarrative) {
      console.log(`  Enhanced narrative length: ${enhancedNarrative.length} chars\n`);
    } else {
      console.warn("  Could not extract enhanced narrative from response.\n");
    }
  }

  // Load enhanced narrative for prompt phase if available
  let effectiveSegment = segment;
  if (shouldRunPhase("prompt", from, only) && fs.existsSync(narrativePath)) {
    const narRaw = fs.readFileSync(narrativePath, "utf-8");
    const { enhancedNarrative } = parseNarrativeCheckResponse(narRaw);
    if (enhancedNarrative) {
      effectiveSegment = { ...segment, narrative: enhancedNarrative };
      console.log(`Using enhanced narrative from: ${narrativePath}\n`);
    }
  }

  let remotionPrompt = "";
  const needsRemotionPrompt =
    shouldRunPhase("prompt", from, only) ||
    shouldRunPhase("images", from, only) ||
    shouldRunPhase("code", from, only);

  // ── Phase: prompt ──
  if (shouldRunPhase("prompt", from, only)) {
    console.log(`Loading ${EXEMPLAR_COUNT} exemplar(s)...`);
    const exemplars = loadExemplars();
    console.log(`  Got ${exemplars.length} exemplar(s)\n`);

    console.log("Step 1: Generating Remotion prompt from segment + exemplars...");
    const { system: step1System, user: step1User } = buildPrompt(slug, effectiveSegment, exemplars);

    try {
      remotionPrompt = await deepseekChat(
        [
          { role: "system", content: step1System },
          { role: "user", content: step1User },
        ],
        PROMPT_GEN_TEMPERATURE,
        PROMPT_GEN_REASONING,
        {
          verbose,
          ...makeDeepSeekRecorders(
            "prompt",
            path.join(deepseekResponseDir, "01-prompt.response.txt"),
            path.join(deepseekResponseDir, "01-prompt.thinking.txt"),
            verbose,
          ),
        },
      );
    } catch (err) {
      if (err instanceof DeepSeekError) {
        console.error(`DeepSeek API error (step 1): ${err.message}`);
        process.exit(1);
      }
      throw err;
    }

    if (verbose) process.stdout.write("\n");
    console.log(`  Got prompt (${remotionPrompt.length} chars)\n`);
    fs.writeFileSync(promptPath, remotionPrompt, "utf-8");
    console.log(`  Saved prompt: ${promptPath}\n`);
  } else if (needsRemotionPrompt) {
    if (!fs.existsSync(promptPath)) {
      console.error(
        `Prompt file not found: ${promptPath}. Run with --from=prompt first.`,
      );
      process.exit(1);
    }
    remotionPrompt = fs.readFileSync(promptPath, "utf-8");
    console.log(`Loaded existing prompt: ${promptPath} (${remotionPrompt.length} chars)\n`);
  }

  // ── Phase: images ──
  if (shouldRunPhase("images", from, only)) {
    console.log("Step 1.5: Generating image fetch plan from Remotion prompt...");
    const { system: imgSystem, user: imgUser } =
      buildImageFetchPrompt(remotionPrompt);

    let imagePlan: string;
    try {
      imagePlan = await deepseekChat(
        [
          { role: "system", content: imgSystem },
          { role: "user", content: imgUser },
        ],
        IMAGE_FETCH_TEMPERATURE,
        IMAGE_FETCH_REASONING,
        {
          verbose,
          ...makeDeepSeekRecorders(
            "image-plan",
            path.join(deepseekResponseDir, "02-image-plan.response.txt"),
            path.join(deepseekResponseDir, "02-image-plan.thinking.txt"),
            verbose,
          ),
        },
      );
    } catch (err) {
      if (err instanceof DeepSeekError) {
        console.error(`DeepSeek API error (image fetch): ${err.message}`);
        process.exit(1);
      }
      throw err;
    }

    if (verbose) process.stdout.write("\n");

    fs.writeFileSync(imagePlanPath, imagePlan, "utf-8");
    console.log(`  Saved image plan: ${imagePlanPath}`);

    let imageItems: ImageFetchItem[];
    try {
      imageItems = parseImageFetchResponse(imagePlan);
      console.log(`  Found ${imageItems.length} asset(s) to download\n`);
    } catch {
      console.warn("  Could not parse image plan as JSON array. Skipping download.\n");
      imageItems = [];
    }

    if (imageItems.length > 0) {
      console.log("Resolving and downloading images...");
      const { downloaded, failed, results } = await downloadImages(
        imageItems,
        IMAGES_DIR,
      );

      for (const r of results) {
        const detail = r.ok ? ` (${r.url})` : ` (${r.error ?? "download failed"})`;
        console.log(`  ${r.ok ? "OK" : "FAIL"}  ${r.label}${detail}`);
      }

      imageItems = mergeDownloadResults(imageItems, results);
      fs.writeFileSync(imagePlanPath, JSON.stringify(imageItems, null, 2), "utf-8");
      console.log(`  Saved resolved image plan: ${imagePlanPath}`);
      console.log(`  Downloaded: ${downloaded}, Failed: ${failed}\n`);
    }
  }

  // ── Phase: code ──
  if (shouldRunPhase("code", from, only)) {
    const codeImageItems = loadCodeImageItems(imagePlanPath);
    const durationInFrames = (segment.endSeconds - segment.startSeconds) * 30;

    console.log("Step 2: Generating scene script JSON from Remotion prompt...");
    const { system: step2System, user: step2User } =
      buildSceneJsonPrompt(remotionPrompt, codeImageItems, slug, durationInFrames);

    let sceneResponse: string;
    try {
      sceneResponse = await deepseekChat(
        [
          { role: "system", content: step2System },
          { role: "user", content: step2User },
        ],
        CODE_GEN_TEMPERATURE,
        CODE_GEN_REASONING,
        {
          verbose,
          ...makeDeepSeekRecorders(
            "code",
            path.join(deepseekResponseDir, "03-code.response.txt"),
            path.join(deepseekResponseDir, "03-code.thinking.txt"),
            verbose,
          ),
        },
      );
    } catch (err) {
      if (err instanceof DeepSeekError) {
        console.error(`DeepSeek API error (step 2): ${err.message}`);
        process.exit(1);
      }
      throw err;
    }

    if (verbose) process.stdout.write("\n");
    console.log(`  Got response (${sceneResponse.length} chars)\n`);

    console.log("Validating and writing scene JSON...");
    try {
      const { path: outPath, script } = writeSceneJson(sceneResponse, slug, SCENE_JSON_DIR);
      console.log(`  Written: ${outPath}`);
      console.log(`  Scenes: ${script.scenes.length}, Duration: ${script.durationInFrames} frames\n`);
    } catch (err) {
      if (err instanceof SceneJsonValidationError) {
        console.error(`Scene JSON validation error: ${err.message}`);
        process.exit(1);
      }
      throw err;
    }
  }

  console.log("Done. Run `npx remotion studio` to view the composition.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
