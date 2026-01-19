> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Wave 5: Video Preview & Remotion Integration

> Detailed specification for real-time video preview using Remotion Player and new component library.

## Overview

**Goal:** Implement real-time video preview with Remotion Player, including a new component library optimized for web integration.

**Prerequisites:** Wave 1-4 (Foundation, Script, Assets, Editors)

**Outcome:** Users can preview their video in real-time with scrubbing, using the Remotion Player component.

---

## 1. Remotion Setup

### 1.1 Dependencies

```json
{
  "dependencies": {
    "@remotion/player": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "remotion": "^4.0.0"
  }
}
```

### 1.2 Directory Structure

```
remotion/
├── Root.tsx                    # Remotion entry point
├── compositions/
│   └── StoryFlowVideo.tsx      # Main composition
├── components/
│   ├── Background.tsx          # Background image/video
│   ├── Subtitle.tsx            # Word-synced subtitles
│   ├── Word.tsx                # Individual word with animation
│   ├── ViewportContainer.tsx   # Viewport animation wrapper
│   └── MusicTrack.tsx          # Background music
├── hooks/
│   ├── useTimeline.ts          # Timeline state hook
│   ├── useViewport.ts          # Viewport calculation hook
│   └── useWordTiming.ts        # Word timing hook
├── lib/
│   ├── types.ts                # Remotion types
│   ├── utils.ts                # Utility functions
│   ├── easing.ts               # Easing functions
│   └── viewport-math.ts        # Viewport calculations
└── remotion.config.ts          # Remotion config
```

---

## 2. Main Composition

### 2.1 StoryFlowVideo Component

```tsx
// remotion/compositions/StoryFlowVideo.tsx

import { AbsoluteFill, Sequence, Audio, useVideoConfig } from 'remotion'
import { Background } from '../components/Background'
import { Subtitle } from '../components/Subtitle'
import { MusicTrack } from '../components/MusicTrack'
import type { Timeline } from '../lib/types'

interface StoryFlowVideoProps {
  timeline: Timeline
}

export const StoryFlowVideo: React.FC<StoryFlowVideoProps> = ({ timeline }) => {
  const { fps } = useVideoConfig()

  const introFrames = 30  // 1 second intro

  return (
    <AbsoluteFill className="bg-black">
      {/* Intro Sequence */}
      <Sequence from={0} durationInFrames={introFrames}>
        <IntroTitle title={timeline.title} />
      </Sequence>

      {/* Background Layer */}
      {timeline.backgrounds.map((bg, index) => (
        <Sequence
          key={`bg-${index}`}
          from={bg.startFrame + introFrames}
          durationInFrames={bg.endFrame - bg.startFrame}
        >
          <Background element={bg} />
        </Sequence>
      ))}

      {/* Subtitle Layer */}
      {timeline.text.map((text, index) => (
        <Sequence
          key={`text-${index}`}
          from={text.startFrame + introFrames}
          durationInFrames={text.endFrame - text.startFrame + (text.holdFrames || 0)}
        >
          <Subtitle element={text} />
        </Sequence>
      ))}

      {/* Audio Layer */}
      {timeline.audio.map((audio, index) => (
        <Sequence
          key={`audio-${index}`}
          from={audio.startFrame + introFrames}
        >
          <Audio src={audio.audioUrl} />
        </Sequence>
      ))}

      {/* Background Music */}
      {timeline.music && (
        <Sequence from={introFrames}>
          <MusicTrack
            src={timeline.music.url}
            volume={timeline.music.volume}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  )
}
```

### 2.2 Intro Title Component

```tsx
// remotion/components/IntroTitle.tsx

import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'

export const IntroTitle: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame()

  const opacity = interpolate(frame, [0, 10, 25, 30], [0, 1, 1, 0])
  const scale = interpolate(frame, [0, 15], [0.8, 1], {
    extrapolateRight: 'clamp'
  })

  return (
    <AbsoluteFill className="items-center justify-center bg-white">
      <div
        style={{
          opacity,
          transform: `scale(${scale})`
        }}
        className="bg-[#F2E205] px-8 py-4"
      >
        <h1 className="text-4xl font-bold text-black">{title}</h1>
      </div>
    </AbsoluteFill>
  )
}
```

