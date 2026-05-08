import fs from "node:fs";
import path from "node:path";
import { parseScript } from "./lib/parse-script";
import type { Segment } from "./lib/parse-script";
import { deepseekChat, DeepSeekError } from "./lib/deepseek";
import { buildPrompt } from "./lib/build-prompt";
import { writeComposition, regenerateBarrel } from "./lib/write-composition";
import { buildSceneJsonPrompt } from "./lib/build-scene-json-prompt";
import {
  writeSceneJson,
  writeSceneScriptsModule,
  SceneJsonValidationError,
} from "./lib/write-scene-json";
import { buildScenePrompt } from "./lib/build-scene-prompt";
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
  DEEPSEEK_CONCURRENCY,
  IMAGE_DOWNLOAD_CONCURRENCY,
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
import { createLimiter } from "./lib/concurrency";
import {
  parseSceneManifest,
  manifestPath,
  sceneOutputDir,
  sceneFileName,
  compositionId,
  sceneImageDir,
  isArtifactReady,
  writeFileAtomically,
  type SceneManifest,
  type SceneSpec,
} from "./lib/scene-manifest";
import {
  buildSceneManifestPrompt,
} from "./lib/build-scene-manifest-prompt";

process.loadEnvFile();

const SCRIPT_PATH = "script.txt";
const EXEMPLARS_DIR = "examples/prompts";

type Phase = "narrative" | "prompt" | "images" | "code";
const PHASES: Phase[] = ["narrative", "prompt", "images", "code"];

function parsePhase(value: string | undefined): Phase | undefined {
  if (
    value === "narrative" ||
    value === "prompt" ||
    value === "images" ||
    value === "code"
  ) {
    return value;
  }
  return undefined;
}

function parseArgs(): {
  segmentIndex: number;
  from: Phase;
  only?: Phase;
  verbose: boolean;
  sceneIndex?: number;
} {
  const args = process.argv.slice(2);
  let segmentIndex = 0;
  let from: Phase = parsePhase(process.env.npm_config_from) ?? "narrative";
  let only = parsePhase(process.env.npm_config_only);
  let verbose = false;
  let sceneIndex: number | undefined;

  for (const arg of args) {
    if (arg.startsWith("--scene=")) {
      const n = parseInt(arg.split("=")[1], 10);
      if (!isNaN(n) && n >= 1) {
        sceneIndex = n;
      } else {
        console.error(`Invalid scene index: ${arg}. Use --scene=N with N >= 1.`);
        process.exit(1);
      }
    } else if (arg.startsWith("--from=")) {
      const phase = arg.split("=")[1];
      const parsedPhase = parsePhase(phase);
      if (parsedPhase) {
        from = parsedPhase;
      } else {
        console.error(
          `Unknown phase: ${phase}. Use --from=narrative|prompt|images|code`,
        );
        process.exit(1);
      }
    } else if (arg.startsWith("--only=")) {
      const phase = arg.split("=")[1];
      const parsedPhase = parsePhase(phase);
      if (parsedPhase) {
        only = parsedPhase;
      } else {
        console.error(
          `Unknown phase: ${phase}. Use --only=narrative|prompt|images|code`,
        );
        process.exit(1);
      }
    } else if (arg === "--verbose" || arg === "-v") {
      verbose = true;
    } else if (!arg.startsWith("--")) {
      const n = parseInt(arg, 10);
      if (!isNaN(n) && n >= 0) segmentIndex = n;
    }
  }

  return { segmentIndex, from, only, verbose, sceneIndex };
}

