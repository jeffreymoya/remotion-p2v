> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Wave 2: Script Generation Pipeline

> Detailed specification for topic discovery, AI-powered script generation, and TTS audio synthesis.

## Overview

**Goal:** Implement the content creation pipeline including Google Trends discovery, AI script generation, and TTS audio generation with word-level timestamps.

**Prerequisites:** Wave 1 (Foundation)

**Outcome:** Users can discover trending topics, select one to create a project, and generate AI scripts with TTS audio.

**Key Decisions:**
- **Script is read-only:** Users cannot edit script text directly. Any changes require full AI regeneration.
- **Regenerate entire script:** No per-segment regeneration in MVP. Full script regeneration maintains narrative coherence.
- **Google Trends via RSS:** Uses unofficial RSS feed with fallback to manual topic entry if unavailable.

---

## 1. Topic Discovery

### 1.1 Discovery Page UI

**Features:**
- Fetch trending topics from Google Trends
- Display topics in card grid
- Click topic to create project from it
- Refresh button to fetch new trends
- Loading state during fetch

```tsx
// app/(dashboard)/discover/page.tsx

export default function DiscoverPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Discover Topics"
        description="Find trending topics to create videos about"
        action={<RefreshButton />}
      />
      <TopicsGrid />
    </PageContainer>
  )
}
```

### 1.2 Topic Card

**Display:**
- Topic/query text
- Traffic indicator (if available)
- "Create Project" button
- Explore link (Google Trends)

### 1.3 Discovery API

**POST /api/discover**
```typescript
// Request (optional filters)
{
  geo?: string        // Country code (default: 'US')
  category?: number   // Google Trends category ID
}

// Response
{
  topics: {
    query: string
    traffic: string | null
    exploreUrl: string | null
  }[]
}
```

**Implementation:**
- Migrate `GoogleTrendsService` from CLI
- Use RSS feed parsing from `https://trends.google.com/trending/rss`
- Cache results for 15 minutes
- **Fallback handling:** If RSS is unavailable (rate-limited, down), show "Enter topic manually" UI
- **Error states:** Display friendly message, not technical error

```typescript
// lib/services/discovery/google-trends.ts
export async function fetchTrendingTopics(): Promise<Topic[]> {
  try {
    const rssUrl = 'https://trends.google.com/trending/rss?geo=US'
    const response = await fetch(rssUrl, { next: { revalidate: 900 } }) // 15min cache

    if (!response.ok) {
      throw new Error('RSS unavailable')
    }

    const xml = await response.text()
    return parseRssTopics(xml)
  } catch (error) {
    // Return empty array - UI will show manual entry option
    console.warn('Google Trends RSS unavailable:', error)
    return []
  }
}
```

---

## 2. Script Generation

### 2.1 Script Generation Flow

```
1. User creates project from topic (or enters topic manually)
2. Click "Generate Script" button
3. Show loading state with progress
4. AI generates script segments
5. Display script preview
6. User can "Regenerate" if not satisfied
7. Proceed to next step when ready
```

### 2.2 Script Page UI

**Components:**
- Topic display (editable before generation)
- "Generate Script" button
- Progress indicator during generation
- Script preview (read-only)
- "Regenerate" button
- "Continue" button (to next wizard step)

```tsx
// app/(dashboard)/projects/[id]/script/page.tsx

export default async function ScriptPage({
  params
}: {
  params: { id: string }
}) {
  const project = await getProject(params.id)
  const script = await getScript(params.id)

  return (
    <WizardLayout project={project} currentStep="script">
      <ScriptGenerator
        projectId={params.id}
        topic={project.topic}
        script={script}
      />
    </WizardLayout>
  )
}
```

### 2.3 Script Display

**Segment Card:**
- Segment number
- Segment text
- Word count
- Estimated duration

**Script Stats:**
- Total segments
- Total word count
- Estimated duration

### 2.4 Script API

**POST /api/ai/script**
```typescript
// Request
{
  projectId: string
  topic: string
}

// Response
{
  script: {
    id: string
    title: string
    segments: {
      index: number
      text: string
      wordCount: number
      estimatedDuration: number
    }[]
  }
}
```

**Implementation:**
- Migrate AI provider from CLI (`GeminiCLIProvider`)
- Use existing prompt template (`generateScriptPrompt`)
- Zod validation for response
- Store in database (Script table)

