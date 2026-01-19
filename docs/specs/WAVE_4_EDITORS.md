> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Wave 4: Viewport & Boards Editors

> Detailed specification for AI-generated viewport animations and visual storyboard editing.

## Overview

**Goal:** Implement visual editors for viewport (pan-scan) animation and boards (storyboard regions), combining AI generation with manual adjustment capabilities.

**Prerequisites:** Wave 1, Wave 2 (Script), Wave 3 (Assets)

**Outcome:** Users can generate AI viewport keyframes, visually adjust them, and edit board layouts with drag-drop region editing.

**Key Decisions:**
- **Mutually exclusive modes:** A project uses EITHER Viewport (pan-scan on single image) OR Boards (multi-image collage), not both.
- **User-controlled asset mapping:** Users explicitly assign which image goes with which segment via drag-drop interface.
- **Viewport is primary:** Most projects will use Viewport mode. Boards is an advanced feature for specific use cases.

**Mode Selection:**
```typescript
// Project can be in one of two visual modes
type VisualMode = 'viewport' | 'boards'

// User selects mode before editing
// Mode selection is shown after assets are uploaded
interface ModeSelectionUI {
  viewport: {
    description: 'Pan-scan animation across a single background image',
    bestFor: 'Single subject focus, cinematic feel',
    requirements: 'At least 1 high-resolution image'
  },
  boards: {
    description: 'Multi-image collage with region-based layouts',
    bestFor: 'Multiple subjects, comparison videos',
    requirements: 'Multiple images (2+)'
  }
}
```

---

## 1. Viewport Animation

### 1.1 Viewport Concepts

**What is Viewport Animation?**
- Pan-scan effect across static images
- Camera "moves" over image, focusing on different regions
- Creates dynamic video from single image
- Keyframes define camera position (centerX, centerY) and zoom level

**Keyframe Structure:**
```typescript
interface ViewportKeyframe {
  frameStart: number
  frameEnd: number
  viewport: {
    centerX: number  // 0-1, horizontal position
    centerY: number  // 0-1, vertical position
    zoom: number     // 1.0 = full image, 2.0+ = magnified
  }
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'slowDramatic' | 'fastAction'
  transitionDurationMs: number
}
```

### 1.2 Viewport Page UI

**Flow:**
1. Select background image from assets
2. Click "Generate Viewport" → AI analyzes image + script
3. AI returns detected regions and suggested keyframes
4. Preview animation
5. Adjust keyframes visually
6. Save and continue

```tsx
// app/(dashboard)/projects/[id]/viewport/page.tsx

export default async function ViewportPage({
  params
}: {
  params: { id: string }
}) {
  const project = await getProject(params.id)
  const assets = await getImageAssets(params.id)
  const viewport = await getViewport(params.id)

  return (
    <WizardLayout project={project} currentStep="viewport">
      <ViewportEditor
        projectId={params.id}
        images={assets}
        viewport={viewport}
      />
    </WizardLayout>
  )
}
```

### 1.3 Viewport Editor Component

```tsx
// components/editors/viewport-editor/index.tsx

export function ViewportEditor({
  projectId,
  images,
  viewport
}: ViewportEditorProps) {
  const [selectedImage, setSelectedImage] = useState(images[0])
  const [keyframes, setKeyframes] = useState(viewport?.keyframes || [])
  const [detectedRegions, setDetectedRegions] = useState(viewport?.regions || [])
  const [previewFrame, setPreviewFrame] = useState(0)

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Image Canvas with Region Overlay */}
      <div className="space-y-4">
        <ImageSelector
          images={images}
          selected={selectedImage}
          onSelect={setSelectedImage}
        />

        <ViewportCanvas
          image={selectedImage}
          regions={detectedRegions}
          keyframes={keyframes}
          currentFrame={previewFrame}
          onRegionClick={handleRegionClick}
        />

        <GenerateButton
          onClick={generateViewport}
          disabled={!selectedImage}
        />
      </div>

      {/* Right: Keyframe Timeline & Editor */}
      <div className="space-y-4">
        <KeyframeTimeline
          keyframes={keyframes}
          totalFrames={totalFrames}
          currentFrame={previewFrame}
          onFrameChange={setPreviewFrame}
          onKeyframeSelect={setSelectedKeyframe}
        />

        <KeyframeEditor
          keyframe={selectedKeyframe}
          onChange={updateKeyframe}
          onDelete={deleteKeyframe}
        />

        <RegionsList
          regions={detectedRegions}
          onRegionSelect={focusRegion}
        />
      </div>
    </div>
  )
}
```

