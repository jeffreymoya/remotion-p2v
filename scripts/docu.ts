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
import { generateDocuScriptsFile } from "../src/lib/docu/script-codegen";
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
  type TopicData,
} from "../src/lib/docu/topic-generator";
import type { ArcRole, DocuSegmentMeta } from "../src/lib/docu/segment-types";
import type { DocuScript } from "../src/components/docu/DocumentaryComposition";
import {
  runYouTubeClipExtraction,
  mergeYouTubeClipsIntoShots,
  checkYtdlpAvailable,
  type YouTubeClipSpec,
  type YouTubeClipResult,
  type MergedShot,
} from "../src/lib/docu/youtube-pipeline";

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

function cleanArtifacts(slug: string): string[] {
  const removed: string[] = [];
  const rmFile = (p: string) => {
    try { fs.unlinkSync(p); removed.push(p); } catch { /* ok if missing */ }
  };
  const rmDir = (p: string) => {
    try { fs.rmSync(p, { recursive: true, force: true }); removed.push(p); } catch { /* ok if missing */ }
  };

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

  // Regenerate scripts file to drop removed topic
  try {
    const isTopicJson = (f: string) =>
      f.endsWith(".json")
      && !f.endsWith("-timings.json")
      && !f.endsWith("-images.json")
      && !f.endsWith("-topic.json")
      && !f.endsWith("-plan.json")
      && !/-seg-\d+-(narration|overlays)\.json$/.test(f);

    const allTopicPaths = fs.existsSync(promptsDir)
      ? fs.readdirSync(promptsDir).filter(isTopicJson).map((f) => path.join(promptsDir, f)).sort()
      : [];

    const allScripts = allTopicPaths
      .map((p) => { try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return null; } })
      .filter((s): s is object => s !== null && typeof s.slug === "string");

    const content = [
      `import type { DocuScript } from "../components/docu/DocumentaryComposition";`,
      ``,
      `// AUTO-GENERATED — do not edit manually. Run: npm run docu <topic>`,
      `// Discovers all topics from prompts/docu/*.json automatically.`,
      `export const docuScripts: DocuScript[] = ${JSON.stringify(allScripts, null, 2)};`,
      ``,
    ].join("\n");
    fs.writeFileSync("src/generated/docu-scripts.ts", content);
    removed.push("src/generated/docu-scripts.ts");
  } catch {
    // ok if generation fails
  }

  return removed;
}


// ── Full pipeline (hand-authored + LLM paths) ───────────────────────────

async function runFullPipeline(
  slug: string,
  topic: string,
  sentences: SentenceDef[],
  overlaySpecs: OverlaySpec[],
  imageQueries: ImageQuery[],
  segmentPlans?: TopicData["segmentPlans"],
  youtubeClipSpecs?: YouTubeClipSpec[],
  opts?: { only?: "images" | "codegen" },
) {
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
    ttsResult = await runTtsPipeline(slug, sentences);
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
  }

  // 2. Shot scheduling
  const shots = scheduleShotsForSentences(sentenceFrameRanges, durationFrames);

  // 2.5 — Merge YouTube clips into shot schedule (replaces `shots` for all downstream steps)
  const mergedShots: MergedShot[] = mergeYouTubeClipsIntoShots(
    shots,
    youtubeClipResults,
    sentenceFrameRanges,
  );
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
  const overlays = resolveOverlays(overlaySpecs, wordTimings, FPS);

  // 6. Build segment metas
  let segmentMetas: DocuSegmentMeta[] | undefined;
  if (segmentPlans && segmentPlans.length > 1) {
    const frameRanges = computeSegmentFrameRanges(segmentPlans, sentenceFrameRanges, durationFrames);
    let firstSentenceIndex = 0;
    segmentMetas = segmentPlans.map((plan, i) => {
      const meta: DocuSegmentMeta = {
        index: plan.index,
        title: plan.title,
        role: "arcRole" in plan ? plan.arcRole : plan.role as ArcRole,
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
    backgroundMusicPath: "background-music/scott-buckley-permafrost(chosic.com).mp3",
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
                captionWords: ms.captionWords,
              };
            }
            return {
              imagePath: `images/docu/${slug}/img-${String(ms.originalIndex!).padStart(2, "0")}.jpg`,
              mediaType: "image" as const,
              loop: false,
              startFrame: ms.startFrame,
              endFrame: ms.endFrame,
              palette: ms.palette,
            };
          }),
      },
    ],
    overlays,
    segments: segmentMetas,
  };

  // 9. Codegen
  console.log(`\n[docu] Generating docu-scripts.ts...`);
  generateDocuScriptsFile(docuScript);

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
  console.log("[docu] docu-scripts.ts updated — open studio to render");
}

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

  const flagSet = new Set(["--audition", "--minutes", "--from", "--only", "--clean"]);
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
    ? args[fromIdx + 1] as "plan" | "narration" | "overlays" | "tts" | "youtube"
    : "tts";

  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx >= 0 && onlyIdx + 1 < args.length
    ? args[onlyIdx + 1] as "plan" | "narration" | "overlays" | "youtube" | "tts" | "images" | "codegen"
    : undefined;

  return { topicArg, audition, clean, minutes, from, only };
}