### 2.5 Script Schema (Zod)

```typescript
const scriptSegmentSchema = z.object({
  index: z.number(),
  text: z.string(),
  wordCount: z.number().optional(),
  estimatedDuration: z.number().optional()
})

const scriptSchema = z.object({
  title: z.string(),
  segments: z.array(scriptSegmentSchema)
})
```

---

## 3. TTS Generation

### 3.1 TTS Generation Flow

```
1. Script is ready
2. Click "Generate Audio" or automatic after script
3. Process each segment sequentially
4. Show progress (segment N of M)
5. Store audio files in project directory
6. Extract word-level timestamps
7. Update script with timing data
```

### 3.2 TTS API

**POST /api/tts/generate**
```typescript
// Request
{
  projectId: string
  segmentIndex: number  // Generate one segment at a time
}

// Response
{
  audioUrl: string
  duration: number
  timestamps: {
    word: string
    startMs: number
    endMs: number
  }[]
}
```

**POST /api/tts/generate-all**
```typescript
// Request
{
  projectId: string
}

// Response (streamed via WebSocket)
// See WebSocket events below
```

### 3.3 TTS Service

**Migrate from CLI:**
- `cli/services/tts/google-tts.ts`
- Use Google Cloud TTS v1beta1 for SSML marks
- **Voice:** Chirp HD variants (configurable in settings)
- **Features:**
  - Word-level timestamps via SSML marks
  - Character-level timestamps (optional)
  - MP3 output format

```typescript
// lib/services/tts/google-tts.ts

export class GoogleTTSService {
  private client: TextToSpeechClient

  async generateAudio(
    text: string,
    options: TTSOptions
  ): Promise<TTSResult> {
    // Insert SSML marks for word timing
    const ssml = this.textToSSML(text)

    // Call Google TTS API
    const response = await this.client.synthesizeSpeech({
      input: { ssml },
      voice: {
        languageCode: 'en-US',
        name: options.voice || 'en-US-Chirp3-HD-Algieba'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: options.speakingRate || 1.0,
        pitch: options.pitch || 0
      },
      enableTimePointing: ['SSML_MARK']
    })

    // Parse timestamps from response
    const timestamps = this.parseTimestamps(response.timepoints)

    return {
      audioContent: response.audioContent,
      duration: this.calculateDuration(response),
      timestamps
    }
  }
}
```

### 3.4 Available Voices (Google Cloud TTS)

**Voice Naming Convention:**
Google Cloud TTS uses format: `{language}-{region}-{model}-{variant}`

```typescript
// Available high-quality voices for English
const googleTTSVoices = [
  // Neural2 voices (high quality, natural)
  { id: 'en-US-Neural2-A', name: 'Neural2 A', gender: 'Male' },
  { id: 'en-US-Neural2-C', name: 'Neural2 C', gender: 'Female' },
  { id: 'en-US-Neural2-D', name: 'Neural2 D', gender: 'Male' },
  { id: 'en-US-Neural2-E', name: 'Neural2 E', gender: 'Female' },
  { id: 'en-US-Neural2-F', name: 'Neural2 F', gender: 'Female' },
  { id: 'en-US-Neural2-G', name: 'Neural2 G', gender: 'Female' },
  { id: 'en-US-Neural2-H', name: 'Neural2 H', gender: 'Female' },
  { id: 'en-US-Neural2-I', name: 'Neural2 I', gender: 'Male' },
  { id: 'en-US-Neural2-J', name: 'Neural2 J', gender: 'Male' },

  // Studio voices (highest quality, limited availability)
  { id: 'en-US-Studio-M', name: 'Studio M', gender: 'Male' },
  { id: 'en-US-Studio-O', name: 'Studio O', gender: 'Female' },

  // Journey voices (conversational)
  { id: 'en-US-Journey-D', name: 'Journey D', gender: 'Male' },
  { id: 'en-US-Journey-F', name: 'Journey F', gender: 'Female' },
]

// Default voice for new projects
const DEFAULT_VOICE = 'en-US-Neural2-D'
```

**Note:** Voice availability depends on Google Cloud TTS API tier. Check current pricing and availability at cloud.google.com/text-to-speech/docs/voices.

### 3.5 Audio Storage

```
public/projects/{projectId}/assets/audio/
├── segment-1.mp3
├── segment-2.mp3
├── segment-3.mp3
└── ...
```

