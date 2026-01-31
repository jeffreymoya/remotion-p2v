import path from "path";
import { z } from "zod";

import { viewportAnalysisPrompt } from "@/config/prompts/viewport.prompt";
import { Prisma } from "@/src/generated/storyflow";
import { storyflowPrisma } from "./prisma";
import { toJsonArray } from "./prisma-json";
import {
  Asset,
  DetectedRegion,
  Script,
  ScriptSegment,
  Viewport,
  ViewportKeyframe,
} from "./types";
import {
  FPS,
  countWords,
  WORDS_PER_MINUTE,
  DEFAULT_SEGMENT_DURATION_MS,
} from "../constants";
import { getSettings } from "./settings";
import { getProjectPaths } from "@/src/lib/paths";
import { aiGenerate } from "@/src/lib/services/ai";
import type { Milliseconds } from "@/src/lib/types/units";
import { ms } from "@/src/lib/types/units";

type SegmentTiming = {
  text: string;
  startMs: Milliseconds;
  endMs: Milliseconds;
  durationMs: Milliseconds;
  wpm: number;
};

const boundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const regionSchema = z.object({
  id: z.string(),
  label: z.string(),
  bounds: boundsSchema,
  salience: z.number().min(0).max(1),
});

const keyframeSchema = z.object({
  frameStart: z.number().int().nonnegative(),
  frameEnd: z.number().int().nonnegative(),
  viewport: z.object({
    centerX: z.number(),
    centerY: z.number(),
    zoom: z.number(),
  }),
  easing: z.enum([
    "linear",
    "easeIn",
    "easeOut",
    "easeInOut",
    "slowDramatic",
    "fastAction",
  ]),
  transitionDurationMs: z.number().int().nonnegative(),
});

const viewportResponseSchema = z.object({
  regions: z.array(regionSchema).min(1),
  keyframes: z.array(keyframeSchema).optional(),
});

function buildSegmentTimings(script: Script): SegmentTiming[] {
  const segments = (script.segments || []) as ScriptSegment[];
  const timings: SegmentTiming[] = [];
  let cursor = 0;

  for (const segment of segments) {
    const durationMs = ms(
      typeof segment.estimatedDuration === "number"
        ? segment.estimatedDuration * 1000
        : Math.max(DEFAULT_SEGMENT_DURATION_MS, Math.round((countWords(segment.text) / WORDS_PER_MINUTE.TIMELINE_FALLBACK) * 60000))
    );

    const startMs = ms(cursor);
    const endMs = ms(cursor + durationMs);

    timings.push({
      text: segment.text,
      startMs,
      endMs,
      durationMs,
      wpm: (countWords(segment.text) / durationMs) * 60000,
    });

    cursor = endMs;
  }

  return timings;
}

