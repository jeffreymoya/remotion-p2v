import { traceable } from "langsmith/traceable";
import fs from "node:fs";
import path from "node:path";
import { generateLongformScript } from "./longform-narration-prompt";
import type { LongformScript } from "./longform-narration-prompt";
import { runInspirePipeline } from "./inspire-pipeline";
import type { InspirePhase } from "./inspire-pipeline";
import { combineSegments, concatWavBuffers } from "./combine-segments";
import { writeInspireJson } from "./write-inspire-script";
import { InspirationScriptSchema } from "./inspire-schema";
import type { InspirationScript } from "./inspire-schema";
import { checkSox, dreamyVoice } from "./audio-postprocess";
import { loadRegistry, saveRegistry, recordSlug } from "./video-registry";
import {
  loadMusicRegistry,
  saveMusicRegistry,
  pickNextTrack,
  recordTrackUse,
} from "./music-registry";
import { refineChapter } from "./refine/refine-chapter";
import type { GateContext } from "./gates/gate-types";
import { REFINE_MAX_REVISIONS } from "../config";

export interface LongformPipelineOptions {
  topic: string;
  slug: string;
  segmentCount: number;
  limit?: number;
  from?: InspirePhase | "refine";
  verbose: boolean;
  maxRevisions?: number;
  allowWords?: string[];
}

// ── Path helpers ──────────────────────────────────────────────────────────

function longformJsonPath(slug: string): string {
  return `prompts/inspire/${slug}-longform.json`;
}

function segSlug(rootSlug: string, index: number): string {
  return `${rootSlug}-seg-${String(index + 1).padStart(2, "0")}`;
}

// ── Chapter role assignment ───────────────────────────────────────────────

function assignChapterRoles(count: number): Array<GateContext["chapterRole"]> {
  if (count === 1) return ["open"];
  if (count === 2) return ["open", "land"];
  // First = open, last = land, second-to-last = turn, rest = build/complicate
  const roles: Array<GateContext["chapterRole"]> = new Array(count);
  roles[0] = "open";
  roles[count - 1] = "land";
  roles[count - 2] = "turn";
  for (let i = 1; i < count - 2; i++) {
    roles[i] = i % 2 === 1 ? "build" : "complicate";
  }
  return roles;
}

function segNarrationPath(segSlug: string): string {
  return `prompts/inspire/${segSlug}-narration.txt`;
}

function segAudioPath(segSlug: string): string {
  return `public/audio/inspire/${segSlug}.wav`;
}

function segTimingsPath(segSlug: string): string {
  return `prompts/inspire/${segSlug}-timings.json`;
}

function segClipPlanPath(segSlug: string): string {
  return `prompts/inspire/${segSlug}-clip-plan.json`;
}

function segArtDirectPath(segSlug: string): string {
  return `prompts/inspire/${segSlug}-artdirection.json`;
}

function combinedAudioPath(rootSlug: string): string {
  return `public/audio/inspire/${rootSlug}.wav`;
}

// ── Longform script: load or generate ────────────────────────────────────

function loadCachedLongformScript(
  slug: string,
  segmentCount: number,
): LongformScript | null {
  const jsonPath = longformJsonPath(slug);
  if (!fs.existsSync(jsonPath)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as LongformScript;
    if (data.segments.length !== segmentCount) {
      console.log(
        `  [longform] cached script has ${data.segments.length} segments but ${segmentCount} requested — regenerating`,
      );
      fs.unlinkSync(jsonPath);
      return null;
    }
    return data;
  } catch {
    console.log(`  [longform] cached script corrupt — regenerating`);
    fs.unlinkSync(jsonPath);
    return null;
  }
}