---

## 2. Viewport Canvas

### 2.1 Canvas Component

**Features:**
- Display image with detected regions overlay
- Show current viewport frame (camera position indicator)
- Click region to create keyframe
- Drag to adjust viewport position
- Zoom controls

```tsx
// components/editors/viewport-editor/viewport-canvas.tsx

export function ViewportCanvas({
  image,
  regions,
  keyframes,
  currentFrame,
  onRegionClick
}: ViewportCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewport, setViewport] = useState({ centerX: 0.5, centerY: 0.5, zoom: 1 })

  // Calculate viewport state at current frame
  useEffect(() => {
    const state = calculateViewportState(currentFrame, keyframes, FPS)
    setViewport(state)
  }, [currentFrame, keyframes])

  // Draw canvas
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    // Draw image
    ctx.drawImage(image, 0, 0)

    // Draw region overlays
    regions.forEach((region) => {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'
      ctx.strokeRect(
        region.bounds.x * canvasWidth,
        region.bounds.y * canvasHeight,
        region.bounds.width * canvasWidth,
        region.bounds.height * canvasHeight
      )
    })

    // Draw viewport frame indicator
    drawViewportIndicator(ctx, viewport, canvasWidth, canvasHeight)
  }, [image, regions, viewport])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border"
        onClick={handleCanvasClick}
      />

      {/* Region Labels */}
      {regions.map((region) => (
        <div
          key={region.id}
          className="absolute bg-black/70 text-white text-xs px-2 py-1 rounded"
          style={{
            left: `${region.bounds.x * 100}%`,
            top: `${region.bounds.y * 100}%`
          }}
        >
          {region.label}
        </div>
      ))}
    </div>
  )
}
```

### 2.2 Viewport Indicator

```tsx
// Draw rectangle showing what camera sees at current frame
function drawViewportIndicator(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  canvasWidth: number,
  canvasHeight: number
) {
  const { centerX, centerY, zoom } = viewport

  // Calculate visible rectangle
  const viewWidth = canvasWidth / zoom
  const viewHeight = canvasHeight / zoom
  const viewX = (centerX * canvasWidth) - (viewWidth / 2)
  const viewY = (centerY * canvasHeight) - (viewHeight / 2)

  // Draw indicator
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'  // Blue
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.strokeRect(viewX, viewY, viewWidth, viewHeight)

  // Draw center crosshair
  ctx.beginPath()
  ctx.moveTo(centerX * canvasWidth - 10, centerY * canvasHeight)
  ctx.lineTo(centerX * canvasWidth + 10, centerY * canvasHeight)
  ctx.moveTo(centerX * canvasWidth, centerY * canvasHeight - 10)
  ctx.lineTo(centerX * canvasWidth, centerY * canvasHeight + 10)
  ctx.stroke()
}
```

---

## 3. Keyframe Timeline

### 3.1 Timeline Component

**Features:**
- Horizontal timeline showing all keyframes
- Drag keyframes to reposition
- Click to select keyframe
- Scrub to preview different frames
- Add keyframe button

```tsx
// components/editors/viewport-editor/keyframe-timeline.tsx

export function KeyframeTimeline({
  keyframes,
  totalFrames,
  currentFrame,
  onFrameChange,
  onKeyframeSelect,
  onKeyframeMove
}: KeyframeTimelineProps) {
  return (
    <div className="relative h-20 bg-muted rounded-lg">
      {/* Timeline track */}
      <div className="absolute inset-x-4 top-1/2 h-1 bg-border rounded" />

      {/* Keyframe markers */}
      {keyframes.map((keyframe, index) => (
        <div
          key={index}
          className="absolute w-4 h-4 bg-primary rounded-full cursor-pointer"
          style={{
            left: `${(keyframe.frameStart / totalFrames) * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          onClick={() => onKeyframeSelect(keyframe)}
          draggable
          onDrag={(e) => handleKeyframeDrag(e, index)}
        />
      ))}

      {/* Playhead */}
      <div
        className="absolute w-0.5 h-full bg-red-500"
        style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
      />

      {/* Scrub area */}
      <input
        type="range"
        min={0}
        max={totalFrames}
        value={currentFrame}
        onChange={(e) => onFrameChange(Number(e.target.value))}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
  )
}
```

### 3.2 Keyframe Editor Panel

```tsx
// components/editors/viewport-editor/keyframe-editor.tsx

