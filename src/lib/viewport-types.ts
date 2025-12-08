import { z } from 'zod';

// ============================================================================
// Section 1.0: Manifest Schema (TTS Output)
// ============================================================================

/**
 * Audio entry for each script segment from TTS output
 */
export const ManifestAudioEntrySchema = z.object({
  segmentIndex: z.number().int().min(0),
  text: z.string(),
  startMs: z.number().min(0),
  endMs: z.number().min(0),
  durationMs: z.number().min(0),
  audioFile: z.string(), // e.g., "segment-0.mp3"
  // Optional fields for future enhancement
  emphasisWords: z.array(z.string()).optional(),
  emphasisRatio: z.number().min(0).max(1).optional(),
});

/**
 * Complete manifest schema containing audio timing data from TTS
 */
export const ManifestSchema = z.object({
  version: z.string(),
  projectId: z.string(),
  audio: z.array(ManifestAudioEntrySchema),
  // ... other manifest fields (images, tags, etc.)
});

export type ManifestAudioEntry = z.infer<typeof ManifestAudioEntrySchema>;
export type Manifest = z.infer<typeof ManifestSchema>;

/**
 * Validation Notes:
 * - If manifest.audio exists, use actual TTS timing data
 * - If missing or incomplete, fall back to WPM estimation (~150 WPM)
 * - startMs/endMs must be sequential and non-overlapping
 * - durationMs should equal (endMs - startMs)
 */

// ============================================================================
// Section 1.1: Viewport Analysis Types
// ============================================================================

/**
 * A detected region of visual interest in the image
 * Represents distinct objects or areas that can be focused on
 */
export interface DetectedRegion {
  id: string; // "region-1", "region-2", etc.
  label: string; // "athlete's face", "football", "jersey number"
  bounds: {
    x: number; // 0-1 normalized (left edge)
    y: number; // 0-1 normalized (top edge)
    width: number; // 0-1 normalized
    height: number; // 0-1 normalized
  };
  salience: number; // 0-1 visual importance score
}

/**
 * Base sentence group before keyframe generation
 * Represents grouped audio segments that focus on a specific region
 */
export interface SentenceGroupBase {
  groupIndex: number;
  segmentIndices: number[]; // [0, 1] = first two segments grouped
  regionId: string; // Which region this group focuses on
  tone: 'dramatic' | 'narrative' | 'action' | 'contemplative' | 'energetic';
  focusReason: string; // "Describes the athlete's expression"
  startMs: number;
  endMs: number;
  wpm: number; // Average words-per-minute for this group (computed from segments)
  emphasisDensity?: number; // Optional: ratio of emphasized words (future enhancement)
}

/**
 * Complete sentence group after keyframe generation
 * Extends SentenceGroupBase with frame information
 */
export interface SentenceGroup extends SentenceGroupBase {
  startFrame: number; // populated in generateKeyframes (single source of truth)
  endFrame: number;
}

/**
 * A keyframe definition for viewport animation
 * Specifies the camera position and zoom at specific frame ranges
 */
export interface ViewportKeyframe {
  frameStart: number;
  frameEnd: number;
  viewport: {
    centerX: number; // 0-1 (center of viewport on image)
    centerY: number; // 0-1
    zoom: number; // 1.0 = full image, 2.0 = 2x magnification
  };
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'slowDramatic' | 'fastAction';
  transitionDurationMs: number; // How long to transition TO this keyframe
}

/**
 * Complete viewport analysis output
 * Contains detected regions, sentence groupings, and generated keyframes
 */
export interface ViewportAnalysis {
  version: '1.0';
  imageSource: string; // Path to source image
  imageMetadata: { width: number; height: number; aspectRatio: number };
  detectedRegions: DetectedRegion[];
  sentenceGroups: SentenceGroup[];
  keyframes: ViewportKeyframe[];
}

