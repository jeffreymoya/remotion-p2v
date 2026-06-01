import fs from "node:fs";
import { z } from "zod";
import { traceable, getCurrentRunTree } from "langsmith/traceable";
import { enrichCurrentRun } from "../tracing";
import { topicToSlug } from "../shared/slug";
import {
  loadCachedResearchBundle,
  saveResearchBundle,
  runResearchPhase,
} from "../shared/research/research-pipeline";
import type { ResearchBundle } from "../shared/research/research-schema";
import type { Anchor } from "../shared/research/research-schema";
import type { SentenceDef } from "./tts-pipeline";
import type { OverlaySpec } from "./overlays/registry";
import { OverlaySpecSchema } from "./overlays/registry";
import type { DataItem } from "./overlays/types";
import { DataItemSchema } from "./overlays/types";
import { generateSegmentNarration, validateNarrationStyle } from "./narration-prompt";
import { generateSegmentOverlaySelections } from "./overlay-prompt";
import { extractDataItems } from "./metric-extraction-prompt";
import { SENTENCES_PER_MINUTE, SEGMENT_IMAGE_QUERY_CONCURRENCY } from "../config";
import { generateSpine, computeSentenceTargets } from "./segment-plan-prompt";
import type { DocuSegmentPlan, SceneSpec, StorySpine } from "./segment-types";
import { generateYouTubeClipSpecs } from "./youtube-clip-prompt";
import { gateNarrationFidelity } from "./narration-fidelity-gate";
import { gateStoryStructure } from "./story-structure-gate";
import { gateInfotainmentVoice } from "./infotainment-voice-gate";
import type { YouTubeClipSpec, ClipCandidateInfo } from "./youtube-pipeline";
import { readCachedJson, writeCachedJson } from "./pipeline";
import type { VarietyAssignment } from "./variety-controller";

export interface TopicData {
  topic: string;
  slug: string;
  generatedAt: string;
  sentences: SentenceDef[];
  overlaySpecs: OverlaySpec[];
  dataItems?: DataItem[];
  segmentCount?: number;
  segmentPlans?: DocuSegmentPlan[];
  youtubeClipSpecs?: YouTubeClipSpec[];
  clipCandidateInfo?: ClipCandidateInfo[];
}

const TopicDataSchema = z.object({
  topic: z.string(),
  slug: z.string(),
  generatedAt: z.string(),
  sentences: z.array(z.object({
    text: z.string().min(1),
    emphasis: z.array(z.string()).min(1),
    palette: z.enum(["cool-tech", "warm-real"]),
  })),
  overlaySpecs: z.array(OverlaySpecSchema),
  dataItems: z.array(DataItemSchema).optional(),
  segmentCount: z.number().int().positive().optional(),
  segmentPlans: z.array(z.object({
    index: z.number().int().min(0),
    title: z.string(),
    role: z.string().optional(),
    intent: z.string(),
    targetSentenceCount: z.number().int().positive(),
    assignedAnchorIds: z.array(z.string()),
  })).optional(),
  youtubeClipSpecs: z.array(z.object({
    sentenceIndex: z.number().int().min(0),
    searchQuery: z.string().min(1),
    targetPhrases: z.array(z.string()).min(1),
    leadSec: z.number().positive().optional(),
    trailSec: z.number().positive().optional(),
    rationale: z.string().optional(),
    transformationNote: z.string().optional(),
  })).max(5).optional(),
  clipCandidateInfo: z.array(z.object({
    sentenceIndex: z.number().int().min(0),
    anchorId: z.string(),
    anchorClaim: z.string(),
    personName: z.string().optional(),
    sourceLabel: z.string().optional(),
  })).optional(),
});

const PROMPTS_DIR = "prompts/docu";

export function topicDataPath(slug: string): string {
  return `${PROMPTS_DIR}/${slug}-topic.json`;
}

function planCachePath(slug: string): string {
  return `${PROMPTS_DIR}/${slug}-plan.json`;
}

function dataItemsCachePath(slug: string): string {
  return `${PROMPTS_DIR}/${slug}-data-items.json`;
}

function segmentNarrationCachePath(slug: string, segIndex: number): string {
  return `${PROMPTS_DIR}/${slug}-seg-${String(segIndex).padStart(2, "0")}-narration.json`;
}

function segmentOverlayCachePath(slug: string, segIndex: number): string {
  return `${PROMPTS_DIR}/${slug}-seg-${String(segIndex).padStart(2, "0")}-overlays.json`;
}

