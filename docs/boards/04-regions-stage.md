> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Stage 4: Regions Stage

## Overview

Detect regions in the uploaded board images using Gemini with grid hints from the prompts stage. This improves determinism by telling Gemini where elements should be.

**Files to create**:
- `config/prompts/boards-region.prompt.ts`

**Files to modify**:
- `cli/lib/board-planner.ts` (add region detection)

---

## Input

- `boards/board-prompts.json` (from Stage 3)
- `assets/images/board-{n}.png` (user uploaded)

---

## Output

`boards/board-regions.json`:

```json
{
  "version": "1.0",
  "boards": [
    {
      "boardId": "board-1",
      "imagePath": "assets/images/board-1.png",
      "imageMetadata": {
        "width": 2048,
        "height": 1152,
        "aspectRatio": 1.78
      },
      "regions": [
        {
          "id": "region-1",
          "elementId": "elem-1",
          "gridPosition": { "row": 0, "col": 0 },
          "bounds": {
            "x": 0.02,
            "y": 0.03,
            "width": 0.30,
            "height": 0.45
          },
          "label": "College photo",
          "salience": 0.9
        }
      ]
    }
  ],
  "generatedAt": "2026-01-08T..."
}
```

---

## Key Improvement: Grid Hints

The current viewport.ts prompt doesn't tell Gemini where elements should be. This causes inconsistent region detection.

**Before** (current viewport.ts):
```
Identify 3-8 regions of interest in the image...
```

**After** (with grid hints):
```
This image was generated with a 2x3 grid layout.
Expected elements:
- elem-1 (photo) at approximately (0.0, 0.0)
- elem-2 (clipping) at approximately (0.33, 0.0)
...
Detect the ACTUAL bounds for each expected element.
```

---

## LLM Prompt

```typescript
// config/prompts/boards-region.prompt.ts

export interface RegionPromptContext {
  gridLayout: { rows: number; cols: number };
  expectedElements: Array<{
    id: string;
    type: string;
    gridPosition: { row: number; col: number };
    description: string;
  }>;
  imageAspectRatio: number;
  canvasAspectRatio: number;  // Target video canvas (1.78 for 1920x1080)
}

export function boardsRegionPrompt(context: RegionPromptContext): string {
  const { rows, cols } = context.gridLayout;
  const cellWidth = (1 / cols).toFixed(3);
  const cellHeight = (1 / rows).toFixed(3);

  const elementHints = context.expectedElements.map(el => {
    const expectedX = (el.gridPosition.col / cols).toFixed(3);
    const expectedY = (el.gridPosition.row / rows).toFixed(3);
    const expectedW = cellWidth;
    const expectedH = cellHeight;

    return `  - ${el.id}: ${el.type}
      Expected position: x=${expectedX}, y=${expectedY}
      Expected size: ~${expectedW} x ${expectedH}
      Description: "${el.description}"`;
  }).join('\n\n');

  return `You are analyzing a detective board image for precise region detection.

IMAGE: [Attached]

GRID SPECIFICATION:
This image was generated with a ${rows}x${cols} grid layout.
- Cell width: ${cellWidth} (normalized 0-1)
- Cell height: ${cellHeight} (normalized 0-1)
- Total cells: ${rows * cols}

EXPECTED ELEMENTS:
${elementHints}

IMAGE PROPERTIES:
- Image aspect ratio: ${context.imageAspectRatio.toFixed(2)}:1
- Target canvas: ${context.canvasAspectRatio.toFixed(2)}:1

DETECTION TASK:
For each expected element, find its ACTUAL bounding box in the image.
The element may be slightly offset from the expected grid position.

RULES:
1. Bounds must TIGHTLY fit the visual element (not the grid cell)
2. Maximum width: ${cellWidth} (one column)
3. Maximum height: ${cellHeight} (one row)
4. All coordinates normalized 0-1
5. x + width <= 1.0, y + height <= 1.0
6. Each region should show ONE element when zoomed

RETURN FORMAT:
{
  "regions": [
    {
      "id": "region-1",
      "elementId": "elem-1",
      "gridPosition": { "row": 0, "col": 0 },
      "bounds": { "x": 0.02, "y": 0.03, "width": 0.30, "height": 0.45 },
      "label": "descriptive label",
      "salience": 0.9
    }
  ],
  "detectionNotes": "Any observations about layout differences"
}`;
}
```

