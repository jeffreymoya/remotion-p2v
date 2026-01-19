import { z } from 'zod';

// Shared grid position representation
export interface GridPosition {
  row: number;      // 0-indexed
  col: number;      // 0-indexed
  rowSpan?: number; // Default 1
  colSpan?: number; // Default 1
}

export type BoardElementType =
  | 'photo'
  | 'note'
  | 'clipping'
  | 'string'
  | 'map'
  | 'document'
  | 'diagram'
  | 'headline';

export interface BoardElement {
  id: string;
  type: BoardElementType;
  gridPosition: GridPosition;
  description: string;
  label?: string;
  connectionTo?: string[];
}

export interface SegmentContext {
  segmentIndex: number;
  text: string;
  focusElementId: string;
}

export interface BoardPrompt {
  boardId: string;
  gridLayout: {
    rows: number;
    cols: number;
  };
  styleGuide: string;
  elements: BoardElement[];
  segmentContexts: SegmentContext[];
  fullPromptText: string;
}

export interface BoardPromptsOutput {
  version: '1.0';
  prompts: BoardPrompt[];
  generatedAt: string;
}

export interface BoardSegmentMapping {
  boardId: string; // "board-1", "board-2", etc.
  segmentIndices: number[];
  totalDurationMs: number;
  topicSummary: string;
}

export interface BoardPlan {
  version: '1.0';
  scriptPath: string;
  totalSegments: number;
  totalDurationMs: number;
  boards: BoardSegmentMapping[];
  generatedAt: string;
}

export interface RegionBounds {
  x: number;      // 0-1 normalized, top-left
  y: number;      // 0-1 normalized, top-left
  width: number;  // 0-1 normalized
  height: number; // 0-1 normalized
}

export interface BoardRegion {
  id: string; // "region-1", "region-2"
  elementId: string;
  gridPosition: GridPosition;
  bounds: RegionBounds;
  label: string;
  salience: number; // 0-1
}

export interface BoardRegionsOutput {
  version: '1.0';
  boardId: string;
  imagePath: string;
  imageMetadata: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  regions: BoardRegion[];
  generatedAt: string;
}

export type TriggerType = 'segment_start' | 'topic_shift' | 'emphasis' | 'manual';

export interface ViewportTrigger {
  triggerId: string;
  wordId: string; // "seg-{segIdx}-w-{wordIdx}"
  globalWordIndex: number;
  segmentIndex: number;
  localWordIndex: number;
  word: string;
  wordStartMs: number;
  targetRegionId: string;
  targetBoardId: string;
  transitionMs: number;
  triggerType: TriggerType;
}

export interface BoardTriggersOutput {
  version: '1.0';
  triggers: ViewportTrigger[];
  totalWords: number;
  totalTriggers: number;
  generatedAt: string;
}

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
  imagePath: z.string(),
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