---

## 4. WebSocket Integration

### 4.1 Real-time Progress

**Events for script generation:**
```typescript
// Server → Client
{
  type: 'script:generating',
  projectId: string,
  message: 'Generating script...'
}

{
  type: 'script:complete',
  projectId: string,
  script: Script
}

{
  type: 'script:error',
  projectId: string,
  error: string
}
```

**Events for TTS generation:**
```typescript
// Server → Client
{
  type: 'tts:started',
  projectId: string,
  totalSegments: number
}

{
  type: 'tts:segment-complete',
  projectId: string,
  segmentIndex: number,
  audioUrl: string
}

{
  type: 'tts:complete',
  projectId: string
}

{
  type: 'tts:error',
  projectId: string,
  segmentIndex: number,
  error: string
}
```

### 4.2 WebSocket Setup

```typescript
// app/api/ws/route.ts

import { Server } from 'socket.io'

const io = new Server()

io.on('connection', (socket) => {
  socket.on('subscribe:project', ({ projectId }) => {
    socket.join(`project:${projectId}`)
  })

  socket.on('unsubscribe', ({ channel }) => {
    socket.leave(channel)
  })
})

export function emitToProject(projectId: string, event: string, data: any) {
  io.to(`project:${projectId}`).emit(event, data)
}
```

---

## 5. Database Updates

### 5.1 Script Table

```prisma
model Script {
  id          String   @id @default(cuid())
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title       String
  segments    Json     // ScriptSegment[]
  timestamps  Json?    // Word timestamps after TTS
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 5.2 Script Segment Type

```typescript
interface ScriptSegment {
  index: number
  text: string
  wordCount: number
  estimatedDuration: number
  audioUrl?: string        // After TTS
  actualDuration?: number  // After TTS
  timestamps?: WordTimestamp[]  // After TTS
}

interface WordTimestamp {
  word: string
  startMs: number
  endMs: number
}
```

---

## 6. UI Components

### 6.1 Script Generator Component

```tsx
// components/script/script-generator.tsx

interface ScriptGeneratorProps {
  projectId: string
  topic: string | null
  script: Script | null
}

