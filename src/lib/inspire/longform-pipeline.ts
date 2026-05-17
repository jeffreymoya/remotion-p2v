import { traceable } from "langsmith/traceable";
import fs from "node:fs";
import path from "node:path";
import {
  generateLongformScript,
  generateLongformPlan,
  generateChapterDraft,
  LongformPlanSchema,
} from "./longform-narration-prompt";
import type { LongformScript, LongformPlan } from "./longform-narration-prompt";
import { runInspirePipeline } from "./inspire-pipeline";
import type { InspirePhase } from "./inspire-pipeline";
import { combineSegments, concatWavBuffers } from "./combine-segments";
import { writeInspireJson } from "./write-inspire-script";
import { InspirationScriptSchema } from "./inspire-schema";
import type { InspirationScript } from "./inspire-schema";
import { checkSox, dreamyVoice, reverbOnlyVoice } from "./audio-postprocess";
import { loadRegistry, saveRegistry, recordSlug } from "./video-registry";
import {
  loadMusicRegistry,
  saveMusicRegistry,
  pickNextTrack,
  recordTrackUse,
} from "./music-registry";
import { refineChapter } from "./refine/refine-chapter";
import type { GateContext } from "./gates/gate-types";
import { FINAL_LINT_GATES } from "./gates/run-gates";
import { REFINE_MAX_REVISIONS, PROOFREAD_MAX_REDRAFTS_PER_CHAPTER, TTS_PROVIDER, RESEARCH_MIN_ANCHOR_COUNT } from "../config";
import type { ResearchBundle } from "./research/research-schema";
import {
  runResearchPhase,
  researchBundlePath,
  loadCachedResearchBundle,
  saveResearchBundle,
} from "./research/research-pipeline";
import { proofreadScript } from "./proofread/proofreader";
import type { ProofreadFindings } from "./proofread/proofread-types";
import { enrichCurrentRun } from "../tracing";

export interface LongformPipelineOptions {
  topic: string;
  slug: string;
  segmentCount: number;
  limit?: number;
  from?: InspirePhase | "refine" | "proofread";
  narrationOnly?: boolean;
  skipResearch?: boolean;
  skipProofread?: boolean;
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

// ── Longform plan: load or generate (research-grounded) ──────────────────

function planJsonPath(slug: string): string {
  return `prompts/inspire/${slug}-plan.json`;
}

function loadCachedPlan(slug: string, segmentCount: number): LongformPlan | null {
  const p = planJsonPath(slug);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    // Detect old shape (has `segments` instead of `chapters`)
    if ("segments" in raw && !("chapters" in raw)) {
      console.log(`  [plan] old format detected — regenerating`);
      fs.unlinkSync(p);
      return null;
    }
    const parsed = LongformPlanSchema.safeParse(raw);
    if (!parsed.success) {
      console.log(`  [plan] cached plan schema mismatch — regenerating`);
      fs.unlinkSync(p);
      return null;
    }
    const data = parsed.data;
    if (data.chapters.length !== segmentCount) {
      console.log(
        `  [plan] cached plan has ${data.chapters.length} chapters but ${segmentCount} requested — regenerating`,
      );
      fs.unlinkSync(p);
      return null;
    }
    return data;
  } catch {
    console.log(`  [plan] cached plan corrupt — regenerating`);
    fs.unlinkSync(p);
    return null;
  }
}

