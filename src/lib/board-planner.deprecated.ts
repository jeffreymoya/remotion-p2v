import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { z } from 'zod';
import {
  BoardPlan,
  BoardSegmentMapping,
  BoardsConfig,
  DEFAULT_BOARDS_CONFIG,
  MAX_BOARDS,
  BoardPromptsOutput,
  BoardPrompt,
  BoardElement,
  BoardElementType,
  SegmentContext,
  BoardRegion,
  BoardRegionsOutput,
  BoardRegionSchema,
  BoardTriggersOutput,
  ViewportTrigger,
  RegionBounds,
} from '../../src/lib/boards-types';
// Note: AIProviderFactory not migrated - AI-dependent functions will need refactoring
// import { AIProviderFactory } from '../services/ai';
import { boardsPlanPrompt, topicSummaryPrompt } from '../../config/prompts/boards-plan.prompt';
import { contentAnalysisPrompt, elementDescriptionPrompt } from '../../config/prompts/boards-image.prompt';
import { boardsRegionPrompt, RegionPromptContext } from '../../config/prompts/boards-region.prompt';

export interface ScriptSegment {
  id: string;
  order: number;
  text: string;
  estimatedDurationMs: number;
  speakingNotes?: string;
}

export interface Script {
  title?: string;
  segments: ScriptSegment[];
  totalEstimatedDurationMs?: number;
}

interface SegmentMetrics {
  index: number;
  id: string;
  durationMs: number;
  cumulativeDurationMs: number;
  text: string;
}

interface TopicBreak {
  afterSegmentIndex: number;
  reason: string;
  confidence: number;
}

const TopicBreakSchema = z.object({
  afterSegmentIndex: z.number().int().min(0),
  reason: z.string(),
  confidence: z.number().min(0).max(1).default(0.5),
});

const TopicBreakResponseSchema = z.object({
  topicBreaks: z.array(TopicBreakSchema).default([]),
  segmentSummaries: z
    .array(z.object({ index: z.number().int().min(0), topic: z.string() }))
    .optional(),
});

const ContentAnalysisSchema = z.object({
  topics: z.array(z.string()).default([]),
  entities: z.array(z.string()).default([]),
  tone: z.string().default('dramatic'),
});

const ElementDescriptionResponseSchema = z.array(
  z.object({
    id: z.string(),
    description: z.string(),
    label: z.string().nullable().optional(),
    connections: z.array(z.string()).optional(),
  })
);

interface BoardContent {
  boardId: string;
  segments: ScriptSegment[];
  topics: string[];
  keyEntities: string[];
  emotionalTone: string;
}

/**
 * Plan board groups from script content using LLM topic breaks and duration rules.
 */