export function ScriptGenerator({
  projectId,
  topic,
  script
}: ScriptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedScript, setGeneratedScript] = useState(script)

  // WebSocket subscription for real-time updates
  useProjectSocket(projectId, {
    onScriptComplete: setGeneratedScript,
    onError: handleError
  })

  return (
    <div className="space-y-6">
      {/* Topic Input */}
      <TopicInput
        topic={topic}
        disabled={!!generatedScript}
      />

      {/* Generate Button */}
      {!generatedScript && (
        <Button
          onClick={generateScript}
          disabled={!topic || isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Script'}
        </Button>
      )}

      {/* Script Preview */}
      {generatedScript && (
        <>
          <ScriptPreview script={generatedScript} />
          <div className="flex gap-4">
            <Button variant="outline" onClick={regenerate}>
              Regenerate
            </Button>
            <Button onClick={continueToAssets}>
              Continue
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
```

### 6.2 Script Preview Component

```tsx
// components/script/script-preview.tsx

export function ScriptPreview({ script }: { script: Script }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{script.title}</h3>
        <ScriptStats segments={script.segments} />
      </div>

      <div className="space-y-3">
        {script.segments.map((segment) => (
          <SegmentCard key={segment.index} segment={segment} />
        ))}
      </div>
    </div>
  )
}
```

### 6.3 TTS Progress Component

```tsx
// components/script/tts-progress.tsx

export function TTSProgress({
  projectId,
  totalSegments,
  onComplete
}: TTSProgressProps) {
  const [currentSegment, setCurrentSegment] = useState(0)
  const [completedSegments, setCompletedSegments] = useState<number[]>([])

  useProjectSocket(projectId, {
    onTTSSegmentComplete: (data) => {
      setCompletedSegments(prev => [...prev, data.segmentIndex])
      setCurrentSegment(data.segmentIndex + 1)
    },
    onTTSComplete: onComplete
  })

  const progress = (completedSegments.length / totalSegments) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Generating audio...</span>
        <span>{completedSegments.length} / {totalSegments}</span>
      </div>
      <Progress value={progress} />
    </div>
  )
}
```

---

## 7. AI Provider Service

### 7.1 Provider Interface

```typescript
// lib/services/ai/types.ts

export interface AIProvider {
  generateScript(topic: string): Promise<ScriptResponse>
  generateViewport?(imageData: string, script: Script): Promise<ViewportResponse>
}

export interface AIProviderConfig {
  provider: 'gemini-cli' | 'claude-code'
  model: string
  temperature: number
}
```

### 7.2 Gemini CLI Provider

```typescript
// lib/services/ai/gemini-cli.ts

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class GeminiCLIProvider implements AIProvider {
  async generateScript(topic: string): Promise<ScriptResponse> {
    const prompt = generateScriptPrompt({ topic })

    const { stdout } = await execAsync(
      `gemini --yolo --model ${this.model} --output-format json '${prompt}'`,
      { timeout: 300000 }  // 5 minute timeout
    )

    const result = JSON.parse(stdout)
    return scriptResponseSchema.parse(result)
  }
}
```

---

## 8. Prompt Templates

### 8.1 Script Generation Prompt

**Migrate from:** `config/prompts/script.prompt.ts`

```typescript
// config/prompts/script.prompt.ts

export function generateScriptPrompt(vars: ScriptPromptVars): string {
  return `
You are a professional video scriptwriter. Create an engaging script for a video about: ${vars.topic}

Requirements:
- 8-12 segments, each 30-60 seconds when spoken
- Conversational, engaging tone
- Clear narrative arc
- No stage directions or visual cues (just spoken text)

Return JSON in this exact format:
{
  "title": "Video title",
  "segments": [
    {
      "index": 1,
      "text": "Segment text here..."
    }
  ]
}
`
}
```

---

## 9. Error Handling

### 9.0 TTS Partial Generation Recovery

TTS generation processes segments sequentially. If it fails mid-way:

```typescript
// lib/services/tts/recovery.ts

interface TTSProgress {
  projectId: string
  completedSegments: number[]  // Indices of successfully generated segments
  lastError?: string
}

export async function resumeTTSGeneration(projectId: string): Promise<void> {
  const script = await getScript(projectId)
  const existingAudio = await getExistingAudioFiles(projectId)

  // Find segments that need generation
  const missingSegments = script.segments.filter((seg, index) =>
    !existingAudio.includes(`segment-${index + 1}.mp3`)
  )

  if (missingSegments.length === 0) {
    return // All segments already generated
  }

  // Resume from first missing segment
  for (const segment of missingSegments) {
    await generateSegmentAudio(projectId, segment.index)
    // WebSocket: emit progress after each segment
  }
}
```

**Recovery UI:**
- Show which segments are complete (checkmarks)
- Show which segment failed (error indicator)
- "Resume" button to continue from failure point
- "Regenerate All" button to start fresh

### 9.1 Retry Logic

```typescript
// lib/utils/retry.ts

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    onRetry
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxAttempts) break

      const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1)
      onRetry?.(attempt, delay, lastError)

      await sleep(delay)
    }
  }

  throw lastError!
}
```

### 9.2 Error Notifications

- Display toast on error
- Include "Retry" button
- Log errors for debugging

---

## 10. Acceptance Criteria

### Must Have
- [done] Discovery page shows Google Trends topics
- [done] Can create project from discovered topic
- [done] Can generate AI script from topic
- [done] Script displays with segment cards
- [done] Can regenerate script
- [done] TTS generates audio for all segments
- [done] Word-level timestamps extracted
- [done] Progress shown during generation
- [done] Errors displayed with retry option

### Should Have
- [ ] WebSocket real-time updates
- [done] Audio preview for segments
- [done] Script word count and duration stats
- [done] Voice selection in settings

### Nice to Have
- [ ] Script generation streaming
- [ ] Segment-level regeneration
- [ ] Copy script to clipboard

---

## 11. Testing Checklist

1. **Discovery:**
   - Trends fetch successfully
   - Can create project from topic
   - Handles API errors gracefully

2. **Script Generation:**
   - AI generates valid script
   - Zod validation catches malformed responses
   - Retry works on transient failures
   - Progress updates in real-time

3. **TTS:**
   - Audio files created for each segment
   - Timestamps extracted correctly
   - Audio plays in browser
   - Handles long segments

---

*Wave 2 Complete → Proceed to Wave 3: Asset Management*
