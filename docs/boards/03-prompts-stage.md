> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Stage 3: Prompts Stage

## Overview

Generate AI image prompts with specific grid positions for each board. The prompts describe detective board-style images with elements placed in exact grid cells.

**Files to create**:
- `config/prompts/boards-image.prompt.ts`

**Files to modify**:
- `cli/lib/board-planner.ts` (add prompt generation)

---

## Input

- `boards/board-plan.json` (from Stage 2)
- `scripts/script-v1.json`

---

## Output

`boards/board-prompts.json`:

```json
{
  "version": "1.0",
  "prompts": [
    {
      "boardId": "board-1",
      "gridLayout": { "rows": 2, "cols": 3 },
      "styleGuide": "Detective investigation board aesthetic...",
      "elements": [
        {
          "id": "elem-1",
          "type": "photo",
          "gridPosition": { "row": 0, "col": 0 },
          "description": "Polaroid photo of young Cam Newton in college uniform",
          "label": "Auburn 2010",
          "connectionTo": ["elem-3"]
        },
        {
          "id": "elem-2",
          "type": "clipping",
          "gridPosition": { "row": 0, "col": 1 },
          "description": "Newspaper headline about Heisman Trophy win",
          "label": null
        }
      ],
      "segmentContexts": [
        {
          "segmentIndex": 0,
          "text": "In a league built on tradition...",
          "focusElementId": "elem-1"
        }
      ],
      "fullPromptText": "Create a detective investigation board..."
    }
  ],
  "generatedAt": "2026-01-08T..."
}
```

---

## Grid Layout

Default 2x3 grid (6 cells):

```
┌─────────┬─────────┬─────────┐
│ (0,0)   │ (0,1)   │ (0,2)   │
│ TOP-L   │ TOP-C   │ TOP-R   │
├─────────┼─────────┼─────────┤
│ (1,0)   │ (1,1)   │ (1,2)   │
│ BOT-L   │ BOT-C   │ BOT-R   │
└─────────┴─────────┴─────────┘
```

Position names for prompts:
- `(0,0)` = "top-left"
- `(0,1)` = "top-center"
- `(0,2)` = "top-right"
- `(1,0)` = "bottom-left"
- `(1,1)` = "bottom-center"
- `(1,2)` = "bottom-right"

---

## Element Types by Topic

Map topic keywords to appropriate element types:

```typescript
const TOPIC_ELEMENT_MAPPING: Record<string, BoardElementType[]> = {
  // Sports topics
  sports: ['photo', 'clipping', 'diagram', 'note'],
  athlete: ['photo', 'clipping', 'headline', 'note'],
  career: ['photo', 'document', 'clipping', 'note'],

  // Investigation topics
  crime: ['photo', 'document', 'map', 'note', 'clipping'],
  mystery: ['photo', 'note', 'map', 'diagram'],

  // History topics
  history: ['photo', 'document', 'map', 'clipping'],
  war: ['photo', 'map', 'document', 'clipping'],

  // Default fallback
  default: ['photo', 'note', 'clipping', 'document'],
};
```

---

## Algorithm

### Step 1: Analyze Board Content

```typescript
interface BoardContent {
  boardId: string;
  segments: ScriptSegment[];
  topics: string[];           // Extracted key topics
  keyEntities: string[];      // People, places, events
  emotionalTone: string;      // dramatic, narrative, energetic
}

async function analyzeContent(
  boardPlan: BoardSegmentMapping,
  script: Script
): Promise<BoardContent> {
  const segments = boardPlan.segmentIndices.map(i => script.segments[i]);
  const combinedText = segments.map(s => s.text).join(' ');

  // Use LLM to extract topics and entities
  const analysis = await callGemini(contentAnalysisPrompt(combinedText));

  return {
    boardId: boardPlan.boardId,
    segments,
    topics: analysis.topics,
    keyEntities: analysis.entities,
    emotionalTone: analysis.tone,
  };
}
```

### Step 2: Generate Element List