// ============================================================================
// Section 1.2: Gemini Response Validation Schemas
// ============================================================================

/**
 * Gemini Region Schema - validates structure, bounds, and ranges
 * Enforces:
 * - Non-empty ID and label
 * - Normalized bounds (0-1 range)
 * - Positive dimensions
 * - Normalized salience score
 */
export const GeminiRegionSchema = z.object({
  id: z.string().min(1, 'Region ID must not be empty'),
  label: z.string().min(1, 'Region label must not be empty'),
  bounds: z.object({
    x: z.number().min(0).max(1, 'x must be in range 0-1'),
    y: z.number().min(0).max(1, 'y must be in range 0-1'),
    width: z.number().positive('width must be positive').max(1, 'width must be ≤ 1'),
    height: z.number().positive('height must be positive').max(1, 'height must be ≤ 1'),
  }),
  salience: z.number().min(0).max(1, 'salience must be in range 0-1'),
});

/**
 * Gemini Segment Group Schema - validates group structure
 * Enforces:
 * - At least 1 segment, at most 4 segments per group
 * - Valid region reference
 * - Valid tone enum
 * - Non-empty focus reason
 */
export const GeminiSegmentGroupSchema = z.object({
  segmentIndices: z
    .array(z.number().int())
    .min(1, 'Group must have at least 1 segment')
    .max(4, 'Group must have at most 4 segments'),
  regionId: z.string().min(1),
  tone: z.enum(['dramatic', 'narrative', 'action', 'contemplative', 'energetic']),
  focusReason: z.string().min(1),
});

/**
 * Complete Gemini Response Schema
 * Validates:
 * - 3-8 regions (enough diversity, not too many)
 * - At least 1 segment group
 * - All regions conform to GeminiRegionSchema
 * - All groups conform to GeminiSegmentGroupSchema
 */
export const GeminiResponseSchema = z.object({
  regions: z
    .array(GeminiRegionSchema)
    .min(3, 'Must have at least 3 regions')
    .max(8, 'Must have at most 8 regions'),
  segmentGroups: z
    .array(GeminiSegmentGroupSchema)
    .min(1, 'Must have at least 1 segment group'),
});

/**
 * TypeScript types generated from Zod schemas
 */
export type GeminiRegion = z.infer<typeof GeminiRegionSchema>;
export type GeminiSegmentGroup = z.infer<typeof GeminiSegmentGroupSchema>;
export type GeminiResponse = z.infer<typeof GeminiResponseSchema>;

// ============================================================================
// Section 1.2: Business Logic Validation
// ============================================================================

/**
 * Helper function to calculate Intersection over Union (IoU) overlap
 * Used to ensure regions don't overlap excessively
 *
 * @param boundsA - First region bounds
 * @param boundsB - Second region bounds
 * @returns IoU value (0-1), where higher values indicate more overlap
 */
export function calculateOverlap(
  boundsA: { x: number; y: number; width: number; height: number },
  boundsB: { x: number; y: number; width: number; height: number }
): number {
  // Calculate intersection box
  const x1 = Math.max(boundsA.x, boundsB.x);
  const y1 = Math.max(boundsA.y, boundsB.y);
  const x2 = Math.min(boundsA.x + boundsA.width, boundsB.x + boundsB.width);
  const y2 = Math.min(boundsA.y + boundsA.height, boundsB.y + boundsB.height);

  // No overlap if boxes don't intersect
  if (x2 <= x1 || y2 <= y1) {
    return 0;
  }

  // Calculate IoU
  const intersectionArea = (x2 - x1) * (y2 - y1);
  const areaA = boundsA.width * boundsA.height;
  const areaB = boundsB.width * boundsB.height;
  const unionArea = areaA + areaB - intersectionArea;

  return intersectionArea / unionArea;
}

