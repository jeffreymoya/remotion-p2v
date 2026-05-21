import { traceable } from "langsmith/traceable";
import fs from "node:fs";
import path from "node:path";
import { generateNarration } from "./narration-prompt";
import { generateSpeech as generateSpeechGoogle } from "../tts-google";
import { generateSpeech as generateSpeechElevenLabs } from "../tts-elevenlabs";
import type { WordTiming } from "../audio-wav";
import { TTS_PROVIDER } from "../config";
import { segmentSentences } from "./sentence-segmenter";
import type { SentenceTiming } from "./sentence-segmenter";
import { generateClipPlan, ClipPlanSchema } from "./video-query-prompt";
import type { ClipPlan } from "./video-query-prompt";
import { searchAndDownloadVideo } from "./pixabay-video-client";
import { searchAndDownloadVideoFromPexels } from "./pexels-video-client";
import type { VideoDownloadResult } from "./video-source";
import { searchAndDownloadImage } from "./pexels-image-client";
import {
  loadRegistry, saveRegistry, getCooldownIds, getLruSortedIds,
  registerVideo, recordSlug,
} from "./video-registry";
import { PIXABAY_COOLDOWN_RUNS, SHOT_MIN_SECONDS, SHOT_TARGET_SECONDS } from "../config";
import { writeInspireJson } from "./write-inspire-script";
import type { InspirationScript, Clip, Sentence, Shot } from "./inspire-schema";
import { generateArtDirection } from "./art-direction-prompt";
import { ArtDirectionSchema } from "./art-direction-schema";
import type { ArtDirection } from "./art-direction-schema";
import { enrichCurrentRun } from "../tracing";

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

function imageDir(slug: string): string {
  return `public/images/inspire/${slug}`;
}

function artDirectPath(slug: string): string {
  return `prompts/inspire/${slug}-artdirection.json`;
}

function clipVideoPath(slug: string, index: number): string {
  return path.join(videoDir(slug), `clip-${index}.mp4`);
}

function clipImagePath(slug: string, index: number): string {
  return path.join(imageDir(slug), `clip-${index}.jpg`);
}

function shotVideoPath(slug: string, clipIndex: number, shotIndex: number): string {
  return path.join(videoDir(slug), `clip-${clipIndex}-shot-${shotIndex}.mp4`);
}

function shotImagePath(slug: string, clipIndex: number, shotIndex: number): string {
  return path.join(imageDir(slug), `clip-${clipIndex}-shot-${shotIndex}.jpg`);
}

// ── Shot timing computation ─────────────────────────────────────────────
function computeShotFrames(
  totalStartFrame: number,
  totalEndFrame: number,
  shotCount: number,
): Array<{ startFrame: number; endFrame: number }> {
  const totalFrames = totalEndFrame - totalStartFrame;
  const shotSize = Math.floor(totalFrames / shotCount);
  return Array.from({ length: shotCount }, (_, i) => ({
    startFrame: totalStartFrame + i * shotSize,
    endFrame: i === shotCount - 1 ? totalEndFrame : totalStartFrame + (i + 1) * shotSize,
  }));
}

function sweepOrphanClipFiles(slug: string): void {
  const vDir = videoDir(slug);
  const iDir = imageDir(slug);
  for (const dir of [vDir, iDir]) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      // Match old clip-X.mp4 / clip-X.jpg (no "-shot-" in name)
      if (/^clip-\d+\.(mp4|jpg)$/.test(entry)) {
        const p = path.join(dir, entry);
        fs.unlinkSync(p);
        console.log(`  [videos] orphan swept: ${p}`);
      }
    }
  }
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

async function runNarrationPhaseImpl(
  topic: string,
  slug: string,
  verbose: boolean,
): Promise<string> {
  enrichCurrentRun({ slug, topic, phase: "narration" });
  const cached = narrationPath(slug);
  if (fs.existsSync(cached)) {
    enrichCurrentRun({ cacheHit: true });
    console.log(`  [narration] cached: ${cached}`);
    return sanitizeNarration(fs.readFileSync(cached, "utf-8"));
  }

  enrichCurrentRun({ cacheHit: false });
  console.log(`  [narration] Generating narration for "${topic}"...`);
  const narration = sanitizeNarration(await generateNarration(topic, { verbose }));

  fs.mkdirSync(path.dirname(cached), { recursive: true });
  fs.writeFileSync(cached, narration, "utf-8");
  console.log(`  [narration] saved: ${cached} (${narration.length} chars)`);

  invalidateClipPlanCache(slug);
  invalidateTtsCache(slug);

  return narration;
}

