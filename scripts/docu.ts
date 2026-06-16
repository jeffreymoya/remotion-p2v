// Documentary pipeline orchestrator.
//
// Usage:
//   npx tsx --env-file=.env scripts/docu.ts <topic-or-slug>                        → full pipeline
//   npx tsx --env-file=.env scripts/docu.ts <topic-or-slug> --audition              → audition only
//   npx tsx --env-file=.env scripts/docu.ts <topic> --minutes 14                    → long-form (fixed 5-segment arc)
//   npx tsx --env-file=.env scripts/docu.ts <topic> --minutes 14 --from narration
//   npx tsx --env-file=.env scripts/docu.ts <topic-or-slug> --clean                 → clean artifacts + full pipeline

import { FPS, SEGMENT_IMAGE_QUERY_CONCURRENCY } from "../src/lib/config";
import { topicToSlug } from "../src/lib/shared/slug";
import { boundedMap } from "../src/lib/shared/concurrency";
import fs from "node:fs";
import path from "node:path";
import { runTtsPipeline, runTtsAudition, loadCachedTtsResult } from "../src/lib/docu/tts-pipeline";
import type { SentenceDef } from "../src/lib/docu/tts-pipeline";
import { runImagePipeline } from "../src/lib/docu/image-pipeline";
import type { ImageQuery } from "../src/lib/docu/image-pipeline";
import { emitCompositionPlans } from "../src/lib/docu/composition-plan-codegen";
import { resolveScenePlan } from "../src/lib/docu/scene-resolver";
import { scheduleShotsForSentences } from "../src/lib/docu/shot-scheduler";
import { resolveOverlays } from "../src/lib/docu/overlay-resolver";
import type { OverlaySpec } from "../src/lib/docu/overlay-resolver";
import {
  generateSegmentImageQueries,
  type ShotContext,
} from "../src/lib/docu/image-query-prompt";
import {
  loadCachedTopicData,
  saveTopicData,
  generateSegmentedTopicData,
  loadCachedScenePlan,
  type TopicData,
} from "../src/lib/docu/topic-generator";
import type { ArcRole, DocuSegmentMeta } from "../src/lib/docu/segment-types";
import type { DocuScript } from "../src/components/docu/DocumentaryComposition";
import {
  runYouTubeClipExtraction,
  mergeYouTubeClipsIntoShots,
  gateClipAttribution,
  checkYtdlpAvailable,
  type YouTubeClipSpec,
  type YouTubeClipResult,
} from "../src/lib/docu/youtube-pipeline";
import { enrichCurrentRun, textOnlyAssetSummary, traceableChain } from "../src/lib/tracing";
import {
  type PhaseName,
  cleanArtifactsFor,
  checkPrereqs,
  writeCachedJson,
  VALID_FROM,
  VALID_ONLY,
} from "../src/lib/docu/pipeline";
import { generatePublishManifest } from "../src/lib/docu/publish-manifest";
import type { CompositionPlan } from "../src/lib/pipeline/schemas";
import {
  assignVariety,
  loadLedger,
  saveLedger,
  loadCachedAssignment,
  saveCachedAssignment,
  pacingProfile,
  presetForArc,
  ARC_AXES,
  VOICE_POOL,
  type ArcAxis,
  type VarietyAssignment,
} from "../src/lib/docu/variety-controller";

// Shared so the rendered DocuScript and the publish manifest report one source.
const DOCU_BACKGROUND_MUSIC = "background-music/scott-buckley-permafrost(chosic.com).mp3";

// ── Niche allowlist ─────────────────────────────────────────────────────

const ALLOWED_NICHES: Record<string, string[]> = {
  "personal-finance": ["personal finance", "money", "budget", "saving", "investing", "retirement", "credit", "debt", "loan", "mortgage", "tax", "insurance", "wealth"],
  "saas": ["saas", "software", "subscription", "cloud", "b2b", "platform", "api", "app", "tech", "startup", "pricing", "mrr", "arr"],
  "entrepreneurship": ["entrepreneur", "founder", "startup", "business", "venture", "funding", "pitch", "scale", "growth", "market", "company"],
  "legal-real-estate": ["real estate", "property", "house", "housing", "mortgage", "landlord", "tenant", "rent", "lease", "legal", "zoning", "foreclosure"],
  "digital-marketing": ["marketing", "digital", "seo", "social media", "advertising", "content", "brand", "email", "funnel", "conversion", "traffic", "audience", "ads"],
};

function checkNicheAllowlist(slug: string, topic: string): { allowed: boolean; niches: string } {
  const target = `${slug} ${topic}`.toLowerCase();
  const tokens = target.split(/[\s-]+/);
  const matched: string[] = [];

  for (const [niche, keywords] of Object.entries(ALLOWED_NICHES)) {
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      const isMultiWord = kwLower.includes(" ");
      const found = isMultiWord
        ? target.includes(kwLower)
        : tokens.includes(kwLower);
      if (found) {
        matched.push(niche);
        break;
      }
    }
  }

  return {
    allowed: matched.length > 0,
    niches: Object.keys(ALLOWED_NICHES).join(", "),
  };
}