function shouldRunPhase(
  phase: Phase,
  from: Phase,
  only: Phase | undefined,
): boolean {
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
    if (!result) return item;
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
  if (!isArtifactReady(imagePlanPath)) {
    console.warn(
      `Image plan not found or incomplete: ${imagePlanPath}. Code generation will rely on the prompt only.`,
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
    if (verbose) process.stdout.write(text);
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

type SceneJobStatus = "success" | "failed" | "skipped";

interface SceneJobResult {
  scene: SceneSpec;
  status: SceneJobStatus;
  promptPath?: string;
  imagePlanPath?: string;
  sceneJsonPath?: string;
  error?: string;
  durationMs: number;
  deepseekCalls: number;
  artifactPaths: string[];
}

async function runSceneJob(
  scene: SceneSpec,
  segmentSlug: string,
  segmentTitle: string,
  effectiveSegment: Segment,
  args: {
    from: Phase;
    only?: Phase;
    verbose: boolean;
  },
  runDeepSeek: <T>(task: () => Promise<T>) => Promise<T>,
  runImageDownload: <T>(task: () => Promise<T>) => Promise<T>,
  runDir: string,
  exemplars: string[],
): Promise<SceneJobResult> {
  const startTime = Date.now();
  let deepseekCalls = 0;
  const artifactPaths: string[] = [];
  const from = args.from;
  const only = args.only;

  try {
    const outDir = sceneOutputDir(segmentSlug);
    const scenePromptPath = path.join(outDir, sceneFileName(scene, ".txt"));
    const sceneImagePlanPath = path.join(
      outDir,
      sceneFileName(scene, "-images.json"),
    );
    const sceneJsonPath = path.join(
      outDir,
      sceneFileName(scene, "-scene.json"),
    );
    const imgDir = sceneImageDir(segmentSlug, scene);

    const sceneDir = path.join(runDir, `scene-${String(scene.sceneIndex).padStart(3, "0")}`);
    fs.mkdirSync(sceneDir, { recursive: true });

    // ── Prompt phase ──
    let remotionPrompt = "";
    const needsPrompt =
      shouldRunPhase("prompt", from, only) ||
      shouldRunPhase("images", from, only) ||
      shouldRunPhase("code", from, only);

    if (shouldRunPhase("prompt", from, only)) {
      let promptContent: string;
      if (isArtifactReady(scenePromptPath)) {
        promptContent = fs.readFileSync(scenePromptPath, "utf-8");
        remotionPrompt = promptContent;
        artifactPaths.push(scenePromptPath);
        console.log(
          `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Prompt cached: ${scenePromptPath}`,
        );
      } else {
        const { system, user } = buildScenePrompt(
          scene,
          segmentTitle,
          segmentSlug,
          exemplars,
        );
        promptContent = await runDeepSeek(async () => {
          deepseekCalls++;
          const recorders = makeDeepSeekRecorders(
            `scene-${String(scene.sceneIndex).padStart(3, "0")}-prompt`,
            path.join(sceneDir, "prompt.response.txt"),
            path.join(sceneDir, "prompt.thinking.txt"),
            args.verbose,
          );
          return deepseekChat(
            [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            PROMPT_GEN_TEMPERATURE,
            PROMPT_GEN_REASONING,
            { verbose: false, ...recorders },
          );
        });
        remotionPrompt = promptContent;
        writeFileAtomically(scenePromptPath, promptContent);
        artifactPaths.push(scenePromptPath);
        console.log(
          `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Prompt saved: ${scenePromptPath} (${promptContent.length} chars)`,
        );
      }
    } else if (needsPrompt) {
      if (!isArtifactReady(scenePromptPath)) {
        return {
          scene,
          status: "failed",
          promptPath: scenePromptPath,
          durationMs: Date.now() - startTime,
          deepseekCalls,
          artifactPaths,
          error: `Prompt file not found: ${scenePromptPath}. Run with --from=prompt first.`,
        };
      }
      remotionPrompt = fs.readFileSync(scenePromptPath, "utf-8");
      artifactPaths.push(scenePromptPath);
      console.log(
        `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Prompt loaded: ${scenePromptPath}`,
      );
    }

    // ── Images phase ──
    if (shouldRunPhase("images", from, only)) {
      let imageItems: ImageFetchItem[] = [];
      if (isArtifactReady(sceneImagePlanPath)) {
        const raw = fs.readFileSync(sceneImagePlanPath, "utf-8");
        try {
          imageItems = parseImageFetchResponse(raw);
          artifactPaths.push(sceneImagePlanPath);
          console.log(
            `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Image plan cached: ${sceneImagePlanPath}`,
          );
        } catch {
          console.warn(
            `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Image plan corrupted, regenerating.`,
          );
        }
      }

      if (!isArtifactReady(sceneImagePlanPath) || imageItems.length === 0) {
        const { system, user } = buildImageFetchPrompt(remotionPrompt);
        const imagePlanRaw = await runDeepSeek(async () => {
          deepseekCalls++;
          const recorders = makeDeepSeekRecorders(
            `scene-${String(scene.sceneIndex).padStart(3, "0")}-images`,
            path.join(sceneDir, "images.response.txt"),
            path.join(sceneDir, "images.thinking.txt"),
            args.verbose,
          );
          return deepseekChat(
            [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            IMAGE_FETCH_TEMPERATURE,
            IMAGE_FETCH_REASONING,
            { verbose: false, ...recorders },
          );
        });
        writeFileAtomically(sceneImagePlanPath, imagePlanRaw);
        artifactPaths.push(sceneImagePlanPath);

        try {
          imageItems = parseImageFetchResponse(imagePlanRaw);
          console.log(
            `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Image plan: ${imageItems.length} asset(s)`,
          );
        } catch {
          console.warn(
            `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Could not parse image plan. Skipping download.`,
          );
        }
      }

      if (imageItems.length > 0) {
        const { downloaded, failed, results } = await downloadImages(
          imageItems,
          imgDir,
          runImageDownload,
        );
        for (const r of results) {
          const detail = r.ok
            ? ` (${r.url})`
            : ` (${r.error ?? "download failed"})`;
          console.log(
            `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] ${r.ok ? "OK" : "FAIL"}  ${r.label}${detail}`,
          );
        }
        imageItems = mergeDownloadResults(imageItems, results);
        writeFileAtomically(
          sceneImagePlanPath,
          JSON.stringify(imageItems, null, 2),
        );
        console.log(
          `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Images: ${downloaded} downloaded, ${failed} failed`,
        );
      }
    }

    // ── Code phase ──
    if (shouldRunPhase("code", from, only)) {
      const codeImageItems = loadCodeImageItems(sceneImagePlanPath);
      const durationInFrames = Math.round(
        (scene.endSeconds - scene.startSeconds) * 30,
      );
      const compId = compositionId(segmentSlug, scene);

      const { system, user } = buildSceneJsonPrompt(
        remotionPrompt,
        codeImageItems,
        compId,
        durationInFrames,
      );

      const sceneResponse = await runDeepSeek(async () => {
        deepseekCalls++;
        const recorders = makeDeepSeekRecorders(
          `scene-${String(scene.sceneIndex).padStart(3, "0")}-code`,
          path.join(sceneDir, "code.response.txt"),
          path.join(sceneDir, "code.thinking.txt"),
          args.verbose,
        );
        return deepseekChat(
          [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          CODE_GEN_TEMPERATURE,
          CODE_GEN_REASONING,
          { verbose: false, ...recorders },
        );
      });

      const fileBase = sceneFileName(scene, "");
      const { path: outPath, script } = writeSceneJson(
        sceneResponse,
        fileBase,
        outDir,
        {
          expectedDurationFrames: durationInFrames,
          expectedCompositionId: compId,
          skipRegeneration: true,
        },
      );
      artifactPaths.push(outPath);
      sceneJsonPath && artifactPaths.push(sceneJsonPath);
      console.log(
        `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Code: ${outPath} (${script.scenes.length} blocks, ${script.durationInFrames}f)`,
      );
    }

    const durationMs = Date.now() - startTime;
    return {
      scene,
      status: "success",
      promptPath: scenePromptPath,
      imagePlanPath: sceneImagePlanPath,
      sceneJsonPath,
      durationMs,
      deepseekCalls,
      artifactPaths,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (err instanceof DeepSeekError) {
      const isRetryable =
        err.status === 429 || (err.status !== undefined && err.status >= 500);
      const tag = isRetryable ? "[RETRYABLE]" : "[FATAL]";
      console.error(
        `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] ${tag} DeepSeek error: ${errorMessage}`,
      );
    } else if (err instanceof SceneJsonValidationError) {
      console.error(
        `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Scene JSON validation error: ${errorMessage}`,
      );
    } else {
      console.error(
        `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Error: ${errorMessage}`,
      );
    }

    return {
      scene,
      status: "failed",
      promptPath: path.join(sceneOutputDir(segmentSlug), sceneFileName(scene, ".txt")),
      imagePlanPath: path.join(
        sceneOutputDir(segmentSlug),
        sceneFileName(scene, "-images.json"),
      ),
      sceneJsonPath: path.join(
        sceneOutputDir(segmentSlug),
        sceneFileName(scene, "-scene.json"),
      ),
      error: errorMessage,
      durationMs,
      deepseekCalls,
      artifactPaths,
    };
  }
}

function printBatchSummary(
  results: SceneJobResult[],
  manifest: SceneManifest,
): void {
  const succeeded = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log(`  Segment: ${manifest.segmentTitle}`);
  console.log(`  Total scenes: ${manifest.scenes.length}`);
  console.log(`  Succeeded: ${succeeded}, Failed: ${failed}, Skipped: ${skipped}`);
  console.log("───────────────────────────────────────────");

  for (const r of results) {
    const idx = String(r.scene.sceneIndex).padStart(3, "0");
    const statusIcon =
      r.status === "success"
        ? "✓"
        : r.status === "failed"
          ? "✗"
          : "○";
    const duration = (r.durationMs / 1000).toFixed(1);
    console.log(
      `  ${statusIcon} scene ${idx} "${r.scene.title}" | ${r.status} | ${duration}s | ${r.deepseekCalls} DeepSeek calls`,
    );
    if (r.error) {
      console.log(`    Error: ${r.error}`);
    }
    if (r.artifactPaths.length > 0) {
      for (const ap of r.artifactPaths.sort()) {
        console.log(`    → ${ap}`);
      }
    }
  }

  console.log("═══════════════════════════════════════════");

  if (failed > 0) {
    console.log(`\n⚠ ${failed} scene(s) failed. Check error messages above.`);
    console.log(
      "Re-run with --from=<phase> to resume from the failed phase, or --scene=N to debug a single scene.",
    );
  }
}

async function runLegacyPipeline(
  slug: string,
  segment: Segment,
  effectiveSegment: Segment,
  args: {
    from: Phase;
    only?: Phase;
    verbose: boolean;
  },
  runDir: string,
): Promise<void> {
  const { from, only, verbose } = args;
  const promptsDir = "prompts";
  const promptPath = path.join(promptsDir, `${slug}.txt`);
  const imagePlanPath = path.join(promptsDir, `${slug}-images.json`);

  let remotionPrompt = "";
  const needsRemotionPrompt =
    shouldRunPhase("prompt", from, only) ||
    shouldRunPhase("images", from, only) ||
    shouldRunPhase("code", from, only);

  // ── prompt ──
  if (shouldRunPhase("prompt", from, only)) {
    console.log(`Loading ${EXEMPLAR_COUNT} exemplar(s)...`);
    const exemplars = loadExemplars();
    console.log(`  Got ${exemplars.length} exemplar(s)\n`);
    console.log("Step 1: Generating Remotion prompt from segment + exemplars...");
    const { system: step1System, user: step1User } = buildPrompt(
      slug,
      effectiveSegment,
      exemplars,
    );
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
            path.join(runDir, "01-prompt.response.txt"),
            path.join(runDir, "01-prompt.thinking.txt"),
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
    writeFileAtomically(promptPath, remotionPrompt);
    console.log(`  Saved prompt: ${promptPath}\n`);
  } else if (needsRemotionPrompt) {
    if (!isArtifactReady(promptPath)) {
      console.error(
        `Prompt file not found or incomplete: ${promptPath}. Run with --from=prompt first.`,
      );
      process.exit(1);
    }
    remotionPrompt = fs.readFileSync(promptPath, "utf-8");
    console.log(
      `Loaded existing prompt: ${promptPath} (${remotionPrompt.length} chars)\n`,
    );
  }

  // ── images ──
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
            path.join(runDir, "02-image-plan.response.txt"),
            path.join(runDir, "02-image-plan.thinking.txt"),
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
    writeFileAtomically(imagePlanPath, imagePlan);
    console.log(`  Saved image plan: ${imagePlanPath}`);
    let imageItems: ImageFetchItem[];
    try {
      imageItems = parseImageFetchResponse(imagePlan);
      console.log(`  Found ${imageItems.length} asset(s) to download\n`);
    } catch {
      console.warn(
        "  Could not parse image plan as JSON array. Skipping download.\n",
      );
      imageItems = [];
    }
    if (imageItems.length > 0) {
      console.log("Resolving and downloading images...");
      const { downloaded, failed, results } = await downloadImages(
        imageItems,
        IMAGES_DIR,
      );
      for (const r of results) {
        const detail = r.ok
          ? ` (${r.url})`
          : ` (${r.error ?? "download failed"})`;
        console.log(`  ${r.ok ? "OK" : "FAIL"}  ${r.label}${detail}`);
      }
      imageItems = mergeDownloadResults(imageItems, results);
      writeFileAtomically(
        imagePlanPath,
        JSON.stringify(imageItems, null, 2),
      );
      console.log(`  Saved resolved image plan: ${imagePlanPath}`);
      console.log(`  Downloaded: ${downloaded}, Failed: ${failed}\n`);
    }
  }

  // ── code ──
  if (shouldRunPhase("code", from, only)) {
    const codeImageItems = loadCodeImageItems(imagePlanPath);
    const durationInFrames = (segment.endSeconds - segment.startSeconds) * 30;
    console.log("Step 2: Generating scene script JSON from Remotion prompt...");
    const { system: step2System, user: step2User } = buildSceneJsonPrompt(
      remotionPrompt,
      codeImageItems,
      slug,
      durationInFrames,
    );
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
            path.join(runDir, "03-code.response.txt"),
            path.join(runDir, "03-code.thinking.txt"),
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
      const { path: outPath, script } = writeSceneJson(
        sceneResponse,
        slug,
        SCENE_JSON_DIR,
      );
      console.log(`  Written: ${outPath}`);
      console.log(
        `  Scenes: ${script.scenes.length}, Duration: ${script.durationInFrames} frames\n`,
      );
    } catch (err) {
      if (err instanceof SceneJsonValidationError) {
        console.error(`Scene JSON validation error: ${err.message}`);
        process.exit(1);
      }
      throw err;
    }
  }
}

async function main(): Promise<void> {
  const { segmentIndex, from, only, verbose, sceneIndex } = parseArgs();

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

  console.log(
    `Processing segment ${segmentIndex}/${segments.length - 1}: "${segment.title}"`,
  );
  console.log(`  Timeline: ${segment.startSeconds}s - ${segment.endSeconds}s`);
  if (sceneIndex) {
    console.log(`  Target scene: ${sceneIndex}`);
  }
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
  const narrativePath = path.join(promptsDir, `${slug}-narrative.txt`);
  const runDir = path.join(DEEPSEEK_RESPONSES_DIR, `${makeRunId()}-${slug}`);
  fs.mkdirSync(runDir, { recursive: true });
  console.log(`  Saving DeepSeek responses: ${runDir}\n`);

  // ── Phase: narrative (segment-level, unchanged) ──
  if (shouldRunPhase("narrative", from, only)) {
    console.log("Phase 0: Scoring and enhancing segment narrative...");
    const { system: narSystem, user: narUser } =
      buildNarrativeCheckPrompt(segment);

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
            path.join(runDir, "00-narrative.response.txt"),
            path.join(runDir, "00-narrative.thinking.txt"),
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

    const { totalScore, enhancedNarrative } =
      parseNarrativeCheckResponse(narResponse);
    console.log(`  Narrative rubric score: ${totalScore}/20`);

    if (totalScore < 14) {
      console.warn(
        `  ⚠ Score below 14/20 — narrative may produce a weak composition.`,
      );
    }

    fs.writeFileSync(narrativePath, narResponse, "utf-8");
    console.log(`  Saved narrative check: ${narrativePath}`);

    if (enhancedNarrative) {
      console.log(
        `  Enhanced narrative length: ${enhancedNarrative.length} chars\n`,
      );
    } else {
      console.warn("  Could not extract enhanced narrative from response.\n");
    }
  }

  // Load enhanced narrative
  let effectiveSegment = segment;
  if (fs.existsSync(narrativePath)) {
    const narRaw = fs.readFileSync(narrativePath, "utf-8");
    const { enhancedNarrative } = parseNarrativeCheckResponse(narRaw);
    if (enhancedNarrative) {
      effectiveSegment = { ...segment, narrative: enhancedNarrative };
      if (shouldRunPhase("prompt", from, only)) {
        console.log(`Using enhanced narrative from: ${narrativePath}\n`);
      }
    }
  }

  // Determine if scene pipeline phases are needed
  const needsScenePipeline =
    shouldRunPhase("prompt", from, only) ||
    shouldRunPhase("images", from, only) ||
    shouldRunPhase("code", from, only);

  if (!needsScenePipeline) {
    console.log("Done. Run `npx remotion studio` to view the composition.");
    return;
  }

  // ── Try scene manifest ──
  const manifestFilePath = manifestPath(slug);
  let manifest: SceneManifest | null = null;
  let manifestGenerated = false;

  if (isArtifactReady(manifestFilePath)) {
    try {
      manifest = parseSceneManifest(
        fs.readFileSync(manifestFilePath, "utf-8"),
      );
      console.log(`Loaded scene manifest: ${manifest.scenes.length} scene(s)\n`);
    } catch (err) {
      console.warn(
        `Scene manifest parse error: ${err instanceof Error ? err.message : String(err)}. Regenerating.`,
      );
    }
  }

  if (!manifest && shouldRunPhase("prompt", from, only)) {
    console.log("Generating scene manifest from segment narrative...");
    const { system, user } = buildSceneManifestPrompt(
      effectiveSegment,
      slug,
    );
    try {
      const raw = await deepseekChat(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        0.3,
        {
          effort: "medium",
          thinking: { type: "disabled" as const },
        },
        {
          verbose,
          ...makeDeepSeekRecorders(
            "manifest",
            path.join(runDir, "00-manifest.response.txt"),
            path.join(runDir, "00-manifest.thinking.txt"),
            verbose,
          ),
        },
      );
      manifest = parseSceneManifest(raw);
      writeFileAtomically(manifestFilePath, raw);
      manifestGenerated = true;
      console.log(
        `Saved scene manifest: ${manifestFilePath} (${manifest.scenes.length} scene(s))\n`,
      );
    } catch (err) {
      if (err instanceof DeepSeekError) {
        console.error(
          `DeepSeek API error (scene manifest): ${err.message}. Falling back to legacy single-composition mode.`,
        );
      } else {
        console.error(
          `Scene manifest generation error: ${err instanceof Error ? err.message : String(err)}. Falling back to legacy single-composition mode.`,
        );
      }
      manifest = null;
    }
  }

  if (manifest) {
    // ── Scene-level parallel pipeline ──
    const concurrency = DEEPSEEK_CONCURRENCY;
    console.log(
      `DeepSeek concurrency: ${concurrency} (set DEEPSEEK_CONCURRENCY env to change)`,
    );
    if (manifestGenerated) {
      console.log("");
    }

    const runDeepSeek = createLimiter(concurrency);
    const runImageDownload = createLimiter(IMAGE_DOWNLOAD_CONCURRENCY);

    let scenes = manifest.scenes;
    if (sceneIndex !== undefined) {
      scenes = scenes.filter((s) => s.sceneIndex === sceneIndex);
      if (scenes.length === 0) {
        console.error(
          `Scene ${sceneIndex} not found in manifest (${manifest.scenes.length} scene(s) available).`,
        );
        process.exit(1);
      }
      console.log(`Targeting scene ${sceneIndex} of ${manifest.scenes.length}\n`);
    }

    console.log(`\nRunning ${scenes.length} scene job(s)...\n`);

    const exemplars = loadExemplars();
    const results = await Promise.all(
      scenes.map((scene) =>
        runSceneJob(
          scene,
          slug,
          segment.title,
          effectiveSegment,
          { from, only, verbose: verbose && scenes.length === 1 },
          runDeepSeek,
          runImageDownload,
          runDir,
          exemplars,
        ),
      ),
    );

    // Regenerate scene-scripts.ts once
    writeSceneScriptsModule(SCENE_JSON_DIR);

    printBatchSummary(results, { ...manifest, scenes });

    const anyFailed = results.some((r) => r.status === "failed");
    if (anyFailed) {
      process.exitCode = 1;
    }
  } else {
    // ── Legacy single-composition pipeline ──
    console.log(
      "No scene manifest available. Running legacy single-composition pipeline.",
    );
    await runLegacyPipeline(
      slug,
      segment,
      effectiveSegment,
      { from, only, verbose },
      runDir,
    );
  }

  console.log("\nDone. Run `npx remotion studio` to view compositions.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
