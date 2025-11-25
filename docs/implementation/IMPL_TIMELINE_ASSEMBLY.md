# Timeline Assembly Implementation Specification

This document provides detailed technical specifications for timeline building, including frame alignment, media synchronization, and edge case handling.

---

## Table of Contents

1. [Timeline Structure](#1-timeline-structure)
2. [Frame Alignment](#2-frame-alignment)
3. [Media Synchronization](#3-media-synchronization)
4. [Text Element Generation](#4-text-element-generation)
5. [Music Integration](#5-music-integration)
6. [Edge Case Handling](#6-edge-case-handling)
7. [Timeline Validation](#7-timeline-validation)

---

## 1. Timeline Structure

### 1.1 Timeline JSON Schema

```typescript
interface Timeline {
  version: string;  // "1.0"
  projectId: string;
  scriptId: string;
  shortTitle: string;
  duration: number;  // Total duration in ms
  fps: number;  // 30
  aspectRatio: '16:9' | '9:16';
  elements: BackgroundElement[];  // Images and videos
  text: TextElement[];  // Subtitles (character-by-character)
  audio: AudioElement[];  // TTS segments
  music?: MusicElement;  // Background music (optional)
  metadata: {
    createdAt: string;  // ISO 8601
    generatedBy: string;  // "remotion-p2v v2.0.0"
    totalSegments: number;
    totalImages: number;
    totalVideos: number;
    hasMusicTrack: boolean;
  };
}

interface BackgroundElement {
  id: string;
  startMs: number;
  endMs: number;
  type: 'image' | 'video';
  mediaUrl: string;
  segmentId: string;  // Reference to script segment
  enterTransition: 'none' | 'fade' | 'dissolve';
  exitTransition: 'none' | 'fade' | 'dissolve';
  animations: Animation[];  // Ken Burns effect for images
  loop?: boolean;  // For videos shorter than segment
  muted: boolean;  // Always true for videos
  zIndex: number;  // Layering (0 = background)
}

interface Animation {
  type: 'kenBurns' | 'zoom' | 'pan';
  startScale: number;
  endScale: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

interface TextElement {
  id: string;
  startMs: number;
  endMs: number;
  text: string;  // Single word or character
  type: 'character' | 'word';
  position: 'bottom' | 'center' | 'top';
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor?: string;
    padding?: number;
    borderRadius?: number;
  };
  animations: string[];  // ['scale-in', 'highlight']
  zIndex: number;  // 100 = above media
}

interface AudioElement {
  id: string;
  segmentId: string;
  startMs: number;
  endMs: number;
  audioUrl: string;
  volume: number;  // 0-1, default 1.0
  fadeIn?: number;  // ms
  fadeOut?: number;  // ms
}

interface MusicElement {
  id: string;
  startMs: number;
  endMs: number;
  musicUrl: string;
  volume: number;  // 0-1, default 0.15
  fadeIn: number;  // ms, default 2000
  fadeOut: number;  // ms, default 3000
  fadeOutStart?: number;  // ms, when to start fade out
  loop: boolean;  // true if music shorter than video
  duckingPoints: DuckingPoint[];  // Volume ducking during pauses
}

interface DuckingPoint {
  startMs: number;
  endMs: number;
  duckVolume: number;  // Reduced volume (e.g., 0.08)
}
```

---

## 2. Frame Alignment

### 2.1 Frame-Aligned Timestamps

```typescript
export function alignToFrame(timeMs: number, fps: number): number {
  // Round to nearest frame boundary
  const frameDurationMs = 1000 / fps;
  return Math.round(timeMs / frameDurationMs) * frameDurationMs;
}

export function calculateFrame(timeMs: number, fps: number): number {
  // Convert milliseconds to frame number
  return Math.round((timeMs / 1000) * fps);
}

export function calculateDuration(startMs: number, endMs: number, fps: number): number {
  // Calculate duration in frames
  const startFrame = calculateFrame(startMs, fps);
  const endFrame = calculateFrame(endMs, fps);
  return endFrame - startFrame;
}
```

### 2.2 Gap Prevention

```typescript
export function ensureNoGaps(elements: BackgroundElement[], fps: number): BackgroundElement[] {
  // Sort by startMs
  const sorted = [...elements].sort((a, b) => a.startMs - b.startMs);

  // Adjust elements to eliminate gaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    // If gap exists, extend current element to meet next
    if (current.endMs < next.startMs) {
      const gap = next.startMs - current.endMs;
      logger.warn(`Gap detected: ${gap}ms between ${current.id} and ${next.id}. Extending current element.`);

      current.endMs = alignToFrame(next.startMs, fps);
    }

    // If overlap exists, trim current element
    if (current.endMs > next.startMs) {
      const overlap = current.endMs - next.startMs;
      logger.warn(`Overlap detected: ${overlap}ms between ${current.id} and ${next.id}. Trimming current element.`);

      current.endMs = alignToFrame(next.startMs, fps);
    }
  }

  return sorted;
}
```

---

## 3. Media Synchronization

### 3.1 Timeline Assembly Algorithm

```typescript
export async function assembleTimeline(
  script: Script,
  audioData: AudioData[],
  images: StockImage[],
  videos: StockVideo[],
  music: MusicTrack | null,
  aspectRatio: '16:9' | '9:16',
  fps: number = 30
): Promise<Timeline> {
  let currentTimeMs = 0;
  const elements: BackgroundElement[] = [];
  const textElements: TextElement[] = [];
  const audioElements: AudioElement[] = [];

  for (const segment of script.segments) {
    // 1. Find matching audio file
    const audio = audioData.find(a => a.segmentId === segment.id);
    if (!audio) {
      throw new Error(`Missing audio for segment: ${segment.id}`);
    }

    // 2. Find matching media (images and videos by tags)
    const segmentMedia = findMediaForSegment(segment, images, videos, {
      targetCount: 5,
      minMatchScore: 0.7,
    });

    // Handle insufficient media
    if (segmentMedia.length < 3) {
      logger.warn(`Insufficient media for segment ${segment.id}, reusing available media`);
      // ... handle insufficient media (see Section 6)
    }

    // 3. Calculate timing
    const segmentDuration = audio.durationMs;
    const mediaCount = segmentMedia.length;
    const mediaDuration = segmentDuration / mediaCount;

    // 4. Create background elements (mix of images and videos)
    for (let i = 0; i < mediaCount; i++) {
      const startMs = alignToFrame(currentTimeMs + (i * mediaDuration), fps);
      const endMs = alignToFrame(currentTimeMs + ((i + 1) * mediaDuration), fps);
      const media = segmentMedia[i];

      // Create background element
      const element = createBackgroundElement({
        media,
        startMs,
        endMs,
        segmentId: segment.id,
        index: i,
        isLast: i === mediaCount - 1,
        fps,
      });

      elements.push(element);
    }

    // 5. Create text elements (word-by-word or character-by-character from audio timestamps)
    const words = audio.timestamps;  // word-level timing
    for (const word of words) {
      const textElement = createTextElement({
        word,
        startMs: alignToFrame(currentTimeMs + word.startMs, fps),
        endMs: alignToFrame(currentTimeMs + word.endMs, fps),
        segmentId: segment.id,
      });

      textElements.push(textElement);
    }

    // 6. Create audio element
    audioElements.push({
      id: `audio-${segment.id}`,
      segmentId: segment.id,
      startMs: alignToFrame(currentTimeMs, fps),
      endMs: alignToFrame(currentTimeMs + segmentDuration, fps),
      audioUrl: audio.url,
      volume: 1.0,
    });

    // 7. Add pauses if specified
    const pause = script.pacing.pauses.find(p => p.afterSegmentId === segment.id);
    if (pause) {
      currentTimeMs += pause.durationMs;
    }

    currentTimeMs += segmentDuration;
  }

  // 8. Ensure no gaps
  const alignedElements = ensureNoGaps(elements, fps);

  // 9. Add background music track (full duration)
  let musicElement: MusicElement | undefined;
  if (music) {
    musicElement = createMusicElement(music, currentTimeMs, script.pacing.pauses, fps);
  }

  // 10. Build final timeline
  const timeline: Timeline = {
    version: '1.0',
    projectId: script.projectId,
    scriptId: script.id,
    shortTitle: script.title,
    duration: alignToFrame(currentTimeMs, fps),
    fps,
    aspectRatio,
    elements: alignedElements,
    text: textElements,
    audio: audioElements,
    music: musicElement,
    metadata: {
      createdAt: new Date().toISOString(),
      generatedBy: 'remotion-p2v v2.0.0',
      totalSegments: script.segments.length,
      totalImages: alignedElements.filter(e => e.type === 'image').length,
      totalVideos: alignedElements.filter(e => e.type === 'video').length,
      hasMusicTrack: !!musicElement,
    },
  };

  return timeline;
}
```

### 3.2 Background Element Creation

```typescript
function createBackgroundElement(options: {
  media: MediaAsset;
  startMs: number;
  endMs: number;
  segmentId: string;
  index: number;
  isLast: boolean;
  fps: number;
}): BackgroundElement {
  const { media, startMs, endMs, segmentId, index, isLast, fps } = options;
  const duration = endMs - startMs;

  const element: BackgroundElement = {
    id: `${segmentId}-media-${index}`,
    startMs,
    endMs,
    type: media.type,
    mediaUrl: media.url,
    segmentId,
    enterTransition: index === 0 ? 'fade' : 'none',
    exitTransition: isLast ? 'fade' : 'dissolve',
    muted: media.type === 'video',
    zIndex: 0,
    animations: [],
  };

  // Add Ken Burns effect for images
  if (media.type === 'image') {
    element.animations.push({
      type: 'kenBurns',
      startScale: 1.0,
      endScale: 1.15,  // Zoom in by 15%
      easing: 'easeInOut',
    });
  }

  // Handle video looping if shorter than duration
  if (media.type === 'video') {
    const videoDuration = (media as StockVideo).duration * 1000; // Convert to ms

    if (videoDuration < duration) {
      element.loop = true;
      logger.debug(`Video ${media.id} will loop (${videoDuration}ms < ${duration}ms)`);
    } else if (videoDuration > duration) {
      logger.debug(`Video ${media.id} will be trimmed (${videoDuration}ms > ${duration}ms)`);
      // Remotion will handle trimming via durationInFrames
    }
  }

  return element;
}
```

---

## 4. Text Element Generation

### 4.1 Word-Level Text Elements

```typescript
function createTextElement(options: {
  word: WordTimestamp;
  startMs: number;
  endMs: number;
  segmentId: string;
}): TextElement {
  const { word, startMs, endMs, segmentId } = options;

  return {
    id: `text-${segmentId}-${word.word}-${startMs}`,
    startMs,
    endMs,
    text: word.word,
    type: 'word',
    position: 'bottom',
    style: {
      fontSize: 48,
      fontFamily: 'Inter, sans-serif',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 8,
      borderRadius: 4,
    },
    animations: ['scale-in'],
    zIndex: 100,
  };
}
```

### 4.2 Character-Level Text Elements

```typescript
function createCharacterLevelTextElements(options: {
  word: WordTimestamp;
  startMs: number;
  segmentId: string;
  fps: number;
}): TextElement[] {
  const { word, startMs, segmentId, fps } = options;

  if (!word.characters || word.characters.length === 0) {
    // Fallback to word-level if no character data
    return [createTextElement({
      word,
      startMs,
      endMs: startMs + (word.endMs - word.startMs),
      segmentId,
    })];
  }

  // Create element for each character
  return word.characters.map((char, i) => {
    const charStartMs = alignToFrame(startMs + char.startMs, fps);
    const charEndMs = alignToFrame(startMs + char.endMs, fps);

    return {
      id: `text-${segmentId}-char-${charStartMs}`,
      startMs: charStartMs,
      endMs: charEndMs,
      text: char.char,
      type: 'character' as const,
      position: 'bottom' as const,
      style: {
        fontSize: 48,
        fontFamily: 'Inter, sans-serif',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 8,
        borderRadius: 4,
      },
      animations: ['scale-in', 'highlight'],
      zIndex: 100,
    };
  });
}
```

---

## 5. Music Integration

### 5.1 Music Element Creation

```typescript
function createMusicElement(
  music: MusicTrack,
  totalDuration: number,
  pauses: ScriptPause[],
  fps: number
): MusicElement {
  const musicDurationMs = music.duration * 1000;

  const musicElement: MusicElement = {
    id: 'background-music',
    startMs: 0,
    endMs: alignToFrame(totalDuration, fps),
    musicUrl: music.url,
    volume: 0.15,  // 15% of max volume
    fadeIn: 2000,
    fadeOut: 3000,
    loop: musicDurationMs < totalDuration,
    duckingPoints: [],
  };

  // Handle music duration mismatch
  if (musicDurationMs < totalDuration) {
    logger.info(`Music will loop (${musicDurationMs}ms < ${totalDuration}ms)`);
  } else if (musicDurationMs > totalDuration) {
    // Start fade out 3 seconds before end
    musicElement.fadeOutStart = alignToFrame(totalDuration - 3000, fps);
    logger.info(`Music will fade out at ${musicElement.fadeOutStart}ms`);
  }

  // Add volume ducking during pauses
  musicElement.duckingPoints = createDuckingPoints(pauses, fps);

  return musicElement;
}
```

### 5.2 Volume Ducking

```typescript
function createDuckingPoints(pauses: ScriptPause[], fps: number): DuckingPoint[] {
  const duckingPoints: DuckingPoint[] = [];

  for (const pause of pauses) {
    // Duck music volume by 50% during pauses
    duckingPoints.push({
      startMs: alignToFrame(pause.startMs, fps),
      endMs: alignToFrame(pause.endMs, fps),
      duckVolume: 0.08,  // 8% of max volume (vs normal 15%)
    });
  }

  return duckingPoints;
}
```

---

## 6. Edge Case Handling

### 6.1 Insufficient Media

```typescript
function handleInsufficientMedia(
  segmentMedia: MediaAsset[],
  segmentDuration: number,
  targetCount: number
): MediaAsset[] {
  if (segmentMedia.length === 0) {
    throw new Error('No media available for segment');
  }

  if (segmentMedia.length < 3) {
    logger.warn(`Only ${segmentMedia.length} media items, reusing with extended duration`);

    // Reuse media items cyclically
    const extended: MediaAsset[] = [];
    for (let i = 0; i < targetCount; i++) {
      const media = segmentMedia[i % segmentMedia.length];
      extended.push(media);
    }

    return extended;
  }

  return segmentMedia;
}
```

### 6.2 Video Duration Mismatch

```typescript
function adjustVideoForDuration(
  video: StockVideo,
  targetDurationMs: number
): { loop: boolean; trim: boolean; trimEndMs?: number } {
  const videoDurationMs = video.duration * 1000;

  if (videoDurationMs < targetDurationMs) {
    // Video too short → loop
    return { loop: true, trim: false };
  } else if (videoDurationMs > targetDurationMs) {
    // Video too long → trim
    return { loop: false, trim: true, trimEndMs: targetDurationMs };
  }

  // Perfect match
  return { loop: false, trim: false };
}
```

### 6.3 Missing Audio Timestamps

```typescript
function generateFallbackTimestamps(text: string, durationMs: number): WordTimestamp[] {
  // If TTS provider doesn't return timestamps, generate evenly distributed timestamps
  const words = text.split(/\s+/);
  const wordDuration = durationMs / words.length;

  return words.map((word, i) => ({
    word,
    startMs: i * wordDuration,
    endMs: (i + 1) * wordDuration,
  }));
}
```

---

## 7. Timeline Validation

### 7.1 Validation Rules

```typescript
export function validateTimeline(timeline: Timeline): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check duration consistency
  const maxElementEnd = Math.max(...timeline.elements.map(e => e.endMs));
  if (maxElementEnd > timeline.duration) {
    errors.push(`Element extends beyond timeline duration: ${maxElementEnd}ms > ${timeline.duration}ms`);
  }

  // 2. Check for gaps in background elements
  const sortedElements = [...timeline.elements].sort((a, b) => a.startMs - b.startMs);
  for (let i = 0; i < sortedElements.length - 1; i++) {
    const current = sortedElements[i];
    const next = sortedElements[i + 1];

    if (current.endMs < next.startMs) {
      const gap = next.startMs - current.endMs;
      warnings.push(`Gap detected: ${gap}ms between ${current.id} and ${next.id}`);
    }

    if (current.endMs > next.startMs) {
      const overlap = current.endMs - next.startMs;
      warnings.push(`Overlap detected: ${overlap}ms between ${current.id} and ${next.id}`);
    }
  }

  // 3. Check frame alignment
  const frameDuration = 1000 / timeline.fps;
  for (const element of timeline.elements) {
    if (element.startMs % frameDuration !== 0) {
      warnings.push(`Element ${element.id} start not frame-aligned: ${element.startMs}ms`);
    }
    if (element.endMs % frameDuration !== 0) {
      warnings.push(`Element ${element.id} end not frame-aligned: ${element.endMs}ms`);
    }
  }

  // 4. Check audio coverage
  const audioStart = Math.min(...timeline.audio.map(a => a.startMs));
  const audioEnd = Math.max(...timeline.audio.map(a => a.endMs));

  if (audioStart > 0) {
    warnings.push(`Audio starts at ${audioStart}ms, not at 0ms`);
  }

  if (audioEnd < timeline.duration) {
    warnings.push(`Audio ends at ${audioEnd}ms, before timeline ends at ${timeline.duration}ms`);
  }

  // 5. Check text element synchronization
  if (timeline.text.length === 0) {
    warnings.push('No text elements (subtitles) in timeline');
  }

  // 6. Check music element if present
  if (timeline.music) {
    if (timeline.music.endMs !== timeline.duration) {
      warnings.push(`Music ends at ${timeline.music.endMs}ms, timeline ends at ${timeline.duration}ms`);
    }

    if (timeline.music.volume > 0.25) {
      warnings.push(`Music volume ${timeline.music.volume} may be too loud (recommended: ≤0.20)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

### 7.2 Auto-Repair

```typescript
export function autoRepairTimeline(timeline: Timeline): Timeline {
  // 1. Align all timestamps to frame boundaries
  const fps = timeline.fps;

  timeline.elements = timeline.elements.map(e => ({
    ...e,
    startMs: alignToFrame(e.startMs, fps),
    endMs: alignToFrame(e.endMs, fps),
  }));

  timeline.text = timeline.text.map(t => ({
    ...t,
    startMs: alignToFrame(t.startMs, fps),
    endMs: alignToFrame(t.endMs, fps),
  }));

  timeline.audio = timeline.audio.map(a => ({
    ...a,
    startMs: alignToFrame(a.startMs, fps),
    endMs: alignToFrame(a.endMs, fps),
  }));

  // 2. Fix gaps and overlaps
  timeline.elements = ensureNoGaps(timeline.elements, fps);

  // 3. Clamp music to timeline duration
  if (timeline.music) {
    timeline.music.endMs = Math.min(timeline.music.endMs, timeline.duration);
  }

  // 4. Update timeline duration to match longest element
  const maxEnd = Math.max(
    ...timeline.elements.map(e => e.endMs),
    ...timeline.audio.map(a => a.endMs)
  );
  timeline.duration = alignToFrame(maxEnd, fps);

  return timeline;
}
```

---

## Summary

This timeline assembly implementation provides:

1. **Frame-aligned timestamps** (30fps = 33.33ms increments)
2. **Gap prevention** algorithm to ensure continuous playback
3. **Mixed media synchronization** (images + videos)
4. **Ken Burns effect** for static images
5. **Video loop/trim logic** for duration mismatches
6. **Word-level or character-level** subtitle timing
7. **Music integration** with looping and ducking
8. **Cross-fade transitions** between segments
9. **Comprehensive validation** with auto-repair
10. **Edge case handling** for insufficient media, missing timestamps, etc.

All algorithms ensure:
- Perfect synchronization between audio, video, and text
- No gaps or overlaps in timeline
- Smooth transitions and animations
- Proper audio mixing (voice + music)
- Frame-accurate timing for Remotion rendering
