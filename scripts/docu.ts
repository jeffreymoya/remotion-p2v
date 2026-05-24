// Documentary pipeline orchestrator.
//
// Usage:
//   npx tsx --env-file=.env scripts/docu.ts <topic-or-slug>                        → full pipeline
//   npx tsx --env-file=.env scripts/docu.ts <topic-or-slug> --audition              → audition only
//   npx tsx --env-file=.env scripts/docu.ts <topic> --segments 5 --minutes 14       → segmented long-form
//   npx tsx --env-file=.env scripts/docu.ts <topic> --segments 5 --minutes 14 --from narration

import { FPS, SEGMENT_IMAGE_QUERY_CONCURRENCY } from "../src/lib/config";
import { topicToSlug } from "../src/lib/shared/slug";
import { boundedMap } from "../src/lib/shared/concurrency";
import { runTtsPipeline, runTtsAudition } from "../src/lib/docu/tts-pipeline";
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
import type { DocuSegmentMeta } from "../src/lib/docu/segment-types";
import type { DocuScript } from "../src/components/docu/DocumentaryComposition";

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

// ── Full pipeline (hand-authored + LLM paths) ───────────────────────────

async function runFullPipeline(
  slug: string,
  topic: string,
  sentences: SentenceDef[],
  overlaySpecs: OverlaySpec[],
  imageQueries: ImageQuery[],
  segmentPlans?: TopicData["segmentPlans"],
) {
  // 1. TTS pipeline
  console.log(`[docu] Running TTS pipeline for "${topic}"...`);
  const ttsResult = await runTtsPipeline(slug, sentences);
  const { wordTimings, sentenceFrameRanges, sentenceData, durationSeconds } = ttsResult;
  const durationFrames = Math.ceil(durationSeconds * FPS);

  // 2. Shot scheduling
  const shots = scheduleShotsForSentences(sentenceFrameRanges, durationFrames);

  // 3. Image queries
  let finalImageQueries: ImageQuery[];
  if (imageQueries.length > 0) {
    console.log(`\n[docu] Using ${imageQueries.length} hand-authored image queries`);
    finalImageQueries = imageQueries;
  } else if (segmentPlans && segmentPlans.length >= 1) {
    console.log(`\n[docu] Generating image queries for ${shots.length} shots across ${segmentPlans.length} segments...`);

    const segmentFrameRanges = computeSegmentFrameRanges(segmentPlans, sentenceFrameRanges, durationFrames);

    const allSegmentQueries = await boundedMap(
      segmentPlans,
      async (plan, segIndex) => {
        const range = segmentFrameRanges[segIndex];
        const segShots = shots.filter(
          (sh) => sh.startFrame >= range.startFrame && sh.startFrame < range.endFrame,
        );

        const shotContexts: ShotContext[] = segShots.map((sh, i) => {
          const sentIdx = sentenceFrameRanges.findIndex(
            (s) => s.startFrame <= sh.startFrame && sh.startFrame < s.endFrame,
          );
          const sent = sentIdx >= 0 ? sentences[sentIdx] : sentences[0];
          return {
            shotIndex: shots.indexOf(sh),
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

  // 4. Image pipeline
  console.log(`\n[docu] Downloading images...`);
  const imageResult = await runImagePipeline(slug, finalImageQueries);
  console.log(`[docu] Downloaded ${imageResult.downloadedCount} images`);

  const downloadedSlotSet = new Set(imageResult.downloadedSlots);

  const filteredShots = shots
    .map((sh, i) => ({ shot: sh, originalIndex: i }))
    .filter(({ originalIndex }) => {
      if (!downloadedSlotSet.has(originalIndex)) {
        console.warn(`[docu] ⚠ Shot ${originalIndex} dropped — image not downloaded`);
        return false;
      }
      return true;
    });

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
        role: plan.role,
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
        shots: filteredShots.map(({ shot: sh, originalIndex: i }) => ({
          imagePath: `images/docu/${slug}/img-${String(i).padStart(2, "0")}.jpg`,
          mediaType: "image" as const,
          loop: false,
          startFrame: sh.startFrame,
          endFrame: sh.endFrame,
          palette: sh.palette,
        })),
      },
    ],
    overlays,
    segments: segmentMetas,
  };

  // 9. Codegen
  console.log(`\n[docu] Generating docu-scripts.ts...`);
  generateDocuScriptsFile(docuScript);

  const extras: string[] = [];
  if (segmentMetas) extras.push(`${segmentMetas.length} segments`);
  console.log(
    `\n[docu] Done. Duration: ${durationSeconds.toFixed(1)}s, Frames: ${durationFrames}, ` +
    `Shots: ${filteredShots.length}, Words: ${wordTimings.length}${extras.length ? ", " + extras.join(", ") : ""}`,
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

  const flagSet = new Set(["--audition", "--segments", "--minutes", "--from"]);
  const flagVals = new Set<string>();

  // Collect flag values so they aren't mistaken for topicArg
  for (let i = 0; i < args.length; i++) {
    if (flagSet.has(args[i]) && i + 1 < args.length && !args[i + 1].startsWith("--")) {
      flagVals.add(args[i + 1]);
    }
  }

  const topicArg = args.find((a) => !a.startsWith("--") && !flagSet.has(a) && !flagVals.has(a));

  const segmentsIdx = args.indexOf("--segments");
  const segments = segmentsIdx >= 0 && segmentsIdx + 1 < args.length
    ? Number(args[segmentsIdx + 1])
    : 1;

  const minutesIdx = args.indexOf("--minutes");
  const minutes = minutesIdx >= 0 && minutesIdx + 1 < args.length
    ? Number(args[minutesIdx + 1])
    : 4;

  const fromIdx = args.indexOf("--from");
  const from = fromIdx >= 0 && fromIdx + 1 < args.length
    ? args[fromIdx + 1] as "plan" | "narration" | "overlays" | "tts"
    : "tts";

  return { topicArg, audition, segments, minutes, from };
}

function printUsage() {
  console.error("Usage: npx tsx --env-file=.env scripts/docu.ts <topic-or-slug> [--audition] [--segments N] [--minutes N] [--from phase]");
  console.error("  --segments N    Number of narrative segments (default: 1)");
  console.error("  --minutes N     Target video length in minutes (default: 4)");
  console.error("  --from phase    Resume from: plan | narration | overlays | tts (default: tts)");
  console.error("  --audition      TTS audition only (30s clips)");
}

async function main() {
  const args = process.argv.slice(2);
  const { topicArg, audition, segments, minutes, from } = parseArgs(args);

  if (!topicArg) {
    printUsage();
    process.exit(1);
  }

  // Validate --segments
  if (!Number.isInteger(segments) || segments < 1) {
    console.error("Error: --segments must be a positive integer");
    process.exit(1);
  }

  // Validate --minutes
  if (!Number.isFinite(minutes) || minutes <= 0) {
    console.error("Error: --minutes must be a positive number");
    process.exit(1);
  }

  // Validate --from
  const validFrom = ["plan", "narration", "overlays", "tts"];
  if (!validFrom.includes(from)) {
    console.error(`Error: --from must be one of: ${validFrom.join(", ")}`);
    process.exit(1);
  }

  const slug = topicToSlug(topicArg);

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
    && topicCached.segmentCount === segments
    && topicCached.segmentPlans
    && topicCached.segmentPlans.length === segments;

  if (isCacheValid && from === "tts") {
    console.log(`[docu] Using cached topic data for "${topicCached.topic}" (generated ${topicCached.generatedAt})`);
    topicData = topicCached;
  } else {
    if (topicCached && !isCacheValid) {
      console.log(`[docu] Cached topic data stale (segments mismatch or missing segmentPlans) — regenerating`);
    }
    console.log(`[docu] Generating topic data: ${segments} segments, ${minutes} min target...`);
    topicData = await generateSegmentedTopicData(topicArg, slug, segments, minutes, {
      verbose: true,
      from: from as "plan" | "narration" | "overlays",
    });
    saveTopicData(topicData);
  }

  const { topic, sentences, overlaySpecs, segmentPlans } = topicData;

  if (audition) {
    console.log(`[docu] Running TTS audition for "${topic}"...`);
    await runTtsAudition(slug, sentences);
    console.log("[docu] Audition complete.");
    return;
  }

  await runFullPipeline(slug, topic, sentences, overlaySpecs, [], segmentPlans);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