// ── Clean artifacts ─────────────────────────────────────────────────────

type CleanPhase = PhaseName;

function cleanArtifacts(slug: string, only?: CleanPhase): string[] {
  const removed: string[] = [];
  const rmFile = (p: string) => {
    try { fs.unlinkSync(p); removed.push(p); } catch { /* ok if missing */ }
  };
  const rmDir = (p: string) => {
    try { fs.rmSync(p, { recursive: true, force: true }); removed.push(p); } catch { /* ok if missing */ }
  };

  if (only) {
    for (const entry of cleanArtifactsFor(slug, only)) {
      if (entry.endsWith("/")) rmDir(entry);
      else rmFile(entry);
    }
    return removed;
  }

  // Prompt JSONs
  const promptsDir = "prompts/docu";
  if (fs.existsSync(promptsDir)) {
    for (const entry of fs.readdirSync(promptsDir)) {
      if (entry.startsWith(slug) && entry.endsWith(".json")) {
        rmFile(path.join(promptsDir, entry));
      }
    }
  }

  // Audio
  rmFile(`public/audio/docu/${slug}.wav`);

  // Images
  rmDir(`public/images/docu/${slug}`);

  // YouTube interview clips
  rmDir(`public/videos/docu/interview-clips/${slug}`);

  // Regenerate composition plans to drop removed topic
  try {
    const plans = buildCompositionPlans();
    emitCompositionPlans(plans);
    removed.push("src/generated/docu-composition-plans.ts");
  } catch {
    // ok if generation fails
  }

  return removed;
}


// ── Full pipeline (hand-authored + LLM paths) ───────────────────────────

