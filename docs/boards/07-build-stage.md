> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Stage 7: Build Stage

## Overview

Merge all board data into the final `viewport.json` file. References 8k upscaled images and includes word-level triggers for runtime viewport animation.

**Files to modify**:
- `cli/lib/board-planner.ts` (add build function)

---

## Input

- `boards/board-plan.json`
- `boards/board-prompts.json`
- `boards/board-regions.json`
- `boards/board-triggers.json`
- `assets/images/board-{n}_8k.png` (upscaled images)

---

## Output

`viewport.json`:

```json
{
  "version": "2.0",
  "generatedBy": "boards",
  "boards": [
    {
      "boardId": "board-1",
      "imageSource": "board-1_8k.png",
      "imageMetadata": {
        "width": 7680,
        "height": 4320,
        "aspectRatio": 1.78
      },
      "segmentRange": [0, 4],
      "regions": [
        {
          "id": "region-1",
          "elementId": "elem-1",
          "bounds": { "x": 0.02, "y": 0.03, "width": 0.30, "height": 0.45 },
          "label": "College photo"
        }
      ]
    }
  ],
  "wordTriggers": [
    {
      "triggerId": "trigger-1",
      "wordId": "seg-0-w-0",
      "globalWordIndex": 0,
      "wordStartMs": 15,
      "targetRegionId": "region-1",
      "targetBoardId": "board-1",
      "transitionMs": 0
    }
  ],
  "keyframes": [
    {
      "frame": 0,
      "boardId": "board-1",
      "regionId": "region-1",
      "viewport": {
        "centerX": 0.17,
        "centerY": 0.255,
        "zoom": 2.5
      }
    }
  ],
  "generatedAt": "2026-01-08T..."
}
```

---

## Algorithm

### Step 1: Check for Upscaled Images

```typescript
async function checkUpscaledImages(
  boards: BoardPlan['boards'],
  imagesDir: string
): Promise<Map<string, ImageMetadata>> {
  const imageMap = new Map<string, ImageMetadata>();
  const missingUpscales: string[] = [];

  for (const board of boards) {
    const upscaledPath = path.join(imagesDir, `${board.boardId}_8k.png`);
    const originalPath = path.join(imagesDir, `${board.boardId}.png`);

    let imagePath: string;
    if (await fileExists(upscaledPath)) {
      imagePath = upscaledPath;
      console.log(`[BUILD] Using upscaled: ${board.boardId}_8k.png`);
    } else if (await fileExists(originalPath)) {
      imagePath = originalPath;
      missingUpscales.push(board.boardId);
    } else {
      throw new Error(`[BUILD] No image found for ${board.boardId}`);
    }

    const metadata = await getImageMetadata(imagePath);
    imageMap.set(board.boardId, {
      ...metadata,
      path: path.basename(imagePath),
    });
  }

  // Warn about missing upscaled images (optional but recommended)
  if (missingUpscales.length > 0) {
    console.warn(`\n[BUILD] WARNING: No 8k images found for: ${missingUpscales.join(', ')}`);
    console.warn(`[BUILD] Using original images. Video quality may be reduced.`);
    console.warn(`[BUILD] Run 'npm run upscale -- --project <id>' to upscale images.\n`);
  }

  return imageMap;
}
```

### Step 2: Calculate Keyframes from Triggers

```typescript
interface Keyframe {
  frame: number;
  boardId: string;
  regionId: string;
  viewport: {
    centerX: number;
    centerY: number;
    zoom: number;
  };
}

function calculateKeyframes(
  triggers: ViewportTrigger[],
  regionsData: BoardRegionsOutput[],
  fps: number = 30
): Keyframe[] {
  const keyframes: Keyframe[] = [];

  for (const trigger of triggers) {
    // Find region bounds
    const boardRegions = regionsData.find(r =>
      r.boards?.some(b => b.boardId === trigger.targetBoardId)
    );
    const board = boardRegions?.boards?.find(b => b.boardId === trigger.targetBoardId);
    const region = board?.regions.find(r => r.id === trigger.targetRegionId);

    if (!region) {
      console.warn(`[BUILD] Region not found: ${trigger.targetRegionId}`);
      continue;
    }

    // Calculate viewport center and zoom
    const viewport = calculateViewportForRegion(region.bounds, board.imageMetadata);

    // Convert ms to frame
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
```

### Step 3: Calculate Aspect-Aware Zoom

```typescript
interface ViewportState {
  centerX: number;
  centerY: number;
  zoom: number;
}

function calculateViewportForRegion(
  bounds: RegionBounds,
  imageMetadata: { width: number; height: number; aspectRatio: number }
): ViewportState {
  const canvasAspect = 16 / 9;  // 1920x1080
  const imageAspect = imageMetadata.aspectRatio;

  // Center of region
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  // Aspect-aware zoom calculation
  const targetCoverage = 0.9;  // Region should fill 90% of viewport

  let zoom: number;

  if (imageAspect > canvasAspect) {
    // Wide image (like detective board)
    // Width-constrained: image width fills canvas width
    const zoomForWidth = targetCoverage / bounds.width;

    // Check if height would overflow
    const effectiveHeightRatio = (bounds.height * imageAspect) / canvasAspect;
    const zoomForHeight = targetCoverage / effectiveHeightRatio;

    zoom = Math.min(zoomForWidth, zoomForHeight);
  } else {
    // Tall image
    const zoomForHeight = targetCoverage / bounds.height;

    const effectiveWidthRatio = (bounds.width * canvasAspect) / imageAspect;
    const zoomForWidth = targetCoverage / effectiveWidthRatio;

    zoom = Math.min(zoomForWidth, zoomForHeight);
  }

  // Clamp zoom to reasonable range
  zoom = Math.max(1.0, Math.min(5.0, zoom));

  return { centerX, centerY, zoom };
}
```