```typescript
function generateElements(
  content: BoardContent,
  gridLayout: { rows: number; cols: number }
): BoardElement[] {
  const totalCells = gridLayout.rows * gridLayout.cols;
  const elements: BoardElement[] = [];

  // Determine element types based on topic
  const elementTypes = selectElementTypes(content.topics, totalCells);

  // Assign grid positions
  let cellIndex = 0;
  for (const type of elementTypes) {
    const row = Math.floor(cellIndex / gridLayout.cols);
    const col = cellIndex % gridLayout.cols;

    elements.push({
      id: `elem-${cellIndex + 1}`,
      type,
      gridPosition: { row, col },
      description: '', // Filled in next step
      connectionTo: [],
    });

    cellIndex++;
  }

  return elements;
}
```

### Step 3: Generate Element Descriptions (LLM)

```typescript
async function fillElementDescriptions(
  elements: BoardElement[],
  content: BoardContent
): Promise<BoardElement[]> {
  const prompt = elementDescriptionPrompt(elements, content);
  const descriptions = await callGemini(prompt);

  return elements.map((elem, i) => ({
    ...elem,
    description: descriptions[i].description,
    label: descriptions[i].label,
    connectionTo: descriptions[i].connections,
  }));
}
```

### Step 4: Map Segments to Focus Elements

> **Important - Element Linking**: The `focusElementId` in `SegmentContext` links directly to a `BoardElement.id`. In the regions stage (Stage 4), `BoardRegion.elementId` references the same ID for consistent linking throughout the pipeline. This allows triggers (Stage 6) to find the correct region by matching `elementId` values.

```typescript
function mapSegmentsToElements(
  segments: ScriptSegment[],
  elements: BoardElement[],
  segmentIndices: number[]
): SegmentContext[] {
  // Distribute segments across elements
  // Each segment focuses on 1-2 elements
  // The focusElementId is the stable link used throughout the pipeline

  return segmentIndices.map((segIdx, i) => {
    const elementIndex = Math.floor(i * elements.length / segmentIndices.length);
    const targetElement = elements[elementIndex];

    return {
      segmentIndex: segIdx,
      text: segments[segIdx].text,
      focusElementId: targetElement.id,  // This ID links to BoardRegion.elementId in regions stage
    };
  });
}
```

### Step 5: Build Full Prompt Text

```typescript
function buildFullPrompt(
  elements: BoardElement[],
  gridLayout: { rows: number; cols: number },
  content: BoardContent
): string {
  const gridPositionNames = getGridPositionNames(gridLayout);

  const elementDescriptions = elements.map(elem => {
    const posName = gridPositionNames[elem.gridPosition.row][elem.gridPosition.col];
    return `- ${posName.toUpperCase()}: ${elem.type} - ${elem.description}${elem.label ? ` (labeled "${elem.label}")` : ''}`;
  }).join('\n');

  const connections = elements
    .filter(e => e.connectionTo && e.connectionTo.length > 0)
    .map(e => `- Connect ${e.id} to ${e.connectionTo!.join(', ')} with red string`)
    .join('\n');

  return `Create a detective investigation board image with a cork board background.

STYLE:
- Warm brown cork board texture
- Elements pinned with colorful thumbtacks
- Red and white strings connecting related items
- Slightly aged, worn paper textures
- Dramatic lighting from top-left

GRID LAYOUT: ${gridLayout.rows} rows x ${gridLayout.cols} columns

ELEMENTS (place each in its specified position):
${elementDescriptions}

CONNECTIONS:
${connections || '- Red strings connecting thematically related elements'}

IMPORTANT:
- Each element must be clearly visible and distinct
- Leave small gaps between elements
- Elements should fit within their grid cell
- Style should feel like an authentic investigation board`;
}
```

---

## LLM Prompts

### Content Analysis Prompt

```typescript
// config/prompts/boards-image.prompt.ts

export function contentAnalysisPrompt(text: string): string {
  return `Analyze this script segment for visual representation:

TEXT:
${text}

Extract:
1. Main topics (3-5 keywords)
2. Key entities (people, places, events, objects)
3. Emotional tone (dramatic, narrative, energetic, contemplative)

RETURN JSON:
{
  "topics": ["topic1", "topic2"],
  "entities": ["person name", "place", "event"],
  "tone": "dramatic"
}`;
}
```

### Element Description Prompt

```typescript
export function elementDescriptionPrompt(
  elements: BoardElement[],
  content: BoardContent
): string {
  const elementList = elements.map(e =>
    `${e.id} (${e.type} at row ${e.gridPosition.row}, col ${e.gridPosition.col})`
  ).join('\n');

  return `Generate descriptions for detective board elements.

CONTEXT:
Topic: ${content.topics.join(', ')}
Key entities: ${content.keyEntities.join(', ')}
Tone: ${content.emotionalTone}

ELEMENTS TO DESCRIBE:
${elementList}

For each element, provide:
- description: What specifically should be shown (20-40 words)
- label: Short handwritten label text (or null)
- connections: Array of element IDs this connects to (for visual strings)

RETURN JSON ARRAY:
[
  {
    "id": "elem-1",
    "description": "Polaroid photo showing...",
    "label": "2010",
    "connections": ["elem-3"]
  }
]`;
}
```

---

## Implementation

```typescript
// Add to cli/lib/board-planner.ts

export async function generateBoardPrompts(
  plan: BoardPlan,
  script: Script,
  gridLayout = { rows: 2, cols: 3 }
): Promise<BoardPromptsOutput> {
  console.log(`[PROMPTS] Generating prompts for ${plan.boards.length} boards...`);

  const prompts: BoardPrompt[] = [];

  for (const board of plan.boards) {
    console.log(`[PROMPTS] Processing ${board.boardId}...`);

    // Analyze content
    const content = await analyzeContent(board, script);

    // Generate elements
    let elements = generateElements(content, gridLayout);

    // Fill descriptions
    elements = await fillElementDescriptions(elements, content);

    // Map segments to elements
    const segmentContexts = mapSegmentsToElements(
      script.segments,
      elements,
      board.segmentIndices
    );

    // Build full prompt
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

const DETECTIVE_BOARD_STYLE_GUIDE = `Detective investigation board with:
- Cork board background texture
- Elements pinned with colorful thumbtacks
- Red and white strings connecting items
- Aged paper textures
- Dramatic lighting`;
```

---

## CLI Integration

```typescript
case 'prompts': {
  const plan = await readJson<BoardPlan>(path.join(paths.boards, 'board-plan.json'));
  const script = await readJson<Script>(paths.script);

  const prompts = await generateBoardPrompts(plan, script, config.gridLayout);

  await writeJson(path.join(paths.boards, 'board-prompts.json'), prompts);

  console.log('\n[PROMPTS] Generated prompts:');
  for (const p of prompts.prompts) {
    console.log(`\n=== ${p.boardId} ===`);
    console.log(p.fullPromptText.substring(0, 500) + '...');
  }
  break;
}
```

---

## Verification

```bash
# Run prompts stage (requires plan stage first)
npm run boards -- --project project-1764548027472 prompts

# View generated prompts
cat public/projects/project-1764548027472/boards/board-prompts.json | jq '.prompts[0].fullPromptText'

# Copy prompt to clipboard for AI image generation
cat public/projects/project-1764548027472/boards/board-prompts.json | jq -r '.prompts[0].fullPromptText' | pbcopy
```

---

## User Workflow After This Stage

1. Open `board-prompts.json`
2. Copy `fullPromptText` for each board
3. Paste into AI image generator (DALL-E, Midjourney, Ideogram)
4. Download generated images
5. Rename to `board-1.png`, `board-2.png`, etc.
6. Upload to `public/projects/{projectId}/assets/images/`
7. Proceed to regions stage

---

## Next Step

Proceed to [04-regions-stage.md](./04-regions-stage.md)
