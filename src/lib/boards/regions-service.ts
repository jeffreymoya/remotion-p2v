import sharp from 'sharp';
import { z } from 'zod';
import {
  BoardRegion,
  BoardRegionSchema,
  BoardPrompt,
} from '../boards-types';
import { boardsRegionPrompt, RegionPromptContext } from '../../../config/prompts/boards-region.prompt';

/**
 * Image metadata extracted from the board image
 */
export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Response schema for region detection from AI
 */
export const RegionDetectionResponseSchema = z.object({
  regions: z.array(BoardRegionSchema),
  detectionNotes: z.string().optional(),
});

/**
 * Extract image metadata using sharp
 */
export async function getImageMetadata(imagePath: string): Promise<ImageMetadata> {
  const metadata = await sharp(imagePath).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read image dimensions: ${imagePath}`);
  }

  return {
    width: metadata.width,
    height: metadata.height,
    aspectRatio: metadata.width / metadata.height,
  };
}

/**
 * Build prompt context for region detection
 */
export function buildRegionPromptContext(
  boardPrompt: BoardPrompt,
  imageMetadata: ImageMetadata
): RegionPromptContext {
  return {
    gridLayout: boardPrompt.gridLayout,
    expectedElements: boardPrompt.elements.map(e => ({
      id: e.id,
      type: e.type,
      gridPosition: e.gridPosition,
      description: e.description,
    })),
    imageAspectRatio: imageMetadata.aspectRatio,
    canvasAspectRatio: 16 / 9,
  };
}

/**
 * Validate that all regions reference valid element IDs
 */
export function validateRegionElementLinks(
  regions: BoardRegion[],
  expectedElements: Array<{ id: string }>
): void {
  const elementIds = new Set(expectedElements.map(e => e.id));

  for (const region of regions) {
    if (!elementIds.has(region.elementId)) {
      throw new Error(
        `Region ${region.id} references unknown element: ${region.elementId}. Valid elements: ${Array.from(elementIds).join(', ')}`
      );
    }
  }
}

/**
 * Validate and adjust region bounds to ensure they fit within image boundaries
 * and respect grid constraints
 */
export function validateRegions(
  regions: BoardRegion[],
  gridLayout: { rows: number; cols: number }
): { valid: BoardRegion[]; warnings: string[] } {
  const maxWidth = 1 / gridLayout.cols;
  const maxHeight = 1 / gridLayout.rows;
  const warnings: string[] = [];

  const valid = regions.map(region => {
    const adjusted = {
      ...region,
      bounds: { ...region.bounds },
    };

    // Check width exceeds grid cell
    if (adjusted.bounds.width > maxWidth * 1.1) {
      warnings.push(`${region.id}: width ${adjusted.bounds.width.toFixed(3)} exceeds max ${maxWidth.toFixed(3)}`);
      adjusted.bounds.width = maxWidth;
    }

    // Check height exceeds grid cell
    if (adjusted.bounds.height > maxHeight * 1.1) {
      warnings.push(`${region.id}: height ${adjusted.bounds.height.toFixed(3)} exceeds max ${maxHeight.toFixed(3)}`);
      adjusted.bounds.height = maxHeight;
    }

    // Ensure bounds don't exceed image boundaries
    if (adjusted.bounds.x + adjusted.bounds.width > 1) {
      adjusted.bounds.width = 1 - adjusted.bounds.x;
    }

    if (adjusted.bounds.y + adjusted.bounds.height > 1) {
      adjusted.bounds.height = 1 - adjusted.bounds.y;
    }

    // Clamp all values to valid range [0, 1]
    adjusted.bounds.x = Math.max(0, adjusted.bounds.x);
    adjusted.bounds.y = Math.max(0, adjusted.bounds.y);
    adjusted.bounds.width = Math.max(0, adjusted.bounds.width);
    adjusted.bounds.height = Math.max(0, adjusted.bounds.height);

    return adjusted;
  });

  return { valid, warnings };
}

/**
 * Detect regions in a board image using AI vision
 *
 * @param imagePath - Absolute path to the board image
 * @param context - Region detection context with grid layout and expected elements
 * @param aiDetectFn - Function that calls AI provider for region detection
 * @returns Array of detected regions
 */
export async function detectRegions(
  imagePath: string,
  context: RegionPromptContext,
  aiDetectFn: (multimodalPrompt: string) => Promise<z.infer<typeof RegionDetectionResponseSchema>>
): Promise<BoardRegion[]> {
  const prompt = boardsRegionPrompt(context);

  // For Gemini Vision multimodal prompts, use pattern: @{imagePath}\n\n{prompt}
  const multimodalPrompt = `@${imagePath}\n\n${prompt}`;

  const response = await aiDetectFn(multimodalPrompt);

  // Validate that all regions reference valid elements
  validateRegionElementLinks(response.regions, context.expectedElements);

  return response.regions;
}

/**
 * Main function to detect board regions
 *
 * @param boardPrompt - Board prompt containing grid layout and elements
 * @param imagePath - Absolute path to the board image
 * @param aiDetectFn - Function that calls AI provider for region detection
 * @returns Region detection result with metadata and validated regions
 */
export async function detectBoardRegions(
  boardPrompt: BoardPrompt,
  imagePath: string,
  aiDetectFn: (multimodalPrompt: string) => Promise<z.infer<typeof RegionDetectionResponseSchema>>
): Promise<{
  imageMetadata: ImageMetadata;
  regions: BoardRegion[];
  warnings: string[];
}> {
  // Extract image metadata
  const metadata = await getImageMetadata(imagePath);

  // Build context for region detection
  const context = buildRegionPromptContext(boardPrompt, metadata);

  // Detect regions using AI
  const rawRegions = await detectRegions(imagePath, context, aiDetectFn);

  // Validate and adjust regions
  const { valid: regions, warnings } = validateRegions(rawRegions, boardPrompt.gridLayout);

  return {
    imageMetadata: metadata,
    regions,
    warnings,
  };
}
