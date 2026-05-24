import fs from "node:fs";
import { z } from "zod";
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
import { generateSegmentNarration } from "./narration-prompt";
import {
  generateSegmentOverlays,
  generateSegmentOverlaySelections,
} from "./overlay-prompt";
import { extractDataItems } from "./metric-extraction-prompt";
import { SENTENCES_PER_MINUTE, SEGMENT_IMAGE_QUERY_CONCURRENCY } from "../config";
import { generateSegmentPlan, computeSentenceTargets } from "./segment-plan-prompt";
import type { DocuSegmentPlan } from "./segment-types";

export interface TopicData {
  topic: string;
  slug: string;
  generatedAt: string;
  sentences: SentenceDef[];
  overlaySpecs: OverlaySpec[];
  dataItems?: DataItem[];
  segmentCount?: number;
  segmentPlans?: DocuSegmentPlan[];
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
    role: z.string(),
    intent: z.string(),
    targetSentenceCount: z.number().int().positive(),
    assignedAnchorIds: z.array(z.string()),
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
  const p = dataItemsCachePath(slug);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    return z.array(DataItemSchema).parse(raw) as DataItem[];
  } catch {
    return null;
  }
}

function saveCachedDataItems(slug: string, items: DataItem[]): void {
  fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  fs.writeFileSync(dataItemsCachePath(slug), JSON.stringify(items, null, 2));
}

// ── Segmented pipeline ──────────────────────────────────────────────────

function loadCachedPlan(slug: string): DocuSegmentPlan[] | null {
  const p = planCachePath(slug);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as DocuSegmentPlan[];
  } catch {
    return null;
  }
}

function saveCachedPlan(slug: string, plans: DocuSegmentPlan[]): void {
  fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  fs.writeFileSync(planCachePath(slug), JSON.stringify(plans, null, 2));
}

function loadCachedSegmentNarration(slug: string, segIndex: number): SentenceDef[] | null {
  const p = segmentNarrationCachePath(slug, segIndex);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as SentenceDef[];
  } catch {
    return null;
  }
}

function saveCachedSegmentNarration(slug: string, segIndex: number, sentences: SentenceDef[]): void {
  fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  fs.writeFileSync(segmentNarrationCachePath(slug, segIndex), JSON.stringify(sentences, null, 2));
}

function loadCachedSegmentOverlays(slug: string, segIndex: number): OverlaySpec[] | null {
  const p = segmentOverlayCachePath(slug, segIndex);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as OverlaySpec[];
  } catch {
    return null;
  }
}

function saveCachedSegmentOverlays(slug: string, segIndex: number, overlays: OverlaySpec[]): void {
  fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  fs.writeFileSync(segmentOverlayCachePath(slug, segIndex), JSON.stringify(overlays, null, 2));
}

function filterAnchorsByIds(anchors: readonly Anchor[], ids: string[]): Anchor[] {
  const idSet = new Set(ids);
  return anchors.filter((a) => idSet.has(a.id));
}

function filterDataItemsByAnchors(items: DataItem[], anchorIds: string[]): DataItem[] {
  const idSet = new Set(anchorIds);
  return items.filter((di) => idSet.has(di.sourceAnchorId));
}

import { boundedMap } from "../shared/concurrency";

export interface SegmentedTopicOpts {
  verbose?: boolean;
  /** Resume from a specific phase: "plan" | "narration" | "overlays" */
  from?: "plan" | "narration" | "overlays";
}