async function runFullPipeline_impl(
  slug: string,
  topic: string,
  sentences: SentenceDef[],
  overlaySpecs: OverlaySpec[],
  imageQueries: ImageQuery[],
  segmentPlans?: TopicData["segmentPlans"],
  youtubeClipSpecs?: YouTubeClipSpec[],
  scenePlan?: TopicData["scenePlan"],
  sentenceIndexToAnchorId?: Map<number, string>,
  sentenceIndexToAttribution?: Map<number, { name?: string; sourceLabel?: string }>,
  opts?: { only?: "images" | "codegen"; voiceName?: string; speakingRate?: number; targetShotSeconds?: number; publishMode?: boolean },
) {
  enrichCurrentRun({ slug, topic, phase: "compose" });
  const only = opts?.only;

  // 1. TTS pipeline (or load from cache if skipping ahead)
  let ttsResult;
  if (only) {
    const cached = loadCachedTtsResult(slug, sentences);
    if (!cached) throw new Error("TTS timings not found — re-run without --only to regenerate.");
    console.log(`[docu] Loaded TTS timings from cache (${cached.durationSeconds.toFixed(1)}s)`);
    ttsResult = cached;
  } else {
    console.log(`[docu] Running TTS pipeline for "${topic}"...`);
    ttsResult = await runTtsPipeline(slug, sentences, {
      voiceName: opts?.voiceName,
      speakingRate: opts?.speakingRate,
    });
  }
  const { wordTimings, sentenceFrameRanges, sentenceData, durationSeconds } = ttsResult;
  const durationFrames = Math.ceil(durationSeconds * FPS);

  // 1.5 — YouTube clip extraction (if specs exist)
  let youtubeClipResults: YouTubeClipResult[] = [];
  let effectiveClipSpecs = youtubeClipSpecs;
  if (effectiveClipSpecs && effectiveClipSpecs.length > 0) {
    if (!checkYtdlpAvailable()) {
      console.warn("[docu] yt-dlp not found — skipping YouTube clip extraction");
      effectiveClipSpecs = undefined;
    }
  }
  if (effectiveClipSpecs && effectiveClipSpecs.length > 0) {
    console.log(`\n[docu] Extracting ${effectiveClipSpecs.length} YouTube interview clips...`);
    youtubeClipResults = await runYouTubeClipExtraction(slug, effectiveClipSpecs);
    const succeeded = youtubeClipResults.filter((r) => r.success);
    console.log(`[docu] YouTube clips: ${succeeded.length}/${effectiveClipSpecs.length} succeeded`);

    // Clip-attribution gate (Deliverable B): block un-attributed clips, persist
    // a provenance record per admitted clip, and (in publish mode) block clips
    // with no transformation note. Runs before merge so blocked clips are never
    // inserted into the shot schedule.
    const gate = gateClipAttribution(youtubeClipResults, effectiveClipSpecs, {
      publishMode: opts?.publishMode ?? false,
    });
    if (gate.blocked.length > 0) {
      console.warn(`[docu] Clip-attribution gate blocked ${gate.blocked.length} clip(s):`);
      for (const b of gate.blocked) console.warn(`  sentence ${b.sentenceIndex}: ${b.reason}`);
    }
    writeCachedJson(`prompts/docu/${slug}-clips.json`, {
      records: gate.records,
      blocked: gate.blocked,
    });
    console.log(`[docu] Clip provenance written: prompts/docu/${slug}-clips.json (${gate.records.length} admitted)`);
    youtubeClipResults = gate.admitted;
  }

  // 2. Shot scheduling
  const shots = scheduleShotsForSentences(sentenceFrameRanges, durationFrames, opts?.targetShotSeconds);

  // 2.5 — Merge YouTube clips into shot schedule (replaces `shots` for all downstream steps)
  const { shots: mergedShots, citationBlocks } = mergeYouTubeClipsIntoShots(
    shots,
    youtubeClipResults,
    sentenceFrameRanges,
    durationFrames,
    sentenceIndexToAnchorId,
  );
  const annotatedCitationBlocks = citationBlocks.map((block) => {
    const attr = sentenceIndexToAttribution?.get(block.sentenceIndex);
    if (!attr) return block;
    return {
      ...block,
      name: block.name || attr.name,
      sourceLabel: block.sourceLabel || attr.sourceLabel,
    };
  });
  // FROM THIS POINT ON: use `mergedShots`, not `shots`

  // 3. Image queries (skip LLM generation when loading images from manifest)
  let finalImageQueries: ImageQuery[] = [];
  if (only === "codegen") {
    // queries not needed — images are loaded from manifest below
  } else if (imageQueries.length > 0) {
    console.log(`\n[docu] Using ${imageQueries.length} hand-authored image queries`);
    finalImageQueries = imageQueries;
  } else if (segmentPlans && segmentPlans.length >= 1) {
    console.log(`\n[docu] Generating image queries for ${mergedShots.length} shots across ${segmentPlans.length} segments...`);

    const segmentFrameRanges = computeSegmentFrameRanges(segmentPlans, sentenceFrameRanges, durationFrames);

    const allSegmentQueries = await boundedMap(
      segmentPlans,
      async (plan, segIndex) => {
        const range = segmentFrameRanges[segIndex];
        const segShots = mergedShots.filter(
          (sh) => sh.startFrame >= range.startFrame && sh.startFrame < range.endFrame
            && sh.mediaType !== "video",
        );

        const shotContexts: ShotContext[] = segShots.map((sh) => {
          const sentIdx = sentenceFrameRanges.findIndex(
            (s) => s.startFrame <= sh.startFrame && sh.startFrame < s.endFrame,
          );
          const sent = sentIdx >= 0 ? sentences[sentIdx] : sentences[0];
          return {
            shotIndex: sh.originalIndex!,
            palette: sh.palette,
            sentenceText: sent.text,
          };
        });

        console.log(`[docu]   seg-${String(segIndex).padStart(2, "0")}: ${shotContexts.length} shots`);
        return generateSegmentImageQueries(plan, shotContexts);
      },
      SEGMENT_IMAGE_QUERY_CONCURRENCY,
    );

    finalImageQueries = allSegmentQueries.flat();
    console.log(`[docu] Generated ${finalImageQueries.length} image queries`);
  }

  // 4. Image pipeline (or load manifest if skipping ahead)
  let downloadedSlotSet: Set<number>;
  if (only === "codegen") {
    const manifestPath = `prompts/docu/${slug}-images.json`;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as unknown;
    if (!manifest || typeof manifest !== "object" || !Array.isArray((manifest as Record<string, unknown>).slots)) {
      throw new Error(`Image manifest at ${manifestPath} is malformed (missing slots array) — re-run --only images.`);
    }
    downloadedSlotSet = new Set(
      ((manifest as { slots: Array<{ index: number }> }).slots).map((slot) => slot.index),
    );
    console.log(`[docu] Loaded ${downloadedSlotSet.size} cached images from manifest`);
  } else {
    console.log(`\n[docu] Downloading images...`);
    const imageResult = await runImagePipeline(slug, finalImageQueries);
    console.log(`[docu] Downloaded ${imageResult.downloadedCount} images`);
    downloadedSlotSet = new Set(imageResult.downloadedSlots);
  }

  if (only === "images") {
    console.log(`[docu] --only images: done. ${downloadedSlotSet.size} images ready.`);
    return;
  }

  // 5. Overlay resolution
  const overlays = resolveOverlays(overlaySpecs, wordTimings, FPS, {
    sentenceAnchors: sentenceData.map((sd, i) => ({
      text: sentences[i].text,
      startSeconds: sd.startSeconds,
      endSeconds: sd.endSeconds,
    })),
  });

  // 6. Build segment metas
  let segmentMetas: DocuSegmentMeta[] | undefined;
  if (segmentPlans && segmentPlans.length > 1) {
    const frameRanges = computeSegmentFrameRanges(segmentPlans, sentenceFrameRanges, durationFrames);
    let firstSentenceIndex = 0;
    segmentMetas = segmentPlans.map((plan, i) => {
      const meta: DocuSegmentMeta = {
        index: plan.index,
        title: plan.title,
        role: "arcRole" in plan ? (plan as { arcRole: ArcRole }).arcRole : (plan.role as ArcRole),
        firstSentenceIndex,
        lastSentenceIndex: firstSentenceIndex + plan.targetSentenceCount - 1,
        startFrame: frameRanges[i].startFrame,
        endFrame: frameRanges[i].endFrame,
      };
      firstSentenceIndex += plan.targetSentenceCount;
      return meta;
    });
  }

  // 7. Build DocuScript
  const docuScript: DocuScript = {
    slug,
    topic,
    audioPath: `audio/docu/${slug}.wav`,
    backgroundMusicPath: DOCU_BACKGROUND_MUSIC,
    durationInFrames: durationFrames,
    fps: FPS,
    width: 1920,
    height: 1080,
    wordTimings: wordTimings.map((w) => ({
      word: w.word,
      startSeconds: w.startSeconds,
      endSeconds: w.endSeconds,
    })),
    sentences: sentenceData.map((sd, i) => ({
      sentenceIndex: i,
      text: sentences[i].text,
      startSeconds: sd.startSeconds,
      endSeconds: sd.endSeconds,
      startFrame: sd.startFrame,
      endFrame: sd.endFrame,
      clipIndex: 0,
      tokenWordIndexes: sd.tokenWordIndexes,
      emphasisWordIndexes: sd.emphasisIndices.length > 0 ? sd.emphasisIndices : undefined,
    })),
    clips: [
      {
        clipIndex: 0,
        startFrame: 0,
        endFrame: durationFrames,
        shots: mergedShots
          .filter((ms) => {
            if (ms.mediaType === "video") return true;
            return ms.originalIndex !== undefined && downloadedSlotSet.has(ms.originalIndex);
          })
          .map((ms) => {
            if (ms.mediaType === "video") {
              return {
                videoPath: ms.videoPath!,
                mediaType: "video" as const,
                loop: false,
                startFrame: ms.startFrame,
                endFrame: ms.endFrame,
                palette: ms.palette,
                isInterviewClip: true,
                startFrom: ms.startFrom,
                captionWords: ms.captionWords,
              };
            }
            const iq = finalImageQueries.find((q) => q.slot === ms.originalIndex);
            const queryStr = iq ? iq.query.toLowerCase() : "";
            const isHighlightSafe = [
              "document", "letter", "calculator", "paper", "isolated object", "white background", "white-background"
            ].some((term) => queryStr.includes(term));

            return {
              imagePath: `images/docu/${slug}/img-${String(ms.originalIndex!).padStart(2, "0")}.jpg`,
              mediaType: "image" as const,
              loop: false,
              startFrame: ms.startFrame,
              endFrame: ms.endFrame,
              palette: ms.palette,
              gradeMode: isHighlightSafe ? "highlight-safe" : "full",
            };
          }),
      },
    ],
    overlays,
    segments: segmentMetas,
    citationBlocks: annotatedCitationBlocks.length > 0 ? annotatedCitationBlocks : undefined,
  };

  // 9. Codegen
  console.log(`\n[docu] Generating composition plans...`);
  emitCompositionPlans(buildCompositionPlans({
    current: { slug, script: docuScript, scenePlan, segmentPlans },
  }));

  const finalShotCount = mergedShots.filter((ms) => {
    if (ms.mediaType === "video") return true;
    return ms.originalIndex !== undefined && downloadedSlotSet.has(ms.originalIndex);
  }).length;

  const extras: string[] = [];
  if (segmentMetas) extras.push(`${segmentMetas.length} segments`);
  const videoShotCount = mergedShots.filter((ms) => ms.mediaType === "video").length;
  if (videoShotCount > 0) extras.push(`${videoShotCount} interview clips`);
  console.log(
    `\n[docu] Done. Duration: ${durationSeconds.toFixed(1)}s, Frames: ${durationFrames}, ` +
    `Shots: ${finalShotCount}, Words: ${wordTimings.length}${extras.length ? ", " + extras.join(", ") : ""}`,
  );
  console.log("[docu] Composition plans updated — open studio to render");
}

