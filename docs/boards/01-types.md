> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Stage 1: Types & Data Structures

## Overview

Define all TypeScript interfaces and Zod validation schemas for the boards pipeline.

**File to create**: `src/lib/boards-types.ts`

---

## Interfaces

### BoardPlan (Stage 1 Output)

```typescript
export interface BoardSegmentMapping {
  boardId: string;           // "board-1", "board-2", etc.
  segmentIndices: number[];  // Segments that will use this board
  totalDurationMs: number;   // Combined duration of mapped segments
  topicSummary: string;      // LLM-generated topic summary
}

export interface BoardPlan {
  version: '1.0';
  scriptPath: string;
  totalSegments: number;
  totalDurationMs: number;
  boards: BoardSegmentMapping[];
  generatedAt: string;
}
```

### BoardPrompt (Stage 2 Output)

```typescript
export interface GridPosition {
  row: number;      // 0-indexed
  col: number;      // 0-indexed
  rowSpan?: number; // Default 1
  colSpan?: number; // Default 1
}

export type BoardElementType =
  | 'photo'      // Polaroid-style photo
  | 'note'       // Sticky note or paper note
  | 'clipping'   // Newspaper clipping
  | 'string'     // Connecting string between elements
  | 'map'        // Map with pins
  | 'document'   // Official document
  | 'diagram'    // Flowchart or diagram
  | 'headline';  // Large text/headline

export interface BoardElement {
  id: string;
  type: BoardElementType;
  gridPosition: GridPosition;
  description: string;       // What should be depicted
  label?: string;           // Optional text label
  connectionTo?: string[];  // IDs of elements connected by strings
}

export interface SegmentContext {
  segmentIndex: number;
  text: string;
  focusElementId: string;   // Element ID to focus on during this segment
}

export interface BoardPrompt {
  boardId: string;
  gridLayout: {
    rows: number;
    cols: number;
  };
  styleGuide: string;        // Detective board style description
  elements: BoardElement[];
  segmentContexts: SegmentContext[];
  fullPromptText: string;    // Complete prompt for AI image generation
}

export interface BoardPromptsOutput {
  version: '1.0';
  prompts: BoardPrompt[];
  generatedAt: string;
}
```

### BoardRegion (Stage 3 Output)

```typescript
export interface RegionBounds {
  x: number;      // 0-1 normalized, top-left
  y: number;      // 0-1 normalized, top-left
  width: number;  // 0-1 normalized
  height: number; // 0-1 normalized
}

export interface BoardRegion {
  id: string;              // "region-1", "region-2"
  elementId: string;       // Links to BoardElement.id
  gridPosition: GridPosition;
  bounds: RegionBounds;
  label: string;
  salience: number;        // 0-1, importance score
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
```

### ViewportTrigger (Stage 5 Output)

```typescript
export type TriggerType = 'segment_start' | 'topic_shift' | 'emphasis' | 'manual';

export interface ViewportTrigger {
  triggerId: string;
  wordId: string;              // Stable ID: "seg-{segIdx}-w-{wordIdx}"
  globalWordIndex: number;     // Global word position across all segments
  segmentIndex: number;        // Which segment this word belongs to
  localWordIndex: number;      // Word position within segment
  word: string;                // The actual word
  wordStartMs: number;         // When word starts (from TTS)
  targetRegionId: string;      // Region to pan to
  targetBoardId: string;       // Which board this region belongs to
  transitionMs: number;        // Transition duration
  triggerType: TriggerType;
}

export interface BoardTriggersOutput {
  version: '1.0';
  triggers: ViewportTrigger[];
  totalWords: number;
  totalTriggers: number;
  generatedAt: string;
}
```

### Config Types