---

## Algorithm

### Step 1: Load Image and Get Metadata

```typescript
import sharp from 'sharp';

interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
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
```

### Step 2: Build Prompt Context

```typescript
function buildRegionPromptContext(
  prompt: BoardPrompt,
  imageMetadata: ImageMetadata
): RegionPromptContext {
  return {
    gridLayout: prompt.gridLayout,
    expectedElements: prompt.elements.map(e => ({
      id: e.id,
      type: e.type,
      gridPosition: e.gridPosition,
      description: e.description,
    })),
    imageAspectRatio: imageMetadata.aspectRatio,
    canvasAspectRatio: 16 / 9,  // 1920x1080 target
  };
}
```

### Step 3: Call Gemini with Image

> **Element Linking**: The LLM prompt explicitly requests that each region include an `elementId` that matches a `BoardElement.id` from the prompts stage. This creates a stable link for the triggers stage to find the correct region for each segment.

```typescript
async function detectRegions(
  imagePath: string,
  context: RegionPromptContext
): Promise<BoardRegion[]> {
  const prompt = boardsRegionPrompt(context);
  const imageBase64 = await fs.readFile(imagePath, { encoding: 'base64' });

  // Use retry logic for LLM calls
  const response = await callGeminiWithRetry(async () => {
    return await callGeminiWithImage(prompt, imageBase64);
  });
  const parsed = JSON.parse(response);

  // Validate regions
  const regions = parsed.regions.map((r: any) => BoardRegionSchema.parse(r));

  // Validate element links
  validateRegionElementLinks(regions, context.expectedElements);

  return regions;
}

// Validate that all regions reference valid elements from prompts stage
function validateRegionElementLinks(
  regions: BoardRegion[],
  expectedElements: Array<{ id: string }>
): void {
  const elementIds = new Set(expectedElements.map(e => e.id));

  for (const region of regions) {
    if (!elementIds.has(region.elementId)) {
      throw new Error(
        `Region ${region.id} references unknown element: ${region.elementId}. ` +
        `Valid elements: ${Array.from(elementIds).join(', ')}`
      );
    }
  }
}
```

### Step 4: Validate Region Bounds

```typescript
function validateRegions(
  regions: BoardRegion[],
  gridLayout: { rows: number; cols: number }
): { valid: BoardRegion[]; warnings: string[] } {
  const maxWidth = 1 / gridLayout.cols;
  const maxHeight = 1 / gridLayout.rows;
  const warnings: string[] = [];

  const valid = regions.map(r => {
    // Clamp oversized regions
    if (r.bounds.width > maxWidth * 1.1) {
      warnings.push(`${r.id}: width ${r.bounds.width.toFixed(3)} exceeds max ${maxWidth.toFixed(3)}`);
      r.bounds.width = maxWidth;
    }
    if (r.bounds.height > maxHeight * 1.1) {
      warnings.push(`${r.id}: height ${r.bounds.height.toFixed(3)} exceeds max ${maxHeight.toFixed(3)}`);
      r.bounds.height = maxHeight;
    }

    // Ensure bounds don't exceed image
    if (r.bounds.x + r.bounds.width > 1) {
      r.bounds.width = 1 - r.bounds.x;
    }
    if (r.bounds.y + r.bounds.height > 1) {
      r.bounds.height = 1 - r.bounds.y;
    }

    return r;
  });

  return { valid, warnings };
}
```

---

## Implementation