function isValidDocuScript(obj: unknown): obj is DocuScript {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Record<string, unknown>;
  return typeof s.slug === "string"
    && typeof s.fps === "number"
    && typeof s.width === "number"
    && typeof s.height === "number"
    && typeof s.durationInFrames === "number"
    && typeof s.audioPath === "string"
    && Array.isArray(s.wordTimings)
    && Array.isArray(s.sentences);
}

function buildCompositionPlans(args?: {
  current?: {
    slug: string;
    script: DocuScript;
    scenePlan?: TopicData["scenePlan"];
    segmentPlans?: TopicData["segmentPlans"];
  };
}): Array<{ slug: string; plan: CompositionPlan }> {
  const promptsDir = "prompts/docu";
  const bySlug = new Map<string, { script: DocuScript; scenePlan?: TopicData["scenePlan"]; segmentPlans?: TopicData["segmentPlans"] }>();

  if (fs.existsSync(promptsDir)) {
    for (const entry of fs.readdirSync(promptsDir).filter((name) => /^[^-].*\.json$/.test(name)).sort()) {
      if (
        entry.endsWith("-timings.json") ||
        entry.endsWith("-images.json") ||
        entry.endsWith("-topic.json") ||
        entry.endsWith("-plan.json") ||
        entry.endsWith("-scene-plan.json") ||
        entry.endsWith("-clips.json") ||
        entry.endsWith("-publish-manifest.json") ||
        /-seg-\d+-(narration|overlays)\.json$/.test(entry)
      ) {
        continue;
      }
      const filePath = path.join(promptsDir, entry);
      try {
        const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (isValidDocuScript(raw)) bySlug.set(raw.slug, { script: raw });
      } catch {
        console.warn(`[docu:codegen] skipping ${filePath} while building s2v plans`);
      }
    }
  }

  if (args?.current) {
    bySlug.set(args.current.slug, {
      script: args.current.script,
      scenePlan: args.current.scenePlan,
      segmentPlans: args.current.segmentPlans,
    });
  }

  const plans: Array<{ slug: string; plan: CompositionPlan }> = [];
  for (const [slug, entry] of bySlug.entries()) {
    const scenePlan = entry.scenePlan ?? loadCachedScenePlan(slug);
    if (!scenePlan || scenePlan.scenes.length === 0) {
      if (scenePlan?.scenes.length === 0) console.warn(`[docu:codegen] skipping ${slug}: empty scene plan`);
      continue;
    }
    try {
      plans.push({
        slug,
        plan: resolveScenePlan({
          scenePlan,
          sentences: entry.script.sentences.map((sentence) => ({
            text: sentence.text,
            emphasis: [],
            palette: "cool-tech",
          })),
          wordTimings: entry.script.wordTimings,
          fps: entry.script.fps,
          width: entry.script.width,
          height: entry.script.height,
          audioPath: entry.script.audioPath ?? "",
          durationInFrames: entry.script.durationInFrames,
          captionsEnabled: false,
          segmentPlans: entry.segmentPlans,
          backgroundAssetRefs: sceneBackgroundAssets(entry.script, entry.segmentPlans, scenePlan.scenes.length),
        }),
      });
    } catch (err) {
      console.warn(`[docu:codegen] skipping ${slug}: scene plan did not resolve (${err instanceof Error ? err.message : String(err)})`);
    }
  }
  return plans;
}