function fallbackRegions(): DetectedRegion[] {
  return [
    {
      id: "region-1",
      label: "Left focus",
      bounds: { x: 0.05, y: 0.2, width: 0.35, height: 0.6 },
      salience: 0.7,
    },
    {
      id: "region-2",
      label: "Center focus",
      bounds: { x: 0.35, y: 0.15, width: 0.3, height: 0.55 },
      salience: 0.9,
    },
    {
      id: "region-3",
      label: "Right focus",
      bounds: { x: 0.6, y: 0.2, width: 0.35, height: 0.6 },
      salience: 0.75,
    },
  ];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function pickZoomForRegion(region: DetectedRegion): number {
  const smallestSide = Math.min(region.bounds.width, region.bounds.height);
  const zoom = 1 / clamp(smallestSide || 0.5, 0.2, 1);
  return clamp(zoom, 1, 3.5);
}

function buildKeyframesFromRegions(
  regions: DetectedRegion[],
  timings: SegmentTiming[]
): ViewportKeyframe[] {
  if (!timings.length) {
    return [
      {
        frameStart: 0,
        frameEnd: 90,
        viewport: { centerX: 0.5, centerY: 0.5, zoom: 1 },
        easing: "easeInOut",
        transitionDurationMs: 800,
      },
    ];
  }

  const sortedRegions = [...regions].sort((a, b) => b.salience - a.salience);
  const keyframes: ViewportKeyframe[] = [
    {
      frameStart: 0,
      frameEnd: 30,
      viewport: { centerX: 0.5, centerY: 0.5, zoom: 1 },
      easing: "easeInOut",
      transitionDurationMs: 600,
    },
  ];

  let currentFrame = 30;
  timings.forEach((timing, idx) => {
    const region = sortedRegions[idx % sortedRegions.length];
    const frameDuration = Math.max(30, Math.round((timing.durationMs / 1000) * FPS));
    const frameStart = currentFrame;
    const frameEnd = currentFrame + frameDuration;

    keyframes.push({
      frameStart,
      frameEnd,
      viewport: {
        centerX: region.bounds.x + region.bounds.width / 2,
        centerY: region.bounds.y + region.bounds.height / 2,
        zoom: pickZoomForRegion(region),
      },
      easing: "easeInOut",
      transitionDurationMs: clamp(Math.round(timing.durationMs * 0.25), 300, 2000),
    });

    currentFrame = frameEnd;
  });

  return keyframes;
}

async function callGeminiViewport(
  projectId: string,
  imagePath: string,
  segmentTimings: SegmentTiming[]
): Promise<z.infer<typeof viewportResponseSchema>> {
  const settings = await getSettings();
  const prompt = viewportAnalysisPrompt(segmentTimings);
  const multimodalPrompt = `@${imagePath}\n\n${prompt}`;

  const { data } = await aiGenerate<z.infer<typeof viewportResponseSchema>>({
    projectId,
    operation: "viewport-generate",
    prompt: multimodalPrompt,
    model: settings.ai.proModel,
    outputFormat: "json",
    schema: viewportResponseSchema,
    metadata: { imagePath },
  });

  return data;
}

export async function generateViewportForProject(
  projectId: string,
  imageAssetId: string
): Promise<{ viewport: Viewport; source: "gemini" | "fallback" }> {
  const project = await storyflowPrisma.project.findByIdOrThrow(projectId, {
    include: { script: true, assets: true, viewport: true },
  });

  if (!project.script) {
    throw Object.assign(new Error("Script is required before generating viewport"), {
      status: 400,
    });
  }

  const imageAsset = (project.assets as Asset[] | undefined)?.find((a) => a.id === imageAssetId);
  if (!imageAsset) {
    throw Object.assign(new Error("Image asset not found for project"), { status: 404 });
  }

  const paths = getProjectPaths(projectId);
  const absoluteImagePath = path.join(paths.root, imageAsset.path.replace(/^\/projects\//, ""));
  const segmentTimings = buildSegmentTimings(project.script as unknown as Script);

  let regions: DetectedRegion[] = [];
  let keyframes: ViewportKeyframe[] = [];
  let source: "gemini" | "fallback" = "fallback";

  try {
    const aiResult = await callGeminiViewport(projectId, absoluteImagePath, segmentTimings);
    regions = aiResult.regions;
    keyframes =
      aiResult.keyframes && aiResult.keyframes.length > 0
        ? aiResult.keyframes
        : buildKeyframesFromRegions(regions, segmentTimings);
    source = "gemini";
  } catch (error) {
    console.warn("[viewport] Gemini generation failed, using fallback:", error);
    regions = fallbackRegions();
    keyframes = buildKeyframesFromRegions(regions, segmentTimings);
  }

  const viewport = await storyflowPrisma.viewport.upsert({
    where: { projectId },
    update: {
      imageAssetId,
      keyframes: (toJsonArray(keyframes) as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      regions: (toJsonArray(regions) as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
    create: {
      projectId,
      imageAssetId,
      keyframes: (toJsonArray(keyframes) as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      regions: (toJsonArray(regions) as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
  });

  if (project.status === "ASSETS_READY") {
    await storyflowPrisma.project.update({
      where: { id: projectId },
      data: { status: "VIEWPORT_READY" },
    });
  }

  return { viewport: viewport as unknown as Viewport, source };
}