function printUsage() {
  console.error("Usage: npx tsx --env-file=.env scripts/docu.ts <topic-or-slug> [--audition] [--clean] [--minutes N] [--from phase] [--only phase]");
  console.error("  --minutes N     Target video length in minutes (default: 4)");
  console.error("  --from phase    Resume from: plan | narration | overlays | youtube | tts (default: tts)");
  console.error("  --only phase    Stop after: plan | narration | overlays | youtube | tts | images | codegen (omit to run full pipeline)");
  console.error("  --audition      TTS audition only (30s clips)");
  console.error("  --clean         Remove all pipeline artifacts for this topic before running");
}

async function main() {
  const args = process.argv.slice(2);
  const { topicArg, audition, clean, minutes, from, only } = parseArgs(args);

  if (!topicArg) {
    printUsage();
    process.exit(1);
  }

  const segments = 5; // fixed 5-phase arc: hook → baseline → escalation → turn → payoff

  // Validate --minutes
  if (!Number.isFinite(minutes) || minutes <= 0) {
    console.error("Error: --minutes must be a positive number");
    process.exit(1);
  }

  // Validate --from
  const validFrom = ["plan", "narration", "overlays", "youtube", "tts"];
  if (!validFrom.includes(from)) {
    console.error(`Error: --from must be one of: ${validFrom.join(", ")}`);
    process.exit(1);
  }

  // Validate --only
  const validOnly = ["plan", "narration", "overlays", "youtube", "tts", "images", "codegen"];
  if (only !== undefined && !validOnly.includes(only)) {
    console.error(`Error: --only must be one of: ${validOnly.join(", ")}`);
    process.exit(1);
  }

  const slug = topicToSlug(topicArg);

  // Clean artifacts if requested
  if (clean) {
    console.log(`[docu] Cleaning artifacts for "${slug}"...`);
    const removed = cleanArtifacts(slug);
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

  // ── LLM generation path ───────────────────────────────────────────
  let topicData: TopicData;
  const topicCached = loadCachedTopicData(slug);

  const isCacheValid = topicCached
    && topicCached.segmentPlans
    && topicCached.segmentPlans.length === 5;

  const llmOnlyPhases = new Set(["plan", "narration", "overlays", "youtube"]);
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
      from: from === "tts" ? "overlays" : from as "plan" | "narration" | "overlays" | "youtube",
      only: isLlmsOnly ? only : undefined,
    });
    if (!isLlmsOnly) saveTopicData(topicData);
  }

  const { topic, sentences, overlaySpecs, segmentPlans, youtubeClipSpecs } = topicData;

  if (isLlmsOnly) {
    console.log(`[docu] --only ${only}: done. Inspect prompts/docu/${slug}-*.json`);
    return;
  }

  if (only === "tts") {
    console.log(`[docu] --only tts: running TTS pipeline for "${topic}"...`);
    await runTtsPipeline(slug, sentences);
    console.log("[docu] --only tts: done.");
    return;
  }

  if (only === "images") {
    const timingsPath = `prompts/docu/${slug}-timings.json`;
    if (!fs.existsSync(timingsPath)) {
      console.error(`Error: No TTS timings found at ${timingsPath}.`);
      console.error(`Run first: npx tsx --env-file=.env scripts/docu.ts "${topicArg}" --only tts`);
      process.exit(1);
    }
  }

  if (only === "codegen") {
    const imagesPath = `prompts/docu/${slug}-images.json`;
    if (!fs.existsSync(imagesPath)) {
      console.error(`Error: No image manifest found at ${imagesPath}.`);
      console.error(`Run first: npx tsx --env-file=.env scripts/docu.ts "${topicArg}" --only images`);
      process.exit(1);
    }
  }

  if (audition) {
    console.log(`[docu] Running TTS audition for "${topic}"...`);
    await runTtsAudition(slug, sentences);
    console.log("[docu] Audition complete.");
    return;
  }

  await runFullPipeline(slug, topic, sentences, overlaySpecs, [], segmentPlans, youtubeClipSpecs,
    (only === "images" || only === "codegen") ? { only } : undefined);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