function sceneBackgroundAssets(
  script: DocuScript,
  segmentPlans: TopicData["segmentPlans"] | undefined,
  sceneCount: number,
): string[] {
  const shots = script.clips.flatMap((clip) => clip.shots).filter((shot) => shot.mediaType === "image" && shot.imagePath);
  if (shots.length === 0) return [];

  const ranges = sceneFrameRanges(script, segmentPlans, sceneCount);
  return ranges.map((range) => {
    const covering = shots.find((shot) => shot.startFrame <= range.startFrame && range.startFrame < shot.endFrame);
    const next = shots.find((shot) => shot.startFrame >= range.startFrame);
    return (covering ?? next ?? shots[0]).imagePath ?? "";
  });
}

function sceneFrameRanges(
  script: DocuScript,
  segmentPlans: TopicData["segmentPlans"] | undefined,
  sceneCount: number,
): Array<{ startFrame: number; endFrame: number }> {
  if (segmentPlans && segmentPlans.length === sceneCount) {
    const ranges: Array<{ startFrame: number; endFrame: number }> = [];
    let sentenceOffset = 0;
    for (const segment of segmentPlans) {
      const first = script.sentences[sentenceOffset];
      const last = script.sentences[Math.min(script.sentences.length - 1, sentenceOffset + segment.targetSentenceCount - 1)];
      ranges.push({
        startFrame: first?.startFrame ?? 0,
        endFrame: last?.endFrame ?? script.durationInFrames,
      });
      sentenceOffset += segment.targetSentenceCount;
    }
    return ranges;
  }

  return Array.from({ length: sceneCount }, (_, index) => ({
    startFrame: Math.floor((index * script.durationInFrames) / sceneCount),
    endFrame: Math.floor(((index + 1) * script.durationInFrames) / sceneCount),
  }));
}