---

## 3. Background Component

### 3.1 New Background Component

```tsx
// remotion/components/Background.tsx

import { AbsoluteFill, Img, Video, useCurrentFrame, useVideoConfig } from 'remotion'
import { useViewport } from '../hooks/useViewport'
import type { BackgroundElement } from '../lib/types'

interface BackgroundProps {
  element: BackgroundElement
}

export const Background: React.FC<BackgroundProps> = ({ element }) => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()

  // Calculate viewport transform if enabled
  const viewport = useViewport(
    frame,
    element.viewportAnimation,
    fps
  )

  // Calculate blur for transitions
  const blur = calculateBlur(frame, element, fps)

  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: element.mediaMetadata?.mode || 'cover',
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
    ...(viewport && {
      transform: `translate(${viewport.translateX}px, ${viewport.translateY}px) scale(${viewport.scale})`,
      transformOrigin: 'center center'
    })
  }

  return (
    <AbsoluteFill className="overflow-hidden">
      {element.imageUrl ? (
        <Img
          src={element.imageUrl}
          style={style}
        />
      ) : element.videoUrl ? (
        <Video
          src={element.videoUrl}
          style={style}
        />
      ) : null}
    </AbsoluteFill>
  )
}

function calculateBlur(
  frame: number,
  element: BackgroundElement,
  fps: number
): number {
  const fadeDuration = Math.floor(fps / 3)  // ~10 frames
  const maxBlur = 25

  // Entry blur (blur → clear)
  if (element.enterTransition === 'blur' && frame < fadeDuration) {
    return interpolate(frame, [0, fadeDuration], [maxBlur, 0])
  }

  // Exit blur (clear → blur)
  const duration = element.endFrame - element.startFrame
  if (element.exitTransition === 'blur' && frame > duration - fadeDuration) {
    return interpolate(
      frame,
      [duration - fadeDuration, duration],
      [0, maxBlur]
    )
  }

  return 0
}
```

---

## 4. Viewport Hook

### 4.1 useViewport Hook

```tsx
// remotion/hooks/useViewport.ts

import { useMemo } from 'react'
import { useVideoConfig } from 'remotion'
import { calculateViewportState, viewportToTransform } from '../lib/viewport-math'
import type { ViewportAnimation } from '../lib/types'

interface ViewportTransform {
  scale: number
  translateX: number
  translateY: number
}

export function useViewport(
  frame: number,
  animation: ViewportAnimation | undefined,
  fps: number
): ViewportTransform | null {
  const { width, height } = useVideoConfig()

  return useMemo(() => {
    if (!animation?.enabled || !animation.keyframes?.length) {
      return null
    }

    // Get current viewport state (centerX, centerY, zoom)
    const state = calculateViewportState(frame, animation.keyframes, fps)

    // Convert to CSS transform values
    const imageWidth = animation.imageWidth || width
    const imageHeight = animation.imageHeight || height

    return viewportToTransform(
      state,
      imageWidth,
      imageHeight,
      width,
      height
    )
  }, [frame, animation, fps, width, height])
}
```

### 4.2 Viewport Math

