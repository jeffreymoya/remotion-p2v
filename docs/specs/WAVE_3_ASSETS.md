> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Wave 3: Asset Management & Upload

> Detailed specification for asset upload, storage, optional upscaling, and music library.

## Overview

**Goal:** Implement asset management including image/video upload, optional Real-ESRGAN upscaling, and music upload/library functionality.

**Prerequisites:** Wave 1 (Foundation), Wave 2 (Script)

**Outcome:** Users can upload background images/videos, optionally upscale images, and select/upload background music.

---

## 1. Asset Upload

### 1.1 Asset Page UI

**Features:**
- Drag-and-drop upload zone
- Asset gallery (grid view)
- Asset type tabs (Images, Videos, Music)
- Upload progress indicator
- Delete asset button
- Upscale button (for images)

```tsx
// app/(dashboard)/projects/[id]/assets/page.tsx

export default async function AssetsPage({
  params
}: {
  params: { id: string }
}) {
  const project = await getProject(params.id)
  const assets = await getAssets(params.id)

  return (
    <WizardLayout project={project} currentStep="assets">
      <AssetManager
        projectId={params.id}
        assets={assets}
      />
    </WizardLayout>
  )
}
```

### 1.2 Upload Zone Component

```tsx
// components/assets/upload-zone.tsx

export function UploadZone({
  projectId,
  assetType,
  onUpload
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const handleDrop = async (files: FileList) => {
    for (const file of files) {
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)
      formData.append('type', assetType)

      await uploadAsset(formData, {
        onProgress: setUploadProgress
      })

      onUpload()
    }

    setUploadProgress(null)
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center',
        isDragging && 'border-primary bg-primary/5'
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        handleDrop(e.dataTransfer.files)
      }}
    >
      {uploadProgress !== null ? (
        <Progress value={uploadProgress} />
      ) : (
        <>
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2">Drag and drop files here</p>
          <p className="text-sm text-muted-foreground">
            or click to browse
          </p>
        </>
      )}
    </div>
  )
}
```

### 1.3 Asset Gallery Component

```tsx
// components/assets/asset-gallery.tsx

export function AssetGallery({
  assets,
  onDelete,
  onUpscale
}: AssetGalleryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onDelete={() => onDelete(asset.id)}
          onUpscale={
            asset.type === 'IMAGE' && !asset.upscaled
              ? () => onUpscale(asset.id)
              : undefined
          }
        />
      ))}
    </div>
  )
}
```

### 1.4 Asset Card Component

**For Images:**
- Thumbnail preview
- Dimensions badge
- "Upscale" button (if not upscaled)
- "Upscaled" badge (if upscaled)
- Delete button

**For Videos:**
- Video thumbnail (first frame)
- Duration badge
- Delete button

**For Music:**
- Waveform visualization (optional)
- Duration
- Play/pause button
- Delete button

---

## 2. Upload API

### 2.1 Upload Endpoint

**POST /api/assets/upload**

```typescript
// Request: multipart/form-data
// - file: File
// - projectId: string
// - type: 'IMAGE' | 'VIDEO' | 'MUSIC'

// Response
{
  asset: {
    id: string
    type: string
    filename: string
    path: string
    metadata: {
      width?: number
      height?: number
      duration?: number
      size: number
    }
  }
}
```

### 2.2 Upload Handler

```typescript
// app/api/assets/upload/route.ts

import { writeFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { getVideoDuration } from '@/lib/utils/video'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const projectId = formData.get('projectId') as string
  const type = formData.get('type') as AssetType

  // Validate file type
  validateFileType(file, type)

  // Generate unique filename
  const filename = generateFilename(file.name)

  // Determine storage path
  const subdir = type === 'IMAGE' ? 'images' :
                 type === 'VIDEO' ? 'videos' : 'music'
  const storagePath = path.join(
    process.cwd(),
    'public',
    'projects',
    projectId,
    'assets',
    subdir,
    filename
  )

  // Save file
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(storagePath, buffer)

  // Extract metadata
  const metadata = await extractMetadata(storagePath, type)

  // Save to database
  const asset = await prisma.asset.create({
    data: {
      projectId,
      type,
      filename,
      path: `/projects/${projectId}/assets/${subdir}/${filename}`,
      metadata
    }
  })

  return Response.json({ asset })
}
```

### 2.3 File Validation

```typescript
// lib/utils/file-validation.ts

const ALLOWED_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
  MUSIC: ['audio/mpeg', 'audio/wav', 'audio/ogg']
}

const MAX_SIZES = {
  IMAGE: 50 * 1024 * 1024,  // 50MB
  VIDEO: 500 * 1024 * 1024, // 500MB
  MUSIC: 50 * 1024 * 1024   // 50MB
}

export function validateFileType(file: File, type: AssetType) {
  if (!ALLOWED_TYPES[type].includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`)
  }

  if (file.size > MAX_SIZES[type]) {
    throw new Error(`File too large: ${file.size} bytes`)
  }
}
```

### 2.4 Metadata Extraction

```typescript
// lib/utils/metadata.ts