const runFullPipeline = traceableChain(runFullPipeline_impl, "runFullPipeline", {
  processInputs: (inputs) => (textOnlyAssetSummary(inputs) as Record<string, unknown>) ?? {},
  processOutputs: (outputs) => textOnlyAssetSummary(outputs) as Record<string, unknown>,
});

function computeSegmentFrameRanges(
  segmentPlans: NonNullable<TopicData["segmentPlans"]>,
  sentenceFrameRanges: Array<{ startFrame: number; endFrame: number }>,
  totalDurationFrames: number,
): Array<{ startFrame: number; endFrame: number }> {
  const ranges: Array<{ startFrame: number; endFrame: number }> = [];
  let sentenceOffset = 0;

  for (let i = 0; i < segmentPlans.length; i++) {
    const plan = segmentPlans[i];
    const firstSentIdx = sentenceOffset;
    const lastSentIdx = sentenceOffset + plan.targetSentenceCount - 1;
    sentenceOffset += plan.targetSentenceCount;

    const startFrame = sentenceFrameRanges[firstSentIdx]?.startFrame ?? 0;
    const endFrame = i < segmentPlans.length - 1
      ? (sentenceFrameRanges[sentenceOffset]?.startFrame ?? totalDurationFrames)
      : totalDurationFrames;

    ranges.push({ startFrame, endFrame });
  }

  return ranges;
}

// ── Main ─────────────────────────────────────────────────────────────────

function parseArgs(args: string[]) {
  const audition = args.includes("--audition");
  const clean = args.includes("--clean");

  const flagSet = new Set(["--audition", "--minutes", "--from", "--only", "--clean", "--allow-youtube-clips", "--publish", "--variety"]);
  const flagVals = new Set<string>();

  // Collect flag values so they aren't mistaken for topicArg
  for (let i = 0; i < args.length; i++) {
    if (flagSet.has(args[i]) && i + 1 < args.length && !args[i + 1].startsWith("--")) {
      flagVals.add(args[i + 1]);
    }
  }

  const topicArg = args.find((a) => !a.startsWith("--") && !flagSet.has(a) && !flagVals.has(a));

  const minutesIdx = args.indexOf("--minutes");
  const minutes = minutesIdx >= 0 && minutesIdx + 1 < args.length
    ? Number(args[minutesIdx + 1])
    : 4;

  const fromIdx = args.indexOf("--from");
  const from = fromIdx >= 0 && fromIdx + 1 < args.length
    ? args[fromIdx + 1] as PhaseName
    : "tts";

  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx >= 0 && onlyIdx + 1 < args.length
    ? args[onlyIdx + 1] as PhaseName
    : undefined;

  const allowYoutubeClips = args.includes("--allow-youtube-clips");
  const publish = args.includes("--publish");

  const varietyIdx = args.indexOf("--variety");
  const variety = varietyIdx >= 0 && varietyIdx + 1 < args.length && !args[varietyIdx + 1].startsWith("--")
    ? args[varietyIdx + 1]
    : undefined;

  return { topicArg, audition, clean, minutes, from, only, allowYoutubeClips, publish, variety };
}

function printUsage() {
  console.error("Usage: npx tsx --env-file=.env scripts/docu.ts <topic-or-slug> [--audition] [--clean] [--minutes N] [--from phase] [--only phase] [--allow-youtube-clips]");
  console.error("  --minutes N     Target video length in minutes (default: 4)");
  console.error(`  --from phase    Resume from: ${VALID_FROM.join(" | ")} (default: tts)`);
  console.error(`  --only phase    Stop after: ${VALID_ONLY.join(" | ")} (omit to run full pipeline)`);
  console.error("  --audition      TTS audition only (30s clips)");
  console.error("  --clean         Remove pipeline artifacts for this topic. With --only <phase>, removes only that phase's artifacts");
  console.error("  --allow-youtube-clips  Enable YouTube clip extraction (disabled by default)");
  console.error("  --publish              Publish-intended run: clips missing a transformation note are blocked (otherwise warned)");
  console.error("  --variety <off|arc>    Force variety: 'off' = baseline preset (regression); an arc name pins that structure (omit for quota-based rotation)");
}

