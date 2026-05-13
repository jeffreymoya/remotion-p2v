import fs from "node:fs";
import path from "node:path";
import { generateNarration } from "./narration-prompt";
import { generateSpeech } from "../tts-google";
import type { WordTiming } from "../tts-google";
import { segmentSentences } from "./sentence-segmenter";
import type { SentenceTiming } from "./sentence-segmenter";
import { generateClipPlan } from "./video-query-prompt";
import type { ClipPlan } from "./video-query-prompt";
import { searchAndDownloadVideo } from "./pixabay-video-client";
import { writeInspireJson } from "./write-inspire-script";
import type { InspirationScript, Clip, Sentence } from "./inspire-schema";

export type InspirePhase = "narration" | "tts" | "videos" | "compose";
const ALL_PHASES: InspirePhase[] = ["narration", "tts", "videos", "compose"];

interface PipelineOptions {
  topic: string;
  slug: string;
  from?: InspirePhase;
  verbose: boolean;
}

function phaseIndex(phase: InspirePhase): number {
  return ALL_PHASES.indexOf(phase);
}

function shouldRun(phase: InspirePhase, from: InspirePhase): boolean {
  return phaseIndex(phase) >= phaseIndex(from);
}

// ── Path helpers ────────────────────────────────────────────────────────
function narrationPath(slug: string): string {
  return `prompts/inspire/${slug}-narration.txt`;
}

function audioPath(slug: string): string {
  return `public/audio/inspire/${slug}.wav`;
}

function timingsPath(slug: string): string {
  return `prompts/inspire/${slug}-timings.json`;
}

function clipPlanPath(slug: string): string {
  return `prompts/inspire/${slug}-clip-plan.json`;
}

function videoDir(slug: string): string {
  return `public/videos/inspire/${slug}`;
}

function clipVideoPath(slug: string, index: number): string {
  return path.join(videoDir(slug), `clip-${index}.mp4`);
}

// ── Phase 1: Narration ──────────────────────────────────────────────────
async function runNarrationPhase(
  topic: string,
  slug: string,
  verbose: boolean,
): Promise<string> {
  const cached = narrationPath(slug);
  if (fs.existsSync(cached)) {
    console.log(`  [narration] cached: ${cached}`);
    return fs.readFileSync(cached, "utf-8");
  }

  console.log(`  [narration] Generating narration for "${topic}"...`);
  const narration = await generateNarration(topic, { verbose });

  fs.mkdirSync(path.dirname(cached), { recursive: true });
  fs.writeFileSync(cached, narration, "utf-8");
  console.log(`  [narration] saved: ${cached} (${narration.length} chars)`);

  return narration;
}

// ── Phase 2: TTS ────────────────────────────────────────────────────────
interface TtsPhaseResult {
  wordTimings: WordTiming[];
  durationSeconds: number;
}

async function runTtsPhase(
  narration: string,
  slug: string,
  verbose: boolean,
): Promise<TtsPhaseResult> {
  const wavPath = audioPath(slug);
  const timPath = timingsPath(slug);

  if (fs.existsSync(wavPath) && fs.existsSync(timPath)) {
    console.log(`  [tts] cached: ${wavPath}`);
    const data = JSON.parse(fs.readFileSync(timPath, "utf-8")) as TtsPhaseResult;
    return data;
  }

  console.log(`  [tts] Generating speech (${narration.length} chars)...`);
  const result = await generateSpeech(narration);

  fs.mkdirSync(path.dirname(wavPath), { recursive: true });
  fs.writeFileSync(wavPath, result.audioBuffer);

  fs.mkdirSync(path.dirname(timPath), { recursive: true });
  fs.writeFileSync(
    timPath,
    JSON.stringify(
      { wordTimings: result.wordTimings, durationSeconds: result.durationSeconds },
      null,
      2,
    ),
  );

  console.log(
    `  [tts] saved: ${wavPath} (${result.durationSeconds.toFixed(1)}s, ${result.wordTimings.length} words)`,
  );

  return {
    wordTimings: result.wordTimings,
    durationSeconds: result.durationSeconds,
  };
}

// ── Phase 3: Videos ─────────────────────────────────────────────────────
interface VideoPhaseResult {
  clipPlan: ClipPlan;
  clips: Clip[];
  sentences: Sentence[];
}