import sharp from 'sharp'
import ffprobe from 'ffprobe'

export async function extractMetadata(
  filePath: string,
  type: AssetType
): Promise<AssetMetadata> {
  if (type === 'IMAGE') {
    const metadata = await sharp(filePath).metadata()
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size
    }
  }

  if (type === 'VIDEO' || type === 'MUSIC') {
    const probe = await ffprobe(filePath)
    const stream = probe.streams[0]
    return {
      width: stream.width,
      height: stream.height,
      duration: parseFloat(stream.duration),
      codec: stream.codec_name,
      size: probe.format.size
    }
  }

  throw new Error(`Unknown asset type: ${type}`)
}
```

---

## 3. Image Upscaling

### 3.1 Upscale API

**POST /api/assets/upscale**

```typescript
// Request
{
  assetId: string
}

// Response (async - use WebSocket for progress)
{
  jobId: string
}
```

### 3.2 Real-ESRGAN Integration

**Migrate from:** `cli/commands/upscale.ts`

```typescript
// lib/services/upscale/realesrgan.ts

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export class RealESRGANService {
  private binaryPath: string | null
  private isAvailable: boolean = false

  constructor() {
    this.binaryPath = this.detectBinary()
  }

  /**
   * Detect Real-ESRGAN binary location
   * Checks common installation paths and environment variable
   */
  private detectBinary(): string | null {
    const possiblePaths = [
      process.env.REALESRGAN_PATH,
      '/usr/local/bin/realesrgan-ncnn-vulkan',
      '/opt/homebrew/bin/realesrgan-ncnn-vulkan',
      '/usr/bin/realesrgan-ncnn-vulkan',
      path.join(process.cwd(), 'bin', 'realesrgan-ncnn-vulkan'),
    ].filter(Boolean) as string[]

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.isAvailable = true
        return p
      }
    }

    console.warn('Real-ESRGAN binary not found. Upscaling will be disabled.')
    return null
  }

  /**
   * Check if upscaling is available on this system
   */
  static async isUpscalingAvailable(): Promise<boolean> {
    const service = new RealESRGANService()
    return service.isAvailable
  }

  async upscale(
    inputPath: string,
    outputPath: string,
    options: UpscaleOptions = {}
  ): Promise<void> {
    const {
      scale = 4,
      model = 'realesrgan-x4plus',
      tileSize = 256,
      gpuId = 0
    } = options

    const command = [
      this.binaryPath,
      '-i', inputPath,
      '-o', outputPath,
      '-s', scale.toString(),
      '-n', model,
      '-t', tileSize.toString(),
      '-g', gpuId.toString()
    ].join(' ')

    await execAsync(command, {
      timeout: 600000  // 10 minute timeout
    })
  }
}
```

### 3.3 Upscale Job Handler

```typescript
// lib/services/upscale/job.ts

export async function processUpscaleJob(assetId: string) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId }
  })

  if (!asset || asset.type !== 'IMAGE') {
    throw new Error('Invalid asset for upscaling')
  }

  const inputPath = path.join(process.cwd(), 'public', asset.path)
  const outputFilename = asset.filename.replace(/\.(\w+)$/, '_8k.$1')
  const outputPath = inputPath.replace(asset.filename, outputFilename)

  // Emit start event
  emitToProject(asset.projectId, 'upscale:started', { assetId })

  try {
    const upscaler = new RealESRGANService()
    await upscaler.upscale(inputPath, outputPath)

    // Update database
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        upscaled: true,
        upscaledPath: outputPath.replace(process.cwd() + '/public', '')
      }
    })

    // Emit completion
    emitToProject(asset.projectId, 'upscale:complete', {
      assetId,
      upscaledPath: outputPath
    })
  } catch (error) {
    emitToProject(asset.projectId, 'upscale:error', {
      assetId,
      error: error.message
    })
    throw error
  }
}
```

---

## 4. Music Library

### 4.1 External Music Library Integration (Pixabay)

Instead of bundling music files, StoryFlow integrates with the Pixabay Music API for royalty-free tracks.

**Why Pixabay:**
- Free tier available (with attribution)
- Large library of royalty-free music
- API provides search, preview, and download
- No licensing concerns for bundled files

### 4.2 Music API Integration

```typescript
// lib/services/music/pixabay.ts

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY

interface PixabayTrack {
  id: number
  title: string
  duration: number
  audio_url: string  // Preview URL
  download_url: string  // Full download (with API key)
  user: string
  tags: string
}