const runNarrationPhase = traceable(runNarrationPhaseImpl, {
  name: "runNarrationPhase",
  run_type: "chain",
}) as typeof runNarrationPhaseImpl;

// ── Phase 2: TTS ──────────────────────────────────────────────────────
interface TtsPhaseResult {
  wordTimings: WordTiming[];
  durationSeconds: number;
  provider?: string;
}

async function runTtsPhaseImpl(
  narration: string,
  slug: string,
  verbose: boolean,
): Promise<TtsPhaseResult> {  enrichCurrentRun({ slug, phase: "tts", provider: TTS_PROVIDER === "elevenlabs" ? "elevenlabs" : "google-tts" });  const wavPath = audioPath(slug);
  const timPath = timingsPath(slug);

  if (fs.existsSync(wavPath) && fs.existsSync(timPath)) {
    const data = JSON.parse(fs.readFileSync(timPath, "utf-8")) as TtsPhaseResult;
    if (data.provider && data.provider !== TTS_PROVIDER) {
      console.log(
        `  [tts] provider mismatch (cached=${data.provider}, current=${TTS_PROVIDER}) — invalidating`,
      );
      fs.unlinkSync(wavPath);
      fs.unlinkSync(timPath);
    } else {
      enrichCurrentRun({ cacheHit: true });
      console.log(`  [tts] cached: ${wavPath}`);
      return data;
    }
  }

  enrichCurrentRun({ cacheHit: false });
  console.log(`  [tts] Generating speech via ${TTS_PROVIDER} (${narration.length} chars)...`);
  const result =
    TTS_PROVIDER === "elevenlabs"
      ? await generateSpeechElevenLabs(narration)
      : await generateSpeechGoogle(narration);

  fs.mkdirSync(path.dirname(wavPath), { recursive: true });
  fs.writeFileSync(wavPath, result.audioBuffer);

  const timingsData: TtsPhaseResult = {
    wordTimings: result.wordTimings,
    durationSeconds: result.durationSeconds,
    provider: TTS_PROVIDER,
  };

  fs.mkdirSync(path.dirname(timPath), { recursive: true });
  fs.writeFileSync(timPath, JSON.stringify(timingsData, null, 2));

  console.log(
    `  [tts] saved: ${wavPath} (${result.durationSeconds.toFixed(1)}s, ${result.wordTimings.length} words)`,
  );

  return timingsData;
}

const runTtsPhase = traceable(runTtsPhaseImpl, {
  name: "runTtsPhase",
  run_type: "tool",
}) as typeof runTtsPhaseImpl;

// ── Phase 3: Videos ─────────────────────────────────────────────────
interface VideoPhaseResult {
  clipPlan: ClipPlan;
  clips: Clip[];
  sentences: Sentence[];
}