```typescript
// remotion/lib/viewport-math.ts

import { interpolate } from 'remotion'

interface ViewportState {
  centerX: number
  centerY: number
  zoom: number
}

export function calculateViewportState(
  frame: number,
  keyframes: ViewportKeyframe[],
  fps: number
): ViewportState {
  // Find active keyframe
  const activeIndex = keyframes.findIndex(
    (kf) => frame >= kf.frameStart && frame <= kf.frameEnd
  )

  if (activeIndex === -1) {
    // Before first or after last - use nearest
    if (frame < keyframes[0].frameStart) {
      return keyframes[0].viewport
    }
    return keyframes[keyframes.length - 1].viewport
  }

  const current = keyframes[activeIndex]
  const previous = keyframes[activeIndex - 1]

  // If no previous or at start of keyframe, return current
  if (!previous || frame <= current.frameStart) {
    return current.viewport
  }

  // Interpolate transition
  const transitionFrames = Math.floor(
    (current.transitionDurationMs / 1000) * fps
  )
  const transitionProgress = Math.min(
    1,
    (frame - current.frameStart) / transitionFrames
  )

  // Apply easing
  const easedProgress = applyEasing(transitionProgress, current.easing)

  return {
    centerX: interpolate(easedProgress, [0, 1], [previous.viewport.centerX, current.viewport.centerX]),
    centerY: interpolate(easedProgress, [0, 1], [previous.viewport.centerY, current.viewport.centerY]),
    zoom: interpolate(easedProgress, [0, 1], [previous.viewport.zoom, current.viewport.zoom])
  }
}

export function viewportToTransform(
  viewport: ViewportState,
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number
): { scale: number; translateX: number; translateY: number } {
  const { centerX, centerY, zoom } = viewport

  // Base scale to cover canvas
  const baseScale = Math.max(
    canvasWidth / imageWidth,
    canvasHeight / imageHeight
  )

  const scale = baseScale * zoom

  // Calculate scaled dimensions
  const scaledWidth = imageWidth * scale
  const scaledHeight = imageHeight * scale

  // Calculate target point on scaled image
  const targetX = centerX * scaledWidth
  const targetY = centerY * scaledHeight

  // Center of canvas
  const canvasCenterX = canvasWidth / 2
  const canvasCenterY = canvasHeight / 2

  // Translation to center target point
  let translateX = canvasCenterX - targetX
  let translateY = canvasCenterY - targetY

  // Clamp to prevent black bars
  const maxTranslateX = 0
  const minTranslateX = canvasWidth - scaledWidth
  const maxTranslateY = 0
  const minTranslateY = canvasHeight - scaledHeight

  translateX = Math.min(maxTranslateX, Math.max(minTranslateX, translateX))
  translateY = Math.min(maxTranslateY, Math.max(minTranslateY, translateY))

  return { scale, translateX, translateY }
}
```

---

## 5. Subtitle Component

### 5.1 New Subtitle Component

```tsx
// remotion/components/Subtitle.tsx

import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { Word } from './Word'
import type { TextElement } from '../lib/types'

interface SubtitleProps {
  element: TextElement
}

export const Subtitle: React.FC<SubtitleProps> = ({ element }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Calculate which words are visible
  const visibleWords = element.words.filter((word) => {
    const wordStartFrame = Math.floor((word.startMs / 1000) * fps)
    return frame >= wordStartFrame - element.startFrame
  })

  const positionClass =
    element.position === 'top' ? 'top-16' :
    element.position === 'bottom' ? 'bottom-16' : 'top-1/2 -translate-y-1/2'

  return (
    <AbsoluteFill className={`items-center ${positionClass} px-8`}>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 max-w-4xl">
        {visibleWords.map((word, index) => (
          <Word
            key={index}
            word={word}
            baseFrame={element.startFrame}
          />
        ))}
      </div>
    </AbsoluteFill>
  )
}
```

### 5.2 Word Component

```tsx
// remotion/components/Word.tsx

import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import type { WordTiming } from '../lib/types'

interface WordProps {
  word: WordTiming
  baseFrame: number
}

export const Word: React.FC<WordProps> = ({ word, baseFrame }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const wordStartFrame = Math.floor((word.startMs / 1000) * fps) - baseFrame

  // Pop animation
  const animationProgress = spring({
    frame: frame - wordStartFrame,
    fps,
    config: {
      damping: 20,
      stiffness: 200,
      mass: 0.5
    }
  })

  const scale = interpolate(animationProgress, [0, 1], [0.8, 1])
  const opacity = interpolate(animationProgress, [0, 1], [0, 1])
  const translateY = interpolate(animationProgress, [0, 1], [10, 0])

  // Emphasis styling
  const emphasisLevel = word.emphasis?.level || 'none'

  const textStyle: React.CSSProperties = {
    fontSize: emphasisLevel === 'high' ? 58 : emphasisLevel === 'med' ? 52 : 48,
    fontWeight: emphasisLevel === 'high' ? 900 : 400,
    fontFamily: emphasisLevel === 'high' ? 'Montserrat' : 'Roboto',
    color: '#FFFFFF',
    textShadow: generateTextShadow(),
    transform: `scale(${scale}) translateY(${translateY}px)`,
    opacity
  }

  const showHighlight = emphasisLevel !== 'none'
  const highlightProgress = spring({
    frame: frame - wordStartFrame,
    fps,
    config: { damping: 30, stiffness: 300 }
  })

  return (
    <span className="relative inline-block">
      {/* Yellow highlight */}
      {showHighlight && (
        <span
          className="absolute inset-0 bg-[#F2E205] -z-10"
          style={{
            transform: `scaleX(${highlightProgress})`,
            transformOrigin: 'left'
          }}
        />
      )}

      <span style={textStyle}>
        {word.text}
      </span>
    </span>
  )
}

function generateTextShadow(): string {
  const color = '#1A1A1D'
  const size = 2
  const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],          [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ]
  return directions
    .map(([x, y]) => `${x * size}px ${y * size}px 0 ${color}`)
    .join(', ')
}
```

