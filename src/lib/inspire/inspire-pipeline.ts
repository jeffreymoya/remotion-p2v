import { traceable } from "langsmith/traceable";
import fs from "node:fs";
import path from "node:path";
import { generateNarration } from "./narration-prompt";
import { generateSpeech } from "../tts-google";
import type { WordTiming } from "../tts-google";
import { segmentSentences } from "./sentence-segmenter";
import type { SentenceTiming } from "./sentence-segmenter";
import { generateClipPlan, ClipPlanSchema } from "./video-query-prompt";
import type { ClipPlan } from "./video-query-prompt";
import { searchAndDownloadVideo } from "./pixabay-video-client";
import { searchAndDownloadVideoFromPexels } from "./pexels-video-client";
import type { VideoDownloadResult } from "./video-source";
import {
  loadRegistry, saveRegistry, getCooldownIds, getLruSortedIds,
  registerVideo, recordSlug,
} from "./video-registry";
import { PIXABAY_COOLDOWN_RUNS } from "../config";
import { writeInspireJson } from "./write-inspire-script";
import type { InspirationScript, Clip, Sentence } from "./inspire-schema";
import { generateArtDirection } from "./art-direction-prompt";
import { ArtDirectionSchema } from "./art-direction-schema";
import type { ArtDirection } from "./art-direction-schema";

export type InspirePhase = "research" | "plan" | "narration" | "tts" | "videos" | "artdirect" | "compose";
const ALL_PHASES: InspirePhase[] = [
  "research",
  "plan",
  "narration",
  "tts",
  "videos",
  "artdirect",
  "compose",
];

