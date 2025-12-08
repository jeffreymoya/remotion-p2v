import { ViewportKeyframe } from './viewport-types';

/**
 * ============================================================================
 * Section 6: Viewport Rendering Utilities
 * ============================================================================
 *
 * Provides core viewport math for pan-scan animation:
 * - Easing functions for smooth transitions
 * - Viewport state calculation with keyframe interpolation
 * - CSS transform generation for viewport to canvas mapping
 */

// ============================================================================
// Section 6.0: Helper Functions
// ============================================================================

/**
 * Linear interpolation between two values
 * @param a - Start value
 * @param b - End value
 * @param t - Progress (0-1)
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamps a value between min and max bounds
 * @param value - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// Section 6.1: Easing Functions
// ============================================================================

/**
 * Collection of easing functions for viewport transitions
 * Each function takes a normalized progress value (0-1) and returns an eased value
 */
export const EASING_FUNCTIONS = {
  /**
   * No easing, linear interpolation
   */
  linear: (t: number): number => t,

  /**
   * Quadratic ease-in: accelerating from zero velocity
   */
  easeIn: (t: number): number => t * t,

  /**
   * Quadratic ease-out: decelerating to zero velocity
   */
  easeOut: (t: number): number => 1 - (1 - t) * (1 - t),

  /**
   * Quadratic ease-in-out: acceleration until halfway, then deceleration
   * Provides smooth cinematic pacing
   */
  easeInOut: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  /**
   * Alias for easeInOut: slow dramatic pacing for cinematic effect
   */
  slowDramatic: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  /**
   * Cubic ease-out: fast action sequences
   */
  fastAction: (t: number): number => 1 - Math.pow(1 - t, 3),
} as const;

/**
 * Type for valid easing function names
 */
export type EasingFunctionName = keyof typeof EASING_FUNCTIONS;

// ============================================================================
// Section 6.1: Viewport State Calculation
// ============================================================================

/**
 * Result of viewport state calculation
 */
export interface ViewportState {
  centerX: number; // 0-1 normalized position on image
  centerY: number; // 0-1 normalized position on image
  zoom: number; // 1.0 = full image, >1.0 = magnification
}

/**
 * Calculates the current viewport state based on keyframes and current frame
 * Handles transition interpolation between keyframes with proper easing.
 *
 * Key behaviors:
 * - First keyframe displays immediately without interpolation (previous = null)
 * - Transitions are clamped to keyframe duration to prevent progress overflow
 * - Falls back to first/last keyframe if current frame is outside range
 * - Uses easing functions for smooth, cinematic transitions
 *
 * @param currentFrame - The current frame number
 * @param keyframes - Array of viewport keyframes
 * @param fps - Frames per second
 * @returns ViewportState with centerX, centerY, and zoom
 */
export function calculateViewportState(
  currentFrame: number,
  keyframes: ViewportKeyframe[],
  fps: number
): ViewportState {
  // Sort keyframes by start frame
  const sorted = [...keyframes].sort((a, b) => a.frameStart - b.frameStart);

  // Find active keyframe for current frame
  let current: ViewportKeyframe | null = null;
  let previousIndex: number = -1;

  for (let i = 0; i < sorted.length; i++) {
    const kf = sorted[i];
    if (currentFrame >= kf.frameStart && currentFrame <= kf.frameEnd) {
      current = kf;
      previousIndex = i - 1;
      break;
    }
  }

  // Handle edge cases: frame is outside all keyframe ranges
  if (current === null) {
    if (currentFrame < sorted[0].frameStart) {
      return { ...sorted[0].viewport };
    }
    return { ...sorted[sorted.length - 1].viewport };
  }

  // Get previous keyframe if it exists
  const previous = previousIndex >= 0 ? sorted[previousIndex] : null;

  // Calculate transition parameters
  const transitionFrames = (current.transitionDurationMs / 1000) * fps;
  const keyframeDuration = current.frameEnd - current.frameStart;
  const framesIntoKeyframe = currentFrame - current.frameStart;

  // CLAMP transition to keyframe duration to prevent progress overflow
  const actualTransitionFrames = Math.min(transitionFrames, keyframeDuration);

  // Check if in transition phase and interpolate
  if (framesIntoKeyframe < actualTransitionFrames && previous !== null) {
    // NOTE: First keyframe (previous = null) displays immediately without interpolation
    // This implements the "first keyframe displays immediately" requirement
    // Interpolate between previous and current
    const progress = framesIntoKeyframe / actualTransitionFrames;
    const easingFn =
      EASING_FUNCTIONS[current.easing as EasingFunctionName] ||
      EASING_FUNCTIONS.easeInOut;
    const easedProgress = easingFn(progress);

    return {
      centerX: lerp(
        previous.viewport.centerX,
        current.viewport.centerX,
        easedProgress
      ),
      centerY: lerp(
        previous.viewport.centerY,
        current.viewport.centerY,
        easedProgress
      ),
      zoom: lerp(previous.viewport.zoom, current.viewport.zoom, easedProgress),
    };
  }

  // Static viewport (not transitioning)
  return { ...current.viewport };
}

// ============================================================================
// Section 6.2: Viewport to CSS Transform
// ============================================================================

/**
 * Result of viewport-to-transform calculation
 */
export interface TransformValues {
  scale: number; // CSS scale value
  translateX: number; // CSS translateX in pixels
  translateY: number; // CSS translateY in pixels
}

/**
 * Converts viewport state to CSS transform values for rendering
 * Handles zoom scaling, centering, and clamping to prevent black bars.
 *
 * The transform works by:
 * 1. Calculating a base scale to fit the image to the canvas
 * 2. Applying viewport zoom to the base scale
 * 3. Positioning the viewport center at the canvas center
 * 4. Clamping translations to ensure the scaled image covers the entire canvas
 *
 * @param viewport - Current viewport state
 * @param imageW - Image width in pixels
 * @param imageH - Image height in pixels
 * @param canvasW - Canvas width in pixels
 * @param canvasH - Canvas height in pixels
 * @returns Transform values for CSS transform property
 */
export function viewportToTransform(
  viewport: ViewportState,
  imageW: number,
  imageH: number,
  canvasW: number,
  canvasH: number
): TransformValues {
  // Calculate base scale to fit image to canvas
  // zoom=1 means image fills canvas, zoom=2 means 2x magnification
  const baseScale = Math.max(canvasW / imageW, canvasH / imageH);
  const scale = baseScale * viewport.zoom;

  // Calculate scaled dimensions
  const scaledW = imageW * scale;
  const scaledH = imageH * scale;

  // Target point on scaled image (where viewport center should be)
  const targetX = viewport.centerX * scaledW;
  const targetY = viewport.centerY * scaledH;

  // Canvas center
  const canvasCenterX = canvasW / 2;
  const canvasCenterY = canvasH / 2;

  // Translation to put target at canvas center
  let translateX = canvasCenterX - targetX;
  let translateY = canvasCenterY - targetY;

  // Clamp translations so the scaled image still covers the canvas
  // (avoid black bars near edges)
  const minX = canvasW - scaledW;
  const minY = canvasH - scaledH;
  translateX = clamp(translateX, minX, 0);
  translateY = clamp(translateY, minY, 0);

  return { scale, translateX, translateY };
}