export async function searchMusic(query: string, mood?: string): Promise<PixabayTrack[]> {
  const params = new URLSearchParams({
    key: PIXABAY_API_KEY,
    q: query || mood || 'background',
    category: 'music',
    per_page: '20'
  })

  const response = await fetch(`https://pixabay.com/api/videos/?${params}`)
  // Note: Pixabay uses videos API for music with audio type
  const data = await response.json()

  return data.hits.map(hit => ({
    id: hit.id,
    title: hit.tags.split(',')[0],
    duration: hit.duration,
    audio_url: hit.videos?.tiny?.url || hit.userImageURL,
    download_url: `https://pixabay.com/music/download/${hit.id}`,
    user: hit.user,
    tags: hit.tags
  }))
}

export async function downloadTrack(trackId: number, projectId: string): Promise<string> {
  // Download track to project's music folder
  const outputPath = path.join(
    process.cwd(), 'public', 'projects', projectId, 'assets', 'music', `pixabay-${trackId}.mp3`
  )

  // Download and save...
  return `/projects/${projectId}/assets/music/pixabay-${trackId}.mp3`
}
```

### 4.3 Music Metadata Cache

```typescript
// Cache downloaded track metadata locally
interface CachedTrack {
  id: string
  source: 'pixabay' | 'upload'
  name: string
  mood?: string
  duration: number
  localPath: string
  attribution?: string  // Required for Pixabay free tier
}
```

### 4.4 Fallback: User Upload Only

If Pixabay API is unavailable or user prefers their own music:

```typescript
// UI shows upload option when:
// 1. API key not configured
// 2. API returns error
// 3. User clicks "Upload your own"

const hasMusicApiAccess = !!process.env.PIXABAY_API_KEY
```

### 4.3 Music Browser Component

```tsx
// components/assets/music-browser.tsx

export function MusicBrowser({
  onSelect,
  selectedTrack
}: MusicBrowserProps) {
  const [filter, setFilter] = useState<MusicMood | 'all'>('all')
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)

  const { data: tracks } = useQuery({
    queryKey: ['music-library', filter],
    queryFn: () => fetchMusicLibrary(filter)
  })

  return (
    <div className="space-y-4">
      {/* Mood Filter */}
      <div className="flex gap-2">
        {moods.map((mood) => (
          <Button
            key={mood}
            variant={filter === mood ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(mood)}
          >
            {mood}
          </Button>
        ))}
      </div>

      {/* Track List */}
      <div className="space-y-2">
        {tracks?.map((track) => (
          <MusicTrackCard
            key={track.id}
            track={track}
            isSelected={selectedTrack === track.id}
            isPlaying={playingTrack === track.id}
            onSelect={() => onSelect(track)}
            onPlay={() => setPlayingTrack(track.id)}
            onPause={() => setPlayingTrack(null)}
          />
        ))}
      </div>
    </div>
  )
}
```

### 4.4 Music Track Card

```tsx
// components/assets/music-track-card.tsx

export function MusicTrackCard({
  track,
  isSelected,
  isPlaying,
  onSelect,
  onPlay,
  onPause
}: MusicTrackCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play()
    } else {
      audioRef.current?.pause()
    }
  }, [isPlaying])

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg border',
        isSelected && 'border-primary bg-primary/5'
      )}
    >
      <audio ref={audioRef} src={track.path} />

      <Button
        variant="ghost"
        size="icon"
        onClick={isPlaying ? onPause : onPlay}
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>

      <div className="flex-1">
        <p className="font-medium">{track.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatDuration(track.duration)} • {track.mood}
        </p>
      </div>

      <Button
        variant={isSelected ? 'default' : 'outline'}
        onClick={onSelect}
      >
        {isSelected ? 'Selected' : 'Select'}
      </Button>
    </div>
  )
}
```

---

## 5. Music API

### 5.1 Library Endpoint

**GET /api/music/library**

```typescript
// Query params
{
  mood?: MusicMood
}

// Response
{
  tracks: MusicTrack[]
}
```

### 5.2 Select Music Endpoint

**POST /api/projects/[id]/music**

```typescript
// Request
{
  trackId?: string      // From library
  uploadedAssetId?: string  // User upload
  volume?: number       // 0-1, default 0.3
}

// Response
{
  success: boolean
}
```

---

## 6. Database Updates

### 6.1 Asset Table (already in Wave 1)

```prisma
model Asset {
  id           String    @id @default(cuid())
  projectId    String
  project      Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  type         AssetType
  filename     String
  path         String
  metadata     Json?
  upscaled     Boolean   @default(false)
  upscaledPath String?
  createdAt    DateTime  @default(now())
}