export function KeyframeEditor({
  keyframe,
  onChange,
  onDelete
}: KeyframeEditorProps) {
  if (!keyframe) {
    return <EmptyState message="Select a keyframe to edit" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyframe Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Position Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Center X</Label>
            <Slider
              value={[keyframe.viewport.centerX * 100]}
              onValueChange={([v]) =>
                onChange({ ...keyframe, viewport: { ...keyframe.viewport, centerX: v / 100 } })
              }
              min={0}
              max={100}
            />
          </div>
          <div>
            <Label>Center Y</Label>
            <Slider
              value={[keyframe.viewport.centerY * 100]}
              onValueChange={([v]) =>
                onChange({ ...keyframe, viewport: { ...keyframe.viewport, centerY: v / 100 } })
              }
              min={0}
              max={100}
            />
          </div>
        </div>

        {/* Zoom Control */}
        <div>
          <Label>Zoom</Label>
          <Slider
            value={[keyframe.viewport.zoom]}
            onValueChange={([v]) =>
              onChange({ ...keyframe, viewport: { ...keyframe.viewport, zoom: v } })
            }
            min={1}
            max={4}
            step={0.1}
          />
        </div>

        {/* Easing Select */}
        <div>
          <Label>Easing</Label>
          <Select
            value={keyframe.easing}
            onValueChange={(v) => onChange({ ...keyframe, easing: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="easeIn">Ease In</SelectItem>
              <SelectItem value="easeOut">Ease Out</SelectItem>
              <SelectItem value="easeInOut">Ease In Out</SelectItem>
              <SelectItem value="slowDramatic">Slow Dramatic</SelectItem>
              <SelectItem value="fastAction">Fast Action</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transition Duration */}
        <div>
          <Label>Transition Duration (ms)</Label>
          <Input
            type="number"
            value={keyframe.transitionDurationMs}
            onChange={(e) =>
              onChange({ ...keyframe, transitionDurationMs: Number(e.target.value) })
            }
          />
        </div>

        <Button variant="destructive" onClick={onDelete}>
          Delete Keyframe
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

## 4. Viewport AI Generation

### 4.1 Generation API

**POST /api/ai/viewport**

```typescript
// Request
{
  projectId: string
  imageAssetId: string
}

// Response
{
  viewport: {
    regions: DetectedRegion[]
    keyframes: ViewportKeyframe[]
  }
}
```

### 4.2 AI Service

**Migrate from:** `cli/commands/viewport.ts`

```typescript
// lib/services/ai/viewport.ts

export async function generateViewport(
  imagePath: string,
  script: Script
): Promise<ViewportAnalysis> {
  // Prepare multimodal prompt with image + script
  const prompt = viewportPrompt({
    scriptSegments: script.segments,
    imageDescription: 'Analyze this image for viewport animation'
  })

  // Call Gemini with image
  const result = await geminiProvider.multimodalComplete(
    prompt,
    imagePath,
    viewportResponseSchema
  )

  return result
}
```

### 4.3 Viewport Prompt

```typescript
// config/prompts/viewport.prompt.ts

export function viewportPrompt(vars: ViewportPromptVars): string {
  return `
You are analyzing an image for viewport animation (pan-scan effect) in a video.

The video script has ${vars.scriptSegments.length} segments.

Analyze the image and:
1. Detect key regions of interest (faces, objects, text, focal points)
2. Generate viewport keyframes that create an engaging pan-scan animation
3. Match viewport movements to script tone and pacing

Requirements:
- Start zoomed out to establish scene
- Focus on relevant regions during corresponding script segments
- Use smooth transitions (easeInOut for most, fastAction for dramatic moments)
- Avoid jarring movements
- Return to establishing shot periodically

Return JSON:
{
  "regions": [
    {
      "id": "region-1",
      "label": "Subject face",
      "bounds": { "x": 0.3, "y": 0.2, "width": 0.4, "height": 0.5 },
      "salience": 0.9
    }
  ],
  "keyframes": [
    {
      "frameStart": 0,
      "frameEnd": 90,
      "viewport": { "centerX": 0.5, "centerY": 0.5, "zoom": 1.0 },
      "easing": "easeInOut",
      "transitionDurationMs": 1000
    }
  ]
}
`
}
```

---

## 5. Boards Editor

### 5.1 Boards Concepts

**What are Boards?**
- Storyboard-style layouts with multiple images
- Grid layout (e.g., 2x3, 3x3)
- Each cell has a region that syncs to script timing
- Creates collage-style video effect

**Board Structure:**
```typescript
interface Board {
  id: string
  index: number
  layout: {
    columns: number
    rows: number
  }
  regions: BoardRegion[]
  triggers: AnimationTrigger[]
}

interface BoardRegion {
  id: string
  position: { row: number; col: number }
  assetId: string
  bounds: { x: number; y: number; width: number; height: number }
  animation?: RegionAnimation
}
```

### 5.2 Boards Page UI

```tsx
// app/(dashboard)/projects/[id]/boards/page.tsx

export default async function BoardsPage({
  params
}: {
  params: { id: string }
}) {
  const project = await getProject(params.id)
  const boards = await getBoards(params.id)
  const assets = await getImageAssets(params.id)

  return (
    <WizardLayout project={project} currentStep="boards">
      <BoardsEditor
        projectId={params.id}
        boards={boards}
        assets={assets}
      />
    </WizardLayout>
  )
}
```

### 5.3 Boards Editor Component

```tsx
// components/editors/boards-editor/index.tsx

export function BoardsEditor({
  projectId,
  boards,
  assets
}: BoardsEditorProps) {
  const [selectedBoard, setSelectedBoard] = useState(boards[0])
  const [selectedRegion, setSelectedRegion] = useState<BoardRegion | null>(null)

  return (
    <div className="space-y-6">
      {/* Board Tabs */}
      <Tabs value={selectedBoard?.id} onValueChange={handleBoardSelect}>
        <TabsList>
          {boards.map((board) => (
            <TabsTrigger key={board.id} value={board.id}>
              Board {board.index + 1}
            </TabsTrigger>
          ))}
          <Button variant="ghost" size="sm" onClick={addBoard}>
            <Plus className="h-4 w-4" />
          </Button>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Board Canvas */}
        <BoardCanvas
          board={selectedBoard}
          assets={assets}
          selectedRegion={selectedRegion}
          onRegionSelect={setSelectedRegion}
          onRegionUpdate={updateRegion}
        />

        {/* Right: Region Editor */}
        <RegionEditor
          region={selectedRegion}
          assets={assets}
          onChange={updateRegion}
          onDelete={deleteRegion}
        />
      </div>

      {/* Layout Controls */}
      <LayoutControls
        layout={selectedBoard?.layout}
        onChange={updateLayout}
      />
    </div>
  )
}
```

### 5.4 Board Canvas

```tsx
// components/editors/boards-editor/board-canvas.tsx

export function BoardCanvas({
  board,
  assets,
  selectedRegion,
  onRegionSelect,
  onRegionUpdate
}: BoardCanvasProps) {
  const { columns, rows } = board.layout

  return (
    <div
      className="grid gap-2 bg-muted p-4 rounded-lg"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`
      }}
    >
      {Array.from({ length: columns * rows }).map((_, index) => {
        const row = Math.floor(index / columns)
        const col = index % columns
        const region = board.regions.find(
          (r) => r.position.row === row && r.position.col === col
        )

        return (
          <BoardCell
            key={index}
            row={row}
            col={col}
            region={region}
            assets={assets}
            isSelected={selectedRegion?.id === region?.id}
            onSelect={() => onRegionSelect(region)}
            onDrop={(assetId) => handleAssetDrop(row, col, assetId)}
          />
        )
      })}
    </div>
  )
}
```

### 5.5 Board Cell

```tsx
// components/editors/boards-editor/board-cell.tsx

