#!/usr/bin/env node
/**
 * Viewport Command - Dreamy Wobbling Mochi Animation
 *
 * Analyzes script segments and image to generate viewport keyframes for pan-scan animation.
 * Uses Gemini CLI for multimodal image + text analysis to detect regions and group segments.
 *
 * Output: viewport.json containing regions, sentence groups, and keyframes
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { z } from 'zod';
import sharp from 'sharp';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

// Import utilities
import { ConfigManager } from '../lib/config';
import { getProjectPaths } from '../../src/lib/paths';
import { GeminiCLIProvider } from '../services/ai/gemini-cli';

// Import types and schemas
import {
  GeminiResponse,
  GeminiResponseSchema,
  validateGeminiResponseBusinessLogic,
  DetectedRegion,
  SentenceGroup,
  SentenceGroupBase,
  ViewportKeyframe,
  ViewportAnalysis,
} from '../../src/lib/viewport-types';

// Import animation speed calculation
import {
  calculateAnimationSpeed,
  ToneType,
} from '../lib/animation-speed';

// Import viewport prompt
import {
  viewportAnalysisPrompt,
  SegmentTiming,
} from '../../config/prompts/viewport.prompt';

// ============================================================================
// CLI Arguments Schema
// ============================================================================

const ViewportCommandArgs = z.object({
  projectId: z.string(),
  imagePath: z.string().optional(), // Optional: defaults to finding image in assets
  overlapThreshold: z.number().min(0).max(1).default(0.2),
});

type ViewportCommandArgsType = z.infer<typeof ViewportCommandArgs>;

// ============================================================================
// Types
// ============================================================================

interface ScriptSegment {
  id?: string;
  text: string;
}

interface Script {
  segments: ScriptSegment[];
}

interface ManifestAudioEntry {
  startMs: number;
  endMs: number;
  durationMs?: number;
}

interface ManifestData {
  audio?: ManifestAudioEntry[];
}

interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
}

interface KeyframeGenerationContext {
  imageMetadata: ImageMetadata;
  canvasAspect: number;
  fps: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Finds the first image file in the assets/images directory
 * Throws an error if no images found or multiple images found
 */
async function findImageInAssets(projectRoot: string): Promise<string> {
  const assetsDir = path.join(projectRoot, 'assets', 'images');

  // Check if directory exists
  try {
    await fs.access(assetsDir);
  } catch {
    throw new Error(`[VIEWPORT] Assets directory not found: ${assetsDir}`);
  }

  const files = await fs.readdir(assetsDir);
  const imageFiles = files.filter((f) => /\.(png|jpg|jpeg)$/i.test(f));

  if (imageFiles.length === 0) {
    throw new Error(`[VIEWPORT] No image files found in ${assetsDir}`);
  }

  if (imageFiles.length > 1) {
    throw new Error(
      `[VIEWPORT] Multiple images found in ${assetsDir}. Specify which to use with --image-path`
    );
  }

  return imageFiles[0];
}

/**
 * Gets image metadata using sharp
 */
async function getImageMetadata(imagePath: string): Promise<ImageMetadata> {
  try {
    await fs.access(imagePath);
  } catch {
    throw new Error(`[VIEWPORT] Image not found: ${imagePath}`);
  }

  const metadata = await sharp(imagePath).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`[VIEWPORT] Could not read image dimensions: ${imagePath}`);
  }

  return {
    width: metadata.width,
    height: metadata.height,
    aspectRatio: metadata.width / metadata.height,
  };
}

/**
 * Counts words in a text string
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Calculates segment timings from script and optional TTS manifest
 * Falls back to ~150 WPM estimation if manifest is unavailable
 */