---

## 6. Remotion Player Integration

### 6.1 Preview Page

```tsx
// app/(dashboard)/projects/[id]/preview/page.tsx

import { Player } from '@remotion/player'
import { StoryFlowVideo } from '@/remotion/compositions/StoryFlowVideo'

export default async function PreviewPage({
  params
}: {
  params: { id: string }
}) {
  const project = await getProject(params.id)
  const timeline = await buildTimeline(params.id)

  return (
    <WizardLayout project={project} currentStep="preview">
      <VideoPreview
        projectId={params.id}
        timeline={timeline}
      />
    </WizardLayout>
  )
}
```

### 6.2 Video Preview Component

```tsx
// components/video/video-preview.tsx

'use client'

import { Player, PlayerRef } from '@remotion/player'
import { useRef, useState } from 'react'
import { StoryFlowVideo } from '@/remotion/compositions/StoryFlowVideo'
import type { Timeline } from '@/lib/types'

interface VideoPreviewProps {
  projectId: string
  timeline: Timeline
}

export function VideoPreview({ projectId, timeline }: VideoPreviewProps) {
  const playerRef = useRef<PlayerRef>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const durationInFrames = Math.ceil(timeline.durationSeconds * 30) + 30  // +30 for intro

  return (
    <div className="space-y-4">
      {/* Player */}
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <Player
          ref={playerRef}
          component={StoryFlowVideo}
          inputProps={{ timeline }}
          durationInFrames={durationInFrames}
          compositionWidth={timeline.aspectRatio === '16:9' ? 1920 : 1080}
          compositionHeight={timeline.aspectRatio === '16:9' ? 1080 : 1920}
          fps={30}
          style={{ width: '100%', height: '100%' }}
          controls
          autoPlay={false}
          loop={false}
          clickToPlay
          doubleClickToFullscreen
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => playerRef.current?.seekTo(0)}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              if (isPlaying) {
                playerRef.current?.pause()
              } else {
                playerRef.current?.play()
              }
              setIsPlaying(!isPlaying)
            }}
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>
        </div>

        <Button asChild>
          <Link href={`/projects/${projectId}/render`}>
            Render Video
          </Link>
        </Button>
      </div>
    </div>
  )
}
```

---

## 7. Timeline Builder

### 7.1 Build Timeline API

**GET /api/projects/[id]/timeline**

```typescript
// Response
{
  timeline: Timeline
}
```

### 7.2 Timeline Builder Service