interface PipelineOptions {
  topic: string;
  slug: string;
  from?: InspirePhase;
  verbose: boolean;
  registryOptions?: { skipRecordSlug?: boolean };
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

function artDirectPath(slug: string): string {
  return `prompts/inspire/${slug}-artdirection.json`;
}

function clipVideoPath(slug: string, index: number): string {
  return path.join(videoDir(slug), `clip-${index}.mp4`);
}

// ── Phase 1: Narration ──────────────────────────────────────────────────
function sanitizeNarration(raw: string): string {
  // 1. The LLM sometimes emits the literal 4-char sequence `\n\n` instead
  //    of real newlines; convert so TTS doesn't speak it and the segmenter
  //    doesn't tokenize it as extra words.
  // 2. Normalize curly punctuation to ASCII so the sentence segmenter's
  //    `[^a-z0-9\s'-]` token regex doesn't split contractions like "it's".
  return raw
    .replace(/\\n\\n/g, "\n\n")
    .replace(/\\n/g, "\n")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

async function runNarrationPhase(
  topic: string,
  slug: string,
  verbose: boolean,
): Promise<string> {
  const cached = narrationPath(slug);
  if (fs.existsSync(cached)) {
    console.log(`  [narration] cached: ${cached}`);
    return sanitizeNarration(fs.readFileSync(cached, "utf-8"));
  }

  console.log(`  [narration] Generating narration for "${topic}"...`);
  const narration = sanitizeNarration(await generateNarration(topic, { verbose }));

  fs.mkdirSync(path.dirname(cached), { recursive: true });
  fs.writeFileSync(cached, narration, "utf-8");
  console.log(`  [narration] saved: ${cached} (${narration.length} chars)`);

  invalidateClipPlanCache(slug);
  invalidateTtsCache(slug);

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
  registryOptions?: { skipRecordSlug?: boolean },
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
    const parseResult = ClipPlanSchema.safeParse(
      JSON.parse(fs.readFileSync(planPath, "utf-8")),
    );
    if (parseResult.success) {
      console.log(`  [videos] clip plan cached: ${planPath}`);
      clipPlan = parseResult.data;
    } else {
      console.warn(`  [videos] clip plan cache invalid (schema mismatch), regenerating...`);
      clipPlan = await generateClipPlan(narration, sentenceTimings, { verbose });
      fs.writeFileSync(planPath, JSON.stringify(clipPlan, null, 2));
      console.log(
        `  [videos] clip plan: ${clipPlan.strategy}, ${clipPlan.clips.length} clip(s)`,
      );
    }
  } else {
    console.log("  [videos] Generating clip plan...");
    clipPlan = await generateClipPlan(narration, sentenceTimings, { verbose });

    fs.mkdirSync(path.dirname(planPath), { recursive: true });
    fs.writeFileSync(planPath, JSON.stringify(clipPlan, null, 2));
    console.log(
      `  [videos] clip plan: ${clipPlan.strategy}, ${clipPlan.clips.length} clip(s)`,
    );
  }

  // Step 3c: Download videos with registry-based deduplication
  // Load existing script for videoId recovery on cache hits
  let existingScript: InspirationScript | null = null;
  const existingScriptPath = `prompts/inspire/${slug}.json`;
  if (fs.existsSync(existingScriptPath)) {
    try { existingScript = JSON.parse(fs.readFileSync(existingScriptPath, "utf-8")); } catch { /* ignore */ }
  }

  const registry = loadRegistry();
  const pixabayCooldownIds = getCooldownIds(registry, "pixabay", PIXABAY_COOLDOWN_RUNS);
  const pexelsCooldownIds = getCooldownIds(registry, "pexels", PIXABAY_COOLDOWN_RUNS);
  const pixabayLruIds = getLruSortedIds(registry, "pixabay");
  const pexelsLruIds = getLruSortedIds(registry, "pexels");
  const pixabayExcludeIds = new Set<number>();
  const pexelsExcludeIds = new Set<number>();

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

      const existingClip = existingScript?.clips[i];
      let cachedVideoId: number | undefined;
      let cachedSource: "pixabay" | "pexels" | undefined = existingClip?.videoSource;

      if (existingClip?.videoId) {
        cachedVideoId = existingClip.videoId;
      } else if (existingClip?.sourceUrl) {
        const m = existingClip.sourceUrl.match(/\/id-(\d+)\//);
        if (m) { cachedVideoId = Number(m[1]); cachedSource = cachedSource ?? "pixabay"; }
      }

      if (cachedVideoId !== undefined && cachedSource) {
        (cachedSource === "pixabay" ? pixabayExcludeIds : pexelsExcludeIds).add(cachedVideoId);
      }

      clips.push({
        clipIndex: i,
        query: planClip.queries[0],
        videoPath: path.relative("public", destPath),
        sourceUrl: existingClip?.sourceUrl ?? "",
        loop: existingClip?.loop ?? false,
        startFrame: clipStartFrame,
        endFrame: clipEndFrame,
        videoId: cachedVideoId,
        videoSource: cachedSource,
      });
      continue;
    }

    // Multi-query download: try each query in order, break on fresh tier
    const FRESH_TIERS = new Set(["fresh", "fresh-loop"]);
    let chosenResult: VideoDownloadResult | null = null;
    let chosenSource: "pixabay" | "pexels" = "pixabay";
    let usedQuery = planClip.queries[0];

    for (const query of planClip.queries) {
      usedQuery = query;
      console.log(`  [videos] Downloading clip ${i}: "${query}"...`);

      const pixabayResult = await searchAndDownloadVideo(
        query, destPath, clipSpanSeconds,
        { excludeIds: pixabayExcludeIds, cooldownIds: pixabayCooldownIds, lruSortedIds: pixabayLruIds },
      );

      if (pixabayResult.ok && FRESH_TIERS.has(pixabayResult.tier ?? "last-resort")) {
        chosenResult = pixabayResult;
        chosenSource = "pixabay";
        break;
      }

      const pexelsTmpPath = destPath.replace(/\.mp4$/, "-pexels.mp4");
      const pexelsResult = await searchAndDownloadVideoFromPexels(
        query, pexelsTmpPath, clipSpanSeconds,
        { excludeIds: pexelsExcludeIds, cooldownIds: pexelsCooldownIds, lruSortedIds: pexelsLruIds },
      );

      if (pexelsResult.ok && FRESH_TIERS.has(pexelsResult.tier ?? "last-resort")) {
        // Pexels fresh — remove partial pixabay file, rename pexels → dest
        if (pixabayResult.ok && pixabayResult.path && fs.existsSync(pixabayResult.path)) {
          fs.unlinkSync(pixabayResult.path);
        }
        fs.renameSync(pexelsTmpPath, destPath);
        chosenResult = { ...pexelsResult, path: destPath };
        chosenSource = "pexels";
        break;
      }

      // Neither source fresh for this query — track best candidate so far
      if (!chosenResult) {
        // Keep pixabay result as fallback candidate if it succeeded
        if (pixabayResult.ok) {
          chosenResult = pixabayResult;
          chosenSource = "pixabay";
        } else if (pexelsResult.ok) {
          fs.renameSync(pexelsTmpPath, destPath);
          chosenResult = { ...pexelsResult, path: destPath };
          chosenSource = "pexels";
        }
      }

      // Clean up pexels tmp if not used
      if (fs.existsSync(pexelsTmpPath)) fs.unlinkSync(pexelsTmpPath);
    }

    if (!chosenResult || !chosenResult.ok) {
      throw new Error(
        `Failed to download video clip ${i} ("${usedQuery}"): ${chosenResult?.error ?? "no results"}`,
      );
    }

    // Update registry
    if (chosenResult.videoId !== undefined) {
      const excludeSet = chosenSource === "pixabay" ? pixabayExcludeIds : pexelsExcludeIds;
      excludeSet.add(chosenResult.videoId);
      registerVideo(registry, chosenSource, chosenResult.videoId, {
        pageURL: chosenResult.sourceUrl ?? "",
        duration: clipSpanSeconds,
        slug,
        clipIndex: i,
        query: usedQuery,
      });
    }

    clips.push({
      clipIndex: i,
      query: usedQuery,
      videoPath: path.relative("public", destPath),
      sourceUrl: chosenResult.sourceUrl ?? "",
      loop: chosenResult.loop,
      startFrame: clipStartFrame,
      endFrame: clipEndFrame,
      videoId: chosenResult.videoId,
      videoSource: chosenSource,
    });

    console.log(
      `  [videos] clip ${i} (${chosenSource}) saved: ${destPath}${chosenResult.loop ? " (will loop)" : ""} [tier: ${chosenResult.tier}]`,
    );
  }