export async function generateSegmentedTopicData(
  topic: string,
  slug: string,
  segmentCount: number,
  targetMinutes: number,
  opts?: SegmentedTopicOpts,
): Promise<TopicData> {
  const totalSentences = Math.round(targetMinutes * SENTENCES_PER_MINUTE);
  const from = opts?.from ?? "overlays";

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

  // 2. Segment plan
  let segmentPlans: DocuSegmentPlan[];
  if (from === "plan") {
    console.log(`[topic] --from plan: regenerating segment plan...`);
    segmentPlans = await generateSegmentPlan(topic, totalSentences, segmentCount, verifiedAnchors, { verbose: opts?.verbose });
    saveCachedPlan(slug, segmentPlans);
  } else {
    const cachedPlan = loadCachedPlan(slug);
    const cachedTotal = cachedPlan?.reduce((s, p) => s + p.targetSentenceCount, 0) ?? 0;
    if (cachedPlan && cachedPlan.length === segmentCount && cachedTotal === totalSentences) {
      segmentPlans = cachedPlan;
      console.log(`[topic] Using cached segment plan (${segmentPlans.length} segments)`);
    } else {
      if (cachedPlan) {
        console.log(`[topic] Cached plan stale (len=${cachedPlan.length}, cachedSent=${cachedTotal}, expectedSent=${totalSentences}) — regenerating`);
      } else {
        console.log(`[topic] Generating segment plan...`);
      }
      segmentPlans = await generateSegmentPlan(topic, totalSentences, segmentCount, verifiedAnchors, { verbose: opts?.verbose });
      saveCachedPlan(slug, segmentPlans);
    }
  }

  // 3. Narration pass — SEQUENTIAL (priorContext threading)
  let allSentences: SentenceDef[] = [];
  const regenerateNarration = from === "plan" || from === "narration";

  if (regenerateNarration) {
    console.log(`[topic] --from ${from}: regenerating all segment narrations...`);
  }

  for (let i = 0; i < segmentPlans.length; i++) {
    const plan = segmentPlans[i];
    const segAnchors = filterAnchorsByIds(verifiedAnchors, plan.assignedAnchorIds);

    let segSentences: SentenceDef[];
    if (!regenerateNarration) {
      const cached = loadCachedSegmentNarration(slug, i);
      if (cached && cached.length === plan.targetSentenceCount) {
        segSentences = cached;
        console.log(`[topic]   seg-${String(i).padStart(2, "0")}: cached ${segSentences.length} sentences`);
        allSentences.push(...segSentences);
        continue;
      }
    }

    const priorContext = allSentences.length > 0
      ? allSentences.slice(-2).map((s) => s.text).join(" ")
      : "";

    console.log(`[topic]   seg-${String(i).padStart(2, "0")}: generating ${plan.targetSentenceCount} sentences (${plan.title}, ${plan.role})...`);
    segSentences = await generateSegmentNarration(
      topic, plan, segAnchors, priorContext, { verbose: opts?.verbose },
    );
    saveCachedSegmentNarration(slug, i, segSentences);
    allSentences.push(...segSentences);
  }

  const expectedTotal = segmentPlans.reduce((sum, p) => sum + p.targetSentenceCount, 0);
  if (allSentences.length !== expectedTotal) {
    throw new Error(
      `[topic] Assembled sentences count mismatch: expected ${expectedTotal} but got ${allSentences.length}`,
    );
  }

  // 4. Extraction — data items from all verified anchors
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

  // 5. Overlay pass — PARALLEL (no cross-segment dependency)
  let allOverlays: OverlaySpec[] = [];
  const hasDataItems = allDataItems.length > 0;

  const segmentOverlayResults = await boundedMap(
    segmentPlans,
    async (plan, i) => {
      if (!regenerateOverlays) {
        const cached = loadCachedSegmentOverlays(slug, i);
        if (cached) {
          const count = cached.length;
          console.log(`[topic]   seg-${String(i).padStart(2, "0")}: cached ${count} overlays`);
          return cached;
        }
      }

      const startIdx = segmentPlans.slice(0, i).reduce((s, p) => s + p.targetSentenceCount, 0);
      const segSentences = allSentences.slice(startIdx, startIdx + plan.targetSentenceCount);
      const segAnchors = filterAnchorsByIds(verifiedAnchors, plan.assignedAnchorIds);
      const segDataItems = hasDataItems
        ? filterDataItemsByAnchors(allDataItems, plan.assignedAnchorIds)
        : [];

      console.log(`[topic]   seg-${String(i).padStart(2, "0")}: selecting overlays for ${segSentences.length} sentences (${segDataItems.length} data items)...`);
      const overlays = segDataItems.length > 0
        ? await generateSegmentOverlaySelections(plan, segSentences, segAnchors, segDataItems, { verbose: opts?.verbose })
        : await generateSegmentOverlays(plan, segSentences, segAnchors, { verbose: opts?.verbose });
      saveCachedSegmentOverlays(slug, i, overlays);
      return overlays;
    },
    SEGMENT_IMAGE_QUERY_CONCURRENCY,
  );

  for (const overlays of segmentOverlayResults) {
    allOverlays.push(...overlays);
  }

  return {
    topic,
    slug,
    generatedAt: new Date().toISOString(),
    sentences: allSentences,
    overlaySpecs: allOverlays,
    dataItems: hasDataItems ? allDataItems : undefined,
    segmentCount,
    segmentPlans,
  };
}
