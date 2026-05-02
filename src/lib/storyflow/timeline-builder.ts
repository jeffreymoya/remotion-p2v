import { z } from "zod";
import { NotFoundError } from "@/app/api/lib";
import { storyflowPrisma } from "./prisma";
import {
  Asset,
  AssetMappings,
  ScriptSegment,
  SegmentViewport,
  ViewportKeyframe,
} from "./types";
import {
  AudioElement,
  BackgroundElement,
  MusicElement,
  TextElement,
  Timeline,
  ViewportAnimation,
  WordTiming,
  AspectRatio,
} from "./timeline-types";
import {
  msToFrames,
  framesToMs,
  WORDS_PER_MINUTE,
  MIN_SEGMENT_DURATION_MS,
  DEFAULT_SEGMENT_DURATION_MS,
  DEFAULT_MUSIC_DUCKING,
  countWords,
} from "../constants";
import { normalizeAssetMappings } from "./asset-mappings";
import { snapToSentenceBoundary } from "./word-timestamp-utils";

const SENTENCE_SNAP_TOLERANCE_MS = 300;
const CROSSFADE_FRAMES = 7;

// Zod schemas for validating DB JSON fields
const wordTimestampSchema = z.object({
  word: z.string(),
  startMs: z.number(),
  endMs: z.number(),
});

const scriptSegmentSchema = z.object({
  index: z.number(),
  text: z.string(),
  wordCount: z.number().optional(),
  estimatedDuration: z.number().optional(),
  audioUrl: z.string().optional(),
  actualDuration: z.number().optional(),
  timestamps: z.array(wordTimestampSchema).optional(),
});

const assetMetadataSchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  size: z.number().optional(),
  format: z.string().nullable().optional(),
  codec: z.string().nullable().optional(),
  bitrate: z.number().nullable().optional(),
  mode: z.string().optional(),
}).passthrough();

const viewportKeyframeSchema = z.object({
  frameStart: z.number(),
  frameEnd: z.number(),
  viewport: z.object({
    centerX: z.number(),
    centerY: z.number(),
    zoom: z.number(),
  }),
  easing: z.enum(["linear", "easeIn", "easeOut", "easeInOut", "slowDramatic", "fastAction"]),
  transitionDurationMs: z.number(),
});

function estimateDuration(segment: ScriptSegment): number {
  if (typeof segment.actualDuration === "number") {
    return Math.max(MIN_SEGMENT_DURATION_MS, Math.round(segment.actualDuration * 1000));
  }
  if (typeof segment.estimatedDuration === "number") {
    return Math.max(MIN_SEGMENT_DURATION_MS, Math.round(segment.estimatedDuration * 1000));
  }
  const words = countWords(segment.text);
  return Math.max(DEFAULT_SEGMENT_DURATION_MS, Math.round((words / WORDS_PER_MINUTE.TIMELINE_FALLBACK) * 60000));
}

function buildWordTimings(segment: ScriptSegment): WordTiming[] {
  if (segment.timestamps && segment.timestamps.length) {
    return segment.timestamps.map((t) => ({
      text: t.word,
      startMs: t.startMs,
      endMs: t.endMs,
    }));
  }

  const words = segment.text.split(/\s+/).filter(Boolean);
  const durationMs = estimateDuration(segment);
  const perWord = durationMs / Math.max(words.length, 1);
  return words.map((word, idx) => ({
    text: word,
    startMs: Math.round(perWord * idx),
    endMs: Math.round(perWord * (idx + 1)),
  }));
}

function buildTextElements(segments: ScriptSegment[]): TextElement[] {
  let cursor = 0;
  return segments.map((segment) => {
    const durationMs = estimateDuration(segment);
    const startMs = cursor;
    const endMs = cursor + durationMs;
    cursor = endMs;

    return {
      text: segment.text,
      position: "bottom",
      startFrame: msToFrames(startMs),
      endFrame: msToFrames(endMs),
      words: buildWordTimings(segment).map((w) => ({
        ...w,
        startMs: w.startMs + startMs,
        endMs: w.endMs + startMs,
      })),
      holdFrames: 6,
    };
  });
}