function calculateSegmentTimings(
  script: Script,
  manifest: ManifestData | null
): SegmentTiming[] {
  const timings: SegmentTiming[] = [];

  if (manifest?.audio && manifest.audio.length > 0) {
    // Use actual TTS timestamps from manifest.audio array
    console.log('[VIEWPORT] Using TTS manifest for timing');
    let currentMs = 0;

    for (let i = 0; i < script.segments.length; i++) {
      const segment = script.segments[i];
      const audioData = i < manifest.audio.length ? manifest.audio[i] : null;
      const wordCount = countWords(segment.text);

      let durationMs: number;
      let startMs: number;
      let endMs: number;

      if (audioData) {
        durationMs = audioData.durationMs || (audioData.endMs - audioData.startMs);
        // Use segment-level startMs/endMs if present, otherwise compute from cumulative durations
        if (typeof audioData.startMs === 'number' && typeof audioData.endMs === 'number') {
          startMs = audioData.startMs;
          endMs = audioData.endMs;
        } else {
          // Compute from cumulative durations when segment-level timing not available
          startMs = currentMs;
          endMs = currentMs + durationMs;
        }
      } else {
        // Gap-filling to avoid missing segment timings
        durationMs = (wordCount / 150) * 60000;
        startMs = currentMs;
        endMs = currentMs + durationMs;
      }

      timings.push({
        text: segment.text,
        startMs,
        endMs,
        durationMs,
        wpm: (wordCount / durationMs) * 60000,
      });

      currentMs = endMs;
    }
  } else {
    // Estimate timing (~150 WPM average)
    console.warn('[VIEWPORT] manifest.json not found, estimating timing at ~150 WPM');
    let currentMs = 0;

    for (const segment of script.segments) {
      const wordCount = countWords(segment.text);
      const durationMs = (wordCount / 150) * 60000;

      timings.push({
        text: segment.text,
        startMs: currentMs,
        endMs: currentMs + durationMs,
        durationMs,
        wpm: 150,
      });

      currentMs += durationMs;
    }
  }

  return timings;
}

/**
 * Calls Gemini CLI for viewport analysis with multimodal input
 * Uses @path syntax to reference the image file
 */
async function callGeminiForViewportAnalysis(
  relativeImagePath: string,
  segmentTimings: SegmentTiming[]
): Promise<GeminiResponse> {
  // Get Gemini configuration
  const geminiConfig = await ConfigManager.getAIProvider('gemini-cli');
  const geminiProvider = new GeminiCLIProvider(geminiConfig);

  // Set pipeline stage for logging
  geminiProvider.setPipelineStage('viewport-analysis');

  // Build prompt with @path reference for multimodal
  const textPrompt = viewportAnalysisPrompt(segmentTimings);
  const multimodalPrompt = `@${relativeImagePath}\n\n${textPrompt}`;

  // Call Gemini with structured output
  const result = await geminiProvider.structuredComplete(
    multimodalPrompt,
    GeminiResponseSchema
  );

  return result;
}

/**
 * Validates Gemini response (Zod schema + business logic)
 */
function validateGeminiResponse(
  geminiResult: GeminiResponse,
  totalSegments: number,
  overlapThreshold: number
): void {
  // Zod schema validation already happened in structuredComplete
  // Now validate business logic rules
  validateGeminiResponseBusinessLogic(geminiResult, totalSegments, overlapThreshold);
}

/**
 * Builds enriched sentence groups by merging Gemini output with timing data
 * Frame numbers are assigned later in generateKeyframes
 */
