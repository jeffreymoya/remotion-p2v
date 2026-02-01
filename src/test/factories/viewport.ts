import type {
  DetectedRegion,
  Viewport,
  ViewportKeyframe,
} from "@/src/lib/storyflow/types";
import type { ViewportAnimation } from "@/src/lib/types";

import { createId, mergeFactory, now } from "./base";
import { buildViewportAnimation as buildTimelineViewportAnimation } from "./timeline";

export function buildViewportKeyframe(
  overrides: Partial<ViewportKeyframe> = {}
): ViewportKeyframe {
  return mergeFactory<ViewportKeyframe>(
    {
      frameStart: overrides.frameStart ?? 0,
      frameEnd: overrides.frameEnd ?? 30,
      viewport: overrides.viewport ?? { centerX: 0.5, centerY: 0.5, zoom: 1.2 },
      easing: overrides.easing ?? "easeInOut",
      transitionDurationMs: overrides.transitionDurationMs ?? 300,
    },
    overrides
  );
}

export function buildDetectedRegion(
  overrides: Partial<DetectedRegion> = {}
): DetectedRegion {
  return mergeFactory<DetectedRegion>(
    {
      id: overrides.id ?? createId("region"),
      label: overrides.label ?? "Main subject",
      bounds:
        overrides.bounds ?? {
          x: 0.1,
          y: 0.1,
          width: 0.3,
          height: 0.3,
        },
      salience: overrides.salience ?? 0.9,
    },
    overrides
  );
}

export function buildViewportAnimation(
  overrides: Partial<ViewportAnimation> = {}
): ViewportAnimation {
  return buildTimelineViewportAnimation(overrides);
}

export function buildViewport(overrides: Partial<Viewport> = {}): Viewport {
  const createdAt = overrides.createdAt ?? now();
  const updatedAt = overrides.updatedAt ?? now();
  const projectId = overrides.projectId ?? createId("project");

  return mergeFactory<Viewport>(
    {
      id: overrides.id ?? createId("viewport"),
      projectId,
      imageAssetId: overrides.imageAssetId ?? createId("asset"),
      keyframes: overrides.keyframes ?? [buildViewportKeyframe()],
      regions: overrides.regions ?? [buildDetectedRegion()],
      createdAt,
      updatedAt,
    },
    overrides
  );
}
