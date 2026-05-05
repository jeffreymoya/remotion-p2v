import { z } from "zod";
import {
  BoardElement,
  BoardElementType,
  BoardPrompt,
  BoardPromptsOutput,
  BoardSegmentMapping,
  SegmentContext,
} from "../boards-types";
import {
  contentAnalysisPrompt,
  elementDescriptionPrompt,
} from "../../../config/prompts/boards-image.prompt";
import { aiGenerate } from "@/src/lib/services/ai/ai-gateway";
import { deepExtractArray } from "@/src/lib/storyflow/gemini-parser";
import { getSettings } from "@/src/lib/storyflow/settings";

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
  tone: z.string().default("dramatic"),
});

const ElementDescriptionResponseSchema = z.array(
  z.object({
    id: z.string(),
    description: z.string(),
    label: z.string().nullable().optional(),
    connections: z.array(z.string()).optional(),
  }),
);

/**
 * Topic-based element type mapping for generating appropriate board elements
 */
export const TOPIC_ELEMENT_MAPPING: Record<string, BoardElementType[]> = {
  sports: ["photo", "clipping", "diagram", "note"],
  athlete: ["photo", "clipping", "headline", "note"],
  career: ["photo", "document", "clipping", "note"],
  crime: ["photo", "document", "map", "note", "clipping"],
  mystery: ["photo", "note", "map", "diagram"],
  history: ["photo", "document", "map", "clipping"],
  war: ["photo", "map", "document", "clipping"],
  default: ["photo", "note", "clipping", "document"],
};

/**
 * Detective board style guide for image generation
 */
export const DETECTIVE_BOARD_STYLE_GUIDE = `- Warm brown cork board texture\n- Elements pinned with colorful thumbtacks\n- Red and white strings connecting related items\n- Slightly aged, worn paper textures\n- Dramatic lighting from top-left`;

/**
 * Generate board prompts for image generation
 */