enum AssetType {
  IMAGE
  VIDEO
  AUDIO
  MUSIC
}
```

### 6.2 Project Settings Update

```prisma
model ProjectSettings {
  id          String   @id @default(cuid())
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  voice       String   @default("en-US-Chirp3-HD-Algieba")
  speakingRate Float   @default(1.0)
  musicTrackId String? // Library track ID or asset ID
  musicVolume  Float   @default(0.3)
}
```

---

## 7. File Upload Security

### 7.1 Security Requirements

```typescript
// lib/utils/file-security.ts

import sharp from 'sharp'

/**
 * Validate and sanitize uploaded files
 */
export async function validateUpload(
  file: File,
  type: AssetType
): Promise<{ valid: boolean; error?: string }> {
  // 1. Check file size
  if (file.size > MAX_SIZES[type]) {
    return { valid: false, error: `File exceeds maximum size of ${MAX_SIZES[type] / 1024 / 1024}MB` }
  }

  // 2. Validate MIME type (don't trust client-provided type)
  const buffer = Buffer.from(await file.slice(0, 8).arrayBuffer())
  const detectedType = detectMimeType(buffer)
  if (!ALLOWED_TYPES[type].includes(detectedType)) {
    return { valid: false, error: `Invalid file type: ${detectedType}` }
  }

  // 3. Sanitize filename (prevent path traversal)
  const sanitizedName = sanitizeFilename(file.name)
  if (sanitizedName !== file.name) {
    console.warn(`Filename sanitized: ${file.name} -> ${sanitizedName}`)
  }

  return { valid: true }
}

/**
 * Strip EXIF metadata from images for privacy
 */
export async function stripImageMetadata(inputPath: string): Promise<void> {
  const buffer = await sharp(inputPath)
    .rotate() // Auto-rotate based on EXIF, then strip
    .toBuffer()

  await sharp(buffer)
    .withMetadata({ exif: {} }) // Remove EXIF
    .toFile(inputPath)
}

/**
 * Generate random filename for storage
 */
export function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase()
  const randomId = crypto.randomBytes(16).toString('hex')
  return `${randomId}${ext}`
}

/**
 * Prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/[<>:"|?*]/g, '')
    .slice(0, 255) // Max filename length
}
```

### 7.2 Validation Rules Table

| Field | Type | Min | Max | Pattern |
|-------|------|-----|-----|---------|
| Image MIME | enum | - | - | image/jpeg, image/png, image/webp |
| Video MIME | enum | - | - | video/mp4, video/webm, video/quicktime |
| Audio MIME | enum | - | - | audio/mpeg, audio/wav, audio/ogg |
| Image size | bytes | 1 | 50MB | - |
| Video size | bytes | 1 | 500MB | - |
| Audio size | bytes | 1 | 50MB | - |
| Filename | string | 1 | 255 | No path separators, no special chars |

---

## 8. Dependencies

```json
{
  "dependencies": {
    "sharp": "^0.33.0",      // Image processing + EXIF stripping
    "ffprobe": "^1.1.0",     // Media metadata
    "formidable": "^3.5.0"   // File upload parsing
  }
}
```

---

## 8. WebSocket Events

```typescript
// Upscale events
interface UpscaleEvents {
  'upscale:started': { assetId: string }
  'upscale:progress': { assetId: string; percent: number }
  'upscale:complete': { assetId: string; upscaledPath: string }
  'upscale:error': { assetId: string; error: string }
}

// Upload events
interface UploadEvents {
  'upload:started': { filename: string }
  'upload:progress': { filename: string; percent: number }
  'upload:complete': { asset: Asset }
  'upload:error': { filename: string; error: string }
}
```

---

## 9. Acceptance Criteria

### Must Have
- [ ] Can upload images via drag-drop
- [ ] Can upload videos via drag-drop
- [ ] Upload progress shown
- [ ] Asset gallery displays all assets
- [ ] Can delete assets
- [ ] Image upscaling works (optional feature)
- [ ] Music library browser
- [ ] Can upload custom music
- [ ] Can select music for project

### Should Have
- [ ] Image preview with dimensions
- [ ] Video preview with duration
- [ ] Audio waveform visualization
- [ ] Upscale progress indicator
- [ ] File type validation with clear errors

### Nice to Have
- [ ] Batch upload support
- [ ] Asset reordering
- [ ] Image crop/edit
- [ ] Music fade in/out settings

---

## 10. Testing Checklist

1. **Image Upload:**
   - Upload JPG, PNG, WebP → success
   - Upload invalid type → clear error
   - Upload over size limit → clear error
   - Metadata extracted correctly

2. **Video Upload:**
   - Upload MP4 → success
   - Duration extracted correctly

3. **Upscaling:**
   - Upscale image → 4x resolution
   - Progress updates shown
   - Error handling works

4. **Music:**
   - Library loads correctly
   - Can preview tracks
   - Can select track
   - Can upload custom music

---

*Wave 3 Complete → Proceed to Wave 4: Viewport & Boards Editors*
