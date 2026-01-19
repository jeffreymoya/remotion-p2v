/**
 * Aspect Ratio Processor Service (Wave 2A.1)
 * Handles aspect ratio processing with crop and letterbox logic
 */

/**
 * Crop configuration from stock-assets.config.json
 */
export interface CropConfig {
  /** Safe padding from edges as percentage (default: 10%) */
  safePaddingPercent: number;
  /** Maximum aspect delta before letterboxing (default: 0.3) */
  maxAspectDelta: number;
  /** Target video width in pixels (default: 1920) */
  targetWidth: number;
  /** Target video height in pixels (default: 1080) */
  targetHeight: number;
}

/**
 * Result of aspect ratio processing
 */
export interface CropResult {
  /** Processing mode applied: 'crop' or 'letterbox' */
  mode: 'crop' | 'letterbox';
  /** Scale factor to apply to source media */
  scale: number;
  /** X position for crop/letterbox (in pixels) */
  x: number;
  /** Y position for crop/letterbox (in pixels) */
  y: number;
  /** Width of the processed region (in pixels) */
  width: number;
  /** Height of the processed region (in pixels) */
  height: number;
}

/**
 * Determines whether media should be cropped based on aspect ratio delta
 *
 * @param sourceAspect - Source media aspect ratio (width/height)
 * @param targetAspect - Target aspect ratio (width/height)
 * @param maxAspectDelta - Maximum allowed aspect delta (default: 0.3)
 * @returns true if should crop, false if should letterbox
 *
 * @example
 * ```typescript
 * const sourceAspect = 1920 / 1080; // 16:9 = 1.778
 * const targetAspect = 1920 / 1080; // 16:9 = 1.778
 * const shouldCrop = shouldCrop(sourceAspect, targetAspect); // true (delta = 0)
 * ```
 */
export function shouldCrop(
  sourceAspect: number,
  targetAspect: number,
  maxAspectDelta: number = 0.3
): boolean {
  // Calculate aspect delta as percentage difference
  const aspectDelta = Math.abs(sourceAspect - targetAspect) / targetAspect;

  // Crop if delta is within acceptable range, letterbox if too different
  return aspectDelta <= maxAspectDelta;
}

/**
 * Calculates crop parameters with safe padding for center crop
 *
 * Crops the source media to fit target aspect ratio while preserving the center
 * region and applying safe padding to avoid cutting off important content.
 *
 * @param sourceW - Source media width in pixels
 * @param sourceH - Source media height in pixels
 * @param config - Crop configuration with padding and target dimensions
 * @returns CropResult with crop parameters
 *
 * @example
 * ```typescript
 * const config: CropConfig = {
 *   safePaddingPercent: 10,
 *   maxAspectDelta: 0.3,
 *   targetWidth: 1920,
 *   targetHeight: 1080
 * };
 * const result = calculateCrop(2560, 1440, config);
 * // result.mode = 'crop'
 * // result.scale = 1.0
 * // result.x, y = center position with safe padding
 * ```
 */
export function calculateCrop(
  sourceW: number,
  sourceH: number,
  config: CropConfig
): CropResult {
  const { safePaddingPercent, maxAspectDelta, targetWidth, targetHeight } = config;

  const sourceAspect = sourceW / sourceH;
  const targetAspect = targetWidth / targetHeight;

  // Determine if we should crop or letterbox
  if (!shouldCrop(sourceAspect, targetAspect, maxAspectDelta)) {
    return calculateLetterbox(sourceW, sourceH, config);
  }

  // Calculate crop dimensions to match target aspect ratio
  let cropWidth: number;
  let cropHeight: number;

  if (sourceAspect > targetAspect) {
    // Source is wider - crop width
    cropHeight = sourceH;
    cropWidth = cropHeight * targetAspect;
  } else {
    // Source is taller - crop height
    cropWidth = sourceW;
    cropHeight = cropWidth / targetAspect;
  }

  // Apply safe padding (reduce crop area by padding percentage)
  const paddingMultiplier = 1 - (safePaddingPercent / 100);
  cropWidth *= paddingMultiplier;
  cropHeight *= paddingMultiplier;

  // Center the crop
  const x = (sourceW - cropWidth) / 2;
  const y = (sourceH - cropHeight) / 2;

  // Scale factor (for rendering in target dimensions)
  const scale = targetWidth / cropWidth;

  return {
    mode: 'crop',
    scale,
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };
}

/**
 * Calculates letterbox parameters to fit source within target dimensions
 *
 * Scales the source media to fit entirely within target dimensions while
 * maintaining aspect ratio. Adds black bars (letterbox) to fill remaining space.
 *
 * @param sourceW - Source media width in pixels
 * @param sourceH - Source media height in pixels
 * @param config - Crop configuration with target dimensions
 * @returns CropResult with letterbox parameters
 *
 * @example
 * ```typescript
 * const config: CropConfig = {
 *   safePaddingPercent: 10,
 *   maxAspectDelta: 0.3,
 *   targetWidth: 1920,
 *   targetHeight: 1080
 * };
 * const result = calculateLetterbox(1080, 1920, config); // 9:16 source
 * // result.mode = 'letterbox'
 * // result.scale < 1.0
 * // result.x, y = position for centered letterbox
 * ```
 */
export function calculateLetterbox(
  sourceW: number,
  sourceH: number,
  config: CropConfig
): CropResult {
  const { targetWidth, targetHeight } = config;

  const sourceAspect = sourceW / sourceH;
  const targetAspect = targetWidth / targetHeight;

  let scaledWidth: number;
  let scaledHeight: number;
  let scale: number;

  if (sourceAspect > targetAspect) {
    // Source is wider - fit to width
    scaledWidth = targetWidth;
    scaledHeight = targetWidth / sourceAspect;
    scale = targetWidth / sourceW;
  } else {
    // Source is taller - fit to height
    scaledHeight = targetHeight;
    scaledWidth = targetHeight * sourceAspect;
    scale = targetHeight / sourceH;
  }

  // Center the letterbox
  const x = (targetWidth - scaledWidth) / 2;
  const y = (targetHeight - scaledHeight) / 2;

  return {
    mode: 'letterbox',
    scale,
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(scaledWidth),
    height: Math.round(scaledHeight),
  };
}

/**
 * Convenience function to process media with aspect ratio handling
 *
 * Determines the best processing method (crop or letterbox) and returns
 * the appropriate parameters for rendering.
 *
 * @param sourceW - Source media width in pixels
 * @param sourceH - Source media height in pixels
 * @param config - Crop configuration
 * @returns CropResult with processing parameters
 *
 * @example
 * ```typescript
 * const config: CropConfig = {
 *   safePaddingPercent: 10,
 *   maxAspectDelta: 0.3,
 *   targetWidth: 1920,
 *   targetHeight: 1080
 * };
 * const result = processAspectRatio(1920, 1080, config);
 * console.log(`Mode: ${result.mode}, Scale: ${result.scale}`);
 * ```
 */
export function processAspectRatio(
  sourceW: number,
  sourceH: number,
  config: CropConfig
): CropResult {
  return calculateCrop(sourceW, sourceH, config);
}
