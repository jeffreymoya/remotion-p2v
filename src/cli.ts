import fs from "node:fs";
import path from "node:path";
import { parseScript } from "./lib/parse-script";
import {
  writeSceneScriptsModule,
} from "./lib/write-scene-json";
import {
  DEEPSEEK_RESPONSES_DIR,
  SCENE_JSON_DIR,
  DEEPSEEK_CONCURRENCY,
  IMAGE_DOWNLOAD_CONCURRENCY,
  TTS_CONCURRENCY,
} from "./lib/config";
import { createLimiter } from "./lib/concurrency";
import { deriveSceneSlug } from "./lib/scene-manifest";
import { parseArgs, shouldRunPhase, makeRunId } from "./lib/cli-args";
import { loadExemplars } from "./lib/exemplars";
import { runSceneJob, printBatchSummary } from "./lib/scene-job";
import { runNarrativePhase, loadEnhancedNarrative } from "./lib/narrative-phase";
import { loadOrGenerateManifest } from "./lib/scene-manifest-phase";

process.loadEnvFile();

const SCRIPT_PATH = "script.txt";

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
  const slug = deriveSceneSlug(segment.title);

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

  // ── Phase: narrative (segment-level) ──
  if (shouldRunPhase("narrative", from, only)) {
    await runNarrativePhase(segment, narrativePath, runDir, { verbose });
  }

  // Load enhanced narrative
  const effectiveSegment = loadEnhancedNarrative(
    segment,
    narrativePath,
    shouldRunPhase("prompt", from, only),
  );

  // Determine if scene pipeline phases are needed
  const needsScenePipeline =
    shouldRunPhase("tts", from, only) ||
    shouldRunPhase("prompt", from, only) ||
    shouldRunPhase("images", from, only) ||
    shouldRunPhase("code", from, only);

  if (!needsScenePipeline) {
    console.log("Done. Run `npx remotion studio` to view the composition.");
    return;
  }

  // ── Try scene manifest ──
  const { manifest, manifestGenerated } = await loadOrGenerateManifest(
    slug,
    effectiveSegment,
    runDir,
    { from, only, verbose },
  );

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
    const runTts = createLimiter(TTS_CONCURRENCY);

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
          runTts,
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
  }

  console.log("\nDone. Run `npx remotion studio` to view compositions.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