async function runVideoPhaseImpl(
  narration: string,
  slug: string,
  wordTimings: WordTiming[],
  durationSeconds: number,
  verbose: boolean,
  registryOptions?: { skipRecordSlug?: boolean },
): Promise<VideoPhaseResult> {
  enrichCurrentRun({ slug, phase: "videos" });
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

  // Step 3c: Sweep orphans from old clip-based naming
  sweepOrphanClipFiles(slug);

  // Step 3d: Per-clip shot planning + download
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

  const clips: Clip[] = [];

  for (let ci = 0; ci < clipPlan.clips.length; ci++) {
    const planClip = clipPlan.clips[ci];

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
    const fps = 30;

    // Compute target shot count and clamp
    const targetShotCount = Math.max(
      1,
      Math.ceil(clipSpanSeconds / SHOT_TARGET_SECONDS),
    );
    const actualShotCount = Math.min(
      targetShotCount,
      Math.floor(
        (clipEndFrame - clipStartFrame) / (SHOT_MIN_SECONDS * fps),
      ),
    );
    const shotCount = Math.max(1, actualShotCount);

    // Compute per-shot frame ranges
    const shotTimings = computeShotFrames(clipStartFrame, clipEndFrame, shotCount);

    // Per-clip excludeIds
    const pixabayExcludeIds = new Set<number>();
    const pexelsExcludeIds = new Set<number>();

    const expandedShots: Shot[] = [];

    for (let si = 0; si < planClip.shots.length; si++) {
      const planShot = planClip.shots[si];
      const shotFrames = shotTimings[si % shotTimings.length];
      const shotSpanSeconds = (shotFrames.endFrame - shotFrames.startFrame) / fps + 0.5;
      const mediaType = planShot.mediaType ?? "video";

      if (mediaType === "image") {
        const imgDest = shotImagePath(slug, ci, si);

        if (fs.existsSync(imgDest) && fs.statSync(imgDest).size > 0) {
          console.log(`  [images] clip ${ci} shot ${si} cached: ${imgDest}`);
          const existingClip = existingScript?.clips[ci];
          const existingShot = existingClip?.shots?.[si];
          expandedShots.push({
            shotIndex: si,
            query: planShot.query,
            imagePath: path.relative("public", imgDest),
            mediaType: "image",
            sourceUrl: existingShot?.sourceUrl ?? "",
            loop: false,
            startFrame: shotFrames.startFrame,
            endFrame: shotFrames.endFrame,
          });
          continue;
        }

        console.log(`  [images] Downloading clip ${ci} shot ${si}: "${planShot.query}"...`);
        const result = await searchAndDownloadImage(planShot.query, imgDest);

        if (!result.ok) {
          throw new Error(
            `Failed to download image clip ${ci} shot ${si} ("${planShot.query}"): ${result.error}`,
          );
        }

        expandedShots.push({
          shotIndex: si,
          query: planShot.query,
          imagePath: path.relative("public", imgDest),
          mediaType: "image",
          sourceUrl: result.sourceUrl ?? "",
          loop: false,
          startFrame: shotFrames.startFrame,
          endFrame: shotFrames.endFrame,
        });

        console.log(`  [images] clip ${ci} shot ${si} saved: ${imgDest}`);
        continue;
      }

      // ── Video branch ────────────────────────────────────────────────
      const destPath = shotVideoPath(slug, ci, si);

      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
        console.log(`  [videos] clip ${ci} shot ${si} cached: ${destPath}`);

        const existingClip = existingScript?.clips[ci];
        const existingShot = existingClip?.shots?.[si];
        let cachedVideoId: number | undefined;
        let cachedSource: "pixabay" | "pexels" | undefined = existingShot?.videoSource;

        if (existingShot?.videoId) {
          cachedVideoId = existingShot.videoId;
        } else if (existingShot?.sourceUrl) {
          const m = existingShot.sourceUrl.match(/\/id-(\d+)\//);
          if (m) { cachedVideoId = Number(m[1]); cachedSource = cachedSource ?? "pixabay"; }
        }

        if (cachedVideoId !== undefined && cachedSource) {
          (cachedSource === "pixabay" ? pixabayExcludeIds : pexelsExcludeIds).add(cachedVideoId);
        }

        expandedShots.push({
          shotIndex: si,
          query: planShot.query,
          videoPath: path.relative("public", destPath),
          mediaType: "video",
          sourceUrl: existingShot?.sourceUrl ?? "",
          loop: existingShot?.loop ?? false,
          startFrame: shotFrames.startFrame,
          endFrame: shotFrames.endFrame,
          videoId: cachedVideoId,
          videoSource: cachedSource,
        });
        continue;
      }

      // Download: try Pixabay first, then Pexels
      const FRESH_TIERS = new Set(["fresh", "fresh-loop"]);
      let chosenResult: VideoDownloadResult | null = null;
      let chosenSource: "pixabay" | "pexels" = "pixabay";

      console.log(`  [videos] Downloading clip ${ci} shot ${si}: "${planShot.query}"...`);

      const pixabayResult = await searchAndDownloadVideo(
        planShot.query, destPath, shotSpanSeconds,
        { excludeIds: pixabayExcludeIds, cooldownIds: pixabayCooldownIds, lruSortedIds: pixabayLruIds },
      );

      if (pixabayResult.ok && FRESH_TIERS.has(pixabayResult.tier ?? "last-resort")) {
        chosenResult = pixabayResult;
        chosenSource = "pixabay";
      } else {
        const pexelsTmpPath = destPath.replace(/\.mp4$/, "-pexels.mp4");
        const pexelsResult = await searchAndDownloadVideoFromPexels(
          planShot.query, pexelsTmpPath, shotSpanSeconds,
          { excludeIds: pexelsExcludeIds, cooldownIds: pexelsCooldownIds, lruSortedIds: pexelsLruIds },
        );

        if (pexelsResult.ok && FRESH_TIERS.has(pexelsResult.tier ?? "last-resort")) {
          if (pixabayResult.ok && pixabayResult.path && fs.existsSync(pixabayResult.path)) {
            fs.unlinkSync(pixabayResult.path);
          }
          fs.renameSync(pexelsTmpPath, destPath);
          chosenResult = { ...pexelsResult, path: destPath };
          chosenSource = "pexels";
        } else if (pexelsResult.ok) {
          fs.renameSync(pexelsTmpPath, destPath);
          chosenResult = { ...pexelsResult, path: destPath };
          chosenSource = "pexels";
        } else if (pixabayResult.ok) {
          chosenResult = pixabayResult;
          chosenSource = "pixabay";
        }

        if (fs.existsSync(pexelsTmpPath)) fs.unlinkSync(pexelsTmpPath);
      }

      if (!chosenResult || !chosenResult.ok) {
        throw new Error(
          `Failed to download video clip ${ci} shot ${si} ("${planShot.query}"): ${chosenResult?.error ?? "no results"}`,
        );
      }

      if (chosenResult.videoId !== undefined) {
        const excludeSet = chosenSource === "pixabay" ? pixabayExcludeIds : pexelsExcludeIds;
        excludeSet.add(chosenResult.videoId);
        registerVideo(registry, chosenSource, chosenResult.videoId, {
          pageURL: chosenResult.sourceUrl ?? "",
          duration: shotSpanSeconds,
          slug,
          clipIndex: ci,
          query: planShot.query,
        });
      }

      expandedShots.push({
        shotIndex: si,
        query: planShot.query,
        videoPath: path.relative("public", destPath),
        mediaType: "video",
        sourceUrl: chosenResult.sourceUrl ?? "",
        loop: chosenResult.loop,
        startFrame: shotFrames.startFrame,
        endFrame: shotFrames.endFrame,
        videoId: chosenResult.videoId,
        videoSource: chosenSource,
      });

      console.log(
        `  [videos] clip ${ci} shot ${si} (${chosenSource}) saved: ${destPath}${chosenResult.loop ? " (will loop)" : ""} [tier: ${chosenResult.tier}]`,
      );
    }

    // Build Clip with shots
    clips.push({
      clipIndex: ci,
      query: planClip.shots[0]?.query ?? "landscape",
      startFrame: clipStartFrame,
      endFrame: clipEndFrame,
      shots: expandedShots,
    });
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

const runVideoPhase = traceable(runVideoPhaseImpl, {
  name: "runVideoPhase",
  run_type: "chain",
}) as typeof runVideoPhaseImpl;

// ── Phase 4: Art Direction ────────────────────────────────────────────
interface ArtDirectPhaseInput {
  narration: string;
  slug: string;
  clipPlan: ClipPlan;
  sentences: Sentence[];
  verbose: boolean;
}

async function runArtDirectPhaseImpl(
  input: ArtDirectPhaseInput,
): Promise<ArtDirection> {
  enrichCurrentRun({ slug: input.slug, phase: "artdirect" });
  const cachePath = artDirectPath(input.slug);

  if (fs.existsSync(cachePath)) {
    try {
      const parsed = ArtDirectionSchema.parse(
        JSON.parse(fs.readFileSync(cachePath, "utf-8")),
      );
      enrichCurrentRun({ cacheHit: true });
      console.log(`  [artdirect] cached: ${cachePath}`);
      return parsed;
    } catch (err) {
      console.warn(
        `  [artdirect] cache corrupt at ${cachePath} (${err instanceof Error ? err.message : String(err)}); regenerating`,
      );
    }
  }

  enrichCurrentRun({ cacheHit: false });
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

const runArtDirectPhase = traceable(runArtDirectPhaseImpl, {
  name: "runArtDirectPhase",
  run_type: "chain",
}) as typeof runArtDirectPhaseImpl;

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
function runComposePhaseImpl(
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

  // Ensure last clip endFrame and last shot endFrame match total duration
  if (clips.length > 0) {
    clips = clips.map((c, i) => {
      if (i === clips.length - 1) {
        return {
          ...c,
          endFrame: durationInFrames,
          shots: c.shots.map((s, si) =>
            si === c.shots.length - 1
              ? { ...s, endFrame: durationInFrames }
              : s,
          ),
        };
      }
      return c;
    });
  }

  const script: InspirationScript = {
    schemaVersion: 2,
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

const runComposePhase = runComposePhaseImpl;

export const runInspirePipeline = traceable(runInspirePipelineImpl, {
  name: "runInspirePipeline",
  run_type: "chain",
});

// ── Main pipeline ─────────────────────────────────────────────────────
async function runInspirePipelineImpl(
  options: PipelineOptions,
): Promise<InspirationScript> {
  const { topic, slug, verbose } = options;
  enrichCurrentRun({ slug, topic });
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
    schemaVersion: 2,
    strategy,
    clips: clips.map((c) => ({
      sentenceIndexes: sentences
        .filter((s) => s.clipIndex === c.clipIndex)
        .map((s) => s.sentenceIndex),
      shots: c.shots.map((shot) => ({
        query: shot.query,
        mediaType: (shot.mediaType ?? "video") as "video" | "image",
      })),
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