function buildSentenceGroups(
  segmentTimings: SegmentTiming[],
  geminiSegmentGroups: GeminiResponse['segmentGroups']
): SentenceGroupBase[] {
  const groups: SentenceGroupBase[] = [];

  for (let groupIndex = 0; groupIndex < geminiSegmentGroups.length; groupIndex++) {
    const geminiGroup = geminiSegmentGroups[groupIndex];

    // Get timing for all segments in this group
    const groupSegments = geminiGroup.segmentIndices.map((i) => segmentTimings[i]);

    // Calculate aggregate timing
    const startMs = Math.min(...groupSegments.map((s) => s.startMs));
    const endMs = Math.max(...groupSegments.map((s) => s.endMs));

    // Calculate average WPM for the group
    const totalWords = groupSegments.reduce((sum, s) => sum + countWords(s.text), 0);
    const totalDurationMs = endMs - startMs;
    const avgWpm = (totalWords / totalDurationMs) * 60000;

    // TODO: Calculate emphasis density if TTS manifest has emphasis data
    const emphasisDensity = undefined;

    groups.push({
      groupIndex,
      segmentIndices: geminiGroup.segmentIndices,
      regionId: geminiGroup.regionId,
      tone: geminiGroup.tone,
      focusReason: geminiGroup.focusReason,
      startMs,
      endMs,
      wpm: avgWpm,
      emphasisDensity,
    });
  }

  return groups;
}

/**
 * Finds a region by ID
 */
function findRegion(regions: DetectedRegion[], regionId: string): DetectedRegion {
  const region = regions.find((r) => r.id === regionId);
  if (!region) {
    throw new Error(`[VIEWPORT] Region not found: ${regionId}`);
  }
  return region;
}

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Converts milliseconds to frame number
 */
function msToFrame(ms: number, fps: number): number {
  return Math.round((ms / 1000) * fps);
}

/**
 * Calculates zoom level for a region to fill ~85% of viewport
 */
function calculateZoomForRegion(
  bounds: { x: number; y: number; width: number; height: number },
  imageMetadata: ImageMetadata,
  canvasAspect: number
): number {
  // Target: region fills ~85% of viewport (higher = more zoom = more pan room)
  const targetCoverage = 0.85;

  // Calculate aspect ratios
  const regionAspect = bounds.width / bounds.height;

  // Determine which dimension is limiting
  let zoom: number;
  if (regionAspect > canvasAspect) {
    // Region is wider than canvas (relative to heights)
    // Width is the limiting dimension
    zoom = 1 / (bounds.width / targetCoverage);
  } else {
    // Region is taller than canvas (relative to widths)
    // Height is the limiting dimension
    zoom = 1 / (bounds.height / targetCoverage);
  }

  // COMPREHENSIVE BOUNDS CHECKING: Ensure region stays fully on-screen
  const regionCenterX = bounds.x + bounds.width / 2;
  const regionCenterY = bounds.y + bounds.height / 2;

  // Calculate viewport extent at this zoom (what portion of image is visible)
  const viewportExtentX = 1 / zoom; // e.g., zoom=2 shows 50% of image width
  const viewportExtentY = 1 / zoom;

  // Safety margin: ensure region plus safety buffer fits within viewport
  const safetyMargin = 0.05; // 5% buffer
  const regionWithMarginWidth = bounds.width + 2 * safetyMargin;
  const regionWithMarginHeight = bounds.height + 2 * safetyMargin;

  // Check if region (with margin) fits within viewport extent
  const marginNeededX = (regionWithMarginWidth + viewportExtentX) / 2;
  const marginNeededY = (regionWithMarginHeight + viewportExtentY) / 2;

  // Reduce zoom if region too close to edges
  if (regionCenterX < marginNeededX) {
    // Too close to left edge
    const maxSafeZoom = 1 / (2 * (regionCenterX + safetyMargin));
    zoom = Math.min(zoom, maxSafeZoom);
  }

  if (regionCenterX > 1 - marginNeededX) {
    // Too close to right edge
    const maxSafeZoom = 1 / (2 * (1 - regionCenterX + safetyMargin));
    zoom = Math.min(zoom, maxSafeZoom);
  }

  if (regionCenterY < marginNeededY) {
    // Too close to top edge
    const maxSafeZoom = 1 / (2 * (regionCenterY + safetyMargin));
    zoom = Math.min(zoom, maxSafeZoom);
  }

  if (regionCenterY > 1 - marginNeededY) {
    // Too close to bottom edge
    const maxSafeZoom = 1 / (2 * (1 - regionCenterY + safetyMargin));
    zoom = Math.min(zoom, maxSafeZoom);
  }

  // Clamp to reasonable range (aligned with schema max of 4.0)
  // NOTE: Allow zoom=1.0 to show full image when appropriate
  return clamp(zoom, 1.0, 4.0);
}

