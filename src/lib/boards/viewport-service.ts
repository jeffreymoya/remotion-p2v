import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

import {
  BoardPlan,
  BoardRegion,
  BoardRegionsOutput,
  BoardTriggersOutput,
  RegionBounds,
  ViewportTrigger,
} from '../boards-types';

interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
}

interface ViewportState {
  centerX: number;
  centerY: number;
  zoom: number;
}

interface Keyframe {
  frame: number;
  boardId: string;
  regionId: string;
  viewport: ViewportState;
}

export interface ViewportJson {
  version: '2.0';
  generatedBy: 'boards';
  boards: Array<{
    boardId: string;
    imageSource: string;
    imageMetadata: ImageMetadata;
    segmentRange: [number, number];
    regions: BoardRegion[];
  }>;
  wordTriggers: ViewportTrigger[];
  keyframes: Keyframe[];
  generatedAt: string;
}

interface ImageInfo extends ImageMetadata {
  path: string;
}

export interface BuildViewportOptions {
  fps?: number;
  projectPath: string;
}

/**
 * Build viewport.json from board plan, regions, and triggers
 */
export async function buildViewportJson(
  plan: BoardPlan,
  regionsData: BoardRegionsOutput[],
  triggers: BoardTriggersOutput,
  options: BuildViewportOptions
): Promise<ViewportJson> {
  const { fps = 30, projectPath } = options;
  const imagesDir = path.join(projectPath, 'assets', 'images');

  console.log('[BUILD] Checking for upscaled images...');
  const imageMap = await checkUpscaledImages(plan.boards, imagesDir);

  console.log('[BUILD] Calculating keyframes...');
  const keyframes = calculateKeyframes(triggers.triggers, regionsData, fps);
  console.log(`[BUILD] Generated ${keyframes.length} keyframes`);

  const viewport = assembleViewportJson(plan, regionsData, triggers, imageMap, keyframes);

  return viewport;
}

async function checkUpscaledImages(
  boards: BoardPlan['boards'],
  imagesDir: string
): Promise<Map<string, ImageInfo>> {
  const imageMap = new Map<string, ImageInfo>();
  const missingUpscales: string[] = [];

  for (const board of boards) {
    const upscaledPath = path.join(imagesDir, `${board.boardId}_8k.png`);
    const originalPath = path.join(imagesDir, `${board.boardId}.png`);

    let imagePath: string;
    if (await fileExists(upscaledPath)) {
      imagePath = upscaledPath;
      console.log(`[BUILD] Using upscaled: ${path.basename(upscaledPath)}`);
    } else if (await fileExists(originalPath)) {
      imagePath = originalPath;
      missingUpscales.push(board.boardId);
    } else {
      throw new Error(`[BUILD] No image found for ${board.boardId}`);
    }

    const metadata = await getImageMetadata(imagePath);
    imageMap.set(board.boardId, { ...metadata, path: path.basename(imagePath) });
  }

  if (missingUpscales.length > 0) {
    console.warn(`\n[BUILD] WARNING: No 8k images found for: ${missingUpscales.join(', ')}`);
    console.warn('[BUILD] Using original images. Run upscale command for best quality.\n');
  }

  return imageMap;
}

function calculateKeyframes(
  triggers: ViewportTrigger[],
  regionsData: BoardRegionsOutput[],
  fps: number
): Keyframe[] {
  const keyframes: Keyframe[] = [];

  for (const trigger of triggers) {
    const board = regionsData.find(r => r.boardId === trigger.targetBoardId);
    const region = board?.regions.find(r => r.id === trigger.targetRegionId);

    if (!board || !region) {
      console.warn(`[BUILD] Region not found for trigger ${trigger.triggerId}`);
      continue;
    }

    const viewport = calculateViewportForRegion(region.bounds, board.imageMetadata);
    const frame = Math.round((trigger.wordStartMs / 1000) * fps);

    keyframes.push({
      frame,
      boardId: trigger.targetBoardId,
      regionId: trigger.targetRegionId,
      viewport,
    });
  }

  return keyframes;
}

function calculateViewportForRegion(bounds: RegionBounds, imageMetadata: ImageMetadata): ViewportState {
  const canvasAspect = 16 / 9;
  const imageAspect = imageMetadata.aspectRatio;

  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  const targetCoverage = 0.9;
  let zoom: number;

  if (imageAspect > canvasAspect) {
    const zoomForWidth = targetCoverage / bounds.width;
    const effectiveHeightRatio = (bounds.height * imageAspect) / canvasAspect;
    const zoomForHeight = targetCoverage / effectiveHeightRatio;
    zoom = Math.min(zoomForWidth, zoomForHeight);
  } else {
    const zoomForHeight = targetCoverage / bounds.height;
    const effectiveWidthRatio = (bounds.width * canvasAspect) / imageAspect;
    const zoomForWidth = targetCoverage / effectiveWidthRatio;
    zoom = Math.min(zoomForWidth, zoomForHeight);
  }

  zoom = Math.max(1.0, Math.min(5.0, zoom));

  return { centerX, centerY, zoom };
}

function assembleViewportJson(
  plan: BoardPlan,
  regionsData: BoardRegionsOutput[],
  triggers: BoardTriggersOutput,
  imageMap: Map<string, ImageInfo>,
  keyframes: Keyframe[]
): ViewportJson {
  const boards = plan.boards.map(board => {
    const imageInfo = imageMap.get(board.boardId);
    const boardRegions = regionsData.find(r => r.boardId === board.boardId);

    if (!imageInfo) {
      throw new Error(`[BUILD] Missing image info for ${board.boardId}`);
    }

    return {
      boardId: board.boardId,
      imageSource: imageInfo.path,
      imageMetadata: {
        width: imageInfo.width,
        height: imageInfo.height,
        aspectRatio: imageInfo.aspectRatio,
      },
      segmentRange: [board.segmentIndices[0], board.segmentIndices[board.segmentIndices.length - 1]] as [number, number],
      regions: boardRegions?.regions ?? [],
    };
  });

  return {
    version: '2.0',
    generatedBy: 'boards',
    boards,
    wordTriggers: triggers.triggers,
    keyframes,
    generatedAt: new Date().toISOString(),
  };
}

async function getImageMetadata(imagePath: string): Promise<ImageMetadata> {
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

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Convenience function to build viewport.json from project files on disk.
 * Loads board-plan.json, board-regions.json, and board-triggers.json from the project's boards directory.
 *
 * @param projectPath - Path to the project directory
 * @param fps - Frames per second (default: 30)
 * @returns ViewportJson object
 */
export async function buildViewportJsonFromFiles(
  projectPath: string,
  fps = 30
): Promise<ViewportJson> {
  const boardsDir = path.join(projectPath, 'boards');

  console.log('[BUILD] Loading board data...');
  const plan = await readJson<BoardPlan>(path.join(boardsDir, 'board-plan.json'));
  const regionsWrapper = await readJson<{ boards: BoardRegionsOutput[] }>(
    path.join(boardsDir, 'board-regions.json')
  );
  const triggers = await readJson<BoardTriggersOutput>(
    path.join(boardsDir, 'board-triggers.json')
  );

  console.log(`[BUILD] Loaded ${plan.boards.length} boards, ${triggers.totalTriggers} triggers`);

  return buildViewportJson(plan, regionsWrapper.boards, triggers, { projectPath, fps });
}