async function runVideoPhase(
  narration: string,
  slug: string,
  wordTimings: WordTiming[],
  durationSeconds: number,
  verbose: boolean,
): Promise<VideoPhaseResult> {
  // Step 3a: Sentence segmentation
  console.log("  [videos] Segmenting sentences...");
  const { sentences: sentenceTimings, warnings } = segmentSentences(
    narration,
    wordTimings,
    durationSeconds,
  );

  for (const w of warnings) {
    console.warn(`  [videos] ⚠ ${w}`);
  }

  console.log(`  [videos] ${sentenceTimings.length} sentences segmented`);

  // Step 3b: LLM clip plan
  let clipPlan: ClipPlan;
  const planPath = clipPlanPath(slug);

  if (fs.existsSync(planPath)) {
    console.log(`  [videos] clip plan cached: ${planPath}`);
    clipPlan = JSON.parse(fs.readFileSync(planPath, "utf-8")) as ClipPlan;
  } else {
    console.log("  [videos] Generating clip plan...");
    clipPlan = await generateClipPlan(narration, sentenceTimings, { verbose });

    fs.mkdirSync(path.dirname(planPath), { recursive: true });
    fs.writeFileSync(planPath, JSON.stringify(clipPlan, null, 2));
    console.log(
      `  [videos] clip plan: ${clipPlan.strategy}, ${clipPlan.clips.length} clip(s)`,
    );
  }

  // Step 3c: Download videos
  const clips: Clip[] = [];

  for (let i = 0; i < clipPlan.clips.length; i++) {
    const planClip = clipPlan.clips[i];
    const destPath = clipVideoPath(slug, i);

    // Compute clip span from sentence timings
    const clipSentences = sentenceTimings.filter((s) =>
      planClip.sentenceIndexes.includes(s.sentenceIndex),
    );
    const clipStartFrame = Math.min(...clipSentences.map((s) => s.startFrame));
    const clipEndFrame = Math.max(...clipSentences.map((s) => s.endFrame));
    const clipSpanSeconds = clipSentences.reduce(
      (sum, s) => sum + (s.endSeconds - s.startSeconds),
      0,
    ) + 1; // +1s tail

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      console.log(`  [videos] clip ${i} cached: ${destPath}`);
      clips.push({
        clipIndex: i,
        query: planClip.query,
        videoPath: path.relative("public", destPath),
        sourceUrl: "",
        loop: false,
        startFrame: clipStartFrame,
        endFrame: clipEndFrame,
      });
      continue;
    }

    console.log(`  [videos] Downloading clip ${i}: "${planClip.query}"...`);
    const result = await searchAndDownloadVideo(
      planClip.query,
      destPath,
      clipSpanSeconds,
    );

    if (!result.ok) {
      throw new Error(
        `Failed to download video clip ${i} ("${planClip.query}"): ${result.error}`,
      );
    }

    clips.push({
      clipIndex: i,
      query: planClip.query,
      videoPath: path.relative("public", destPath),
      sourceUrl: result.sourceUrl ?? "",
      loop: result.loop,
      startFrame: clipStartFrame,
      endFrame: clipEndFrame,
    });

    console.log(
      `  [videos] clip ${i} saved: ${destPath}${result.loop ? " (will loop)" : ""}`,
    );
  }

  // Map sentences to clips
  const sentences: Sentence[] = sentenceTimings.map((st) => {
    const matchingClipIdx = clipPlan.clips.findIndex((c) =>
      c.sentenceIndexes.includes(st.sentenceIndex),
    );
    return {
      sentenceIndex: st.sentenceIndex,
      text: st.text,
      startSeconds: st.startSeconds,
      endSeconds: st.endSeconds,
      startFrame: st.startFrame,
      endFrame: st.endFrame,
      clipIndex: matchingClipIdx >= 0 ? matchingClipIdx : 0,
      tokenWordIndexes: st.tokenWordIndexes,
    };
  });

  return { clipPlan, clips, sentences };
}