function savePlan(slug: string, plan: LongformPlan): void {
  fs.mkdirSync("prompts/inspire", { recursive: true });
  fs.writeFileSync(planJsonPath(slug), JSON.stringify(plan, null, 2));
  console.log(`  [plan] saved: ${planJsonPath(slug)}`);
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

// ── Proofreader re-draft helper ───────────────────────────────────────────

interface ProofreaderRedraftOpts {
  maxRevisions: number;
  verbose: boolean;
  topic: string;
  allowWords?: string[];
}

interface ChapterQualityReport {
  chapterIndex: number;
  slug: string;
  targetFeeling?: LongformPlan["chapters"][number]["targetFeeling"];
  recognitionMoment?: string;
  polarityArc?: LongformPlan["chapters"][number]["polarityArc"];
  unresolved: GateContext extends never ? never : import("./gates/gate-types").GateNote[];
  finalLintWarnings: import("./gates/gate-types").GateNote[];
  gates: Array<{
    gate: string;
    pass: boolean;
    notes: import("./gates/gate-types").GateNote[];
    metrics?: Record<string, string | number | boolean>;
  }>;
}

function buildChapterQualityReport(
  chapterIndex: number,
  slug: string,
  chapterPlan: LongformPlan["chapters"][number] | undefined,
  result: Awaited<ReturnType<typeof refineChapter>>,
): ChapterQualityReport {
  return {
    chapterIndex,
    slug,
    targetFeeling: chapterPlan?.targetFeeling,
    recognitionMoment: chapterPlan?.recognitionMoment,
    polarityArc: chapterPlan?.polarityArc,
    unresolved: result.lastResult.blockingNotes,
    finalLintWarnings: result.lastResult.warnNotes.filter(
      (note) => FINAL_LINT_GATES.some((gate) => gate.name === note.gate),
    ),
    gates: result.lastResult.results.map((gateResult) => ({
      gate: gateResult.gate,
      pass: gateResult.pass,
      notes: gateResult.notes,
      metrics: gateResult.metrics,
    })),
  };
}

async function applyProofreaderRedrafts(
  findings: ProofreadFindings,
  chapters: string[],
  plan: LongformPlan,
  research: ResearchBundle,
  slug: string,
  chapterRoles: Array<GateContext["chapterRole"]>,
  opts: ProofreaderRedraftOpts,
): Promise<string[]> {
  const updated = [...chapters];

  for (const redraft of findings.redrafts) {
    const i = redraft.chapterIndex;
    const chapterPlan = plan.chapters[i];
    const sSlug = segSlug(slug, i);

    console.log(`  [proofread] re-drafting chapter ${i + 1} (${redraft.notes.length} notes)...`);

    const ctx: GateContext = {
      topic: opts.topic,
      slug: sSlug,
      chapterIndex: i,
      chapterCount: chapters.length,
      chapterRole: chapterRoles[i] ?? "build",
      priorChapters: updated.filter((_, idx) => idx < i),
      allowWords: opts.allowWords,
      targetFeeling: chapterPlan?.targetFeeling,
      recognitionMoment: chapterPlan?.recognitionMoment,
      polarityArc: chapterPlan?.polarityArc,
    };

    const result = await refineChapter(ctx, updated[i], {
      maxRevisions: opts.maxRevisions,
      verbose: opts.verbose,
      chapterTitle: chapterPlan?.title ?? `Chapter ${i + 1}`,
      chapterRole: chapterPlan?.role ?? chapterRoles[i] ?? "build",
      chapterIntent: chapterPlan?.intent ?? `Chapter ${i + 1}`,
      sceneSeed: chapterPlan?.sceneSeed ?? `Chapter ${i + 1}`,
      topic: opts.topic,
      targetFeeling: chapterPlan?.targetFeeling,
      recognitionMoment: chapterPlan?.recognitionMoment,
      polarityArc: chapterPlan?.polarityArc,
      slug: sSlug,
      additionalNotes: redraft.notes,
      priorChapters: updated.filter((_, idx) => idx < i),
    });

    updated[i] = result.final;
    seedNarrationFile(sSlug, result.final);
  }

  return updated;
}

// ── Main longform pipeline ────────────────────────────────────────────────

async function runLongformPipelineImpl(
  options: LongformPipelineOptions,
): Promise<InspirationScript | null> {
  const { topic, slug, segmentCount, verbose } = options;
  enrichCurrentRun({ slug, topic });
  const limit = options.limit ?? segmentCount;
  const processCount = Math.min(limit, segmentCount);
  const maxRevisions = options.maxRevisions ?? REFINE_MAX_REVISIONS;
  const skipResearch = options.skipResearch ?? false;
  const narrationOnly = options.narrationOnly ?? false;

  const forceResearch = options.from === "research";
  const forcePlan = options.from === "plan" || forceResearch;
  const forceRegenerate = options.from === "narration" || forcePlan;

  const skipRefine = options.from !== undefined
    && options.from !== "narration"
    && options.from !== "refine"
    && options.from !== "research"
    && options.from !== "plan"
    && options.from !== "proofread";

  const skipProofread = options.skipProofread ?? false;
  const forceProofread = options.from === "proofread";

  // Narration-only runs stop before audio combine and do not require sox.
  if (!narrationOnly) {
    checkSox();
  }

  // Segment pipelines always start from "tts" since narration is seeded externally.
  // If the user requests --from=videos or later, propagate that to each segment.
  const segFrom: InspirePhase =
    !options.from || options.from === "narration" || options.from === "refine"
    || options.from === "research" || options.from === "plan"
    || options.from === "proofread"
      ? "tts"
      : options.from;

  console.log(
    `\n━━ Longform Pipeline: "${topic}" — ${segmentCount} segments, processing ${processCount} ━━\n`,
  );

  // ── Phase R: Research ──────────────────────────────────────────────────
  let research: ResearchBundle | null = null;

  if (!skipResearch) {
    if (forceResearch || !fs.existsSync(researchBundlePath(slug))) {
      console.log(`\n── Research: brainstorm + verify anchors ──`);
      research = await runResearchPhase(topic, slug, segmentCount, { verbose });
      saveResearchBundle(research);
    } else {
      research = loadCachedResearchBundle(slug);
      if (research) {
        console.log(
          `  [research] loaded cached bundle: ${researchBundlePath(slug)} (${research.anchors.length} anchors)`,
        );
      }
    }

    // Verify anchor density: require at least RESEARCH_MIN_ANCHOR_COUNT * 1.5 verified anchors
    if (research) {
      const verifiedCount = research.anchors.filter((a) => a.status === "verified").length;
      const requiredCount = Math.ceil(RESEARCH_MIN_ANCHOR_COUNT * 1.5);
      if (verifiedCount < requiredCount) {
        console.warn(
          `  [research] WARNING: only ${verifiedCount} verified anchors (need ${requiredCount}). ` +
          `Chapters need denser citation pool. Consider re-running research.`,
        );
      }
      // Log unverified/dropped anchors
      const unverified = research.anchors.filter((a) => a.status !== "verified");
      if (unverified.length > 0 && verbose) {
        console.log(`  [research] ${unverified.length} anchor(s) not verified:`);
        for (const a of unverified) {
          console.log(`    - [${a.id}] ${a.claim.slice(0, 60)} (${a.status})`);
        }
      }
    }
  }

  // ── Phase P: Plan (research-grounded) ─────────────────────────────────
  let plan: LongformPlan | null = null;

  if (research) {
    if (forcePlan || !loadCachedPlan(slug, segmentCount)) {
      console.log(`\n── Plan: assigning anchors to chapters ──`);
      plan = await generateLongformPlan(topic, segmentCount, research, { verbose });
      savePlan(slug, plan);
    } else {
      plan = loadCachedPlan(slug, segmentCount);
      if (plan) {
        console.log(`  [plan] loaded cached plan: ${planJsonPath(slug)}`);
      }
    }
  }

  // ── Phase 0: Narration generation ─────────────────────────────────────
  // Two paths: research-grounded (plan+draft) or legacy (monolithic script)
  let longformScript: LongformScript;

  if (plan && research) {
    // Research-grounded path: generate per-chapter drafts
    console.log(`\n── Narration: research-grounded per-chapter drafts ──`);
    const priorChapters: string[] = [];
    const segments: Array<{ title: string; narration: string }> = [];

    for (let i = 0; i < segmentCount; i++) {
      const chapter = plan.chapters[i];
      const cached = segNarrationPath(segSlug(slug, i));

      if (!forceRegenerate && fs.existsSync(cached)) {
        const existing = fs.readFileSync(cached, "utf-8");
        segments.push({ title: chapter.title, narration: existing });
        priorChapters.push(existing);
        if (verbose) {
          console.log(`  [narration] chapter ${i + 1}: cached`);
        }
        continue;
      }

      console.log(`  [narration] chapter ${i + 1}: generating draft...`);
      const draft = await generateChapterDraft(plan, i, research, priorChapters, { verbose });
      if (verbose && draft.droppedAnchorIds.length > 0) {
        console.log(
          `  [narration] chapter ${i + 1}: dropped anchors ${draft.droppedAnchorIds.join(", ")}${draft.dropReason ? ` — ${draft.dropReason}` : ""}`,
        );
      }
      segments.push({ title: chapter.title, narration: draft.narration });
      priorChapters.push(draft.narration);
    }

    longformScript = { segmentCount, segments };

    // Save the longform JSON for compatibility
    fs.mkdirSync("prompts/inspire", { recursive: true });
    fs.writeFileSync(longformJsonPath(slug), JSON.stringify(longformScript, null, 2));
  } else {
    // Legacy path: monolithic script generation
    longformScript = await loadOrGenerateLongformScript(
      topic,
      slug,
      segmentCount,
      forceRegenerate,
      verbose,
    );
  }

  // Phase 0.5: Refine each chapter through deterministic gates
  const chapterRoles: Array<GateContext["chapterRole"]> = assignChapterRoles(processCount);
  const refinedNarrations: string[] = [];
  let chapterQualityReports: ChapterQualityReport[] = [];

  if (!skipRefine) {
    console.log(`\n── Refine: running deterministic gates (max ${maxRevisions} revisions) ──`);
  }

  for (let i = 0; i < processCount; i++) {
    const seg = longformScript.segments[i];
    const chapterPlan = plan?.chapters[i];

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
      targetFeeling: chapterPlan?.targetFeeling,
      recognitionMoment: chapterPlan?.recognitionMoment,
      polarityArc: chapterPlan?.polarityArc,
    };

    const result = await refineChapter(ctx, seg.narration, {
      maxRevisions,
      verbose,
      chapterTitle: chapterPlan?.title ?? seg.title,
      chapterRole: chapterPlan?.role ?? chapterRoles[i],
      chapterIntent: chapterPlan?.intent ?? `Chapter ${i + 1} of ${processCount}`,
      sceneSeed: chapterPlan?.sceneSeed ?? seg.title,
      topic,
      targetFeeling: chapterPlan?.targetFeeling,
      recognitionMoment: chapterPlan?.recognitionMoment,
      polarityArc: chapterPlan?.polarityArc,
      slug: segSlug(slug, i),
      priorChapters: refinedNarrations.slice(0, i),
    });

    refinedNarrations.push(result.final);
    chapterQualityReports = [
      ...chapterQualityReports,
      buildChapterQualityReport(i, segSlug(slug, i), chapterPlan, result),
    ];
    console.log(
      `  [refine] chapter ${i + 1}: ${result.lastResult.pass ? "PASS" : "FAIL"} after ${result.revisions} revision(s)`,
    );
  }

  // ── Phase P2: Cross-chapter proofread ──────────────────────────────────
  const proofreadPath = `prompts/inspire/${slug}-proofread.json`;

  if (!skipProofread && research && plan) {
    const proofreadStale = forceProofread || !fs.existsSync(proofreadPath)
      || refinedNarrations.some((_, i) => {
        const narPath = segNarrationPath(segSlug(slug, i));
        return fs.existsSync(narPath)
          && fs.existsSync(proofreadPath)
          && fs.statSync(narPath).mtimeMs > fs.statSync(proofreadPath).mtimeMs;
      });

    if (proofreadStale) {
      console.log(`\n── Proofread: cross-chapter consistency check ──`);
      const findings = await proofreadScript(refinedNarrations, plan, research, { verbose });
      fs.mkdirSync("prompts/inspire", { recursive: true });
      fs.writeFileSync(proofreadPath, JSON.stringify(findings, null, 2));

      if (!findings.pass && findings.redrafts.length > 0) {
        console.log(`  [proofread] ${findings.redrafts.length} chapter(s) need redrafts`);
        const updated = await applyProofreaderRedrafts(
          findings, refinedNarrations, plan, research, slug, chapterRoles, {
            maxRevisions: PROOFREAD_MAX_REDRAFTS_PER_CHAPTER,
            verbose,
            topic,
            allowWords: options.allowWords,
          },
        );
        // Replace refined narrations with updated versions
        for (let i = 0; i < updated.length; i++) {
          refinedNarrations[i] = updated[i];
        }

        // Re-run proofread to surface residual issues
        const recheck = await proofreadScript(refinedNarrations, plan, research, { verbose });
        fs.writeFileSync(proofreadPath, JSON.stringify(recheck, null, 2));
        if (!recheck.pass) {
          console.warn(`  [proofread] residual issues remain after one redraft round — review ${proofreadPath} before render`);
        }
      } else if (findings.pass) {
        console.log(`  [proofread] PASS — all cross-chapter gates satisfied`);
      } else {
        console.warn(`  [proofread] FAIL — no redrafts returned; continuing with unresolved findings — review ${proofreadPath}`);
      }
    } else {
      console.log(`  [proofread] using cached: ${proofreadPath}`);
    }
  }

  if (narrationOnly) {
    for (let i = 0; i < processCount; i++) {
      seedNarrationFile(segSlug(slug, i), refinedNarrations[i]);
    }

    console.log(`\n━━ Done. Narration files prepared for ${processCount} segment(s): ${slug} ━━\n`);
    return null;
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
  const postprocess = TTS_PROVIDER === "elevenlabs" ? reverbOnlyVoice : dreamyVoice;
  const combinedWav = postprocess(rawWav, slug);
  const postLabel = TTS_PROVIDER === "elevenlabs" ? "reverb-only" : "dreamy";
  const outAudioPath = combinedAudioPath(slug);
  fs.mkdirSync(path.dirname(outAudioPath), { recursive: true });
  fs.writeFileSync(outAudioPath, combinedWav);
  console.log(
    `  [combine] audio: ${outAudioPath} (${(combinedWav.length / 1_048_576).toFixed(1)} MB) [${postLabel}]`,
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
    ? {
        ...combined,
        backgroundMusicPath,
        qualityReport: {
          chapters: chapterQualityReports,
          proofread: {
            emotionalArc: research && plan && fs.existsSync(proofreadPath)
              ? (JSON.parse(fs.readFileSync(proofreadPath, "utf-8")) as ProofreadFindings).emotionalArc
              : undefined,
          },
        },
      }
    : {
        ...combined,
        qualityReport: {
          chapters: chapterQualityReports,
          proofread: {
            emotionalArc: research && plan && fs.existsSync(proofreadPath)
              ? (JSON.parse(fs.readFileSync(proofreadPath, "utf-8")) as ProofreadFindings).emotionalArc
              : undefined,
          },
        },
      };
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
