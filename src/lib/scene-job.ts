import fs from "node:fs";
import path from "node:path";
import { traceable } from "langsmith/traceable";
import type { Segment } from "./parse-script";
import { deepseekChat, DeepSeekError } from "./deepseek";
import { buildScenePrompt } from "./build-scene-prompt";
import {
  buildImageFetchPrompt,
  parseImageFetchResponse,
} from "./build-image-fetch-prompt";
import type { ImageFetchItem } from "./build-image-fetch-prompt";
import { refineImages } from "./refine-image";
import { buildSceneJsonPrompt } from "./build-scene-json-prompt";
import {
  writeSceneJson,
  SceneJsonValidationError,
} from "./write-scene-json";
import {
  sceneOutputDir,
  sceneFileName,
  compositionId,
  sceneImageDir,
  isArtifactReady,
  writeFileAtomically,
  type SceneManifest,
  type SceneSpec,
} from "./scene-manifest";
import { runTtsPhase } from "./tts-phase";
import {
  PROMPT_GEN_TEMPERATURE,
  CODE_GEN_TEMPERATURE,
  PROMPT_GEN_REASONING,
  CODE_GEN_REASONING,
  IMAGE_FETCH_TEMPERATURE,
  IMAGE_FETCH_REASONING,
} from "./config";
import { type Phase, shouldRunPhase } from "./cli-args";
import { makeDeepSeekRecorders } from "./deepseek-recorders";
import { loadCodeImageItems } from "./image-plan-utils";

export type SceneJobStatus = "success" | "failed" | "skipped";

export interface SceneJobResult {
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

async function runSceneJobImpl(
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
  runTts: <T>(task: () => Promise<T>) => Promise<T>,
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

    // Mutable scene reference — TTS phase may update with audio path + word timings
    let effectiveScene = scene;
    let resolvedDurationInFrames: number | undefined;

    // ── TTS phase ──
    if (shouldRunPhase("tts", from, only)) {
      if (!process.env.ELEVENLABS_API_KEY) {
        console.log(
          `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] TTS skipped (no ELEVENLABS_API_KEY)`,
        );
      } else {
        const ttsResult = await runTts(() =>
          runTtsPhase(scene, segmentSlug, runDir, {
            verbose: args.verbose,
          }),
        );
        effectiveScene = ttsResult.updatedScene;
        resolvedDurationInFrames = ttsResult.durationInFrames;
      }
    }

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
        const { items: refinedItems, results } = await refineImages(
          imageItems,
          imgDir,
          remotionPrompt,
          runImageDownload,
          { runDeepSeek, verbose: args.verbose },
        );
        for (const r of results) {
          const detail = r.ok
            ? ` (${r.url})`
            : ` (${r.error ?? "download failed"})`;
          console.log(
            `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] ${r.ok ? "OK" : "FAIL"}  ${r.label}${detail}`,
          );
        }
        imageItems = refinedItems;
        writeFileAtomically(
          sceneImagePlanPath,
          JSON.stringify(imageItems, null, 2),
        );
        const downloaded = results.filter((r) => r.ok).length;
        const failed = results.length - downloaded;
        console.log(
          `  [scene ${String(scene.sceneIndex).padStart(3, "0")}] Images: ${downloaded} downloaded, ${failed} failed`,
        );
      }
    }

    // ── Code phase ──
    if (shouldRunPhase("code", from, only)) {
      const codeImageItems = loadCodeImageItems(sceneImagePlanPath);
      const durationInFrames = resolvedDurationInFrames ?? Math.round(
        (scene.endSeconds - scene.startSeconds) * 30,
      );
      const compId = compositionId(segmentSlug, scene);

      const { system, user } = buildSceneJsonPrompt(
        remotionPrompt,
        codeImageItems,
        compId,
        durationInFrames,
        effectiveScene.wordTimings,
        effectiveScene.audioPath,
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
      // TODO: verify outPath === sceneJsonPath and remove duplicate push
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

export const runSceneJob = traceable(runSceneJobImpl, {
  name: "scene-job",
  run_type: "chain",
});

export function printBatchSummary(
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