function youtubeClipCachePath(slug: string): string {
  return `${PROMPTS_DIR}/${slug}-youtube-clips.json`;
}

function loadYoutubeClipSpecs(slug: string): YouTubeClipSpec[] | null {
  return readCachedJson<YouTubeClipSpec[]>(youtubeClipCachePath(slug));
}

function saveYoutubeClipSpecs(slug: string, specs: YouTubeClipSpec[]): void {
  writeCachedJson(youtubeClipCachePath(slug), specs);
}

export function loadCachedTopicData(slug: string): TopicData | null {
  const p = topicDataPath(slug);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    return TopicDataSchema.parse(raw) as TopicData;
  } catch {
    console.log(`  [topic] cached topic data corrupt — will regenerate`);
    return null;
  }
}

export function saveTopicData(data: TopicData): void {
  fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  const p = topicDataPath(data.slug);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  const extra = data.segmentPlans ? `, ${data.segmentPlans.length} segments` : "";
  const di = data.dataItems ? `, ${data.dataItems.length} data items` : "";
  console.log(`  [topic] saved: ${p} (${data.sentences.length} sentences, ${data.overlaySpecs.length} overlays${di}${extra})`);
}

function loadCachedDataItems(slug: string): DataItem[] | null {
  return readCachedJson(dataItemsCachePath(slug), z.array(DataItemSchema)) as DataItem[] | null;
}

function saveCachedDataItems(slug: string, items: DataItem[]): void {
  writeCachedJson(dataItemsCachePath(slug), items);
}

// ── Segmented pipeline ──────────────────────────────────────────────────

function loadCachedPlan(slug: string): StorySpine | null {
  const p = planCachePath(slug);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    if (Array.isArray(raw)) {
      console.log("[topic] Cached plan is v1 (array) — regenerating with spine");
      return null;
    }
    if (raw.schemaVersion !== 2) {
      console.log(`[topic] Cached plan schemaVersion=${raw.schemaVersion} — spine schema bump, regenerating`);
      return null;
    }
    return raw as StorySpine;
  } catch {
    return null;
  }
}

function saveCachedPlan(slug: string, spine: StorySpine): void {
  writeCachedJson(planCachePath(slug), spine);
}

function loadCachedSegmentNarration(slug: string, segIndex: number): SentenceDef[] | null {
  return readCachedJson<SentenceDef[]>(segmentNarrationCachePath(slug, segIndex));
}

function saveCachedSegmentNarration(slug: string, segIndex: number, sentences: SentenceDef[]): void {
  writeCachedJson(segmentNarrationCachePath(slug, segIndex), sentences);
}

function loadCachedSegmentOverlays(slug: string, segIndex: number): OverlaySpec[] | null {
  return readCachedJson<OverlaySpec[]>(segmentOverlayCachePath(slug, segIndex));
}

function saveCachedSegmentOverlays(slug: string, segIndex: number, overlays: OverlaySpec[]): void {
  writeCachedJson(segmentOverlayCachePath(slug, segIndex), overlays);
}

function filterAnchorsByIds(anchors: readonly Anchor[], ids: string[]): Anchor[] {
  const idSet = new Set(ids);
  return anchors.filter((a) => idSet.has(a.id));
}

function filterDataItemsByAnchors(items: DataItem[], anchorIds: string[]): DataItem[] {
  const idSet = new Set(anchorIds);
  return items.filter((di) => idSet.has(di.sourceAnchorId));
}

function buildSourceLabel(anchor: Anchor | undefined): string | undefined {
  const work = anchor?.attribution.work;
  const year = anchor?.attribution.year;
  if (work && year) return `${work}, ${year}`;
  return work;
}

import { boundedMap } from "../shared/concurrency";

function recordGateOutcome(gateName: string, beforeTexts: string[], afterSentences: SentenceDef[]): void {
  const rewriteCount = afterSentences.filter((s, i) => s.text !== beforeTexts[i]).length;
  const pass = rewriteCount === 0;
  const run = getCurrentRunTree(true);
  if (!run) return;
  run.metadata = {
    ...run.metadata,
    [`gate_${gateName}_pass`]: pass,
    [`gate_${gateName}_rewrites`]: rewriteCount,
  };
  run.tags = [...(run.tags ?? []), `gate:${gateName}:${pass ? "pass" : "rewrite"}`];
}

