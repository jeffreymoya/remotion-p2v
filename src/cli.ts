import fs from "node:fs";
import path from "node:path";
import { parseScript } from "./lib/parse-script";
import {
  writeSceneScriptsModule,
} from "./lib/write-scene-json";
import {
  SCENE_JSON_DIR,
  DEEPSEEK_CONCURRENCY,
  TTS_CONCURRENCY,
  BATCH_TIMEOUT_MS,
  CONCURRENCY_QUEUE_TIMEOUT_MS,
} from "./lib/config";
import { createLimiter } from "./lib/concurrency";
import { deriveSceneSlug } from "./lib/scene-manifest";
import { parseArgs, shouldRunPhase } from "./lib/cli-args";
import { runSceneJob, printBatchSummary } from "./lib/scene-job";
import { runNarrativePhase, loadEnhancedNarrative } from "./lib/narrative-phase";
import { loadOrGenerateManifest } from "./lib/scene-manifest-phase";
import { checkNetworkStability } from "./lib/network-check";
import type { SceneSpec } from "./lib/scene-manifest";

process.loadEnvFile();

const SCRIPT_PATH = "script.txt";

async function main(): Promise<void> {
  const { segmentIndex, from, only, verbose, sceneIndex, style } = parseArgs();

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

  const network = await checkNetworkStability();
  if (!network.stable) {
    console.error(network.error);
    process.exit(1);
  }

  const promptsDir = "prompts";
  if (!fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true });
  }
  const narrativePath = path.join(promptsDir, `${slug}-narrative.txt`);

  // ── Phase: narrative (segment-level) ──
  if (shouldRunPhase("narrative", from, only)) {
    await runNarrativePhase(segment, narrativePath, { verbose });
  }

  // Load enhanced narrative
  const effectiveSegment = loadEnhancedNarrative(
    segment,
    narrativePath,
    shouldRunPhase("tts", from, only) ||
      shouldRunPhase("images", from, only) ||
      shouldRunPhase("code", from, only),
  );

  // Determine if scene pipeline phases are needed
  const needsScenePipeline =
    shouldRunPhase("tts", from, only) ||
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

    const runDeepSeek = createLimiter(concurrency, CONCURRENCY_QUEUE_TIMEOUT_MS);
    const runTts = createLimiter(TTS_CONCURRENCY, CONCURRENCY_QUEUE_TIMEOUT_MS);

    let scenes: SceneSpec[] = manifest.scenes;
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

    const results = await withPipeDeadline(
      Promise.all(
        scenes.map((scene) =>
          runSceneJob(
            scene,
            slug,
            segment.title,
            effectiveSegment,
            { from, only, verbose: verbose && scenes.length === 1, style },
            runDeepSeek,
            runTts,
          ),
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

function withPipeDeadline<T>(promise: Promise<T>): Promise<T> {
  if (BATCH_TIMEOUT_MS <= 0) return promise;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Batch timed out after ${BATCH_TIMEOUT_MS}ms`)),
        BATCH_TIMEOUT_MS,
      ),
    ),
  ]);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
