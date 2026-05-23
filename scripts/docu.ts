// Documentary pipeline orchestrator.
//
// Usage:
//   npx tsx --env-file=.env scripts/docu.ts <topic-or-slug>               → full pipeline
//   npx tsx --env-file=.env scripts/docu.ts <topic-or-slug> --audition    → audition only
//   npx tsx --env-file=.env scripts/docu.ts <topic-or-slug> --regen       → regenerate narration+overlays
//
// Replaces scripts/tts-docu.ts and scripts/download-docu-images.ts.

import { topicToSlug } from "../src/lib/shared/slug";
import { runTtsPipeline, runTtsAudition } from "../src/lib/docu/tts-pipeline";
import type { SentenceDef } from "../src/lib/docu/tts-pipeline";
import { runImagePipeline } from "../src/lib/docu/image-pipeline";
import type { ImageQuery } from "../src/lib/docu/image-pipeline";
import { generateDocuScriptsFile } from "../src/lib/docu/script-codegen";
import { scheduleShotsForSentences } from "../src/lib/docu/shot-scheduler";
import { resolveOverlays } from "../src/lib/docu/overlay-resolver";
import type { OverlaySpec } from "../src/lib/docu/overlay-resolver";
import { generateImageQueries, type ShotContext } from "../src/lib/docu/image-query-prompt";
import {
  runArticleCardPipeline,
  type ArticleCardSpec,
  type DocuArticleCard,
} from "../src/lib/docu/article-pipeline";
import {
  loadCachedTopicData,
  saveTopicData,
  generateTopicData,
  type TopicData,
} from "../src/lib/docu/topic-generator";
import type { DocuScript } from "../src/components/docu/DocumentaryComposition";

const FPS = 30;

interface TopicModule {
  TOPIC: string;
  SLUG: string;
  SENTENCES: SentenceDef[];
  OVERLAY_SPECS: OverlaySpec[];
  IMAGE_QUERIES: ImageQuery[];
  ARTICLE_CARDS?: ArticleCardSpec[];
}

