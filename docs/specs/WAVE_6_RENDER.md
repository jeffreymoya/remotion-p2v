> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Wave 6: Rendering & Final Output

> Detailed specification for server-side video rendering with progress tracking and export.

## Overview

**Goal:** Implement server-side video rendering using Remotion CLI, with real-time progress tracking via WebSocket and download functionality.

**Prerequisites:** Waves 1-5 (Foundation, Script, Assets, Editors, Preview)

**Outcome:** Users can render their video at various quality presets and download the final output.

---

## 1. Render Queue Architecture

### 1.1 Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web Client    │────▶│   API Server     │────▶│  Render Queue   │
│                 │◀────│                  │◀────│                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        │   WebSocket            │                        │
        │◀───────────────────────┼────────────────────────┘
        │   Progress Events      │
```

### 1.2 Render Job States

```typescript
enum RenderStatus {
  PENDING = 'PENDING',       // In queue
  PROCESSING = 'PROCESSING', // Currently rendering
  COMPLETED = 'COMPLETED',   // Success
  FAILED = 'FAILED'          // Error
}
```

---

## 2. Render Page UI

### 2.1 Page Component

```tsx
// app/(dashboard)/projects/[id]/render/page.tsx

export default async function RenderPage({
  params
}: {
  params: { id: string }
}) {
  const project = await getProject(params.id)
  const renders = await getRenders(params.id)

  return (
    <WizardLayout project={project} currentStep="render">
      <RenderManager
        projectId={params.id}
        renders={renders}
      />
    </WizardLayout>
  )
}
```

### 2.2 Render Manager Component

```tsx
// components/render/render-manager.tsx

export function RenderManager({
  projectId,
  renders
}: RenderManagerProps) {
  const [activeRender, setActiveRender] = useState<Render | null>(null)
  const [quality, setQuality] = useState<RenderQuality>('medium')

  // Subscribe to render progress
  useRenderSocket(activeRender?.id, {
    onProgress: handleProgress,
    onComplete: handleComplete,
    onError: handleError
  })

  return (
    <div className="space-y-8">
      {/* Quality Selection */}
      <QualitySelector
        value={quality}
        onChange={setQuality}
        disabled={!!activeRender}
      />

      {/* Start Render Button */}
      {!activeRender && (
        <Button
          size="lg"
          onClick={() => startRender(projectId, quality)}
        >
          <Film className="mr-2 h-5 w-5" />
          Start Render
        </Button>
      )}

      {/* Active Render Progress */}
      {activeRender && (
        <RenderProgress render={activeRender} />
      )}

      {/* Previous Renders */}
      <PreviousRenders
        renders={renders}
        onDownload={downloadRender}
        onDelete={deleteRender}
      />
    </div>
  )
}
```

### 2.3 Quality Selector

```tsx
// components/render/quality-selector.tsx

const qualities = [
  {
    id: 'draft',
    name: 'Draft',
    description: 'Fast preview quality (720p, CRF 28)',
    icon: Zap
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Balanced quality (1080p, CRF 23)',
    icon: Scale
  },
  {
    id: 'high',
    name: 'High',
    description: 'High quality (1080p, CRF 18)',
    icon: Sparkles
  },
  {
    id: 'production',
    name: 'Production',
    description: 'Maximum quality (1080p, CRF 15)',
    icon: Trophy
  }
]

