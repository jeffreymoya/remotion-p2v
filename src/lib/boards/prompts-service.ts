import { z } from 'zod';
import {
  BoardElement,
  BoardElementType,
  BoardPrompt,
  BoardPromptsOutput,
  BoardSegmentMapping,
  SegmentContext,
} from '../boards-types';
import { contentAnalysisPrompt, elementDescriptionPrompt } from '../../../config/prompts/boards-image.prompt';
import { AIProviderFactory } from "@/src/lib/services/ai";

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

interface BoardContent {
  boardId: string;
  segments: ScriptSegment[];
  topics: string[];
  keyEntities: string[];
  emotionalTone: string;
}

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

/**
 * Topic-based element type mapping for generating appropriate board elements
 */
export const TOPIC_ELEMENT_MAPPING: Record<string, BoardElementType[]> = {
  sports: ['photo', 'clipping', 'diagram', 'note'],
  athlete: ['photo', 'clipping', 'headline', 'note'],
  career: ['photo', 'document', 'clipping', 'note'],
  crime: ['photo', 'document', 'map', 'note', 'clipping'],
  mystery: ['photo', 'note', 'map', 'diagram'],
  history: ['photo', 'document', 'map', 'clipping'],
  war: ['photo', 'map', 'document', 'clipping'],
  default: ['photo', 'note', 'clipping', 'document'],
};

/**
 * Detective board style guide for image generation
 */
export const DETECTIVE_BOARD_STYLE_GUIDE = `- Warm brown cork board texture\n- Elements pinned with colorful thumbtacks\n- Red and white strings connecting related items\n- Slightly aged, worn paper textures\n- Dramatic lighting from top-left`;

/**
 * Generate board prompts for image generation
 */
export async function generateBoardPrompts(
  boards: BoardSegmentMapping[],
  segments: ScriptSegment[],
  gridLayout = { rows: 2, cols: 3 }
): Promise<BoardPromptsOutput> {
  console.log(`[PROMPTS] Generating prompts for ${boards.length} boards...`);

  const prompts: BoardPrompt[] = [];

  for (const board of boards) {
    console.log(`[PROMPTS] Processing ${board.boardId}...`);

    const content = await analyzeContent(board, segments);
    let elements = generateElements(content, gridLayout);
    elements = await fillElementDescriptions(elements, content);

    const segmentContexts = mapSegmentsToElements(
      segments,
      elements,
      board.segmentIndices
    );

    const fullPromptText = buildFullPrompt(elements, gridLayout);

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
 * Analyze board content using AI to extract topics, entities, and tone
 */
export async function analyzeContent(
  boardPlan: BoardSegmentMapping,
  segments: ScriptSegment[]
): Promise<BoardContent> {
  const boardSegments = boardPlan.segmentIndices
    .map((i) => {
      // Prefer zero-based index lookup, fallback to order-based match
      return (
        segments[i] ||
        segments.find((s) => s.order === i || s.order === i + 1)
      );
    })
    .filter((s): s is ScriptSegment => Boolean(s));

  if (boardSegments.length === 0) {
    throw new Error(
      `[PROMPTS] No matching segments found for board ${boardPlan.boardId}`
    );
  }

  const combinedText = boardSegments.map((s) => s.text).join(" ");

  const aiProvider = await AIProviderFactory.getProviderWithFallback();
  aiProvider.setPipelineStage?.('boards-prompts-analysis');

  const prompt = contentAnalysisPrompt(combinedText);

  const analysis = await callAIWithRetry(async () => {
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
    segments: boardSegments,
    topics: analysis.topics,
    keyEntities: analysis.entities,
    emotionalTone: analysis.tone,
  };
}

/**
 * Generate initial board elements based on content topics and grid layout
 */
export function generateElements(
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

/**
 * Select element types based on content topics
 */
export function selectElementTypes(topics: string[], totalCells: number): BoardElementType[] {
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

/**
 * Fill element descriptions using AI
 */
export async function fillElementDescriptions(
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

  const descriptions = await callAIWithRetry(async () => {
    const raw = await aiProvider.complete(prompt);
    const parsed = parseJsonFromLLM(String(raw));
    // Gemini sometimes wraps arrays in an object - unwrap if needed
    const unwrapped = unwrapArrayFromObject(parsed);
    const validated = ElementDescriptionResponseSchema.safeParse(unwrapped);
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

/**
 * Map script segments to board elements
 */
export function mapSegmentsToElements(
  segments: ScriptSegment[],
  elements: BoardElement[],
  segmentIndices: number[]
): SegmentContext[] {
  const resolveSegment = (idx: number) =>
    segments[idx] || segments.find((s) => s.order === idx || s.order === idx + 1);

  return segmentIndices.map((segIdx, i) => {
    const elementIndex = Math.floor(i * elements.length / segmentIndices.length);
    const targetElement = elements[elementIndex] ?? elements[0];
    const segment = resolveSegment(segIdx);

    return {
      segmentIndex: segIdx,
      text: segment?.text ?? `Segment ${segIdx}`,
      focusElementId: targetElement.id,
    };
  });
}

/**
 * Build full prompt text for image generation
 */
export function buildFullPrompt(
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

/**
 * Get grid position name for readability
 */
function getGridPositionName(row: number, col: number): string {
  const names = [
    ['top-left', 'top-center', 'top-right'],
    ['bottom-left', 'bottom-center', 'bottom-right'],
  ];
  return names[row]?.[col] ?? `row-${row}-col-${col}`;
}

/**
 * Retry wrapper for AI calls
 */
async function callAIWithRetry<T>(
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
      console.warn(`[AI] Attempt ${attempt}/${maxRetries} for ${label} failed. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error(`[AI] Failed to complete ${label}`);
}

/**
 * Parse JSON from LLM response, handling markdown code blocks
 */
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

/**
 * Unwrap array from object if LLM wrapped it (e.g., { "elements": [...] } -> [...])
 */
function unwrapArrayFromObject(parsed: unknown): unknown {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const values = Object.values(parsed as Record<string, unknown>);
    // If object has exactly one property and it's an array, unwrap it
    if (values.length === 1 && Array.isArray(values[0])) {
      console.log('[PROMPTS] Unwrapped array from object wrapper');
      return values[0];
    }
    // Check common wrapper keys
    const obj = parsed as Record<string, unknown>;
    for (const key of ['elements', 'results', 'data', 'items', 'descriptions']) {
      if (Array.isArray(obj[key])) {
        console.log(`[PROMPTS] Unwrapped array from "${key}" property`);
        return obj[key];
      }
    }
  }
  return parsed;
}
