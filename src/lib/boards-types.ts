import { z } from "zod";

export type {
  BoardElement,
  BoardElementType,
  BoardPlan,
  BoardPrompt,
  BoardPromptsOutput,
  BoardRegion,
  BoardRegionsOutput,
  BoardSegmentMapping,
  GridPosition,
  RegionBounds,
  SegmentContext,
  ViewportTrigger,
  ViewportTriggerType,
} from "@/src/lib/storyflow/types";

export interface BoardsConfig {
  gridLayout: {
    rows: number;
    cols: number;
  };
  targetDurationPerBoardMs: number;
  minSegmentsPerBoard: number;
  maxSegmentsPerBoard: number;
  transitionDefaults: {
    segmentStart: number;
    topicShift: number;
    emphasis: number;
  };
}

export const DEFAULT_BOARDS_CONFIG: BoardsConfig = {
  gridLayout: { rows: 2, cols: 3 },
  targetDurationPerBoardMs: 75000,
  minSegmentsPerBoard: 2,
  maxSegmentsPerBoard: 5,
  transitionDefaults: {
    segmentStart: 800,
    topicShift: 1200,
    emphasis: 400,
  },
};

// Maximum number of boards to prevent runaway generation
export const MAX_BOARDS = 10;

// Project ID validation - prevents path traversal attacks
const PROJECT_ID_PATTERN = /^project-\d+$/;

export function validateProjectId(projectId: string): void {
  const normalized = projectId.trim();

  if (!PROJECT_ID_PATTERN.test(normalized)) {
    throw new Error(`Invalid project ID format: ${projectId}. Expected format: project-{timestamp}`);
  }
}

// Zod Schemas
export const GridPositionSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  rowSpan: z.number().int().min(1).optional(),
  colSpan: z.number().int().min(1).optional(),
});

export const BoardElementTypeSchema = z.enum([
  'photo',
  'note',
  'clipping',
  'string',
  'map',
  'document',
  'diagram',
  'headline',
]);

export const BoardElementSchema = z.object({
  id: z.string().min(1),
  type: BoardElementTypeSchema,
  gridPosition: GridPositionSchema,
  description: z.string().min(1),
  label: z.string().optional(),
  connectionTo: z.array(z.string()).optional(),
});

export const RegionBoundsSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
  })
  .refine(bounds => bounds.x + bounds.width <= 1.001 && bounds.y + bounds.height <= 1.001, {
    message: 'Bounds must not exceed image boundaries',
  });

export const BoardRegionSchema = z.object({
  id: z.string().min(1),
  elementId: z.string().min(1),
  gridPosition: GridPositionSchema,
  bounds: RegionBoundsSchema,
  label: z.string(),
  salience: z.number().min(0).max(1),
});

export const TriggerTypeSchema = z.enum(['segment_start', 'topic_shift', 'emphasis', 'manual']);

export const ViewportTriggerSchema = z.object({
  triggerId: z.string(),
  wordId: z.string(),
  globalWordIndex: z.number().int().min(0),
  segmentIndex: z.number().int().min(0),
  localWordIndex: z.number().int().min(0),
  word: z.string(),
  wordStartMs: z.number().min(0),
  targetRegionId: z.string(),
  targetBoardId: z.string(),
  transitionMs: z.number().min(0).max(5000),
  triggerType: TriggerTypeSchema,
});

export const BoardPlanSchema = z.object({
  version: z.literal('1.0'),
  scriptPath: z.string(),
  totalSegments: z.number().int().min(1),
  totalDurationMs: z.number().min(0),
  boards: z.array(
    z.object({
      boardId: z.string(),
      segmentIndices: z.array(z.number().int().min(0)),
      totalDurationMs: z.number().min(0),
      topicSummary: z.string(),
    }),
  ),
  generatedAt: z.string(),
});

export const BoardRegionsOutputSchema = z.object({
  version: z.literal('1.0'),
  boardId: z.string(),
  assetId: z.string(),
  assetPath: z.string().optional(),
  imageMetadata: z.object({
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    aspectRatio: z.number().min(0),
  }),
  regions: z.array(BoardRegionSchema),
  generatedAt: z.string(),
});

export const SegmentContextSchema = z.object({
  segmentIndex: z.number().int().min(0),
  text: z.string(),
  focusElementId: z.string().min(1),
});

export const BoardPromptSchema = z.object({
  boardId: z.string().min(1),
  gridLayout: z.object({
    rows: z.number().int().min(1),
    cols: z.number().int().min(1),
  }),
  styleGuide: z.string(),
  elements: z.array(BoardElementSchema),
  segmentContexts: z.array(SegmentContextSchema),
  fullPromptText: z.string(),
});

export const BoardPromptsOutputSchema = z.object({
  version: z.literal('1.0'),
  prompts: z.array(BoardPromptSchema),
  generatedAt: z.string(),
});

export const BoardTriggersOutputSchema = z.object({
  version: z.literal('1.0'),
  triggers: z.array(ViewportTriggerSchema),
  totalWords: z.number().int().min(0),
  totalTriggers: z.number().int().min(0),
  generatedAt: z.string(),
});
