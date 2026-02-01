import type {
  AudioElement,
  BackgroundElement,
  Timeline,
  TimelineElement,
  TextElement,
  ViewportAnimation,
} from "@/src/lib/types";

import { mergeFactory } from "./base";

export function buildTimelineSegment(
  overrides: Partial<TimelineElement> = {}
): TimelineElement {
  return mergeFactory<TimelineElement>(
    {
      startMs: overrides.startMs ?? 0,
      endMs: overrides.endMs ?? 1000,
      startFrame: overrides.startFrame ?? 0,
      endFrame: overrides.endFrame ?? 30,
    },
    overrides
  );
}

export function buildViewportAnimation(
  overrides: Partial<NonNullable<ViewportAnimation>> = {}
): ViewportAnimation {
  return mergeFactory<NonNullable<ViewportAnimation>>(
    {
      enabled: overrides.enabled ?? true,
      keyframes:
        overrides.keyframes ??
        [
          {
            frameStart: 0,
            frameEnd: 30,
            viewport: { centerX: 0.5, centerY: 0.5, zoom: 1.2 },
            easing: "easeInOut",
            transitionDurationMs: 300,
          },
        ],
    },
    overrides
  );
}

export function buildBackgroundElement(
  overrides: Partial<BackgroundElement> = {}
): BackgroundElement {
  const segment = buildTimelineSegment(overrides);

  return mergeFactory<BackgroundElement>(
    {
      ...segment,
      imageUrl: overrides.imageUrl ?? "/images/background.jpg",
      videoUrl: overrides.videoUrl,
      enterTransition: overrides.enterTransition ?? "fade",
      exitTransition: overrides.exitTransition ?? "fade",
      animations: overrides.animations ?? [],
      mediaMetadata:
        overrides.mediaMetadata ??
        {
          width: 1920,
          height: 1080,
          mode: "crop",
          scale: 1,
        },
      viewportAnimation: overrides.viewportAnimation ?? buildViewportAnimation(),
    },
    overrides
  );
}

export function buildTextElement(overrides: Partial<TextElement> = {}): TextElement {
  const segment = buildTimelineSegment(overrides);
  const startFrame = segment.startFrame ?? 0;

  return mergeFactory<TextElement>(
    {
      ...segment,
      text: overrides.text ?? "Caption text",
      position: overrides.position ?? "bottom",
      animations: overrides.animations ?? [],
      words:
        overrides.words ??
        [
          {
            text: "Caption",
            startMs: segment.startMs,
            endMs: segment.startMs + 500,
            startFrame,
            endFrame: segment.endFrame ?? startFrame + 15,
            emphasis: { level: "none" },
          },
        ],
      maxCharsPerLine: overrides.maxCharsPerLine ?? 32,
      maxLines: overrides.maxLines ?? 2,
      holdFrames: overrides.holdFrames ?? 0,
    },
    overrides
  );
}

export function buildAudioElement(
  overrides: Partial<AudioElement> = {}
): AudioElement {
  const segment = buildTimelineSegment(overrides);

  return mergeFactory<AudioElement>(
    {
      ...segment,
      audioUrl: overrides.audioUrl ?? "/audio/segment-0.mp3",
    },
    overrides
  );
}

export function buildTimeline(overrides: Partial<Timeline> = {}): Timeline {
  const background = overrides.elements ?? [buildBackgroundElement()];
  const text = overrides.text ?? [buildTextElement()];
  const audio = overrides.audio ?? [buildAudioElement()];

  return mergeFactory<Timeline>(
    {
      shortTitle: overrides.shortTitle ?? "Test Timeline",
      elements: background,
      text,
      audio,
      aspectRatio: overrides.aspectRatio ?? "16:9",
      durationSeconds:
        overrides.durationSeconds ??
        (background[0]?.endMs ? background[0].endMs / 1000 : 1),
      videoClips: overrides.videoClips ?? [],
      backgroundMusic: overrides.backgroundMusic ?? [],
    },
    { ...overrides, elements: background, text, audio }
  );
}