export function QualitySelector({
  value,
  onChange,
  disabled
}: QualitySelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      className="grid grid-cols-2 gap-4"
    >
      {qualities.map((quality) => (
        <div key={quality.id}>
          <RadioGroupItem
            value={quality.id}
            id={quality.id}
            className="peer sr-only"
          />
          <Label
            htmlFor={quality.id}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer',
              'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5'
            )}
          >
            <quality.icon className="h-8 w-8 mb-2" />
            <span className="font-medium">{quality.name}</span>
            <span className="text-sm text-muted-foreground text-center">
              {quality.description}
            </span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
```

### 2.4 Render Progress Component

```tsx
// components/render/render-progress.tsx

export function RenderProgress({ render }: { render: Render }) {
  const [progress, setProgress] = useState(render.progress)
  const [status, setStatus] = useState(render.status)
  const [eta, setEta] = useState<string | null>(null)

  // Subscribe to WebSocket updates
  useRenderSocket(render.id, {
    onProgress: (data) => {
      setProgress(data.progress)
      setEta(data.eta)
    },
    onComplete: () => setStatus('COMPLETED'),
    onError: () => setStatus('FAILED')
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === 'PROCESSING' && (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
          {status === 'COMPLETED' && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {status === 'FAILED' && (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          Rendering Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{Math.round(progress)}%</span>
            {eta && <span>ETA: {eta}</span>}
          </div>
          <Progress value={progress} />
        </div>

        {/* Status Messages */}
        <div className="text-sm text-muted-foreground">
          {status === 'PROCESSING' && 'Encoding frames...'}
          {status === 'COMPLETED' && 'Render complete!'}
          {status === 'FAILED' && (
            <span className="text-red-500">
              Render failed: {render.error}
            </span>
          )}
        </div>

        {/* Download Button */}
        {status === 'COMPLETED' && render.outputPath && (
          <Button asChild>
            <a href={render.outputPath} download>
              <Download className="mr-2 h-4 w-4" />
              Download Video
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 3. Render API

### 3.1 Start Render

**POST /api/render/start**

```typescript
// Request
{
  projectId: string
  quality: 'draft' | 'medium' | 'high' | 'production'
}

// Response
{
  render: {
    id: string
    status: 'PENDING'
    quality: string
    createdAt: string
  }
}
```

### 3.2 Get Render Status

**GET /api/render/[id]/status**

```typescript
// Response
{
  render: {
    id: string
    status: RenderStatus
    progress: number
    outputPath?: string
    error?: string
    startedAt?: string
    completedAt?: string
  }
}
```

### 3.3 Download Render

**GET /api/render/[id]/download**

Returns the video file as a download.

---

## 4. Render Service

### 4.1 Render Job Processor

```typescript
// lib/services/render/processor.ts

import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { emitToRender } from '@/lib/websocket'

const execAsync = promisify(exec)

interface QualityPreset {
  crf: number
  preset: string
  scale?: string
}

const qualityPresets: Record<string, QualityPreset> = {
  draft: { crf: 28, preset: 'ultrafast', scale: '1280:720' },
  medium: { crf: 23, preset: 'medium' },
  high: { crf: 18, preset: 'slow' },
  production: { crf: 15, preset: 'veryslow' }
}

export async function processRenderJob(renderId: string) {
  const render = await prisma.render.findUnique({
    where: { id: renderId },
    include: { project: true }
  })

  if (!render) {
    throw new Error('Render not found')
  }

  // Update status to processing
  await prisma.render.update({
    where: { id: renderId },
    data: {
      status: 'PROCESSING',
      startedAt: new Date()
    }
  })

  const preset = qualityPresets[render.quality]
  const outputPath = path.join(
    process.cwd(),
    'public',
    'projects',
    render.projectId,
    `output-${render.quality}-${Date.now()}.mp4`
  )

  try {
    await renderVideo(render.projectId, outputPath, preset, (progress) => {
      // Emit progress via WebSocket
      emitToRender(renderId, 'render:progress', {
        renderId,
        progress,
        eta: calculateEta(progress, render.startedAt)
      })

      // Update database periodically
      prisma.render.update({
        where: { id: renderId },
        data: { progress }
      })
    })

    // Success
    await prisma.render.update({
      where: { id: renderId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        outputPath: outputPath.replace(process.cwd() + '/public', ''),
        completedAt: new Date()
      }
    })

    emitToRender(renderId, 'render:complete', { renderId, outputPath })
  } catch (error) {
    // Failed
    await prisma.render.update({
      where: { id: renderId },
      data: {
        status: 'FAILED',
        error: error.message,
        completedAt: new Date()
      }
    })

    emitToRender(renderId, 'render:error', {
      renderId,
      error: error.message
    })
  }
}
```

### 4.2 Remotion Render Function

```typescript
// lib/services/render/remotion.ts

import { spawn } from 'child_process'
import path from 'path'

export async function renderVideo(
  projectId: string,
  outputPath: string,
  preset: QualityPreset,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      'render',
      'StoryFlowVideo',
      outputPath,
      '--props', JSON.stringify({ projectId }),
      '--codec', 'h264',
      '--crf', preset.crf.toString(),
      '--preset', preset.preset,
      '--concurrency', '4'
    ]

    if (preset.scale) {
      args.push('--scale', preset.scale)
    }

    const child = spawn('npx', ['remotion', ...args], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let lastProgress = 0

    child.stdout.on('data', (data) => {
      const output = data.toString()

      // Parse progress from Remotion output
      // Remotion outputs: "Rendered 150 out of 3000 frames (5%)"
      const match = output.match(/(\d+)%/)
      if (match) {
        const progress = parseInt(match[1])
        if (progress > lastProgress) {
          lastProgress = progress
          onProgress(progress)
        }
      }
    })

    child.stderr.on('data', (data) => {
      console.error('Render stderr:', data.toString())
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Render failed with code ${code}`))
      }
    })

    child.on('error', reject)
  })
}
```

---

## 5. WebSocket Events

### 5.1 Render Events

```typescript
// Server → Client
interface RenderEvents {
  'render:started': {
    renderId: string
  }

  'render:progress': {
    renderId: string
    progress: number
    frame?: number
    totalFrames?: number
    eta?: string
  }

  'render:complete': {
    renderId: string
    outputPath: string
  }

  'render:error': {
    renderId: string
    error: string
  }
}
```

### 5.2 WebSocket Hook

```typescript
// hooks/useRenderSocket.ts

export function useRenderSocket(
  renderId: string | undefined,
  handlers: {
    onProgress?: (data: RenderProgress) => void
    onComplete?: (data: RenderComplete) => void
    onError?: (data: RenderError) => void
  }
) {
  useEffect(() => {
    if (!renderId) return

    const socket = getSocket()

    socket.emit('subscribe:render', { renderId })

    socket.on('render:progress', handlers.onProgress)
    socket.on('render:complete', handlers.onComplete)
    socket.on('render:error', handlers.onError)

    return () => {
      socket.emit('unsubscribe', { channel: `render:${renderId}` })
      socket.off('render:progress')
      socket.off('render:complete')
      socket.off('render:error')
    }
  }, [renderId])
}
```

---

## 6. Previous Renders List

### 6.1 Component

```tsx
// components/render/previous-renders.tsx

export function PreviousRenders({
  renders,
  onDownload,
  onDelete
}: PreviousRendersProps) {
  if (renders.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Previous Renders</h3>

      <div className="space-y-2">
        {renders.map((render) => (
          <Card key={render.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                {render.status === 'COMPLETED' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {render.status === 'FAILED' && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}

                {/* Info */}
                <div>
                  <p className="font-medium">
                    {qualityLabels[render.quality]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(render.completedAt)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {render.status === 'COMPLETED' && render.outputPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(render)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(render.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

## 7. Database Schema

### 7.1 Render Table

```prisma
model Render {
  id          String       @id @default(cuid())
  projectId   String
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  quality     RenderQuality
  status      RenderStatus @default(PENDING)
  progress    Float        @default(0)
  outputPath  String?
  error       String?
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime     @default(now())
}

enum RenderQuality {
  DRAFT
  MEDIUM
  HIGH
  PRODUCTION
}

enum RenderStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## 8. Render Queue Management

### 8.1 Sequential Queue Implementation

Renders are processed one at a time to prevent resource exhaustion:

```typescript
// lib/services/render/queue.ts

interface QueuedRender {
  id: string
  projectId: string
  quality: RenderQuality
  addedAt: Date
}

class RenderQueue {
  private queue: QueuedRender[] = []
  private currentRender: QueuedRender | null = null
  private isProcessing: boolean = false

  /**
   * Add render to queue. Returns position in queue (0 = processing now)
   */
  async add(render: QueuedRender): Promise<number> {
    // Check if this project already has a render in queue
    const existingIndex = this.queue.findIndex(r => r.projectId === render.projectId)
    if (existingIndex !== -1) {
      throw new Error('Project already has a render in queue')
    }

    // Check if currently rendering this project
    if (this.currentRender?.projectId === render.projectId) {
      throw new Error('Project is currently being rendered')
    }

    this.queue.push(render)
    this.processNext()

    return this.getPosition(render.id)
  }

  /**
   * Cancel a queued render (cannot cancel in-progress render)
   */
  async cancel(renderId: string): Promise<boolean> {
    const index = this.queue.findIndex(r => r.id === renderId)
    if (index === -1) {
      return false // Not in queue (might be processing or complete)
    }

    this.queue.splice(index, 1)

    // Update database
    await prisma.render.update({
      where: { id: renderId },
      data: { status: 'FAILED', error: 'Cancelled by user' }
    })

    return true
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    this.currentRender = this.queue.shift()!

    try {
      await processRenderJob(this.currentRender.id)
    } catch (error) {
      console.error('Render job failed:', error)
    } finally {
      this.currentRender = null
      this.isProcessing = false
      this.processNext()
    }
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getPosition(renderId: string): number {
    if (this.currentRender?.id === renderId) {
      return 0 // Currently processing
    }
    const index = this.queue.findIndex(r => r.id === renderId)
    return index === -1 ? -1 : index + 1 // +1 because 0 is "processing"
  }

  getCurrentRender(): QueuedRender | null {
    return this.currentRender
  }

  getQueueStatus(): { processing: boolean; queueLength: number; current: QueuedRender | null } {
    return {
      processing: this.isProcessing,
      queueLength: this.queue.length,
      current: this.currentRender
    }
  }
}

// Singleton instance
export const renderQueue = new RenderQueue()
```

### 8.2 Queue Position UI

```tsx
// Show queue position when render is queued
{render.status === 'PENDING' && queuePosition > 0 && (
  <Alert>
    <Clock className="h-4 w-4" />
    <AlertDescription>
      Your render is #{queuePosition} in queue.
      Estimated wait: ~{queuePosition * 5} minutes
    </AlertDescription>
  </Alert>
)}
```

### 8.2 API Integration

```typescript
// app/api/render/start/route.ts

export async function POST(request: Request) {
  const { projectId, quality } = await request.json()

  // Validate project exists and is ready
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  // Create render record
  const render = await prisma.render.create({
    data: {
      projectId,
      quality,
      status: 'PENDING'
    }
  })

  // Add to queue
  renderQueue.add(render.id)

  return Response.json({
    render,
    queuePosition: renderQueue.getPosition(render.id)
  })
}
```

---

## 9. Cleanup & Storage Management

### 9.1 Cleanup Old Renders

```typescript
// lib/services/render/cleanup.ts

export async function cleanupOldRenders(
  projectId: string,
  keepCount: number = 3
) {
  const renders = await prisma.render.findMany({
    where: {
      projectId,
      status: 'COMPLETED'
    },
    orderBy: { completedAt: 'desc' }
  })

  // Keep only the most recent `keepCount` renders
  const toDelete = renders.slice(keepCount)

  for (const render of toDelete) {
    if (render.outputPath) {
      const fullPath = path.join(process.cwd(), 'public', render.outputPath)
      await fs.rm(fullPath, { force: true })
    }

    await prisma.render.delete({ where: { id: render.id } })
  }
}
```

### 9.2 Storage Usage API

**GET /api/projects/[id]/storage**

```typescript
// Response
{
  totalSize: number       // Bytes
  breakdown: {
    assets: number
    renders: number
    audio: number
  }
}
```

---

## 10. Acceptance Criteria

### Must Have
- [ ] Can select render quality
- [ ] Render starts and processes
- [ ] Progress updates in real-time
- [ ] Can download completed renders
- [ ] Error handling for failed renders
- [ ] Previous renders listed

### Should Have
- [ ] ETA calculation
- [ ] Queue position display
- [ ] Cancel render option
- [ ] Delete old renders

### Nice to Have
- [ ] Multiple concurrent renders (configurable)
- [ ] Email notification on completion
- [ ] Storage usage display
- [ ] Auto-cleanup old renders

---

## 11. Testing Checklist

1. **Render Start:**
   - Creates render record in database
   - Adds to queue correctly
   - Status updates to PROCESSING

2. **Progress Tracking:**
   - WebSocket updates received
   - Progress bar updates
   - ETA calculation works

3. **Completion:**
   - Output file created
   - Status updates to COMPLETED
   - Download works

4. **Error Handling:**
   - Failed renders show error
   - Status updates to FAILED
   - Can retry render

5. **Queue Management:**
   - Multiple renders queue correctly
   - Queue position displayed
   - Processes in order

---

## 12. Resource Limits & Configuration

### 12.1 Resource Limits

```typescript
// lib/services/render/limits.ts

export const RENDER_LIMITS = {
  // Memory
  maxMemoryMB: 4096,  // 4GB per render process

  // Time
  timeoutMinutes: 60,  // Maximum render duration

  // Storage
  maxRendersPerProject: 3,  // Auto-cleanup older renders
  maxOutputSizeMB: 2048,    // 2GB maximum output file

  // Content
  maxDurationSeconds: 600,  // 10 minutes
  maxFrames: 18000,         // 10 minutes @ 30fps

  // Queue
  maxQueueLength: 10,       // Maximum pending renders
}

// Enforce limits before starting render
export async function validateRenderLimits(projectId: string): Promise<{
  valid: boolean
  error?: string
}> {
  const timeline = await buildTimeline(projectId)

  if (timeline.durationSeconds > RENDER_LIMITS.maxDurationSeconds) {
    return {
      valid: false,
      error: `Video duration (${timeline.durationSeconds}s) exceeds maximum (${RENDER_LIMITS.maxDurationSeconds}s)`
    }
  }

  const totalFrames = Math.ceil(timeline.durationSeconds * 30)
  if (totalFrames > RENDER_LIMITS.maxFrames) {
    return {
      valid: false,
      error: `Frame count (${totalFrames}) exceeds maximum (${RENDER_LIMITS.maxFrames})`
    }
  }

  return { valid: true }
}
```

### 12.2 Auto-Cleanup Policy

```typescript
// lib/services/render/cleanup.ts

/**
 * Automatically clean up old renders when limit is reached
 * Keeps the most recent `keepCount` renders
 */
export async function cleanupOldRenders(
  projectId: string,
  keepCount: number = RENDER_LIMITS.maxRendersPerProject
): Promise<number> {
  const renders = await prisma.render.findMany({
    where: { projectId, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' }
  })

  if (renders.length <= keepCount) {
    return 0
  }

  const toDelete = renders.slice(keepCount)
  let deletedCount = 0

  for (const render of toDelete) {
    try {
      // Delete file
      if (render.outputPath) {
        const fullPath = path.join(process.cwd(), 'public', render.outputPath)
        await fs.rm(fullPath, { force: true })
      }

      // Delete database record
      await prisma.render.delete({ where: { id: render.id } })
      deletedCount++
    } catch (error) {
      console.warn(`Failed to delete render ${render.id}:`, error)
    }
  }

  return deletedCount
}

// Run cleanup before starting new render
// In processRenderJob:
await cleanupOldRenders(projectId)
```

### 12.3 Environment Variables

```bash
# Render settings
RENDER_CONCURRENCY=4           # Remotion concurrency (CPU cores to use)
RENDER_TIMEOUT_MINUTES=60      # Maximum render time
MAX_RENDERS_PER_PROJECT=3      # Auto-cleanup threshold

# Memory limits (for Node.js process)
NODE_OPTIONS="--max-old-space-size=4096"

# FFmpeg settings (optional)
FFMPEG_PATH=/usr/bin/ffmpeg
```

### 12.2 Video Config

```json
// config/video.config.json (extend existing)
{
  "rendering": {
    "qualities": {
      "draft": {
        "codec": "h264",
        "crf": 28,
        "preset": "ultrafast",
        "scale": "1280:720"
      },
      "medium": {
        "codec": "h264",
        "crf": 23,
        "preset": "medium"
      },
      "high": {
        "codec": "h264",
        "crf": 18,
        "preset": "slow"
      },
      "production": {
        "codec": "h264",
        "crf": 15,
        "preset": "veryslow"
      }
    },
    "concurrency": 4,
    "timeoutMinutes": 60
  }
}
```

---

*Wave 6 Complete → StoryFlow MVP Ready!*

---

## Summary

With all 6 waves complete, StoryFlow provides:

1. **Project Management** - Create, manage, delete video projects
2. **Content Discovery** - Google Trends integration with topic selection
3. **AI Script Generation** - Gemini-powered script creation with TTS
4. **Asset Management** - Upload images/videos with optional upscaling
5. **Visual Editors** - Viewport and boards editing with AI assistance
6. **Real-time Preview** - Remotion Player for instant feedback
7. **Video Rendering** - Server-side rendering with progress tracking

The application is designed for local deployment, with a modern Next.js stack, real-time WebSocket updates, and a clean wizard-based workflow.