async function loadOrGenerateLongformScript(
  topic: string,
  slug: string,
  segmentCount: number,
  forceRegenerate: boolean,
  verbose: boolean,
): Promise<LongformScript> {
  if (forceRegenerate) {
    const jsonPath = longformJsonPath(slug);
    if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath);
      console.log(`  [longform] deleted cached script (from=narration)`);
    }
  }

  const cached = loadCachedLongformScript(slug, segmentCount);
  if (cached) {
    console.log(`  [longform] loaded cached script: ${longformJsonPath(slug)}`);
    return cached;
  }

  console.log(
    `  [longform] Generating ${segmentCount}-segment script for "${topic}"...`,
  );
  const script = await generateLongformScript(topic, segmentCount, { verbose });

  fs.mkdirSync("prompts/inspire", { recursive: true });
  fs.writeFileSync(longformJsonPath(slug), JSON.stringify(script, null, 2));
  console.log(`  [longform] saved: ${longformJsonPath(slug)}`);

  return script;
}

// ── Narration seeding with downstream cache invalidation ──────────────────

function seedNarrationFile(slug: string, narration: string): void {
  const narPath = segNarrationPath(slug);
  const existing = fs.existsSync(narPath)
    ? fs.readFileSync(narPath, "utf-8")
    : null;

  if (existing === narration) return;

  // Narration changed — invalidate TTS and clip-plan caches for this segment
  for (const p of [segAudioPath(slug), segTimingsPath(slug), segClipPlanPath(slug), segArtDirectPath(slug)]) {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`  [longform] invalidated (narration changed): ${p}`);
    }
  }

  fs.mkdirSync(path.dirname(narPath), { recursive: true });
  fs.writeFileSync(narPath, narration, "utf-8");
}

// ── Load a segment InspirationScript from cache ───────────────────────────