function buildAudioElements(
  segments: ScriptSegment[],
  projectId: string
): AudioElement[] {
  let cursor = 0;
  const elements: AudioElement[] = [];

  segments.forEach((segment, idx) => {
    const durationMs = estimateDuration(segment);
    const startMs = cursor;
    const endMs = cursor + durationMs;
    cursor = endMs;

    if (segment.audioUrl) {
      elements.push({
        audioUrl: segment.audioUrl.startsWith("/projects/")
          ? segment.audioUrl
          : `/projects/${projectId}/assets/audio/segment-${idx + 1}.mp3`,
        startFrame: msToFrames(startMs),
        endFrame: msToFrames(endMs),
      });
    }
  });

  return elements;
}

function pickPrimaryVisualAsset(assets: Asset[]): Asset | null {
  const images = assets.filter((a) => a.type === "IMAGE");
  const videos = assets.filter((a) => a.type === "VIDEO");
  if (images.length) return images[0];
  if (videos.length) return videos[0];
  return null;
}

function parseAssetMetadata(metadata: unknown): z.infer<typeof assetMetadataSchema> | null {
  const result = assetMetadataSchema.safeParse(metadata);
  return result.success ? result.data : null;
}

function parseViewportKeyframes(keyframes: unknown): ViewportKeyframe[] {
  const result = z.array(viewportKeyframeSchema).safeParse(keyframes);
  return result.success ? result.data : [];
}

function buildViewportAnimation(
  viewport: { keyframes?: unknown } | null,
  asset: { metadata?: unknown } | null
): ViewportAnimation | undefined {
  if (!viewport || !asset) return undefined;
  const keyframes = parseViewportKeyframes(viewport.keyframes);
  if (!keyframes.length) return undefined;
  const metadata = parseAssetMetadata(asset.metadata);
  return {
    enabled: true,
    keyframes,
    imageWidth: metadata?.width,
    imageHeight: metadata?.height,
  };
}

function buildSegmentViewportAnimation(
  vp: SegmentViewport,
  startFrame: number,
  endFrame: number,
  asset: Asset
): ViewportAnimation {
  const easing = vp.easing ?? "easeInOut";
  const durationMs = framesToMs(endFrame - startFrame);
  const metadata = parseAssetMetadata(asset.metadata);
  const startKf: ViewportKeyframe = {
    frameStart: startFrame,
    frameEnd: startFrame,
    viewport: { ...vp.start },
    easing,
    transitionDurationMs: 0,
  };
  const endKf: ViewportKeyframe = {
    frameStart: startFrame,
    frameEnd: endFrame,
    viewport: { ...vp.end },
    easing,
    transitionDurationMs: durationMs,
  };
  return {
    enabled: true,
    keyframes: [startKf, endKf],
    imageWidth: metadata?.width,
    imageHeight: metadata?.height,
  };
}

function buildLegacyBackgrounds(
  assets: Asset[],
  viewport: { keyframes?: unknown } | null,
  totalDurationMs: number
): BackgroundElement[] {
  const primary = pickPrimaryVisualAsset(assets);

  if (!primary) {
    return [
      {
        startFrame: 0,
        endFrame: msToFrames(totalDurationMs || 60000),
        enterTransition: "fade",
        exitTransition: "fade",
        imageUrl: undefined,
        videoUrl: undefined,
      },
    ];
  }

  const mediaMetadata = parseAssetMetadata(primary.metadata);
  const viewportAnimation = buildViewportAnimation(viewport, primary);

  if (primary.type === "IMAGE") {
    return [
      {
        imageUrl: primary.upscaledPath || primary.path,
        startFrame: 0,
        endFrame: msToFrames(totalDurationMs),
        enterTransition: "blur",
        exitTransition: "blur",
        mediaMetadata: mediaMetadata ?? undefined,
        viewportAnimation,
      },
    ];
  }

  return [
    {
      videoUrl: primary.path,
      startFrame: 0,
      endFrame: msToFrames(totalDurationMs),
      enterTransition: "fade",
      exitTransition: "fade",
      mediaMetadata: mediaMetadata ?? undefined,
      viewportAnimation,
    },
  ];
}

