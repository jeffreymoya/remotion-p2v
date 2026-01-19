import { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { ViewportAnimation } from "@/src/lib/storyflow/timeline-types";
import { calculateViewportState, viewportToTransform } from "@/src/lib/viewport-utils";

type Transform = { scale: number; translateX: number; translateY: number };

export function useViewportTransform(
  frame: number,
  animation: ViewportAnimation | undefined,
  fps: number,
  fallbackSize: { width?: number; height?: number }
): Transform | null {
  const { width, height } = useVideoConfig();

  return useMemo(() => {
    if (!animation?.enabled || !animation.keyframes?.length) return null;
    const state = calculateViewportState(frame, animation.keyframes, fps);
    const imgW = animation.imageWidth ?? fallbackSize.width ?? width;
    const imgH = animation.imageHeight ?? fallbackSize.height ?? height;
    return viewportToTransform(state, imgW, imgH, width, height);
  }, [animation, fallbackSize.height, fallbackSize.width, fps, frame, height, width]);
}