// TODO(visual-format): replace DETECTIVE_BOARD_STYLE_GUIDE with per-format
// style guide config keyed on project.styleTheme once non-corkboard formats
// are implemented.
export async function generateBoardPrompts(
  projectId: string,
  boards: BoardSegmentMapping[],
  segments: ScriptSegment[],
  gridLayout = { rows: 2, cols: 3 },
  styleGuide: string = DETECTIVE_BOARD_STYLE_GUIDE,
): Promise<BoardPromptsOutput> {
  console.log(`[PROMPTS] Generating prompts for ${boards.length} boards...`);

  const resolvedStyleGuide = styleGuide.trim() || DETECTIVE_BOARD_STYLE_GUIDE;
  const prompts: BoardPrompt[] = [];

  for (const board of boards) {
    console.log(`[PROMPTS] Processing ${board.boardId}...`);

    const content = await analyzeContent(projectId, board, segments);
    let elements = generateElements(content, gridLayout);
    elements = await fillElementDescriptions(projectId, elements, content);

    const segmentContexts = mapSegmentsToElements(
      segments,
      elements,
      board.segmentIndices,
    );

    const fullPromptText = buildFullPrompt(
      elements,
      gridLayout,
      resolvedStyleGuide,
    );

    prompts.push({
      boardId: board.boardId,
      gridLayout,
      styleGuide: resolvedStyleGuide,
      elements,
      segmentContexts,
      fullPromptText,
    });
  }

  return {
    version: "1.0",
    prompts,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Analyze board content using AI to extract topics, entities, and tone
 */
export async function analyzeContent(
  projectId: string,
  boardPlan: BoardSegmentMapping,
  segments: ScriptSegment[],
): Promise<BoardContent> {
  const boardSegments = boardPlan.segmentIndices
    .map((i) => {
      // Prefer zero-based index lookup, fallback to order-based match
      return (
        segments[i] || segments.find((s) => s.order === i || s.order === i + 1)
      );
    })
    .filter((s): s is ScriptSegment => Boolean(s));

  if (boardSegments.length === 0) {
    throw new Error(
      `[PROMPTS] No matching segments found for board ${boardPlan.boardId}`,
    );
  }

  const combinedText = boardSegments.map((s) => s.text).join(" ");
  const settings = await getSettings();

  const result = await aiGenerate({
    prompt: contentAnalysisPrompt(combinedText),
    projectId,
    operation: "boards-prompts-analysis",
    schema: ContentAnalysisSchema,
    model: settings.ai.proModel,
  });

  const analysis = result.data as z.output<typeof ContentAnalysisSchema>;

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
  gridLayout: { rows: number; cols: number },
): BoardElement[] {
  const totalCells = gridLayout.rows * gridLayout.cols;
  const elementTypes = selectElementTypes(content.topics, totalCells);

  const elements: BoardElement[] = [];
  for (let i = 0; i < totalCells; i++) {
    const row = Math.floor(i / gridLayout.cols);
    const col = i % gridLayout.cols;
    elements.push({
      id: `elem-${i + 1}`,
      type: elementTypes[i] || "photo",
      gridPosition: { row, col },
      description: "",
      connectionTo: [],
    });
  }
  return elements;
}

/**
 * Select element types based on content topics
 */
export function selectElementTypes(
  topics: string[],
  totalCells: number,
): BoardElementType[] {
  const topicKeys = topics.map((t) => t.toLowerCase());
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
  projectId: string,
  elements: BoardElement[],
  content: BoardContent,
): Promise<BoardElement[]> {
  type ElementDescriptions = z.infer<typeof ElementDescriptionResponseSchema>;

  const CoercedElementDescriptionsSchema = z.preprocess(
    (val) => deepExtractArray(val, ["id", "description"]) ?? val,
    ElementDescriptionResponseSchema,
  ) as z.ZodType<ElementDescriptions>;

  const prompt = elementDescriptionPrompt(elements, {
    topics: content.topics,
    keyEntities: content.keyEntities,
    emotionalTone: content.emotionalTone,
  });

  const settings = await getSettings();

  const result = await aiGenerate<ElementDescriptions>({
    prompt,
    projectId,
    operation: "boards-prompts-elements",
    schema: CoercedElementDescriptionsSchema,
    model: settings.ai.proModel,
  });

  const descriptions = result.data;

  const descriptionMap = new Map(descriptions.map((d) => [d.id, d]));

  return elements.map((elem) => {
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
  segmentIndices: number[],
): SegmentContext[] {
  const resolveSegment = (idx: number) =>
    segments[idx] ||
    segments.find((s) => s.order === idx || s.order === idx + 1);

  return segmentIndices.map((segIdx, i) => {
    const elementIndex = Math.floor(
      (i * elements.length) / segmentIndices.length,
    );
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
  gridLayout: { rows: number; cols: number },
  styleGuide: string = DETECTIVE_BOARD_STYLE_GUIDE,
): string {
  const elementDescriptions = elements
    .map((elem) => {
      const posName = getGridPositionName(
        elem.gridPosition.row,
        elem.gridPosition.col,
      );
      const labelPart = elem.label ? ` (labeled "${elem.label}")` : "";
      return `- ${posName.toUpperCase()}: ${elem.type} - ${elem.description}${labelPart}`;
    })
    .join("\n");

  const connections = elements
    .filter((e) => e.connectionTo && e.connectionTo.length > 0)
    .map(
      (e) =>
        `- Connect ${e.id} to ${e.connectionTo!.join(", ")} with red string`,
    )
    .join("\n");

  return `Create a detailed investigation board image with a cork board background.\n\nSTYLE:\n${styleGuide}\n\nGRID LAYOUT: ${gridLayout.rows} rows x ${gridLayout.cols} columns\n\nELEMENTS (place each in its specified position):\n${elementDescriptions}\n\nCONNECTIONS:\n${connections || "- Red strings connecting thematically related elements"}\n\nIMPORTANT:\n- Each element must be clearly visible and distinct\n- Leave small gaps between elements\n- Elements should fit within their grid cell\n- Style should feel visually cohesive and intentional`;
}

/**
 * Get grid position name for readability
 */
function getGridPositionName(row: number, col: number): string {
  const names = [
    ["top-left", "top-center", "top-right"],
    ["bottom-left", "bottom-center", "bottom-right"],
  ];
  return names[row]?.[col] ?? `row-${row}-col-${col}`;
}