function buildBackgrounds(
  assets: { type: string; metadata?: unknown; path: string; upscaledPath?: string | null; id?: string; filename?: string; projectId?: string; createdAt?: Date }[],
  viewport: { keyframes?: unknown } | null,
  segments: ScriptSegment[],
  assetMappings: AssetMappings
): BackgroundElement[] {
  const segmentDurations = segments.map(estimateDuration);
  const segmentEnds: number[] = [];
  let acc = 0;
  for (const d of segmentDurations) {
    acc += d;
    segmentEnds.push(acc);
  }
  const totalDurationMs = acc;

  const hasMappings = Object.keys(assetMappings).length > 0;
  if (!hasMappings) {
    return buildLegacyBackgrounds(assets as Asset[], viewport, totalDurationMs);
  }

  const assetById = new Map<string, Asset>(
    (assets as Asset[]).map((a) => [a.id, a])
  );
  const elements: BackgroundElement[] = [];
  let prevAssetId: string | null = null;

  segments.forEach((segment, idx) => {
    const mapping = assetMappings[segment.index];
    if (!mapping) {
      prevAssetId = null;
      return;
    }
    const asset = assetById.get(mapping.assetId);
    if (!asset) {
      prevAssetId = null;
      return;
    }

    const segStartMs = idx === 0 ? 0 : segmentEnds[idx - 1];
    const naturalEndMs = segmentEnds[idx];
    const isLast = idx === segments.length - 1;
    const localTarget = naturalEndMs - segStartMs;
    const snappedLocal = isLast
      ? localTarget
      : snapToSentenceBoundary(
          localTarget,
          segment.timestamps ?? [],
          segment.text,
          SENTENCE_SNAP_TOLERANCE_MS
        );
    const endMs = segStartMs + snappedLocal;

    const startFrame = msToFrames(segStartMs);
    const endFrame = msToFrames(endMs);
    const sameAsPrev = prevAssetId === mapping.assetId;
    const wantsCrossfade = !sameAsPrev && elements.length > 0;
    const adjustedStart = wantsCrossfade
      ? Math.max(0, startFrame - CROSSFADE_FRAMES)
      : startFrame;

    const metadata = parseAssetMetadata(asset.metadata);
    const viewportAnimation = mapping.viewport
      ? buildSegmentViewportAnimation(mapping.viewport, startFrame, endFrame, asset)
      : undefined;

    elements.push({
      imageUrl: asset.upscaledPath || asset.path,
      startFrame: adjustedStart,
      endFrame,
      enterTransition: elements.length === 0 ? "blur" : "fade",
      exitTransition: isLast ? "blur" : "fade",
      mediaMetadata: metadata ?? undefined,
      viewportAnimation,
    });
    prevAssetId = mapping.assetId;
  });

  if (!elements.length) {
    return [
      {
        startFrame: 0,
        endFrame: msToFrames(totalDurationMs || 60000),
        enterTransition: "fade",
        exitTransition: "fade",
      },
    ];
  }

  return elements;
}

function buildMusicElement(assets: { type: string; path: string }[], settingsVolume?: number): MusicElement | undefined {
  const music = assets.find((a) => a.type === "MUSIC");
  if (!music) return undefined;
  return {
    url: music.path,
    volume: typeof settingsVolume === "number" ? settingsVolume : 0.3,
    ducking: DEFAULT_MUSIC_DUCKING,
  };
}

export async function buildTimeline(projectId: string): Promise<Timeline> {
  const project = await storyflowPrisma.project.findByIdOrThrow(projectId, {
    include: { script: true, assets: true, viewport: true, settings: true },
  });

  if (!project.script) {
    throw new NotFoundError("Script", projectId);
  }

  // Validate segments from DB JSON
  const rawSegments = project.script.segments;
  const segmentsResult = z.array(scriptSegmentSchema).safeParse(rawSegments);
  const segments: ScriptSegment[] = segmentsResult.success ? segmentsResult.data : [];

  if (!segmentsResult.success) {
    console.warn("[timeline-builder] Invalid segments in DB, using empty array:", segmentsResult.error.message);
  }

  const text = buildTextElements(segments);
  const audio = buildAudioElements(segments, projectId);
  const assetMappings = normalizeAssetMappings(project.assetMappings);
  const backgrounds = buildBackgrounds(project.assets, project.viewport, segments, assetMappings);
  const music = buildMusicElement(project.assets, project.settings?.musicVolume ?? undefined);

  const durationMs = segments.reduce((sum, s) => sum + estimateDuration(s), 0);

  return {
    title: project.script.title,
    aspectRatio: (project.aspectRatio as AspectRatio) ?? "16:9",
    durationSeconds: Math.ceil(durationMs / 1000) + 1,
    backgrounds,
    text,
    audio,
    music,
  };
}
