import fs from "node:fs";
import path from "node:path";
import { generateSpeech } from "./tts-elevenlabs";
import type { WordTiming } from "./tts-elevenlabs";
import {
  isArtifactReady,
  writeFileAtomically,
  padSceneIndex,
  type SceneSpec,
} from "./scene-manifest";
import { AUDIO_DIR } from "./config";

export interface TtsPhaseResult {
  updatedScene: SceneSpec;
  durationInFrames: number;
}

export async function runTtsPhase(
  scene: SceneSpec,
  segmentSlug: string,
  runDir: string,
  options: { verbose: boolean },
): Promise<TtsPhaseResult> {
  const paddedIdx = padSceneIndex(scene.sceneIndex);
  const audioDir = path.join(AUDIO_DIR, segmentSlug);
  const audioPath = path.join(audioDir, `scene-${paddedIdx}.mp3`);
  const timingsPath = path.join(
    "prompts",
    segmentSlug,
    `scene-${paddedIdx}-timings.json`,
  );

  // Cache check — reuse if both mp3 and timings exist
  if (isArtifactReady(audioPath) && isArtifactReady(timingsPath)) {
    const timingsRaw = fs.readFileSync(timingsPath, "utf-8");
    const timings = JSON.parse(timingsRaw) as {
      wordTimings: WordTiming[];
      durationSeconds: number;
    };

    console.log(
      `  [scene ${paddedIdx}] TTS cached: ${audioPath} (${timings.durationSeconds.toFixed(1)}s)`,
    );

    const durationInFrames = Math.ceil(timings.durationSeconds * 30);
    const relativeAudioPath = path.relative("public", audioPath);

    return {
      updatedScene: {
        ...scene,
        audioPath: relativeAudioPath,
        wordTimings: timings.wordTimings,
      },
      durationInFrames,
    };
  }

  // Derive TTS text
  const ttsText = scene.ttsText ?? scene.narrative;
  if (!ttsText || ttsText.trim().length === 0) {
    console.warn(`  [scene ${paddedIdx}] No TTS text available, skipping`);
    const fallbackDuration = Math.round(
      (scene.endSeconds - scene.startSeconds) * 30,
    );
    return { updatedScene: scene, durationInFrames: fallbackDuration };
  }

  console.log(
    `  [scene ${paddedIdx}] Generating TTS (${ttsText.length} chars)...`,
  );

  const result = await generateSpeech(ttsText);

  // Write mp3
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  fs.writeFileSync(audioPath, result.audioBuffer);

  // Write timings
  const timingsDir = path.dirname(timingsPath);
  if (!fs.existsSync(timingsDir)) {
    fs.mkdirSync(timingsDir, { recursive: true });
  }
  writeFileAtomically(
    timingsPath,
    JSON.stringify(
      {
        wordTimings: result.wordTimings,
        durationSeconds: result.durationSeconds,
      },
      null,
      2,
    ),
  );

  const durationInFrames = Math.ceil(result.durationSeconds * 30);
  const relativeAudioPath = path.relative("public", audioPath);

  console.log(
    `  [scene ${paddedIdx}] TTS saved: ${audioPath} (${result.durationSeconds.toFixed(1)}s, ${durationInFrames} frames, ${result.wordTimings.length} words)`,
  );

  return {
    updatedScene: {
      ...scene,
      audioPath: relativeAudioPath,
      wordTimings: result.wordTimings,
    },
    durationInFrames,
  };
}
