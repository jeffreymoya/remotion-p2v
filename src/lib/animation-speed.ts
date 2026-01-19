/**
 * Animation speed calculation utility for dreamy wobbling mochi animation
 *
 * Implements hybrid speed logic that combines:
 * - Base duration from tone type (dramatic, contemplative, narrative, energetic, action)
 * - WPM (words per minute) adjustment with linear interpolation
 * - Emphasis density multiplier for text styling impact
 * - Final clamping to 300-3000ms range
 * - Tone-based easing function selection
 */

/**
 * Tone types used in animation speed calculation
 */
export type ToneType = 'dramatic' | 'contemplative' | 'narrative' | 'energetic' | 'action';

/**
 * Easing function types for animation
 */
export type EasingType = 'slowDramatic' | 'fastAction' | 'easeInOut';

/**
 * Text group configuration with animation parameters
 */
export interface TextGroup {
  tone: ToneType;
  wpm?: number;
  emphasisDensity?: number;
}

/**
 * Animation speed result containing duration and easing
 */
export interface AnimationSpeedResult {
  transitionDurationMs: number;
  easing: EasingType;
}

/**
 * Speed configuration with WPM ranges, emphasis thresholds, and tone-specific durations
 */
export const SPEED_CONFIG = {
  wpm: {
    slow: 100,
    normal: 140,
    fast: 180,
  },
  emphasis: {
    low: 0.05,
    high: 0.15,
  },
  duration: {
    dramatic: { min: 1500, max: 3000 },
    contemplative: { min: 2000, max: 3000 },
    narrative: { min: 800, max: 1500 },
    energetic: { min: 400, max: 800 },
    action: { min: 300, max: 600 },
  },
} as const;

/**
 * Clamps a value between min and max
 *
 * @param value The value to clamp
 * @param min The minimum value
 * @param max The maximum value
 * @returns The clamped value
 */
function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Calculates WPM multiplier using linear interpolation between slow and fast thresholds
 *
 * - Below slowThreshold (100 wpm): returns 1.3 (slow animation)
 * - Above fastThreshold (180 wpm): returns 0.7 (fast animation)
 * - Between thresholds: linear interpolation from 1.3 to 0.7
 *
 * @param wpm Words per minute
 * @returns Multiplier to apply to base duration
 */
export function calculateWpmMultiplier(wpm: number): number {
  const slowThreshold = SPEED_CONFIG.wpm.slow; // 100
  const fastThreshold = SPEED_CONFIG.wpm.fast; // 180

  if (wpm < slowThreshold) {
    return 1.3; // Slow speech = slower animation
  } else if (wpm > fastThreshold) {
    return 0.7; // Fast speech = faster animation
  } else {
    // Linear interpolation between slow and fast thresholds
    const normalized = (wpm - slowThreshold) / (fastThreshold - slowThreshold);
    return 1.3 - 0.6 * normalized;
  }
}

/**
 * Selects appropriate easing function based on tone
 *
 * - dramatic, contemplative: slowDramatic (slow in, slow out)
 * - action, energetic: fastAction (quick acceleration)
 * - default (narrative): easeInOut (standard easing)
 *
 * @param tone The tone type
 * @returns The easing function name
 */
export function selectEasing(tone: ToneType): EasingType {
  switch (tone) {
    case 'dramatic':
    case 'contemplative':
      return 'slowDramatic';
    case 'action':
    case 'energetic':
      return 'fastAction';
    default:
      return 'easeInOut';
  }
}

/**
 * Calculates animation speed (duration and easing) for a text group
 *
 * Algorithm:
 * 1. Get base duration from tone (average of min and max)
 * 2. Calculate WPM multiplier using linear interpolation
 * 3. Apply emphasis density multiplier if emphasisDensity > high threshold
 * 4. Calculate final duration and clamp to 300-3000ms range
 * 5. Select easing based on tone
 *
 * @param group Text group with tone, optional WPM, and optional emphasis density
 * @returns Object with transitionDurationMs and easing
 *
 * @example
 * const speed = calculateAnimationSpeed({
 *   tone: 'dramatic',
 *   wpm: 120,
 *   emphasisDensity: 0.2
 * });
 * // Returns: { transitionDurationMs: 2250, easing: 'slowDramatic' }
 */
export function calculateAnimationSpeed(group: TextGroup): AnimationSpeedResult {
  // 1. Get base duration from tone
  const toneRange = SPEED_CONFIG.duration[group.tone];
  const baseDuration = (toneRange.min + toneRange.max) / 2;

  // 2. Adjust for WPM (group now has this field)
  const wpmMultiplier = group.wpm ? calculateWpmMultiplier(group.wpm) : 1.0;

  // 3. Adjust for emphasis density (optional, skip if null/undefined)
  let emphasisMultiplier = 1.0;
  if (group.emphasisDensity && group.emphasisDensity > SPEED_CONFIG.emphasis.high) {
    emphasisMultiplier = 1.1; // Slightly slower for impact
  }

  // 4. Calculate final duration
  let finalDuration = baseDuration * wpmMultiplier * emphasisMultiplier;
  finalDuration = clamp(finalDuration, 300, 3000);

  // 5. Select easing based on tone
  const easing = selectEasing(group.tone);

  return { transitionDurationMs: finalDuration, easing };
}