```typescript
// lib/services/timeline/builder.ts

import { prisma } from '@/lib/db'
import type { Timeline, BackgroundElement, TextElement, AudioElement } from '@/lib/types'

export async function buildTimeline(projectId: string): Promise<Timeline> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      script: true,
      assets: true,
      viewport: true,
      settings: true
    }
  })

  if (!project || !project.script) {
    throw new Error('Project or script not found')
  }

  const fps = 30
  const introMs = 1000

  // Build background elements
  const backgrounds = buildBackgroundElements(
    project.assets.filter((a) => a.type === 'IMAGE' || a.type === 'VIDEO'),
    project.viewport,
    project.script.segments,
    fps
  )

  // Build text elements with word timing
  const text = buildTextElements(project.script.segments, fps)

  // Build audio elements
  const audio = buildAudioElements(project.script.segments, projectId, fps)

  // Build music element
  const music = project.settings?.musicTrackId
    ? await buildMusicElement(project.settings.musicTrackId, project.settings.musicVolume)
    : undefined

  // Calculate total duration
  const lastAudio = audio[audio.length - 1]
  const durationSeconds = lastAudio
    ? (lastAudio.endFrame / fps) + 1
    : 60

  return {
    title: project.script.title,
    aspectRatio: project.aspectRatio as '16:9' | '9:16',
    durationSeconds,
    backgrounds,
    text,
    audio,
    music
  }
}

function buildBackgroundElements(
  assets: Asset[],
  viewport: Viewport | null,
  segments: ScriptSegment[],
  fps: number
): BackgroundElement[] {
  // For single image, use entire duration with viewport
  if (assets.length === 1 && assets[0].type === 'IMAGE') {
    const asset = assets[0]
    const totalDuration = segments.reduce(
      (sum, s) => sum + (s.actualDuration || 30000),
      0
    )

    return [{
      imageUrl: asset.upscaled ? asset.upscaledPath : asset.path,
      startFrame: 0,
      endFrame: Math.ceil((totalDuration / 1000) * fps),
      enterTransition: 'blur',
      exitTransition: 'blur',
      mediaMetadata: asset.metadata,
      viewportAnimation: viewport?.keyframes
        ? {
            enabled: true,
            keyframes: viewport.keyframes,
            imageWidth: asset.metadata.width,
            imageHeight: asset.metadata.height
          }
        : undefined
    }]
  }

  // Multiple assets - distribute across segments
  return assets.map((asset, index) => {
    const segment = segments[index % segments.length]
    const startMs = segments
      .slice(0, index)
      .reduce((sum, s) => sum + (s.actualDuration || 30000), 0)
    const duration = segment.actualDuration || 30000

    return {
      imageUrl: asset.type === 'IMAGE'
        ? (asset.upscaled ? asset.upscaledPath : asset.path)
        : undefined,
      videoUrl: asset.type === 'VIDEO' ? asset.path : undefined,
      startFrame: Math.floor((startMs / 1000) * fps),
      endFrame: Math.floor(((startMs + duration) / 1000) * fps),
      enterTransition: 'blur',
      exitTransition: 'blur',
      mediaMetadata: asset.metadata
    }
  })
}

function buildTextElements(
  segments: ScriptSegment[],
  fps: number
): TextElement[] {
  let currentMs = 0

  return segments.map((segment) => {
    const startMs = currentMs
    const duration = segment.actualDuration || 30000
    currentMs += duration

    return {
      text: segment.text,
      position: 'bottom',
      startFrame: Math.floor((startMs / 1000) * fps),
      endFrame: Math.floor(((startMs + duration) / 1000) * fps),
      words: segment.timestamps || [],
      holdFrames: 6
    }
  })
}

function buildAudioElements(
  segments: ScriptSegment[],
  projectId: string,
  fps: number
): AudioElement[] {
  let currentMs = 0

  return segments.map((segment, index) => {
    const startMs = currentMs
    const duration = segment.actualDuration || 30000
    currentMs += duration

    return {
      audioUrl: `/projects/${projectId}/assets/audio/segment-${index + 1}.mp3`,
      startFrame: Math.floor((startMs / 1000) * fps),
      endFrame: Math.floor(((startMs + duration) / 1000) * fps)
    }
  })
}
```

---

## 8. Subtitle Styling Configuration

### 8.1 Configurable Subtitle Styles

Users can configure subtitle appearance in project settings:

```typescript
// lib/types/subtitle-style.ts

interface SubtitleStyle {
  position: 'top' | 'bottom' | 'center'
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  fontFamily: 'roboto' | 'montserrat' | 'inter' | 'poppins'
  textColor: string        // Hex color, default: #FFFFFF
  highlightColor: string   // Hex color for emphasis, default: #F2E205
  outlineColor: string     // Hex color for text outline, default: #1A1A1D
  outlineWidth: number     // Pixels, default: 2
  paddingBottom: number    // Pixels from bottom edge, default: 64
  paddingTop: number       // Pixels from top edge, default: 64
}

const defaultSubtitleStyle: SubtitleStyle = {
  position: 'bottom',
  fontSize: 'large',
  fontFamily: 'roboto',
  textColor: '#FFFFFF',
  highlightColor: '#F2E205',
  outlineColor: '#1A1A1D',
  outlineWidth: 2,
  paddingBottom: 64,
  paddingTop: 64
}
```

### 8.2 Font Size Mapping

```typescript
const fontSizeMap = {
  small: { base: 32, emphasis: 38 },
  medium: { base: 40, emphasis: 46 },
  large: { base: 48, emphasis: 58 },
  xlarge: { base: 56, emphasis: 68 }
}
```

### 8.3 Database Schema Update

```prisma
model ProjectSettings {
  // ... existing fields
  subtitleStyle Json?  // SubtitleStyle object
}
```

### 8.4 Preview Considerations

- **Large files:** Limit preview resolution to 720p for images > 4K
- **Memory management:** Dispose of unused textures during scrubbing
- **Long videos:** Lazy-load segments as user scrubs

---

## 9. Types

### 9.1 Timeline Types

```typescript
// lib/types/timeline.ts

export interface Timeline {
  title: string
  aspectRatio: '16:9' | '9:16'
  durationSeconds: number
  backgrounds: BackgroundElement[]
  text: TextElement[]
  audio: AudioElement[]
  music?: MusicElement
}

export interface BackgroundElement {
  imageUrl?: string
  videoUrl?: string
  startFrame: number
  endFrame: number
  enterTransition: 'fade' | 'blur' | 'none'
  exitTransition: 'fade' | 'blur' | 'none'
  mediaMetadata?: MediaMetadata
  viewportAnimation?: ViewportAnimation
}

export interface TextElement {
  text: string
  position: 'top' | 'bottom' | 'center'
  startFrame: number
  endFrame: number
  words: WordTiming[]
  holdFrames?: number
}

export interface WordTiming {
  text: string
  startMs: number
  endMs: number
  emphasis?: {
    level: 'none' | 'med' | 'high'
    tone?: 'warm' | 'intense'
  }
}

export interface AudioElement {
  audioUrl: string
  startFrame: number
  endFrame: number
}

export interface MusicElement {
  url: string
  volume: number
}

export interface ViewportAnimation {
  enabled: boolean
  keyframes: ViewportKeyframe[]
  imageWidth?: number
  imageHeight?: number
}

export interface ViewportKeyframe {
  frameStart: number
  frameEnd: number
  viewport: {
    centerX: number
    centerY: number
    zoom: number
  }
  easing: EasingType
  transitionDurationMs: number
}

export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'slowDramatic'
  | 'fastAction'
```

---

## 9. Acceptance Criteria

### Must Have
- [ ] Remotion Player renders video preview
- [ ] Background images display correctly
- [ ] Viewport animation works (pan-scan)
- [ ] Subtitles appear with word timing
- [ ] Audio plays in sync
- [ ] Play/pause controls work
- [ ] Scrubbing/seeking works
- [ ] Fullscreen toggle works

### Should Have
- [ ] Smooth 30fps playback
- [ ] No black flashes between elements
- [ ] Word emphasis animations
- [ ] Background music plays

### Nice to Have
- [ ] Keyboard shortcuts (space for play/pause)
- [ ] Frame-accurate seeking
- [ ] Volume controls
- [ ] Playback speed control

---

## 10. Testing Checklist

1. **Player Integration:**
   - Player renders without errors
   - Correct dimensions for aspect ratio
   - Controls are responsive

2. **Background Rendering:**
   - Images load and display
   - Viewport animation is smooth
   - Transitions work correctly

3. **Subtitle Rendering:**
   - Words appear at correct times
   - Emphasis styling applied
   - Pop animations smooth

4. **Audio Sync:**
   - Audio starts at correct time
   - Stays in sync during playback
   - No audio glitches

---

*Wave 5 Complete → Proceed to Wave 6: Rendering*