  // Save registry
  if (!registryOptions?.skipRecordSlug) {
    recordSlug(registry, slug);
  }
  saveRegistry(registry);

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

// ── Phase 4: Art Direction ──────────────────────────────────────────────
interface ArtDirectPhaseInput {
  narration: string;
  slug: string;
  clipPlan: ClipPlan;
  sentences: Sentence[];
  verbose: boolean;
}

async function runArtDirectPhase(
  input: ArtDirectPhaseInput,
): Promise<ArtDirection> {
  const cachePath = artDirectPath(input.slug);

  if (fs.existsSync(cachePath)) {
    try {
      const parsed = ArtDirectionSchema.parse(
        JSON.parse(fs.readFileSync(cachePath, "utf-8")),
      );
      console.log(`  [artdirect] cached: ${cachePath}`);
      return parsed;
    } catch (err) {
      console.warn(
        `  [artdirect] cache corrupt at ${cachePath} (${err instanceof Error ? err.message : String(err)}); regenerating`,
      );
    }
  }

  console.log(`  [artdirect] Generating art direction...`);
  const ad = await generateArtDirection(
    {
      narration: input.narration,
      sentences: input.sentences.map((s) => ({
        sentenceIndex: s.sentenceIndex,
        text: s.text,
        tokenWordIndexes: s.tokenWordIndexes,
      })),
      clipPlan: input.clipPlan,
    },
    { verbose: input.verbose },
  );

  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(ad, null, 2));
  console.log(`  [artdirect] saved: ${cachePath}`);
  return ad;
}

function invalidateClipPlanCache(slug: string): void {
  const cachePath = clipPlanPath(slug);
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
    console.log(`  [videos] clip plan invalidated (narration changed): ${cachePath}`);
  }
}

function invalidateTtsCache(slug: string): void {
  for (const p of [audioPath(slug), timingsPath(slug)]) {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`  [tts] invalidated (narration changed): ${p}`);
    }
  }
}

function invalidateArtDirectCache(slug: string): void {
  const cachePath = artDirectPath(slug);
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
    console.log(`  [artdirect] invalidated: ${cachePath}`);
  }
}

// ── Phase 5: Compose ────────────────────────────────────────────────────
function runComposePhase(
  slug: string,
  topic: string,
  narration: string,
  wordTimings: WordTiming[],
  durationSeconds: number,
  clips: Clip[],
  sentences: Sentence[],
  strategy: "single" | "multi",
  artDirection: ArtDirection,
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
    artDirection,
  };

  const { path: jsonPath } = writeInspireJson(script);
  console.log(`  [compose] saved: ${jsonPath}`);
  console.log(`  [compose] regenerated: src/generated/inspire-scripts.ts`);

  return script;
}

export const runInspirePipeline = traceable(runInspirePipelineImpl, {
  name: "runInspirePipeline",
  run_type: "chain",
});

// ── Main pipeline ───────────────────────────────────────────────────────
async function runInspirePipelineImpl(
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
      narration = sanitizeNarration(fs.readFileSync(cached, "utf-8"));
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
    invalidateArtDirectCache(slug);
    const videoResult = await runVideoPhase(
      narration,
      slug,
      wordTimings,
      durationSeconds,
      verbose,
      options.registryOptions,
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
      invalidateArtDirectCache(slug);
      const videoResult = await runVideoPhase(
        narration,
        slug,
        wordTimings,
        durationSeconds,
        verbose,
        options.registryOptions,
      );
      clips = videoResult.clips;
      sentences = videoResult.sentences;
      strategy = videoResult.clipPlan.strategy;
    }
  }

  // Phase 4: Art Direction
  const reconstructedClipPlan: ClipPlan = {
    strategy,
    clips: clips.map((c) => ({
      queries: [c.query],
      sentenceIndexes: sentences
        .filter((s) => s.clipIndex === c.clipIndex)
        .map((s) => s.sentenceIndex),
    })),
  };

  const artDirection = await runArtDirectPhase({
    narration,
    slug,
    clipPlan: reconstructedClipPlan,
    sentences,
    verbose,
  });

  // Phase 5: Compose
  const script = runComposePhase(
    slug,
    topic,
    narration,
    wordTimings,
    durationSeconds,
    clips,
    sentences,
    strategy,
    artDirection,
  );

  console.log(`\n━━ Done. Composition ID: ${slug} ━━\n`);
  return script;
}