export function BoardCell({
  row,
  col,
  region,
  assets,
  isSelected,
  onSelect,
  onDrop
}: BoardCellProps) {
  const asset = region ? assets.find((a) => a.id === region.assetId) : null

  return (
    <div
      className={cn(
        'aspect-video rounded border-2 overflow-hidden cursor-pointer',
        isSelected ? 'border-primary' : 'border-dashed border-muted-foreground',
        !region && 'flex items-center justify-center'
      )}
      onClick={onSelect}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const assetId = e.dataTransfer.getData('assetId')
        onDrop(assetId)
      }}
    >
      {asset ? (
        <img
          src={asset.path}
          alt=""
          className="w-full h-full object-cover"
          style={{
            objectPosition: region
              ? `${region.bounds.x * 100}% ${region.bounds.y * 100}%`
              : 'center'
          }}
        />
      ) : (
        <span className="text-sm text-muted-foreground">
          Drop image here
        </span>
      )}
    </div>
  )
}
```

---

## 6. Boards API

### 6.1 Board CRUD

**GET /api/projects/[id]/boards**
```typescript
// Response
{
  boards: Board[]
}
```

**POST /api/projects/[id]/boards**
```typescript
// Request
{
  layout: { columns: number; rows: number }
}

// Response
{
  board: Board
}
```

**PUT /api/projects/[id]/boards/[boardId]**
```typescript
// Request
{
  layout?: { columns: number; rows: number }
  regions?: BoardRegion[]
  triggers?: AnimationTrigger[]
}
```

### 6.2 AI Board Generation

**POST /api/ai/boards**

```typescript
// Request
{
  projectId: string
  layout: { columns: number; rows: number }
}