/**
 * Clamps viewport center to prevent black bars
 * Keeps viewport window inside [0,1] bounds
 */
function clampViewportToImage(
  viewport: { centerX: number; centerY: number; zoom: number },
  imageAspect: number,
  canvasAspect: number
): { centerX: number; centerY: number; zoom: number } {
  // Calculate visible extents accounting for aspect ratios
  // Viewport zoom determines what fraction of image is visible
  let viewportWidthNormalized = 1 / viewport.zoom;
  let viewportHeightNormalized = 1 / viewport.zoom;

  // Adjust for aspect ratio mismatch between image and canvas
  // If canvas is wider than image, we can pan more horizontally
  const aspectRatio = canvasAspect / imageAspect;

  if (aspectRatio > 1) {
    // Canvas is wider - constrain vertical movement more
    viewportHeightNormalized *= aspectRatio;
  } else {
    // Canvas is taller - constrain horizontal movement more
    viewportWidthNormalized /= aspectRatio;
  }

  const halfWidth = viewportWidthNormalized / 2;
  const halfHeight = viewportHeightNormalized / 2;

  return {
    ...viewport,
    centerX: clamp(viewport.centerX, halfWidth, 1 - halfWidth),
    centerY: clamp(viewport.centerY, halfHeight, 1 - halfHeight),
  };
}

/**
 * Generates viewport keyframes from sentence groups and regions
 * Populates startFrame and endFrame on sentence groups (mutates input)
 */
function generateKeyframes(
  sentenceGroups: SentenceGroupBase[],
  regions: DetectedRegion[],
  ctx: KeyframeGenerationContext
): ViewportKeyframe[] {
  const keyframes: ViewportKeyframe[] = [];

  for (let i = 0; i < sentenceGroups.length; i++) {
    const group = sentenceGroups[i];
    const region = findRegion(regions, group.regionId);

    // Calculate viewport to center on region
    const viewport = {
      centerX: region.bounds.x + region.bounds.width / 2,
      centerY: region.bounds.y + region.bounds.height / 2,
      zoom: calculateZoomForRegion(region.bounds, ctx.imageMetadata, ctx.canvasAspect),
    };

    // Clamp viewport center so the visible window stays inside the image after zoom
    const clampedViewport = clampViewportToImage(
      viewport,
      ctx.imageMetadata.aspectRatio,
      ctx.canvasAspect
    );

    // Calculate animation speed based on tone and WPM
    const animationSpeed = calculateAnimationSpeed({
      tone: group.tone as ToneType,
      wpm: group.wpm,
      emphasisDensity: group.emphasisDensity,
    });

    // SPECIAL CASE: First keyframe has no transition (displays immediately)
    const transitionDurationMs = i === 0 ? 0 : animationSpeed.transitionDurationMs;

    // Compute frames once here (single source of truth)
    const frameStart = msToFrame(group.startMs, ctx.fps);
    const frameEnd = msToFrame(group.endMs, ctx.fps);

    // Mutate group to record frames for downstream consumers (timeline validation, tests)
    (group as SentenceGroup).startFrame = frameStart;
    (group as SentenceGroup).endFrame = frameEnd;

    keyframes.push({
      frameStart,
      frameEnd,
      viewport: clampedViewport,
      easing: animationSpeed.easing,
      transitionDurationMs,
    });
  }

  return keyframes;
}

// ============================================================================
// Main Command Function
// ============================================================================