async function main() {
  const args = process.argv.slice(2);
  const { topicArg, audition, clean, minutes, from, only, allowYoutubeClips, publish, variety } = parseArgs(args);

  if (!topicArg) {
    printUsage();
    process.exit(1);
  }

  // Validate --minutes
  if (!Number.isFinite(minutes) || minutes <= 0) {
    console.error("Error: --minutes must be a positive number");
    process.exit(1);
  }

  // Validate --from
  if (!VALID_FROM.includes(from as PhaseName)) {
    console.error(`Error: --from must be one of: ${VALID_FROM.join(", ")}`);
    process.exit(1);
  }

  // Validate --only
  if (only !== undefined && !VALID_ONLY.includes(only as PhaseName)) {
    console.error(`Error: --only must be one of: ${VALID_ONLY.join(", ")}`);
    process.exit(1);
  }

  // Validate --variety
  if (variety !== undefined && variety !== "off" && !ARC_AXES.includes(variety as ArcAxis)) {
    console.error(`Error: --variety must be "off" or one of: ${ARC_AXES.join(", ")}`);
    process.exit(1);
  }

  await runDocuCli({ topicArg, audition, clean, minutes, from, only, allowYoutubeClips, publish, variety });
}

type ParsedDocuArgs = ReturnType<typeof parseArgs> & { topicArg: string };

/**
 * Variety phase (first PIPELINE phase). Resolves the per-video
 * {arc, opener, pacing, voice, skin} assignment. The assignment is cached per
 * slug (so resume runs stay deterministic) and every assignment is recorded to
 * the channel-level ledger for the Step 3 audit. `--variety off` forces the
 * baseline preset (golden-frame regression); an arc name pins that structure.
 */
function resolveVarietyAssignment(
  slug: string,
  topic: string,
  varietyFlag: string | undefined,
): VarietyAssignment {
  const cached = loadCachedAssignment(slug);
  if (cached && varietyFlag === undefined) {
    if (!VOICE_POOL.includes(cached.voice)) {
      const healed = {
        ...cached,
        voice: VOICE_POOL[0],
      };
      saveCachedAssignment(slug, healed);
      console.log(
        `[docu] variety: cached voice ${cached.voice} is no longer supported; ` +
        `rewriting cache to ${healed.voice}`,
      );
      return healed;
    }
    console.log(`[docu] variety: reusing cached assignment (arc=${cached.arc}, voice=${cached.voice})`);
    return cached;
  }

  const baseLedger = loadLedger();
  // Exclude any prior entry for this slug so re-assignment doesn't self-count
  // against the rolling quota.
  const ledger = {
    schemaVersion: 1 as const,
    entries: baseLedger.entries.filter((e) => e.slug !== slug),
  };

  const opts =
    varietyFlag === "off"
      ? { force: true }
      : varietyFlag !== undefined
        ? { preset: presetForArc(varietyFlag as ArcAxis) }
        : undefined;

  const { assignment, ledger: next } = assignVariety(slug, topic, ledger, opts);
  saveLedger(next);
  saveCachedAssignment(slug, assignment);
  console.log(
    `[docu] variety: assigned arc=${assignment.arc}, opener=${assignment.opener}, ` +
    `pacing=${assignment.pacing}, voice=${assignment.voice}, skin=${assignment.skin}`,
  );
  return assignment;
}

