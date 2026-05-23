import fs from "node:fs";
import { z } from "zod";
import { topicToSlug } from "../shared/slug";
import {
  loadCachedResearchBundle,
  saveResearchBundle,
  runResearchPhase,
} from "../shared/research/research-pipeline";
import type { ResearchBundle } from "../shared/research/research-schema";
import type { SentenceDef } from "./tts-pipeline";
import type { OverlaySpec } from "./overlay-resolver";
import { generateNarration } from "./narration-prompt";
import { generateOverlays } from "./overlay-prompt";

export interface TopicData {
  topic: string;
  slug: string;
  generatedAt: string;
  sentences: SentenceDef[];
  overlaySpecs: OverlaySpec[];
}

const TopicDataSchema = z.object({
  topic: z.string(),
  slug: z.string(),
  generatedAt: z.string(),
  sentences: z.array(z.object({
    text: z.string().min(1),
    emphasis: z.array(z.string()).min(1),
    palette: z.enum(["cool-tech", "warm-real"]),
  })).length(20),
  overlaySpecs: z.array(z.object({
    type: z.enum(["headline-card", "kinetic-number"]),
    text: z.string().min(1),
    value: z.number().optional(),
    unit: z.enum(["$", "%", "x", "T", "B"]).optional(),
    source: z.string().optional(),
    palette: z.enum(["cool-tech", "warm-real"]),
    anchorPhrase: z.string().min(1),
    holdSec: z.number().positive(),
    leadSec: z.number().optional(),
  })),
});

const PROMPTS_DIR = "prompts/docu";

export function topicDataPath(slug: string): string {
  return `${PROMPTS_DIR}/${slug}-topic.json`;
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
  console.log(`  [topic] saved: ${p} (${data.sentences.length} sentences, ${data.overlaySpecs.length} overlays)`);
}

export async function generateTopicData(
  topic: string,
  slug: string,
  opts?: { research?: ResearchBundle; verbose?: boolean },
): Promise<TopicData> {
  // 1. Research: load from cache or run fresh
  let researchBundle: ResearchBundle;
  if (opts?.research) {
    researchBundle = opts.research;
    console.log(`[topic] Using provided research bundle (${researchBundle.anchors.length} anchors)`);
  } else {
    const cached = loadCachedResearchBundle(slug);
    if (cached) {
      researchBundle = cached;
      console.log(`[topic] Using cached research bundle (${researchBundle.anchors.length} anchors)`);
    } else {
      console.log(`[topic] Running research phase for "${topic}"...`);
      researchBundle = await runResearchPhase(topic, slug, 1, { verbose: opts?.verbose });
      saveResearchBundle(researchBundle);
    }
  }

  const verifiedAnchors = researchBundle.anchors.filter((a) => a.status === "verified");
  console.log(`[topic] ${verifiedAnchors.length} verified anchors available`);

  // 2. Generate narration
  console.log(`[topic] Generating narration...`);
  const sentences = await generateNarration(topic, verifiedAnchors, { verbose: opts?.verbose });

  // 3. Generate overlays
  console.log(`[topic] Generating overlays...`);
  const overlaySpecs = await generateOverlays(sentences, verifiedAnchors, { verbose: opts?.verbose });

  return {
    topic,
    slug,
    generatedAt: new Date().toISOString(),
    sentences,
    overlaySpecs,
  };
}