### Step 4: Assemble Final Output

```typescript
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

function assembleViewportJson(
  plan: BoardPlan,
  regionsData: BoardRegionsOutput[],
  triggers: BoardTriggersOutput,
  imageMap: Map<string, ImageMetadata>,
  keyframes: Keyframe[]
): ViewportJson {
  const boards = plan.boards.map(board => {
    const imageInfo = imageMap.get(board.boardId)!;
    const boardRegions = regionsData
      .flatMap(r => r.boards || [])
      .find(b => b.boardId === board.boardId);

    return {
      boardId: board.boardId,
      imageSource: imageInfo.path,
      imageMetadata: {
        width: imageInfo.width,
        height: imageInfo.height,
        aspectRatio: imageInfo.aspectRatio,
      },
      segmentRange: [
        board.segmentIndices[0],
        board.segmentIndices[board.segmentIndices.length - 1],
      ] as [number, number],
      regions: boardRegions?.regions || [],
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
```

---

## Implementation

```typescript
// Add to cli/lib/board-planner.ts

export async function buildViewportJson(
  projectPath: string,
  fps: number = 30
): Promise<ViewportJson> {
  const boardsDir = path.join(projectPath, 'boards');
  const imagesDir = path.join(projectPath, 'assets', 'images');

  console.log('[BUILD] Loading board data...');

  // Load all board data
  const plan = await readJson<BoardPlan>(path.join(boardsDir, 'board-plan.json'));
  const prompts = await readJson<BoardPromptsOutput>(path.join(boardsDir, 'board-prompts.json'));
  const regionsData = await readJson<{ boards: BoardRegionsOutput[] }>(
    path.join(boardsDir, 'board-regions.json')
  );
  const triggers = await readJson<BoardTriggersOutput>(
    path.join(boardsDir, 'board-triggers.json')
  );

  console.log(`[BUILD] Loaded ${plan.boards.length} boards, ${triggers.totalTriggers} triggers`);

  // Check for upscaled images
  console.log('[BUILD] Checking for upscaled images...');
  const imageMap = await checkUpscaledImages(plan.boards, imagesDir);

  // Calculate keyframes
  console.log('[BUILD] Calculating keyframes...');
  const keyframes = calculateKeyframes(triggers.triggers, [regionsData], fps);
  console.log(`[BUILD] Generated ${keyframes.length} keyframes`);

  // Assemble final output
  const viewport = assembleViewportJson(plan, [regionsData], triggers, imageMap, keyframes);

  return viewport;
}
```

---

## CLI Integration

```typescript
case 'build': {
  const viewport = await buildViewportJson(paths.project, 30);

  await writeJson(path.join(paths.project, 'viewport.json'), viewport);

  console.log('\n[BUILD] viewport.json created successfully');
  console.log(`  Boards: ${viewport.boards.length}`);
  console.log(`  Triggers: ${viewport.wordTriggers.length}`);
  console.log(`  Keyframes: ${viewport.keyframes.length}`);

  // Show first few keyframes
  console.log('\n  First 5 keyframes:');
  viewport.keyframes.slice(0, 5).forEach(kf => {
    console.log(`    Frame ${kf.frame}: ${kf.regionId} @ zoom ${kf.viewport.zoom.toFixed(2)}`);
  });
  break;
}
```

---

## Verification

```bash
# Ensure upscale has been run
ls public/projects/project-1764548027472/assets/images/*_8k.png

# Run build stage
npm run boards -- --project project-1764548027472 build

# Inspect viewport.json
cat public/projects/project-1764548027472/viewport.json | jq '.version, .boards | length, .keyframes | length'

# Verify keyframes have reasonable zoom values
cat public/projects/project-1764548027472/viewport.json | \
  jq '.keyframes[] | "\(.frame): zoom \(.viewport.zoom)"'

# Test video preview
npm run preview -- --project project-1764548027472
```

---

## Output Format Comparison

### Current viewport.json (v1)

```json
{
  "imageSource": "cam_newton.png",
  "detectedRegions": [...],
  "sentenceGroups": [...],
  "keyframes": [{ "frame": 0, "zoom": 2.88, "centerX": 0.375, "centerY": 0.165 }]
}
```

### New viewport.json (v2)

```json
{
  "version": "2.0",
  "generatedBy": "boards",
  "boards": [
    {
      "boardId": "board-1",
      "imageSource": "board-1_8k.png",
      "regions": [...]
    }
  ],
  "wordTriggers": [...],
  "keyframes": [
    {
      "frame": 0,
      "boardId": "board-1",
      "regionId": "region-1",
      "viewport": { "centerX": 0.17, "centerY": 0.255, "zoom": 2.5 }
    }
  ]
}
```

---

## Board Transitions

When the viewport moves to a region on a different board, the image source changes with a **hard cut** (instant switch). This matches the detective board "reveal" aesthetic.

```typescript
// In Background.tsx rendering logic
function renderBackground(frame: number, viewport: ViewportJson): JSX.Element {
  const currentKeyframe = getCurrentKeyframe(frame, viewport.keyframes);
  const board = viewport.boards.find(b => b.boardId === currentKeyframe.boardId);

  // No crossfade - just switch to the new board's image
  return (
    <Img
      src={staticFile(`projects/${projectId}/assets/images/${board.imageSource}`)}
      style={{ transform: viewportToTransform(currentKeyframe.viewport) }}
    />
  );
}
```

> **Design Decision**: Hard cuts between boards create dramatic "reveal" moments that fit the investigation board style. Crossfades were considered but rejected as they blur the detective aesthetic.

---

## Next Step

Proceed to [08-cli-command.md](./08-cli-command.md)