```typescript
// Add to cli/lib/board-planner.ts

export async function detectBoardRegions(
  prompts: BoardPromptsOutput,
  imagesDir: string
): Promise<BoardRegionsOutput[]> {
  console.log(`[REGIONS] Detecting regions for ${prompts.prompts.length} boards...`);

  const results: BoardRegionsOutput[] = [];

  for (const prompt of prompts.prompts) {
    const imagePath = path.join(imagesDir, `${prompt.boardId}.png`);

    // FAIL-FAST: Error immediately if image is missing
    if (!await fileExists(imagePath)) {
      throw new Error(
        `[REGIONS] Missing image: ${imagePath}\n` +
        `Upload all board images to assets/images/ before running regions stage.\n` +
        `Expected files: ${prompts.prompts.map(p => `${p.boardId}.png`).join(', ')}`
      );
    }

    console.log(`[REGIONS] Processing ${prompt.boardId}...`);

    // Get image metadata
    const metadata = await getImageMetadata(imagePath);
    console.log(`[REGIONS]   Image: ${metadata.width}x${metadata.height}`);

    // Build context with grid hints
    const context = buildRegionPromptContext(prompt, metadata);

    // Detect regions
    const rawRegions = await detectRegions(imagePath, context);
    console.log(`[REGIONS]   Detected ${rawRegions.length} regions`);

    // Validate and fix bounds
    const { valid: regions, warnings } = validateRegions(rawRegions, prompt.gridLayout);

    if (warnings.length > 0) {
      console.warn(`[REGIONS]   Warnings:`);
      warnings.forEach(w => console.warn(`    - ${w}`));
    }

    results.push({
      version: '1.0',
      boardId: prompt.boardId,
      imagePath: `assets/images/${prompt.boardId}.png`,
      imageMetadata: metadata,
      regions,
      generatedAt: new Date().toISOString(),
    });
  }

  return results;
}
```

---

## CLI Integration

```typescript
case 'regions': {
  const prompts = await readJson<BoardPromptsOutput>(
    path.join(paths.boards, 'board-prompts.json')
  );

  const regionsOutput = await detectBoardRegions(prompts, paths.assetsImages);

  // Save combined output
  await writeJson(path.join(paths.boards, 'board-regions.json'), {
    version: '1.0',
    boards: regionsOutput,
    generatedAt: new Date().toISOString(),
  });

  console.log('\n[REGIONS] Detection Summary:');
  for (const board of regionsOutput) {
    console.log(`\n${board.boardId}:`);
    for (const r of board.regions) {
      console.log(`  ${r.id} (${r.elementId}): x=${r.bounds.x.toFixed(2)}, y=${r.bounds.y.toFixed(2)}, w=${r.bounds.width.toFixed(2)}, h=${r.bounds.height.toFixed(2)}`);
    }
  }
  break;
}
```

---

## Verification

```bash
# Ensure images are uploaded first
ls public/projects/project-1764548027472/assets/images/board-*.png

# Run regions stage
npm run boards -- --project project-1764548027472 regions

# Inspect output
cat public/projects/project-1764548027472/boards/board-regions.json | jq '.boards[0].regions'

# Check for oversized regions (should be none after validation)
cat public/projects/project-1764548027472/boards/board-regions.json | \
  jq '.boards[].regions[] | select(.bounds.width > 0.34 or .bounds.height > 0.51)'
```

---

## Comparison with Current viewport.ts

| Aspect | Current viewport.ts | New boards regions |
|--------|--------------------|--------------------|
| Grid hints | None | Full grid spec from prompts |
| Element hints | None | Expected element positions |
| Max bounds | 0.5 width/height (loose) | 1/cols, 1/rows (exact) |
| Validation | Basic | Strict with warnings |
| Determinism | Low | High (guided by prompts) |

---

## Error Handling

The regions stage uses **fail-fast** behavior - errors are thrown immediately rather than continuing with partial data.

```typescript
// Missing image - fail immediately
if (!await fileExists(imagePath)) {
  throw new Error(
    `[REGIONS] Missing image: ${imagePath}\n` +
    `Upload all board images to assets/images/ before running regions stage.`
  );
}

// Invalid LLM response - retry 3x then fail
try {
  const response = await callGeminiWithRetry(async () => {
    return await callGeminiWithImage(prompt, imageBase64);
  });

  const parsed = JSON.parse(response);
  if (!parsed.regions || !Array.isArray(parsed.regions)) {
    throw new Error('Invalid response format: missing regions array');
  }
} catch (e) {
  // After 3 retries, propagate the error
  throw new Error(
    `[REGIONS] Failed to detect regions for ${prompt.boardId}: ${e instanceof Error ? e.message : e}`
  );
}

// Invalid element link - fail with helpful message
if (!elementIds.has(region.elementId)) {
  throw new Error(
    `Region ${region.id} references unknown element: ${region.elementId}. ` +
    `This usually means the LLM hallucinated an element ID. Valid elements: ${Array.from(elementIds).join(', ')}`
  );
}
```

---

## Next Step

Proceed to [05-preview-stage.md](./05-preview-stage.md)