```typescript
export interface BoardsConfig {
  gridLayout: {
    rows: number;
    cols: number;
  };
  targetDurationPerBoardMs: number;  // Default: 75000 (75s)
  minSegmentsPerBoard: number;       // Default: 2
  maxSegmentsPerBoard: number;       // Default: 5
  transitionDefaults: {
    segmentStart: number;            // Default: 800
    topicShift: number;              // Default: 1200
    emphasis: number;                // Default: 400
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
```

### Security Validation

```typescript
// Project ID validation - prevents path traversal attacks
const PROJECT_ID_PATTERN = /^project-\d+$/;

export function validateProjectId(projectId: string): void {
  if (!PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error(`Invalid project ID format: ${projectId}. Expected format: project-{timestamp}`);
  }
}
```

---

## Zod Validation Schemas

```typescript
import { z } from 'zod';

// Grid Position
export const GridPositionSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  rowSpan: z.number().int().min(1).optional(),
  colSpan: z.number().int().min(1).optional(),
});

// Board Element
export const BoardElementTypeSchema = z.enum([
  'photo', 'note', 'clipping', 'string', 'map', 'document', 'diagram', 'headline'
]);

export const BoardElementSchema = z.object({
  id: z.string().min(1),
  type: BoardElementTypeSchema,
  gridPosition: GridPositionSchema,
  description: z.string().min(1),
  label: z.string().optional(),
  connectionTo: z.array(z.string()).optional(),
});

// Region Bounds
export const RegionBoundsSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
}).refine(
  (b) => b.x + b.width <= 1.001 && b.y + b.height <= 1.001,
  { message: 'Bounds must not exceed image boundaries' }
);

// Board Region
export const BoardRegionSchema = z.object({
  id: z.string().min(1),
  elementId: z.string().min(1),
  gridPosition: GridPositionSchema,
  bounds: RegionBoundsSchema,
  label: z.string(),
  salience: z.number().min(0).max(1),
});

// Viewport Trigger
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

// Full Output Schemas
export const BoardPlanSchema = z.object({
  version: z.literal('1.0'),
  scriptPath: z.string(),
  totalSegments: z.number().int().min(1),
  totalDurationMs: z.number().min(0),
  boards: z.array(z.object({
    boardId: z.string(),
    segmentIndices: z.array(z.number().int().min(0)),
    totalDurationMs: z.number().min(0),
    topicSummary: z.string(),
  })),
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

export const BoardTriggersOutputSchema = z.object({
  version: z.literal('1.0'),
  triggers: z.array(ViewportTriggerSchema),
  totalWords: z.number().int().min(0),
  totalTriggers: z.number().int().min(0),
  generatedAt: z.string(),
});

// Board Prompts Output Schema
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
```

> **Runtime Validation Note**: The `GridPositionSchema` validates that row/col >= 0, but does not validate against actual grid dimensions. Implementations should add runtime validation to ensure `row < gridLayout.rows` and `col < gridLayout.cols` when processing prompts.

---

## Files to Modify

### src/lib/paths.ts

Add boards directory to ProjectPaths:

```typescript
// Add to ProjectPaths interface
project: string;  // Alias for root (clarity in CLI commands)
boards: string;   // Boards pipeline output directory

// Add to getProjectPaths function
project: root,  // Alias for root
boards: path.join(root, 'boards'),

// Add to ensureProjectDirs function (note: actual function name is ensureProjectDirs, not ensureProjectDirectories)
fs.mkdirSync(paths.boards, { recursive: true });
```

> **Note**: The function is `ensureProjectDirs` (not `ensureProjectDirectories`). Use the actual function name in implementation.

### package.json

Add npm script:

```json
{
  "scripts": {
    "boards": "npx ts-node cli/commands/boards.ts"
  }
}
```

---

## Verification

After implementing:

```bash
# Verify types compile
npx tsc --noEmit src/lib/boards-types.ts

# Verify paths work
npx ts-node -e "import { getProjectPaths } from './src/lib/paths'; console.log(getProjectPaths('project-1764548027472'));"
```

---

## Next Step

Proceed to [02-plan-stage.md](./02-plan-stage.md)