const TOPIC_IMPORTS: Record<string, () => Promise<TopicModule>> = {
  "how-the-fed-controls-your-money": () =>
    import("../src/lib/docu/topics/how-the-fed-controls-your-money.js") as Promise<TopicModule>,
};

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
  const matched: string[] = [];

  for (const [niche, keywords] of Object.entries(ALLOWED_NICHES)) {
    for (const kw of keywords) {
      if (target.includes(kw.toLowerCase())) {
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

// ── Main ─────────────────────────────────────────────────────────────────

async function runFullPipeline(
  slug: string,
  topic: string,
  sentences: SentenceDef[],
  overlaySpecs: OverlaySpec[],
  imageQueries: ImageQuery[],
  articleCardSpecs: ArticleCardSpec[],
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
    // Hand-authored path: use existing queries directly
    console.log(`\n[docu] Using ${imageQueries.length} hand-authored image queries`);
    finalImageQueries = imageQueries;
  } else {
    // Generation path: LLM-generate queries from shot context
    console.log(`\n[docu] Generating image queries for ${shots.length} shots...`);
    const shotContexts: ShotContext[] = shots.map((sh, i) => {
      const sentIdx = sentenceFrameRanges.findIndex(
        (s) => s.startFrame <= sh.startFrame && sh.startFrame < s.endFrame,
      );
      const sent = sentIdx >= 0 ? sentences[sentIdx] : sentences[0];
      return {
        shotIndex: i,
        palette: sh.palette,
        sentenceText: sent.text,
      };
    });
    finalImageQueries = await generateImageQueries(shotContexts);
    console.log(`[docu] Generated ${finalImageQueries.length} image queries`);
  }

  // 4. Image pipeline
  console.log(`\n[docu] Downloading images...`);
  const imageResult = await runImagePipeline(slug, finalImageQueries);
  console.log(`[docu] Downloaded ${imageResult.downloadedCount} images`);

  // 4.5 Article card pipeline
  const articleCards = runArticleCardPipeline(slug, articleCardSpecs);

  // 5. Overlay resolution
  const overlays = resolveOverlays(overlaySpecs, wordTimings, FPS);

  // 6. Build DocuScript
  const docuScript: DocuScript = {
    slug,
    topic,
    audioPath: `audio/docu/${slug}.wav`,
    backgroundMusicPath: "background-music/scott-buckley-permafrost(chosic.com).mp3",
    durationInFrames: durationFrames,
    fps: 30,
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
        shots: shots.map((sh, i) => ({
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
    articleCards,
  };

  // 7. Codegen
  console.log(`\n[docu] Generating docu-scripts.ts...`);
  generateDocuScriptsFile([docuScript]);

  console.log(
    `\n[docu] Done. Duration: ${durationSeconds.toFixed(1)}s, Frames: ${durationFrames}, ` +
    `Shots: ${shots.length}, Words: ${wordTimings.length}`,
  );
  console.log("[docu] docu-scripts.ts updated — open studio to render");
}

async function main() {
  const args = process.argv.slice(2);
  const audition = args.includes("--audition");
  const regen = args.includes("--regen");
  const topicArg = args.find((a) => a !== "--audition" && a !== "--regen");

  if (!topicArg) {
    console.error("Usage: npx tsx --env-file=.env scripts/docu.ts <topic-or-slug> [--audition] [--regen]");
    console.error("Available hand-authored slugs:");
    for (const s of Object.keys(TOPIC_IMPORTS)) {
      console.error(`  ${s}`);
    }
    process.exit(1);
  }

  const slug = topicToSlug(topicArg);

  // Niche allowlist gate (skip for hand-authored slugs)
  if (!TOPIC_IMPORTS[slug]) {
    const { allowed, niches } = checkNicheAllowlist(slug, topicArg);
    if (!allowed) {
      console.error(`Error: topic "${topicArg}" (slug: "${slug}") is not in an allowed niche.`);
      console.error(`Allowed niches: ${niches}`);
      process.exit(1);
    }
  }

  // ── Hand-authored path ────────────────────────────────────────────
  const loader = TOPIC_IMPORTS[slug];
  if (loader) {
    const topic: TopicModule = await loader();
    const { TOPIC, SENTENCES, OVERLAY_SPECS, IMAGE_QUERIES, ARTICLE_CARDS: articleCardSpecs } = topic;

    if (audition) {
      console.log(`[docu] Running TTS audition for "${TOPIC}"...`);
      await runTtsAudition(slug, SENTENCES);
      console.log("[docu] Audition complete.");
      return;
    }

    await runFullPipeline(slug, TOPIC, SENTENCES, OVERLAY_SPECS, IMAGE_QUERIES, articleCardSpecs ?? []);
    return;
  }

  // ── LLM generation path ───────────────────────────────────────────
  let topicData: TopicData;

  if (regen) {
    console.log(`[docu] --regen: regenerating narration + overlays for "${topicArg}"...`);
    topicData = await generateTopicData(topicArg, slug, { verbose: true });
    saveTopicData(topicData);
  } else {
    const cached = loadCachedTopicData(slug);
    if (cached) {
      console.log(`[docu] Using cached topic data for "${cached.topic}" (generated ${cached.generatedAt})`);
      topicData = cached;
    } else {
      console.log(`[docu] No cached topic data for "${topicArg}" — generating...`);
      topicData = await generateTopicData(topicArg, slug, { verbose: true });
      saveTopicData(topicData);
    }
  }

  const { topic, sentences, overlaySpecs } = topicData;

  if (audition) {
    console.log(`[docu] Running TTS audition for "${topic}"...`);
    await runTtsAudition(slug, sentences);
    console.log("[docu] Audition complete.");
    return;
  }

  // Image queries are generated in runFullPipeline after TTS+scheduling
  await runFullPipeline(slug, topic, sentences, overlaySpecs, [], []);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