async function runDocuCli_impl(args: ParsedDocuArgs): Promise<void> {
  const { topicArg, audition, clean, minutes, from, only, allowYoutubeClips, publish, variety } = args;
  const slug = topicToSlug(topicArg);
  enrichCurrentRun({ slug, topic: topicArg, phase: "compose" });

  const segments = 5;

  // Clean artifacts if requested
  if (clean) {
    const cleanPhase = only as CleanPhase | undefined;
    console.log(`[docu] Cleaning${cleanPhase ? ` (${cleanPhase})` : ""} artifacts for "${slug}"...`);
    const removed = cleanArtifacts(slug, cleanPhase);
    if (removed.length > 0) {
      for (const r of removed) console.log(`  removed: ${r}`);
    } else {
      console.log("  (no artifacts found)");
    }
  }

  // Niche allowlist gate
  const { allowed, niches } = checkNicheAllowlist(slug, topicArg);
  if (!allowed) {
    console.error(`Error: topic "${topicArg}" (slug: "${slug}") is not in an allowed niche.`);
    console.error(`Allowed niches: ${niches}`);
    process.exit(1);
  }

  // ── Variety phase (first PIPELINE phase) ──────────────────────────
  const varietyAssignment = resolveVarietyAssignment(slug, topicArg, variety);
  if (only === "variety") {
    console.log(`[docu] --only variety: done. Assignment cached at prompts/docu/${slug}-variety.json`);
    return;
  }

  // ── Publish-manifest phase (final PIPELINE phase) ─────────────────
  // Standalone regeneration from already-written artifacts — no LLM/IO run.
  if (only === "publish-manifest") {
    generatePublishManifest(slug, {
      topic: topicArg,
      voiceName: varietyAssignment.voice,
      musicPath: DOCU_BACKGROUND_MUSIC,
      publishMode: publish,
    });
    return;
  }

  // ── LLM generation path ───────────────────────────────────────────
  let topicData: TopicData;
  const topicCached = loadCachedTopicData(slug);

  const isCacheValid = topicCached
    && topicCached.segmentPlans
    && topicCached.segmentPlans.length === 5;

  const llmOnlyPhases = new Set(["plan", "narration", "overlays", "scene-plan", "youtube"]);
  const isLlmsOnly = only !== undefined && llmOnlyPhases.has(only);

  if (isCacheValid && from === "tts" && !isLlmsOnly) {
    console.log(`[docu] Using cached topic data for "${topicCached.topic}" (generated ${topicCached.generatedAt})`);
    topicData = topicCached;
  } else {
    if (topicCached && !isCacheValid) {
      console.log(`[docu] Cached topic data stale (missing segmentPlans) — regenerating`);
    }
    if (only === "tts") {
      console.warn(`[docu] No valid topic cache — running LLM narration phase before TTS (this costs API credits).`);
      console.warn(`[docu] To skip LLM: run the full pipeline once first, then re-use --only tts.`);
    }
    console.log(`[docu] Generating topic data: ${minutes} min target...`);
    topicData = await generateSegmentedTopicData(topicArg, slug, 5, minutes, {
      verbose: true,
      from: from === "tts" ? "overlays" : from === "variety" ? "plan" : from as "plan" | "narration" | "overlays" | "scene-plan" | "youtube",
      only: isLlmsOnly ? (only as "plan" | "narration" | "overlays" | "scene-plan" | "youtube") : undefined,
      variety: varietyAssignment,
    });
    if (!isLlmsOnly) saveTopicData(topicData);
  }

  const { topic, sentences, overlaySpecs, segmentPlans, scenePlan } = topicData;
  let { youtubeClipSpecs } = topicData;

  if (youtubeClipSpecs && youtubeClipSpecs.length > 0 && !allowYoutubeClips) {
    console.log(`[docu] YouTube clips disabled (pass --allow-youtube-clips to enable)`);
    youtubeClipSpecs = undefined;
  }

  if (isLlmsOnly) {
    console.log(`[docu] --only ${only}: done. Inspect prompts/docu/${slug}-*.json`);
    return;
  }

  if (only === "tts") {
    console.log(`[docu] --only tts: running TTS pipeline for "${topic}"...`);
    await runTtsPipeline(slug, sentences, {
      voiceName: varietyAssignment.voice,
      speakingRate: pacingProfile(varietyAssignment.pacing).speakingRate,
    });
    console.log("[docu] --only tts: done.");
    return;
  }

  if (only !== undefined) {
    const prereqErr = checkPrereqs(only as PhaseName, slug, topicArg);
    if (prereqErr) {
      console.error(prereqErr);
      process.exit(1);
    }
  }

  if (audition) {
    console.log(`[docu] Running TTS audition for "${topic}"...`);
    await runTtsAudition(slug, sentences);
    console.log("[docu] Audition complete.");
    return;
  }

  const sentenceIndexToAnchorId = new Map(
    (topicData.clipCandidateInfo ?? []).map(({ sentenceIndex, anchorId }) => [sentenceIndex, anchorId])
  );

  const sentenceIndexToAttribution = new Map(
    (topicData.clipCandidateInfo ?? []).map(({ sentenceIndex, personName, sourceLabel }) => [
      sentenceIndex,
      { name: personName, sourceLabel },
    ]),
  );

  const pacing = pacingProfile(varietyAssignment.pacing);
  await runFullPipeline(slug, topic, sentences, overlaySpecs, [], segmentPlans, youtubeClipSpecs, scenePlan,
    sentenceIndexToAnchorId.size > 0 ? sentenceIndexToAnchorId : undefined,
    sentenceIndexToAttribution.size > 0 ? sentenceIndexToAttribution : undefined,
    {
      ...((only === "images" || only === "codegen") ? { only } : {}),
      voiceName: varietyAssignment.voice,
      speakingRate: pacing.speakingRate,
      targetShotSeconds: pacing.targetShotSeconds,
      publishMode: publish,
    });

  // ── Publish-manifest phase (final PIPELINE phase) ─────────────────
  // Only after the pipeline reaches codegen (full run or `--only codegen`);
  // `--only images` returns from runFullPipeline before codegen, so skip it.
  if (only === undefined || only === "codegen") {
    generatePublishManifest(slug, {
      topic,
      voiceName: varietyAssignment.voice,
      musicPath: DOCU_BACKGROUND_MUSIC,
      publishMode: publish,
    });
  }
}

const runDocuCli = traceableChain(runDocuCli_impl, "runDocuCli", {
  processInputs: (inputs) => (textOnlyAssetSummary(inputs) as Record<string, unknown>) ?? {},
  processOutputs: (outputs) => textOnlyAssetSummary(outputs) as Record<string, unknown>,
});

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