/**
 * Validates Gemini response against business logic rules
 *
 * Zod handles structural validation:
 * - Bounds 0-1 range and positive area
 * - Salience 0-1 range
 * - Group length 1-4
 * - Tone enum validation
 * - Region count 3-8
 *
 * This function validates business logic rules:
 * 1. IoU overlap ≤ overlapThreshold (up to 20% overlap allowed by default)
 * 2. RegionId references exist
 * 3. Contiguous segment coverage (no gaps, no duplicates)
 * 4. Chronological group ordering
 * 5. No consecutive groups targeting same region (would cause no camera movement)
 * 6. Bounds remain on-canvas (x+width ≤ 1, y+height ≤ 1)
 *
 * @param response - Validated Gemini response object
 * @param totalSegments - Total number of segments in the manifest
 * @param overlapThreshold - Maximum allowed IoU overlap (default 0.2 = 20%)
 * @throws Error if any validation rule is violated
 */
export function validateGeminiResponseBusinessLogic(
  response: GeminiResponse,
  totalSegments: number,
  overlapThreshold: number = 0.2
): void {
  // 1. Check IoU overlap between all region pairs
  for (let i = 0; i < response.regions.length; i++) {
    for (let j = i + 1; j < response.regions.length; j++) {
      const overlap = calculateOverlap(
        response.regions[i].bounds,
        response.regions[j].bounds
      );
      if (overlap > overlapThreshold) {
        throw new Error(
          `Regions ${response.regions[i].id} and ${response.regions[j].id} have IoU overlap of ${Math.round(overlap * 100)}% (max allowed: ${Math.round(overlapThreshold * 100)}%)`
        );
      }
    }
  }

  // 2. Validate regionId references exist
  const regionIds = new Set(response.regions.map((r) => r.id));
  for (const group of response.segmentGroups) {
    if (!regionIds.has(group.regionId)) {
      throw new Error(`Group references non-existent region: ${group.regionId}`);
    }
  }

  // 3. Validate contiguous segment coverage (no gaps, no duplicates)
  const allIndices = response.segmentGroups.flatMap((g) => g.segmentIndices);
  const sortedIndices = [...new Set(allIndices)].sort((a, b) => a - b);
  const expected = Array.from({ length: totalSegments }, (_, i) => i);

  if (JSON.stringify(sortedIndices) !== JSON.stringify(expected)) {
    const missing = expected.filter((i) => !allIndices.includes(i));
    const duplicates = allIndices.filter((i, idx) => allIndices.indexOf(i) !== idx);
    throw new Error(
      `Segment indices not contiguous. Missing: [${missing}], Duplicates: [${duplicates}]`
    );
  }

  // 4. Validate chronological ordering
  let lastMaxIndex = -1;
  for (const group of response.segmentGroups) {
    const minIndex = Math.min(...group.segmentIndices);
    if (minIndex <= lastMaxIndex) {
      throw new Error(
        `Groups not in chronological order. Group with indices [${group.segmentIndices}] comes after index ${lastMaxIndex}`
      );
    }
    lastMaxIndex = Math.max(...group.segmentIndices);
  }

  // 5. Validate bounds stay on-canvas (x+width ≤ 1, y+height ≤ 1)
  for (const region of response.regions) {
    const { x, y, width, height } = region.bounds;
    if (x + width > 1 || y + height > 1) {
      throw new Error(
        `Region ${region.id} exceeds image bounds (x+width=${(x + width).toFixed(2)}, y+height=${(y + height).toFixed(2)})`
      );
    }
  }

  // 6. Validate no consecutive groups target the same region
  // (would cause no camera movement)
  for (let i = 1; i < response.segmentGroups.length; i++) {
    const prevRegion = response.segmentGroups[i - 1].regionId;
    const currRegion = response.segmentGroups[i].regionId;
    if (prevRegion === currRegion) {
      throw new Error(
        `Consecutive segment groups (${i - 1}, ${i}) both target region ${currRegion}. Camera would not move.`
      );
    }
  }
}