export async function planBoards(
  script: Script,
  scriptPath: string,
  config: BoardsConfig = DEFAULT_BOARDS_CONFIG
): Promise<BoardPlan> {
  const metrics = calculateMetrics(script.segments);

  const topicBreaks = await detectTopicBreaks(script.segments);

  const boardGroups = groupSegments(metrics, topicBreaks, {
    targetDurationMs: config.targetDurationPerBoardMs,
    minSegments: config.minSegmentsPerBoard,
    maxSegments: config.maxSegmentsPerBoard,
  });

  const boards: BoardSegmentMapping[] = [];
  for (const group of boardGroups) {
    const summary = await generateTopicSummary(script.segments, group.indices);
    boards.push({
      boardId: `board-${boards.length + 1}`,
      segmentIndices: group.indices,
      totalDurationMs: group.durationMs,
      topicSummary: summary,
    });
  }

  return {
    version: '1.0',
    scriptPath,
    totalSegments: script.segments.length,
    totalDurationMs:
      script.totalEstimatedDurationMs ??
      script.segments.reduce((sum, seg) => sum + (seg.estimatedDurationMs || 0), 0),
    boards,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Stage 3: Generate AI prompts for each board
 */
export async function generateBoardPrompts(
  plan: BoardPlan,
  script: Script,
  gridLayout = { rows: 2, cols: 3 }
): Promise<BoardPromptsOutput> {
  console.log(`[PROMPTS] Generating prompts for ${plan.boards.length} boards...`);

  const prompts: BoardPrompt[] = [];

  for (const board of plan.boards) {
    console.log(`[PROMPTS] Processing ${board.boardId}...`);

    const content = await analyzeContent(board, script);
    let elements = generateElements(content, gridLayout);
    elements = await fillElementDescriptions(elements, content);

    const segmentContexts = mapSegmentsToElements(
      script.segments,
      elements,
      board.segmentIndices
    );

    const fullPromptText = buildFullPrompt(elements, gridLayout, content);

    prompts.push({
      boardId: board.boardId,
      gridLayout,
      styleGuide: DETECTIVE_BOARD_STYLE_GUIDE,
      elements,
      segmentContexts,
      fullPromptText,
    });
  }

  return {
    version: '1.0',
    prompts,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Stage 4: Detect regions in generated board images using Gemini with grid hints
 */
export async function detectBoardRegions(
  prompts: BoardPromptsOutput,
  imagesDir: string
): Promise<BoardRegionsOutput[]> {
  console.log(`[REGIONS] Detecting regions for ${prompts.prompts.length} boards...`);

  const results: BoardRegionsOutput[] = [];

  for (const prompt of prompts.prompts) {
    const imagePath = path.join(imagesDir, `${prompt.boardId}.png`);

    if (!(await fileExists(imagePath))) {
      const expectedFiles = prompts.prompts.map(p => `${p.boardId}.png`).join(', ');
      throw new Error(
        `[REGIONS] Missing image: ${imagePath}\n` +
          `Upload all board images to assets/images/ before running regions stage.\n` +
          `Expected files: ${expectedFiles}`
      );
    }

    console.log(`[REGIONS] Processing ${prompt.boardId}...`);

    const metadata = await getImageMetadata(imagePath);
    console.log(`[REGIONS]   Image: ${metadata.width}x${metadata.height}`);

    const context = buildRegionPromptContext(prompt, metadata);
    const rawRegions = await detectRegions(imagePath, context);

    const { valid: regions, warnings } = validateRegions(rawRegions, prompt.gridLayout);
    if (warnings.length > 0) {
      console.warn('[REGIONS]   Warnings:');
      warnings.forEach(w => console.warn(`    - ${w}`));
    }

    results.push({
      version: '1.0',
      boardId: prompt.boardId,
      imagePath: path.posix.join('assets', 'images', `${prompt.boardId}.png`),
      imageMetadata: metadata,
      regions,
      generatedAt: new Date().toISOString(),
    });
  }

  return results;
}

interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
}

const RegionDetectionResponseSchema = z.object({
  regions: z.array(BoardRegionSchema),
  detectionNotes: z.string().optional(),
});

async function detectRegions(
  imagePath: string,
  context: RegionPromptContext
): Promise<BoardRegion[]> {
  const aiProvider = await AIProviderFactory.getProviderWithFallback();
  aiProvider.setPipelineStage?.('boards-regions');

  const prompt = boardsRegionPrompt(context);
  const relativeImagePath = toProjectRelativePath(imagePath);
  const multimodalPrompt = `@${relativeImagePath}\n\n${prompt}`;

  const response = await callGeminiWithRetry(
    async () => aiProvider.structuredComplete(multimodalPrompt, RegionDetectionResponseSchema),
    3,
    'region-detection'
  );

  validateRegionElementLinks(response.regions, context.expectedElements);

  return response.regions;
}

function buildRegionPromptContext(prompt: BoardPrompt, imageMetadata: ImageMetadata): RegionPromptContext {
  return {
    gridLayout: prompt.gridLayout,
    expectedElements: prompt.elements.map(e => ({
      id: e.id,
      type: e.type,
      gridPosition: e.gridPosition,
      description: e.description,
    })),
    imageAspectRatio: imageMetadata.aspectRatio,
    canvasAspectRatio: 16 / 9,
  };
}

function validateRegionElementLinks(
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

function validateRegions(
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

    if (adjusted.bounds.width > maxWidth * 1.1) {
      warnings.push(`${region.id}: width ${adjusted.bounds.width.toFixed(3)} exceeds max ${maxWidth.toFixed(3)}`);
      adjusted.bounds.width = maxWidth;
    }

    if (adjusted.bounds.height > maxHeight * 1.1) {
      warnings.push(`${region.id}: height ${adjusted.bounds.height.toFixed(3)} exceeds max ${maxHeight.toFixed(3)}`);
      adjusted.bounds.height = maxHeight;
    }

    if (adjusted.bounds.x + adjusted.bounds.width > 1) {
      adjusted.bounds.width = 1 - adjusted.bounds.x;
    }

    if (adjusted.bounds.y + adjusted.bounds.height > 1) {
      adjusted.bounds.height = 1 - adjusted.bounds.y;
    }

    adjusted.bounds.x = Math.max(0, adjusted.bounds.x);
    adjusted.bounds.y = Math.max(0, adjusted.bounds.y);
    adjusted.bounds.width = Math.max(0, adjusted.bounds.width);
    adjusted.bounds.height = Math.max(0, adjusted.bounds.height);

    return adjusted;
  });

  return { valid, warnings };
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

function toProjectRelativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/');
}

function calculateMetrics(segments: ScriptSegment[]): SegmentMetrics[] {
  let cumulative = 0;
  return segments.map((seg, idx) => {
    const durationMs = seg.estimatedDurationMs || 0;
    cumulative += durationMs;
    return {
      index: idx,
      id: seg.id,
      durationMs,
      cumulativeDurationMs: cumulative,
      text: seg.text,
    };
  });
}

async function detectTopicBreaks(segments: ScriptSegment[]): Promise<TopicBreak[]> {
  if (segments.length === 0) return [];

  const aiProvider = await AIProviderFactory.getProviderWithFallback();
  aiProvider.setPipelineStage?.('boards-plan');

  const prompt = boardsPlanPrompt(segments.map((s, i) => ({ index: i, text: s.text })));

  const response = await callGeminiWithRetry(async () => {
    const raw = await aiProvider.complete(prompt);
    return parseJsonFromLLM(raw);
  }, 3, 'topic-breaks');

  const parsed = TopicBreakResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new Error(
      `[PLAN] LLM topic break response failed validation: ${parsed.error.message}`
    );
  }

  const topicBreaks = parsed.data.topicBreaks
    .filter(tb => tb.afterSegmentIndex < segments.length - 1)
    .map(tb => ({
      afterSegmentIndex: tb.afterSegmentIndex,
      reason: tb.reason,
      confidence: tb.confidence,
    }));

  return topicBreaks;
}

function groupSegments(
  metrics: SegmentMetrics[],
  topicBreaks: TopicBreak[],
  config: { targetDurationMs: number; minSegments: number; maxSegments: number }
): Array<{ indices: number[]; durationMs: number }> {
  const boards: Array<{ indices: number[]; durationMs: number }> = [];
  const validMetrics = metrics.filter(m => {
    if (m.durationMs <= 0) {
      console.warn(`[PLAN] Skipping segment ${m.index} with zero duration`);
      return false;
    }
    return true;
  });

  const topicBreakSet = new Set(topicBreaks.map(tb => tb.afterSegmentIndex));

  let current: number[] = [];
  let currentDuration = 0;

  for (const seg of validMetrics) {
    const isTopicBreak = topicBreakSet.has(seg.index);
    const exceedsTarget =
      currentDuration + seg.durationMs > config.targetDurationMs &&
      current.length >= config.minSegments;
    const reachedMax = current.length >= config.maxSegments;
    const shouldBreak = (exceedsTarget || (isTopicBreak && current.length >= config.minSegments) || reachedMax) && current.length > 0;

    if (shouldBreak) {
      boards.push(createBoardMapping(boards.length + 1, current, metrics));
      current = [];
      currentDuration = 0;

      if (boards.length >= MAX_BOARDS) {
        console.warn(`[PLAN] Reached maximum board limit (${MAX_BOARDS}). Remaining segments added to last board.`);
        break;
      }
    }

    current.push(seg.index);
    currentDuration += seg.durationMs;
  }

  if (boards.length >= MAX_BOARDS && current.length > 0) {
    const last = boards[boards.length - 1];
    last.indices.push(...current);
    last.durationMs += currentDuration;
  } else if (current.length > 0) {
    boards.push(createBoardMapping(boards.length + 1, current, metrics));
  }

  return boards;
}

function createBoardMapping(
  boardNumber: number,
  segmentIndices: number[],
  metrics: SegmentMetrics[]
): { indices: number[]; durationMs: number } {
  const durationMs = segmentIndices.reduce((sum, idx) => {
    const metric = metrics[idx];
    return sum + (metric?.durationMs ?? 0);
  }, 0);

  return {
    indices: [...segmentIndices],
    durationMs,
  };
}

async function generateTopicSummary(segments: ScriptSegment[], indices: number[]): Promise<string> {
  if (indices.length === 0) return 'No segments';

  const aiProvider = await AIProviderFactory.getProviderWithFallback();
  aiProvider.setPipelineStage?.('boards-plan-summary');

  const texts = indices.map(i => segments[i].text);
  const prompt = topicSummaryPrompt(texts);

  const summary = await callGeminiWithRetry(async () => {
    const raw = await aiProvider.complete(prompt);
    return String(raw).trim();
  }, 3, 'topic-summary');

  return summary;
}

async function analyzeContent(
  boardPlan: BoardSegmentMapping,
  script: Script
): Promise<BoardContent> {
  const segments = boardPlan.segmentIndices.map(i => script.segments[i]);
  const combinedText = segments.map(s => s.text).join(' ');

  const aiProvider = await AIProviderFactory.getProviderWithFallback();
  aiProvider.setPipelineStage?.('boards-prompts-analysis');

  const prompt = contentAnalysisPrompt(combinedText);

  const analysis = await callGeminiWithRetry(async () => {
    const raw = await aiProvider.complete(prompt);
    const parsed = parseJsonFromLLM(String(raw));
    const validated = ContentAnalysisSchema.safeParse(parsed);
    if (!validated.success) {
      throw new Error(`[PROMPTS] Content analysis failed validation: ${validated.error.message}`);
    }
    return validated.data;
  }, 3, 'content-analysis');

  return {
    boardId: boardPlan.boardId,
    segments,
    topics: analysis.topics,
    keyEntities: analysis.entities,
    emotionalTone: analysis.tone,
  };
}

const TOPIC_ELEMENT_MAPPING: Record<string, BoardElementType[]> = {
  sports: ['photo', 'clipping', 'diagram', 'note'],
  athlete: ['photo', 'clipping', 'headline', 'note'],
  career: ['photo', 'document', 'clipping', 'note'],
  crime: ['photo', 'document', 'map', 'note', 'clipping'],
  mystery: ['photo', 'note', 'map', 'diagram'],
  history: ['photo', 'document', 'map', 'clipping'],
  war: ['photo', 'map', 'document', 'clipping'],
  default: ['photo', 'note', 'clipping', 'document'],
};

function generateElements(
  content: BoardContent,
  gridLayout: { rows: number; cols: number }
): BoardElement[] {
  const totalCells = gridLayout.rows * gridLayout.cols;
  const elementTypes = selectElementTypes(content.topics, totalCells);

  const elements: BoardElement[] = [];
  for (let i = 0; i < totalCells; i++) {
    const row = Math.floor(i / gridLayout.cols);
    const col = i % gridLayout.cols;
    elements.push({
      id: `elem-${i + 1}`,
      type: elementTypes[i] || 'photo',
      gridPosition: { row, col },
      description: '',
      connectionTo: [],
    });
  }
  return elements;
}

function selectElementTypes(topics: string[], totalCells: number): BoardElementType[] {
  const topicKeys = topics.map(t => t.toLowerCase());
  const pool: BoardElementType[] = [];

  for (const key of topicKeys) {
    const mapped = TOPIC_ELEMENT_MAPPING[key];
    if (mapped) pool.push(...mapped);
  }

  if (pool.length === 0) {
    pool.push(...TOPIC_ELEMENT_MAPPING.default);
  }

  const types: BoardElementType[] = [];
  for (let i = 0; i < totalCells; i++) {
    types.push(pool[i % pool.length]);
  }
  return types;
}

async function fillElementDescriptions(
  elements: BoardElement[],
  content: BoardContent
): Promise<BoardElement[]> {
  const aiProvider = await AIProviderFactory.getProviderWithFallback();
  aiProvider.setPipelineStage?.('boards-prompts-elements');

  const prompt = elementDescriptionPrompt(elements, {
    topics: content.topics,
    keyEntities: content.keyEntities,
    emotionalTone: content.emotionalTone,
  });

  const descriptions = await callGeminiWithRetry(async () => {
    const raw = await aiProvider.complete(prompt);
    const parsed = parseJsonFromLLM(String(raw));
    const validated = ElementDescriptionResponseSchema.safeParse(parsed);
    if (!validated.success) {
      throw new Error(`[PROMPTS] Element description response failed validation: ${validated.error.message}`);
    }
    return validated.data;
  }, 3, 'element-descriptions');

  const descriptionMap = new Map(descriptions.map(d => [d.id, d]));

  return elements.map(elem => {
    const info = descriptionMap.get(elem.id);
    return {
      ...elem,
      description: info?.description ?? elem.description,
      label: info?.label ?? undefined,
      connectionTo: info?.connections ?? elem.connectionTo,
    };
  });
}

function mapSegmentsToElements(
  segments: ScriptSegment[],
  elements: BoardElement[],
  segmentIndices: number[]
): SegmentContext[] {
  return segmentIndices.map((segIdx, i) => {
    const elementIndex = Math.floor(i * elements.length / segmentIndices.length);
    const targetElement = elements[elementIndex] ?? elements[0];

    return {
      segmentIndex: segIdx,
      text: segments[segIdx].text,
      focusElementId: targetElement.id,
    };
  });
}

function buildFullPrompt(
  elements: BoardElement[],
  gridLayout: { rows: number; cols: number }
): string {
  const elementDescriptions = elements
    .map(elem => {
      const posName = getGridPositionName(elem.gridPosition.row, elem.gridPosition.col);
      const labelPart = elem.label ? ` (labeled "${elem.label}")` : '';
      return `- ${posName.toUpperCase()}: ${elem.type} - ${elem.description}${labelPart}`;
    })
    .join('\n');

  const connections = elements
    .filter(e => e.connectionTo && e.connectionTo.length > 0)
    .map(e => `- Connect ${e.id} to ${e.connectionTo!.join(', ')} with red string`)
    .join('\n');

  return `Create a detective investigation board image with a cork board background.\n\nSTYLE:\n${DETECTIVE_BOARD_STYLE_GUIDE}\n\nGRID LAYOUT: ${gridLayout.rows} rows x ${gridLayout.cols} columns\n\nELEMENTS (place each in its specified position):\n${elementDescriptions}\n\nCONNECTIONS:\n${connections || '- Red strings connecting thematically related elements'}\n\nIMPORTANT:\n- Each element must be clearly visible and distinct\n- Leave small gaps between elements\n- Elements should fit within their grid cell\n- Style should feel like an authentic investigation board`;
}

function getGridPositionName(row: number, col: number): string {
  const names = [
    ['top-left', 'top-center', 'top-right'],
    ['bottom-left', 'bottom-center', 'bottom-right'],
  ];
  return names[row]?.[col] ?? `row-${row}-col-${col}`;
}

async function callGeminiWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  label: string
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`[LLM] Attempt ${attempt}/${maxRetries} for ${label} failed. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  // Unreachable
  throw new Error(`[LLM] Failed to complete ${label}`);
}

function parseJsonFromLLM(raw: string): unknown {
  const trimmed = raw.trim();
  const clean = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
    : trimmed;

  try {
    return JSON.parse(clean);
  } catch (error) {
    throw new Error(`[LLM] Failed to parse LLM JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const DETECTIVE_BOARD_STYLE_GUIDE = `- Warm brown cork board texture\n- Elements pinned with colorful thumbtacks\n- Red and white strings connecting related items\n- Slightly aged, worn paper textures\n- Dramatic lighting from top-left`;

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

interface ViewportJson {
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

export async function buildViewportJson(projectPath: string, fps = 30): Promise<ViewportJson> {
  const boardsDir = path.join(projectPath, 'boards');
  const imagesDir = path.join(projectPath, 'assets', 'images');

  console.log('[BUILD] Loading board data...');
  const plan = await readJson<BoardPlan>(path.join(boardsDir, 'board-plan.json'));
  const regionsWrapper = await readJson<{ boards: BoardRegionsOutput[] }>(path.join(boardsDir, 'board-regions.json'));
  const triggers = await readJson<BoardTriggersOutput>(path.join(boardsDir, 'board-triggers.json'));

  console.log(`[BUILD] Loaded ${plan.boards.length} boards, ${triggers.totalTriggers} triggers`);

  console.log('[BUILD] Checking for upscaled images...');
  const imageMap = await checkUpscaledImages(plan.boards, imagesDir);

  console.log('[BUILD] Calculating keyframes...');
  const keyframes = calculateKeyframes(triggers.triggers, regionsWrapper.boards, fps);
  console.log(`[BUILD] Generated ${keyframes.length} keyframes`);

  const viewport = assembleViewportJson(plan, regionsWrapper.boards, triggers, imageMap, keyframes);

  return viewport;
}

async function checkUpscaledImages(
  boards: BoardSegmentMapping[],
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
    console.warn('[BUILD] Using original images. Run `npm run upscale -- --project <id>` for best quality.\n');
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

async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}