function loadSegmentScript(segSlug: string): InspirationScript {
  const jsonPath = `prompts/inspire/${segSlug}.json`;
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Segment script not found: ${jsonPath}`);
  }
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  return InspirationScriptSchema.parse(raw);
}

// ── Main longform pipeline ────────────────────────────────────────────────

async function runLongformPipelineImpl(
  options: LongformPipelineOptions,
): Promise<InspirationScript> {
  const { topic, slug, segmentCount, verbose } = options;
  const limit = options.limit ?? segmentCount;
  const processCount = Math.min(limit, segmentCount);
  const forceRegenerate = options.from === "narration";
  const maxRevisions = options.maxRevisions ?? REFINE_MAX_REVISIONS;
  const skipRefine = options.from !== undefined
    && options.from !== "narration"
    && options.from !== "refine";

  // Fail fast before any network calls if sox is missing.
  checkSox();

  // Segment pipelines always start from "tts" since narration is seeded externally.
  // If the user requests --from=videos or later, propagate that to each segment.
  const segFrom: InspirePhase =
    !options.from || options.from === "narration" || options.from === "refine"
      ? "tts"
      : options.from;

  console.log(
    `\n━━ Longform Pipeline: "${topic}" — ${segmentCount} segments, processing ${processCount} ━━\n`,
  );

  // Phase 0: Longform script generation
  const longformScript = await loadOrGenerateLongformScript(
    topic,
    slug,
    segmentCount,
    forceRegenerate,
    verbose,
  );

  // Phase 0.5: Refine each chapter through deterministic gates
  const chapterRoles: Array<GateContext["chapterRole"]> = assignChapterRoles(processCount);
  const refinedNarrations: string[] = [];

  if (!skipRefine) {
    console.log(`\n── Refine: running deterministic gates (max ${maxRevisions} revisions) ──`);
  }

  for (let i = 0; i < processCount; i++) {
    const seg = longformScript.segments[i];

    if (skipRefine) {
      refinedNarrations.push(seg.narration);
      continue;
    }

    const ctx: GateContext = {
      topic,
      slug: segSlug(slug, i),
      chapterIndex: i,
      chapterCount: processCount,
      chapterRole: chapterRoles[i],
      priorChapters: refinedNarrations.slice(),
      allowWords: options.allowWords,
    };

    const result = await refineChapter(ctx, seg.narration, {
      maxRevisions,
      verbose,
      chapterTitle: seg.title,
      chapterRole: chapterRoles[i],
      chapterIntent: `Chapter ${i + 1} of ${processCount}`,
      sceneSeed: seg.title,
      topic,
      slug: segSlug(slug, i),
    });

    refinedNarrations.push(result.final);
    console.log(
      `  [refine] chapter ${i + 1}: ${result.lastResult.pass ? "PASS" : "FAIL"} after ${result.revisions} revision(s)`,
    );
  }

  // Phases 1-5 per segment
  for (let i = 0; i < processCount; i++) {
    const seg = longformScript.segments[i];
    const sSlug = segSlug(slug, i);

    console.log(
      `\n── Segment ${i + 1}/${processCount}: "${seg.title}" (${sSlug}) ──`,
    );

    seedNarrationFile(sSlug, refinedNarrations[i]);

    await runInspirePipeline({
      topic: seg.title,
      slug: sSlug,
      from: segFrom,
      verbose,
      registryOptions: { skipRecordSlug: true },
    });
  }

  // Record root slug once for the whole longform composition
  const registry = loadRegistry();
  recordSlug(registry, slug);
  saveRegistry(registry);

  // Phase 6: Combine
  console.log(`\n── Combine: merging ${processCount} segments ──`);

  const segmentScripts = Array.from({ length: processCount }, (_, i) =>
    loadSegmentScript(segSlug(slug, i)),
  );

  const wavBuffers = Array.from({ length: processCount }, (_, i) => {
    const wavPath = segAudioPath(segSlug(slug, i));
    if (!fs.existsSync(wavPath)) {
      throw new Error(`Segment WAV not found: ${wavPath}`);
    }
    return fs.readFileSync(wavPath);
  });

  const rawWav = concatWavBuffers(wavBuffers);
  const combinedWav = dreamyVoice(rawWav, slug);
  const outAudioPath = combinedAudioPath(slug);
  fs.mkdirSync(path.dirname(outAudioPath), { recursive: true });
  fs.writeFileSync(outAudioPath, combinedWav);
  console.log(
    `  [combine] audio: ${outAudioPath} (${(combinedWav.length / 1_048_576).toFixed(1)} MB) [dreamy]`,
  );

  const combined = combineSegments(slug, topic, segmentScripts);

  // Background music: reuse cached track on reruns, otherwise LRU-pick
  const cachedJsonPath = `prompts/inspire/${slug}.json`;
  let backgroundMusicPath: string | undefined;
  if (fs.existsSync(cachedJsonPath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachedJsonPath, "utf-8"));
      backgroundMusicPath = cached.backgroundMusicPath;
    } catch {
      // ignore — will pick fresh
    }
  }
  if (!backgroundMusicPath) {
    const musicReg = loadMusicRegistry();
    const track = pickNextTrack(musicReg);
    if (track) {
      const updated = recordTrackUse(musicReg, track, slug);
      saveMusicRegistry(updated);
      backgroundMusicPath = track;
      console.log(`  [music] selected: ${track}`);
    } else {
      console.log(`  [music] no tracks found in public/background-music/`);
    }
  } else {
    console.log(`  [music] reusing cached: ${backgroundMusicPath}`);
  }

  const finalScript: InspirationScript = backgroundMusicPath
    ? { ...combined, backgroundMusicPath }
    : combined;
  const { path: jsonPath } = writeInspireJson(finalScript);

  console.log(`  [combine] script: ${jsonPath}`);
  console.log(
    `  [combine] duration: ${(combined.durationInFrames / 30 / 60).toFixed(1)} min (${combined.durationInFrames} frames)`,
  );
  console.log(`\n━━ Done. Composition ID: ${slug} ━━\n`);

  return combined;
}

export const runLongformPipeline = traceable(runLongformPipelineImpl, {
  name: "runLongformPipeline",
  run_type: "chain",
});