// ── Phase 4: Compose ────────────────────────────────────────────────────
function runComposePhase(
  slug: string,
  topic: string,
  narration: string,
  wordTimings: WordTiming[],
  durationSeconds: number,
  clips: Clip[],
  sentences: Sentence[],
  strategy: "single" | "multi",
): InspirationScript {
  const durationInFrames = Math.ceil(durationSeconds * 30);

  // Ensure last clip endFrame matches total duration
  if (clips.length > 0) {
    const lastClip = clips[clips.length - 1];
    clips = clips.map((c, i) =>
      i === clips.length - 1
        ? { ...c, endFrame: durationInFrames }
        : c,
    );
  }

  const script: InspirationScript = {
    schemaVersion: 1,
    slug,
    topic,
    narration,
    audioPath: `audio/inspire/${slug}.wav`,
    wordTimings,
    sentences,
    clips,
    strategy,
    durationInFrames,
    fps: 30,
    width: 1920,
    height: 1080,
  };

  const { path: jsonPath } = writeInspireJson(script);
  console.log(`  [compose] saved: ${jsonPath}`);
  console.log(`  [compose] regenerated: src/generated/inspire-scripts.ts`);

  return script;
}

// ── Main pipeline ───────────────────────────────────────────────────────
export async function runInspirePipeline(
  options: PipelineOptions,
): Promise<InspirationScript> {
  const { topic, slug, verbose } = options;
  const from = options.from ?? "narration";

  console.log(`\n━━ Inspire Pipeline: "${topic}" (slug: ${slug}) ━━`);
  console.log(`  Starting from phase: ${from}\n`);

  // Phase 1: Narration
  let narration: string;
  if (shouldRun("narration", from)) {
    narration = await runNarrationPhase(topic, slug, verbose);
  } else {
    const cached = narrationPath(slug);
    if (fs.existsSync(cached)) {
      narration = fs.readFileSync(cached, "utf-8");
      console.log(`  [narration] loaded: ${cached}`);
    } else {
      console.log(`  [narration] cache missing, generating...`);
      narration = await runNarrationPhase(topic, slug, verbose);
    }
  }

  // Phase 2: TTS
  let wordTimings: WordTiming[];
  let durationSeconds: number;
  if (shouldRun("tts", from)) {
    const ttsResult = await runTtsPhase(narration, slug, verbose);
    wordTimings = ttsResult.wordTimings;
    durationSeconds = ttsResult.durationSeconds;
  } else {
    const timPath = timingsPath(slug);
    if (fs.existsSync(timPath)) {
      const data = JSON.parse(fs.readFileSync(timPath, "utf-8")) as {
        wordTimings: WordTiming[];
        durationSeconds: number;
      };
      wordTimings = data.wordTimings;
      durationSeconds = data.durationSeconds;
      console.log(`  [tts] loaded: ${timPath}`);
    } else {
      console.log(`  [tts] cache missing, generating...`);
      const ttsResult = await runTtsPhase(narration, slug, verbose);
      wordTimings = ttsResult.wordTimings;
      durationSeconds = ttsResult.durationSeconds;
    }
  }

  // Phase 3: Videos
  let clips: Clip[];
  let sentences: Sentence[];
  let strategy: "single" | "multi";
  if (shouldRun("videos", from)) {
    const videoResult = await runVideoPhase(
      narration,
      slug,
      wordTimings,
      durationSeconds,
      verbose,
    );
    clips = videoResult.clips;
    sentences = videoResult.sentences;
    strategy = videoResult.clipPlan.strategy;
  } else {
    const jsonPath = `prompts/inspire/${slug}.json`;
    if (fs.existsSync(jsonPath)) {
      const existing = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as InspirationScript;
      clips = existing.clips;
      sentences = existing.sentences;
      strategy = existing.strategy;
      console.log(`  [videos] loaded from: ${jsonPath}`);
    } else {
      console.log(`  [videos] cache missing, generating...`);
      const videoResult = await runVideoPhase(
        narration,
        slug,
        wordTimings,
        durationSeconds,
        verbose,
      );
      clips = videoResult.clips;
      sentences = videoResult.sentences;
      strategy = videoResult.clipPlan.strategy;
    }
  }

  // Phase 4: Compose
  const script = runComposePhase(
    slug,
    topic,
    narration,
    wordTimings,
    durationSeconds,
    clips,
    sentences,
    strategy,
  );

  console.log(`\n━━ Done. Composition ID: ${slug} ━━\n`);
  return script;
}