// Response
{
  board: Board
}
```

---

## 7. Database Schema

### 7.1 Viewport Table

```prisma
model Viewport {
  id          String   @id @default(cuid())
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  imageAssetId String?
  keyframes   Json     // ViewportKeyframe[]
  regions     Json?    // DetectedRegion[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 7.2 Board Table

```prisma
model Board {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  index       Int
  layout      Json     // { columns, rows }
  regions     Json     // BoardRegion[]
  triggers    Json?    // AnimationTrigger[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([projectId, index])
}
```

---

## 8. User-Controlled Asset Mapping

### 8.1 Asset-to-Segment Assignment

Users explicitly control which image is used for which segment:

```tsx
// components/editors/asset-mapper/index.tsx

export function AssetMapper({
  projectId,
  segments,
  assets,
  mappings
}: AssetMapperProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Script Segments */}
      <div className="space-y-2">
        <h3 className="font-semibold">Script Segments</h3>
        {segments.map((segment, index) => (
          <SegmentDropZone
            key={index}
            segment={segment}
            assignedAsset={mappings[index]}
            onDrop={(assetId) => assignAsset(index, assetId)}
            onClear={() => clearAsset(index)}
          />
        ))}
      </div>

      {/* Right: Available Assets */}
      <div className="space-y-2">
        <h3 className="font-semibold">Available Images</h3>
        <div className="grid grid-cols-3 gap-2">
          {assets.map((asset) => (
            <DraggableAsset
              key={asset.id}
              asset={asset}
              isAssigned={Object.values(mappings).includes(asset.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 8.2 Mapping Rules

- **Single image projects:** All segments use the same image (Viewport mode)
- **Multiple images:** Each segment can have a different image assigned
- **Unassigned segments:** Use the previous segment's image (or first available)
- **One image per segment:** A segment can only have one background image

### 8.3 Database Storage

```prisma
// Add to Project model
model Project {
  // ... existing fields
  assetMappings Json?  // { segmentIndex: assetId }
}
```

---

## 9. Keyboard Shortcuts

| Action | Shortcut | Context |
|--------|----------|---------|
| Play/Pause preview | `Space` | Viewport editor |
| Previous keyframe | `←` | Keyframe timeline |
| Next keyframe | `→` | Keyframe timeline |
| Delete keyframe | `Delete` / `Backspace` | Selected keyframe |
| Add keyframe | `K` | Viewport editor |
| Zoom in | `+` / `=` | Canvas |
| Zoom out | `-` | Canvas |
| Reset zoom | `0` | Canvas |
| Undo | `Cmd/Ctrl + Z` | All editors |
| Redo | `Cmd/Ctrl + Shift + Z` | All editors |
| Save | `Cmd/Ctrl + S` | All editors |

---

## 10. Acceptance Criteria

### Viewport Editor
- [ ] Can select image for viewport
- [ ] AI generates regions and keyframes
- [ ] Can scrub timeline to preview
- [ ] Can adjust keyframe position
- [ ] Can adjust zoom level
- [ ] Can change easing
- [ ] Can add/delete keyframes
- [ ] Saves viewport to database

### Boards Editor
- [ ] Can create boards with custom layout
- [ ] Can drag-drop images to cells
- [ ] Can adjust region bounds
- [ ] Can delete regions
- [ ] Saves boards to database

### Should Have
- [ ] Viewport animation preview
- [ ] Keyboard shortcuts for editing
- [ ] Undo/redo support

### Nice to Have
- [ ] Copy/paste keyframes
- [ ] Animation presets
- [ ] Board templates

---

## 9. Testing Checklist

1. **Viewport:**
   - AI generates valid keyframes
   - Manual adjustments work
   - Timeline scrubbing is smooth
   - Saves and loads correctly

2. **Boards:**
   - Grid layout renders correctly
   - Drag-drop works
   - Region bounds adjust visually
   - Multiple boards work

---

*Wave 4 Complete → Proceed to Wave 5: Video Preview*