export interface SegmentedTopicOpts {
  verbose?: boolean;
  /** Resume from a specific phase: "plan" | "narration" | "overlays" | "youtube" */
  from?: "plan" | "narration" | "overlays" | "youtube";
  /** Stop after a specific phase and return without running later phases. */
  only?: "plan" | "narration" | "overlays" | "youtube";
  /** Variety assignment (arc forces the spine structure; opener shapes narration). */
  variety?: VarietyAssignment;
}

export const generateSegmentedTopicData = traceable(
  async function generateSegmentedTopicData_impl(
  topic: string,
  slug: string,
  segmentCount: number,
  targetMinutes: number,
  opts?: SegmentedTopicOpts,
): Promise<TopicData> {
  enrichCurrentRun({ slug, topic });

  const totalSentences = Math.round(targetMinutes * SENTENCES_PER_MINUTE);
  const from = opts?.from ?? "overlays";
  const only = opts?.only;

  const earlyReturn = (partial: Partial<TopicData>): TopicData => ({
    topic,
    slug,
    generatedAt: new Date().toISOString(),
    sentences: [],
    overlaySpecs: [],
    segmentCount,
    ...partial,
  });

  // 1. Research (unchanged)
  let researchBundle: ResearchBundle;
  const cached = loadCachedResearchBundle(slug);
  if (cached) {
    researchBundle = cached;
    console.log(`[topic] Using cached research bundle (${researchBundle.anchors.length} anchors)`);
  } else {
    console.log(`[topic] Running research phase for "${topic}"...`);
    researchBundle = await runResearchPhase(topic, slug, 1, { verbose: opts?.verbose });
    saveResearchBundle(researchBundle);
  }

  const verifiedAnchors = researchBundle.anchors.filter((a) => a.status === "verified");
  console.log(`[topic] ${verifiedAnchors.length} verified anchors available for ${segmentCount} segments (${totalSentences} total sentences for ${targetMinutes} min)`);

  if (verifiedAnchors.length === 0) {
    throw new Error(
      `[topic] No verified anchors from research — cannot produce data-driven content. ` +
      `Run research phase first or check Exa/Serper API keys.`
    );
  }

  // 2. Story spine
  let spine: StorySpine;
  if (from === "plan") {
    console.log(`[topic] --from plan: regenerating story spine...`);
    spine = await generateSpine(topic, totalSentences, segmentCount, verifiedAnchors, { verbose: opts?.verbose, requiredArc: opts?.variety?.arc });
    saveCachedPlan(slug, spine);
  } else {
    const cachedPlan = loadCachedPlan(slug);
    const cachedTotal = cachedPlan?.segments.reduce((s, p) => s + p.targetSentenceCount, 0) ?? 0;
    if (cachedPlan && cachedPlan.segments.length === segmentCount && cachedTotal === totalSentences) {
      spine = cachedPlan;
      console.log(`[topic] Using cached story spine (${spine.segments.length} scenes, structure=${spine.primaryStructure})`);
    } else {
      if (cachedPlan) {
        console.log(`[topic] Cached plan stale (len=${cachedPlan.segments.length}, cachedSent=${cachedTotal}, expectedSent=${totalSentences}) — regenerating`);
      } else {
        console.log(`[topic] Generating story spine...`);
      }
      spine = await generateSpine(topic, totalSentences, segmentCount, verifiedAnchors, { verbose: opts?.verbose, requiredArc: opts?.variety?.arc });
      saveCachedPlan(slug, spine);
    }
  }

  if (only === "plan") {
    console.log(`[topic] --only plan: stopping after spine.`);
    return earlyReturn({ segmentPlans: spine.segments });
  }

  // 3. Narration pass — SEQUENTIAL (priorContext threading)
  enrichCurrentRun({ slug, topic, phase: "narration" });
  let allSentences: SentenceDef[] = [];
  const regenerateNarration = from === "plan" || from === "narration";

  if (regenerateNarration) {
    console.log(`[topic] --from ${from}: regenerating all segment narrations...`);
  }

  for (let i = 0; i < spine.segments.length; i++) {
    enrichCurrentRun({ segmentIndex: i });
    const scene = spine.segments[i];
    const segAnchors = filterAnchorsByIds(verifiedAnchors, scene.assignedAnchorIds);

    let segSentences: SentenceDef[];
    if (!regenerateNarration) {
      const cached = loadCachedSegmentNarration(slug, i);
      if (cached && cached.length === scene.targetSentenceCount) {
        segSentences = cached;
        console.log(`[topic]   seg-${String(i).padStart(2, "0")}: cached ${segSentences.length} sentences`);
        allSentences.push(...segSentences);
        continue;
      }
    }

    const priorContext = allSentences.length > 0
      ? allSentences.slice(-2).map((s) => s.text).join(" ")
      : "";

    console.log(`[topic]   seg-${String(i).padStart(2, "0")}: generating ${scene.targetSentenceCount} sentences (${scene.title}, ${scene.arcRole})...`);
    segSentences = await generateSegmentNarration(
      topic, scene, segAnchors, priorContext, {
        verbose: opts?.verbose,
        isQuoteScene: spine.quoteSceneIndex === i,
        clipCandidateAnchorIds: scene.clipCandidateAnchorIds ?? [],
        opener: opts?.variety?.opener,
      },
    );
    saveCachedSegmentNarration(slug, i, segSentences);
    allSentences.push(...segSentences);
  }

  // Citation-fidelity gate — verify narration against anchors, rewrite unsupported sentences
  enrichCurrentRun({ slug, topic, phase: "proofread" });
  if (verifiedAnchors.length > 0) {
    console.log(`[topic] Running citation-fidelity gate on ${allSentences.length} sentences against ${verifiedAnchors.length} anchors...`);
    const beforeFidelity = allSentences.map(s => s.text);
    allSentences = await gateNarrationFidelity(allSentences, verifiedAnchors, { verbose: opts?.verbose });
    recordGateOutcome("citation_fidelity", beforeFidelity, allSentences);
  }

  // Narration style gate — deterministic lint, log-only (no retry, no block)
  // Runs AFTER fidelity so corrected text is also checked.
  const styleViolations = validateNarrationStyle(allSentences);
  if (styleViolations.length > 0) {
    const summary = styleViolations.map((v) => `[${v.index}] ${v.rules.join(",")}`).join("; ");
    process.stderr.write(
      `[topic/narration-style] ${styleViolations.length} style violation(s) in ` +
      `${styleViolations.length} sentence(s) — rules: ${summary}\n`
    );
    if (opts?.verbose) {
      for (const v of styleViolations) {
        console.warn(`  [${v.index}] "${v.text}" — ${v.rules.join(", ")}`);
      }
    }
  }

  // Story-structure gate — deterministic + LLM judge (log+pass, never blocks render)
  console.log(`[topic] Running story-structure gate...`);
  const beforeStructure = allSentences.map(s => s.text);
  const structureResult = await gateStoryStructure(allSentences, spine, { verbose: opts?.verbose });
  allSentences = structureResult.sentences;
  recordGateOutcome("story_structure", beforeStructure, allSentences);

  // Infotainment-voice gate — LLM judge (log+pass, never blocks render)
  console.log(`[topic] Running infotainment-voice gate...`);
  const beforeVoice = allSentences.map(s => s.text);
  const voiceResult = await gateInfotainmentVoice(allSentences, { verbose: opts?.verbose });
  allSentences = voiceResult.sentences;
  recordGateOutcome("infotainment_voice", beforeVoice, allSentences);

  const expectedTotal = spine.segments.reduce((sum, p) => sum + p.targetSentenceCount, 0);
  if (allSentences.length !== expectedTotal) {
    throw new Error(
      `[topic] Assembled sentences count mismatch: expected ${expectedTotal} but got ${allSentences.length}`,
    );
  }

  if (only === "narration") {
    console.log(`[topic] --only narration: stopping after narration.`);
    return earlyReturn({ sentences: allSentences, segmentPlans: spine.segments });
  }

  // 4. Extraction — data items from all verified anchors
  enrichCurrentRun({ slug, topic, phase: "artdirect" });
  const regenerateOverlays = from === "plan" || from === "narration" || from === "overlays";
  let allDataItems: DataItem[];

  if (!regenerateOverlays) {
    const cachedDI = loadCachedDataItems(slug);
    if (cachedDI && cachedDI.length > 0) {
      allDataItems = cachedDI;
      console.log(`[topic] Using cached data items (${allDataItems.length} items)`);
    } else {
      console.log(`[topic] Extracting data items...`);
      allDataItems = await extractDataItems(verifiedAnchors, { verbose: opts?.verbose });
      if (allDataItems.length > 0) saveCachedDataItems(slug, allDataItems);
    }
  } else {
    console.log(`[topic] --from ${from}: re-extracting data items...`);
    allDataItems = await extractDataItems(verifiedAnchors, { verbose: opts?.verbose });
    if (allDataItems.length > 0) saveCachedDataItems(slug, allDataItems);
  }

  const hasNumericAnchors = verifiedAnchors.some(
    (a) => /\d/.test(a.claim + a.detail)
  );
  if (allDataItems.length === 0 && hasNumericAnchors) {
    throw new Error(
      `[topic] Metric extraction returned 0 items despite ${verifiedAnchors.length} numeric anchors. ` +
      `The metric-fidelity gate rejected everything — fix anchor data or re-run research.`
    );
  }

  // 5. Overlay pass — PARALLEL (no cross-segment dependency)
  enrichCurrentRun({ slug, topic, phase: "compose" });
  let allOverlays: OverlaySpec[] = [];
  const hasDataItems = allDataItems.length > 0;

  const segmentOverlayResults = await boundedMap(
    spine.segments,
    async (scene, i) => {
      if (!regenerateOverlays) {
        const cached = loadCachedSegmentOverlays(slug, i);
        if (cached) {
          const count = cached.length;
          console.log(`[topic]   seg-${String(i).padStart(2, "0")}: cached ${count} overlays`);
          return cached;
        }
      }

      const startIdx = spine.segments.slice(0, i).reduce((s, p) => s + p.targetSentenceCount, 0);
      const segSentences = allSentences.slice(startIdx, startIdx + scene.targetSentenceCount);
      const segAnchors = filterAnchorsByIds(verifiedAnchors, scene.assignedAnchorIds);
      const segDataItems = hasDataItems
        ? filterDataItemsByAnchors(allDataItems, scene.assignedAnchorIds)
        : [];

      console.log(`[topic]   seg-${String(i).padStart(2, "0")}: selecting overlays for ${segSentences.length} sentences (${segDataItems.length} data items)...`);
      const overlays = await generateSegmentOverlaySelections(scene, segSentences, segAnchors, segDataItems, { verbose: opts?.verbose });
      saveCachedSegmentOverlays(slug, i, overlays);
      return overlays;
    },
    SEGMENT_IMAGE_QUERY_CONCURRENCY,
  );

  for (const overlays of segmentOverlayResults) {
    allOverlays.push(...overlays);
  }

  if (only === "overlays") {
    console.log(`[topic] --only overlays: stopping after overlays.`);
    return earlyReturn({
      sentences: allSentences,
      overlaySpecs: allOverlays,
      dataItems: hasDataItems ? allDataItems : undefined,
      segmentPlans: spine.segments,
    });
  }

  // 6. YouTube clip annotation
  enrichCurrentRun({ slug, topic, phase: "videos" });
  const regenerateClips = regenerateOverlays || from === "youtube";

  const offsets: number[] = [];
  let running = 0;
  for (const seg of spine.segments) {
    offsets.push(running);
    running += seg.targetSentenceCount;
  }

  const clipCandidateInfo: ClipCandidateInfo[] = spine.segments
    .flatMap((seg, i) =>
      (seg.clipCandidateAnchorIds ?? []).map((anchorId) => {
        const anchor = verifiedAnchors.find((a) => a.id === anchorId);
        return {
          sentenceIndex: offsets[i] + seg.targetSentenceCount - 1,
          anchorId,
          anchorClaim: anchor?.claim ?? "",
          personName: anchor?.attribution.person,
          sourceLabel: buildSourceLabel(anchor),
        };
      })
    )
    .slice(0, 2);

  let youtubeClipSpecs: YouTubeClipSpec[];
  if (!regenerateClips) {
    youtubeClipSpecs = loadYoutubeClipSpecs(slug) ?? [];
    console.log(`[topic] Using cached YouTube clip specs (${youtubeClipSpecs.length} clips)`);
  } else {
    console.log(`[topic] --from ${from}: generating YouTube clip specs...`);
    youtubeClipSpecs = await generateYouTubeClipSpecs(
      allSentences, spine.segments, verifiedAnchors, topic, {
        verbose: opts?.verbose,
        clipCandidateInfo: clipCandidateInfo.length > 0 ? clipCandidateInfo : undefined,
      },
    );
    if (youtubeClipSpecs.length > 0) {
      saveYoutubeClipSpecs(slug, youtubeClipSpecs);
    }
  }

  return {
    topic,
    slug,
    generatedAt: new Date().toISOString(),
    sentences: allSentences,
    overlaySpecs: allOverlays,
    dataItems: hasDataItems ? allDataItems : undefined,
    segmentCount,
    segmentPlans: spine.segments,
    youtubeClipSpecs: youtubeClipSpecs.length > 0 ? youtubeClipSpecs : undefined,
    clipCandidateInfo: clipCandidateInfo.length > 0 ? clipCandidateInfo : undefined,
  };
},
{ run_type: "chain", name: "generateTopic" },
);