async function main(args: ViewportCommandArgsType): Promise<void> {
  const cliArgs = ViewportCommandArgs.parse(args);
  const { projectId } = cliArgs;
  const paths = getProjectPaths(projectId);

  console.log('[VIEWPORT] Starting viewport generation...');

  // 1. Load project configuration
  const videoConfig = await ConfigManager.loadVideoConfig();
  const aspectRatio = videoConfig.defaultAspectRatio;
  const fps = videoConfig.aspectRatios?.[aspectRatio]?.fps ?? 30;

  // Load INTRO_OFFSET_MS (global default with project override)
  const INTRO_OFFSET_MS = (videoConfig.intro?.durationMs ?? 500);

  // Load overlap threshold (CLI > project config > global default)
  const overlapThreshold =
    cliArgs.overlapThreshold ??
    (videoConfig as any).viewport?.overlapThreshold ??
    0.2;

  // Calculate canvas aspect ratio from video dimensions
  const canvasDimensions = videoConfig.aspectRatios?.[aspectRatio];
  if (!canvasDimensions) {
    throw new Error(
      `[VIEWPORT] Aspect ratio configuration not found: ${aspectRatio}`
    );
  }
  const canvasWidth = canvasDimensions.width;
  const canvasHeight = canvasDimensions.height;
  const canvasAspect = canvasWidth / canvasHeight;

  console.log(
    `[VIEWPORT] Loaded config: ${aspectRatio} @ ${fps}fps, intro offset: ${INTRO_OFFSET_MS}ms`
  );

  // 2. Validate image exists in assets (placed during gather stage)
  const imageBasename = cliArgs.imagePath
    ? path.basename(cliArgs.imagePath)
    : await findImageInAssets(paths.root); // Auto-detect if not specified

  const imagePath = path.join(paths.root, 'assets', 'images', imageBasename);

  try {
    await fs.access(imagePath);
  } catch {
    throw new Error(
      `[VIEWPORT] Image not found: ${imagePath}. Ensure image was placed during gather stage.`
    );
  }

  console.log(`[VIEWPORT] Using image: ${imageBasename}`);

  // 3. Load script (uses script.segments as semantic units)
  const scriptPath = path.join(paths.scripts, 'script-v1.json');
  let script: Script;
  try {
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    script = JSON.parse(scriptContent) as Script;
  } catch (error: any) {
    throw new Error(`[VIEWPORT] Failed to load script: ${error.message}`);
  }

  // 4. Load TTS manifest for timing (if available)
  const manifestPath = path.join(paths.root, 'tags.json'); // manifest is in tags.json
  let manifest: ManifestData | null = null;
  try {
    await fs.access(manifestPath);
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifestJson = JSON.parse(manifestContent);
    // Extract audio array from manifest structure
    manifest = { audio: manifestJson.manifest?.audio };
  } catch {
    console.warn('[VIEWPORT] manifest (tags.json) not found, will estimate timing');
  }

  // 5. Calculate segment timings (script.segments = "sentences" for viewport)
  if (!script.segments || script.segments.length === 0) {
    throw new Error('[VIEWPORT] Script has no segments. Cannot generate viewport animation.');
  }

  const segmentTimings = calculateSegmentTimings(script, manifest);
  console.log(`[VIEWPORT] Calculated timing for ${segmentTimings.length} segments`);

  // Get image metadata
  const imageMetadata = await getImageMetadata(imagePath);
  console.log(
    `[VIEWPORT] Image metadata: ${imageMetadata.width}x${imageMetadata.height} (${imageMetadata.aspectRatio.toFixed(2)})`
  );

  // 6. Call Gemini CLI for analysis (requires path relative to project root)
  console.log('[VIEWPORT] Calling Gemini for image + script analysis...');
  const relativeImagePath = path.relative(process.cwd(), imagePath);
  // e.g., "public/projects/project-123/assets/images/cam_newton.png"

  let geminiResult: GeminiResponse;
  try {
    geminiResult = await callGeminiForViewportAnalysis(relativeImagePath, segmentTimings);
  } catch (error: any) {
    console.error('[VIEWPORT] Gemini analysis failed:', error.message);
    throw error;
  }

  // 7. VALIDATE Gemini output (Zod schema + business logic)
  try {
    validateGeminiResponse(geminiResult, segmentTimings.length, overlapThreshold);
  } catch (validationError: any) {
    console.error('[VIEWPORT] Gemini response validation failed');

    // Save failed response for debugging
    const failedPath = path.join(paths.root, 'viewport-failed.json');
    await fs.writeFile(
      failedPath,
      JSON.stringify({ geminiResult, error: validationError.message }, null, 2),
      'utf-8'
    );
    console.log('[VIEWPORT] Failed response saved to viewport-failed.json');

    throw validationError;
  }

  console.log(`[VIEWPORT] Detected ${geminiResult.regions.length} regions`);
  console.log(`[VIEWPORT] Created ${geminiResult.segmentGroups.length} segment groups`);

  // 8. Build segment groups with timing data (merges Gemini + timing)
  const sentenceGroups = buildSentenceGroups(segmentTimings, geminiResult.segmentGroups);

  // 9. Generate viewport keyframes with dynamic FPS
  // Note: Zod validates all required fields are present, safe to assert type
  const keyframes = generateKeyframes(sentenceGroups, geminiResult.regions as DetectedRegion[], {
    imageMetadata,
    canvasAspect,
    fps,
  });

  console.log(`[VIEWPORT] Generated ${keyframes.length} keyframes`);

  // 10. Assemble output
  const viewportAnalysis: ViewportAnalysis = {
    version: '1.0',
    imageSource: imageBasename, // Store relative filename only
    imageMetadata,
    detectedRegions: geminiResult.regions as DetectedRegion[], // Zod validated
    sentenceGroups: sentenceGroups as SentenceGroup[], // Now has startFrame/endFrame populated
    keyframes,
  };

  // 11. Write output
  const outputPath = path.join(paths.root, 'viewport.json');
  await fs.writeFile(outputPath, JSON.stringify(viewportAnalysis, null, 2), 'utf-8');
  console.log(`[VIEWPORT] ✓ Output: ${outputPath}`);
  console.log('[VIEWPORT] ✓ Viewport generation complete');
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (require.main === module) {
  // Parse CLI args
  const args = process.argv.slice(2);
  const projectIdIndex = args.indexOf('--project');
  let projectId = projectIdIndex !== -1 ? args[projectIdIndex + 1] : undefined;

  // Support positional argument
  if (!projectId && args.length > 0 && !args[0].startsWith('--')) {
    projectId = args[0];
  }

  if (!projectId) {
    console.error('[VIEWPORT] ✗ Error: Missing required argument --project <id>');
    console.log('[VIEWPORT] Usage: npm run viewport -- --project <project-id> [--image-path <path>] [--overlap-threshold <0-1>]');
    console.log('[VIEWPORT] ');
    console.log('[VIEWPORT] Options:');
    console.log('[VIEWPORT]   --project <id>            Project ID (required)');
    console.log('[VIEWPORT]   --image-path <path>       Specific image to use (optional)');
    console.log('[VIEWPORT]   --overlap-threshold <n>   Max region overlap IoU 0-1 (default: 0.2)');
    console.log('[VIEWPORT] ');
    process.exit(1);
  }

  // Parse optional arguments
  const imagePathIndex = args.indexOf('--image-path');
  const imagePath = imagePathIndex !== -1 ? args[imagePathIndex + 1] : undefined;

  const overlapThresholdIndex = args.indexOf('--overlap-threshold');
  const overlapThreshold =
    overlapThresholdIndex !== -1 ? parseFloat(args[overlapThresholdIndex + 1]) : 0.2;

  // Run main function
  main({ projectId, imagePath, overlapThreshold })
    .then(() => {
      process.exit(0);
    })
    .catch((error: any) => {
      console.error('[VIEWPORT] ✗ Error:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}

export default main;
