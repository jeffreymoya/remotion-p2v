# Validation Schemas Implementation Specification

This document provides complete Zod validation schemas for all data structures, configuration files, and user inputs.

---

## Table of Contents

1. [Configuration Schemas](#1-configuration-schemas)
2. [Content Schemas](#2-content-schemas)
3. [Asset Schemas](#3-asset-schemas)
4. [Timeline Schemas](#4-timeline-schemas)
5. [Input Validation](#5-input-validation)
6. [Custom Validators](#6-custom-validators)

---

## 1. Configuration Schemas

### 1.1 AI Configuration Schema

```typescript
import { z } from 'zod';

export const AIProviderConfigSchema = z.object({
  model: z.string().min(1),
  apiKey: z.string().min(10).transform(key => {
    // Support environment variable substitution
    if (key.startsWith('${') && key.endsWith('}')) {
      const envVar = key.slice(2, -1);
      return process.env[envVar] || '';
    }
    return key;
  }),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(100).max(100000),
});

export const AIConfigSchema = z.object({
  defaultProvider: z.enum(['gemini', 'openai', 'anthropic']),
  language: z.string().length(2).default('en'), // ISO 639-1
  providers: z.object({
    gemini: AIProviderConfigSchema.optional(),
    openai: AIProviderConfigSchema.optional(),
    anthropic: AIProviderConfigSchema.optional(),
  }).refine(
    (data) => {
      // Ensure at least one provider is configured
      return data.gemini || data.openai || data.anthropic;
    },
    { message: 'At least one AI provider must be configured' }
  ),
}).refine(
  (data) => {
    // Ensure default provider is configured
    return data.providers[data.defaultProvider] !== undefined;
  },
  { message: 'Default provider must be configured in providers object' }
);

export type AIConfig = z.infer<typeof AIConfigSchema>;
```

### 1.2 TTS Configuration Schema

```typescript
export const TTSProviderConfigSchema = z.object({
  apiKey: z.string().min(10).transform(key => {
    if (key.startsWith('${') && key.endsWith('}')) {
      const envVar = key.slice(2, -1);
      return process.env[envVar] || '';
    }
    return key;
  }),
  voiceId: z.string().optional(),
  voiceName: z.string().optional(),
  model: z.string().optional(),
  languageCode: z.string().optional(),
  speakingRate: z.number().min(0.5).max(2.0).optional(),
  pitch: z.number().min(-20).max(20).optional(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
});

export const TTSConfigSchema = z.object({
  defaultProvider: z.enum(['elevenlabs', 'google']),
  language: z.string().length(2).default('en'),
  providers: z.object({
    elevenlabs: TTSProviderConfigSchema.optional(),
    google: TTSProviderConfigSchema.optional(),
  }).refine(
    (data) => data.elevenlabs || data.google,
    { message: 'At least one TTS provider must be configured' }
  ),
}).refine(
  (data) => data.providers[data.defaultProvider] !== undefined,
  { message: 'Default provider must be configured in providers object' }
);

export type TTSConfig = z.infer<typeof TTSConfigSchema>;
```

### 1.3 Stock Assets Configuration Schema

```typescript
export const StockServiceConfigSchema = z.object({
  apiKey: z.string().min(5).transform(key => {
    if (key.startsWith('${') && key.endsWith('}')) {
      const envVar = key.slice(2, -1);
      return process.env[envVar] || '';
    }
    return key;
  }),
  enabled: z.boolean().default(true),
});

export const StockAssetsConfigSchema = z.object({
  services: z.object({
    pexels: StockServiceConfigSchema.optional(),
    unsplash: StockServiceConfigSchema.optional(),
    pixabay: StockServiceConfigSchema.optional(),
  }).refine(
    (data) => data.pexels?.enabled || data.unsplash?.enabled || data.pixabay?.enabled,
    { message: 'At least one stock service must be enabled' }
  ),
  defaults: z.object({
    images: z.object({
      perTag: z.number().int().min(1).max(50).default(3),
      orientation: z.enum(['16:9', '9:16']).default('16:9'),
    }),
    videos: z.object({
      enabled: z.boolean().default(true),
      perTag: z.number().int().min(1).max(20).default(2),
      minDuration: z.number().min(1).default(5),
      maxDuration: z.number().min(5).default(20),
      orientation: z.enum(['16:9', '9:16']).default('16:9'),
    }),
  }),
});

export type StockAssetsConfig = z.infer<typeof StockAssetsConfigSchema>;
```

### 1.4 Music Configuration Schema

```typescript
export const MusicConfigSchema = z.object({
  pixabay: z.object({
    apiKey: z.string().min(5).transform(key => {
      if (key.startsWith('${') && key.endsWith('}')) {
        const envVar = key.slice(2, -1);
        return process.env[envVar] || '';
      }
      return key;
    }),
    enabled: z.boolean().default(true),
  }).optional(),
  localLibrary: z.object({
    path: z.string().min(1),
    enabled: z.boolean().default(true),
  }).optional(),
  defaults: z.object({
    volume: z.number().min(0).max(1).default(0.15),
    fadeIn: z.number().int().min(0).max(10000).default(2000),
    fadeOut: z.number().int().min(0).max(10000).default(3000),
  }),
}).refine(
  (data) => data.pixabay?.enabled || data.localLibrary?.enabled,
  { message: 'At least one music source must be enabled' }
);

export type MusicConfig = z.infer<typeof MusicConfigSchema>;
```

### 1.5 Video Rendering Configuration Schema

```typescript
export const VideoConfigSchema = z.object({
  defaultQuality: z.enum(['draft', 'preview', 'final']).default('draft'),
  defaultAspectRatio: z.enum(['16:9', '9:16']).default('16:9'),
  fps: z.number().int().min(24).max(60).default(30),
  qualityPresets: z.object({
    draft: z.object({
      crf: z.number().int().min(0).max(51).default(28),
      scale: z.number().min(0.1).max(1).default(0.5),
      concurrency: z.number().int().min(1).max(8).default(1),
    }),
    preview: z.object({
      crf: z.number().int().min(0).max(51).default(23),
      scale: z.number().min(0.1).max(1).default(1),
      concurrency: z.number().int().min(1).max(8).default(2),
    }),
    final: z.object({
      crf: z.number().int().min(0).max(51).default(18),
      scale: z.number().min(0.1).max(1).default(1),
      concurrency: z.number().int().min(1).max(8).default(4),
    }),
  }),
});

export type VideoConfig = z.infer<typeof VideoConfigSchema>;
```

---

## 2. Content Schemas

### 2.1 Topic Schemas

```typescript
export const TopicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3).max(100),
  trendingReason: z.string().min(10).max(500),
  appealReason: z.string().min(10).max(500),
  engagementPotential: z.number().int().min(1).max(10),
  suggestedAngle: z.string().min(10).max(300),
  source: z.string().optional(),
  discoveredAt: z.string().datetime().optional(),
});

export const DiscoveredTopicsSchema = z.object({
  version: z.string().default('1.0'),
  projectId: z.string(),
  topics: z.array(TopicSchema).min(1).max(100),
  discoveredAt: z.string().datetime(),
  ageRange: z.object({
    min: z.number().int().min(13).max(100),
    max: z.number().int().min(13).max(100),
  }).refine(data => data.max >= data.min, {
    message: 'Max age must be greater than or equal to min age',
  }),
});

export const SelectedTopicsSchema = z.object({
  version: z.string().default('1.0'),
  projectId: z.string(),
  selectedIds: z.array(z.string()).min(1).max(50),
  selectedAt: z.string().datetime(),
});

export const RefinedTopicSchema = z.object({
  id: z.string(),
  originalTopicId: z.string(),
  refinedTitle: z.string().min(3).max(100),
  broadenedScope: z.string().min(20).max(1000),
  narrativeAngles: z.array(z.string()).min(3).max(10),
  hookIdeas: z.array(z.string()).min(2).max(5),
  visualOpportunities: z.array(z.string()).min(3).max(10),
  refinedAt: z.string().datetime(),
});

export const RefinedTopicsSchema = z.object({
  version: z.string().default('1.0'),
  projectId: z.string(),
  topics: z.array(RefinedTopicSchema).min(1).max(50),
});

export type Topic = z.infer<typeof TopicSchema>;
export type DiscoveredTopics = z.infer<typeof DiscoveredTopicsSchema>;
export type RefinedTopic = z.infer<typeof RefinedTopicSchema>;
```

### 2.2 Script Schemas

```typescript
export const ScriptSegmentSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['hook', 'intro', 'body', 'transition', 'conclusion', 'cta']),
  text: z.string().min(10).max(2000),
  duration: z.number().min(1).max(300), // 1 second to 5 minutes per segment
  speakingNotes: z.string().min(5).max(500),
  visualSuggestions: z.array(z.string()).min(1).max(10),
});

export const ScriptPacingSchema = z.object({
  fast: z.array(z.string()),
  slow: z.array(z.string()),
  pauses: z.array(z.object({
    afterSegmentId: z.string(),
    durationMs: z.number().int().min(500).max(3000),
  })),
}).refine(
  (data) => {
    // Ensure fast and slow are mutually exclusive
    const fastSet = new Set(data.fast);
    const slowSet = new Set(data.slow);
    for (const id of data.fast) {
      if (slowSet.has(id)) return false;
    }
    return true;
  },
  { message: 'Segments cannot be both fast and slow' }
);

export const ScriptSchema = z.object({
  version: z.string().default('1.0'),
  projectId: z.string(),
  id: z.string(),
  title: z.string().min(10).max(100),
  topicId: z.string(),
  estimatedDuration: z.number().int().min(600).max(900), // 10-15 minutes
  tone: z.enum(['educational', 'entertaining', 'inspirational']).default('educational'),
  segments: z.array(ScriptSegmentSchema).min(5).max(50),
  hooks: z.array(z.string()).min(1).max(5),
  pacing: ScriptPacingSchema,
  generatedAt: z.string().datetime(),
}).refine(
  (data) => {
    // Validate segment structure: hook → intro → body+ → conclusion → cta
    const types = data.segments.map(s => s.type);
    const pattern = /^hook,intro,(body|transition)+,conclusion,cta$/;
    return pattern.test(types.join(','));
  },
  { message: 'Invalid segment structure. Must follow: hook → intro → body+ → conclusion → cta' }
).refine(
  (data) => {
    // Validate pacing references
    const segmentIds = new Set(data.segments.map(s => s.id));
    for (const id of [...data.pacing.fast, ...data.pacing.slow]) {
      if (!segmentIds.has(id)) return false;
    }
    for (const pause of data.pacing.pauses) {
      if (!segmentIds.has(pause.afterSegmentId)) return false;
    }
    return true;
  },
  { message: 'Pacing references non-existent segment IDs' }
);

export type ScriptSegment = z.infer<typeof ScriptSegmentSchema>;
export type Script = z.infer<typeof ScriptSchema>;
```

---

## 3. Asset Schemas

### 3.1 Media Asset Schemas

```typescript
export const StockImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  downloadUrl: z.string().url(),
  source: z.enum(['pexels', 'unsplash', 'pixabay']),
  tags: z.array(z.string()),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  photographer: z.string().optional(),
  licenseUrl: z.string().url(),
  attribution: z.string().optional(),
  qualityScore: z.number().min(0).max(1).optional(),
});

export const StockVideoSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  downloadUrl: z.string().url(),
  source: z.enum(['pexels', 'pixabay']),
  tags: z.array(z.string()),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  duration: z.number().min(0),
  fps: z.number().int().min(1).max(120),
  creator: z.string().optional(),
  licenseUrl: z.string().url(),
  attribution: z.string().optional(),
  qualityScore: z.number().min(0).max(1).optional(),
});

export const MusicTrackSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  source: z.enum(['pixabay', 'local']),
  title: z.string(),
  duration: z.number().min(0),
  mood: z.enum(['ambient', 'corporate', 'upbeat', 'uplifting', 'cinematic', 'minimal']),
  bpm: z.number().int().min(40).max(200).optional(),
  licenseUrl: z.string().url().optional(),
});

export type StockImage = z.infer<typeof StockImageSchema>;
export type StockVideo = z.infer<typeof StockVideoSchema>;
export type MusicTrack = z.infer<typeof MusicTrackSchema>;
```

### 3.2 Audio Schemas

```typescript
export const CharacterTimestampSchema = z.object({
  char: z.string().length(1),
  startMs: z.number().min(0),
  endMs: z.number().min(0),
}).refine(data => data.endMs >= data.startMs, {
  message: 'endMs must be >= startMs',
});

export const WordTimestampSchema = z.object({
  word: z.string().min(1),
  startMs: z.number().min(0),
  endMs: z.number().min(0),
  characters: z.array(CharacterTimestampSchema).optional(),
}).refine(data => data.endMs >= data.startMs, {
  message: 'endMs must be >= startMs',
});

export const AudioDataSchema = z.object({
  segmentId: z.string(),
  url: z.string().url(),
  durationMs: z.number().int().min(0),
  format: z.enum(['mp3', 'wav', 'opus']),
  timestamps: z.array(WordTimestampSchema),
  provider: z.enum(['elevenlabs', 'google']),
  generatedAt: z.string().datetime(),
});

export type WordTimestamp = z.infer<typeof WordTimestampSchema>;
export type AudioData = z.infer<typeof AudioDataSchema>;
```

---

## 4. Timeline Schemas

### 4.1 Timeline Element Schemas

```typescript
export const AnimationSchema = z.object({
  type: z.enum(['kenBurns', 'zoom', 'pan']),
  startScale: z.number().min(0.1).max(2),
  endScale: z.number().min(0.1).max(2),
  startX: z.number().optional(),
  startY: z.number().optional(),
  endX: z.number().optional(),
  endY: z.number().optional(),
  easing: z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut']),
});

export const BackgroundElementSchema = z.object({
  id: z.string(),
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  type: z.enum(['image', 'video']),
  mediaUrl: z.string().url(),
  segmentId: z.string(),
  enterTransition: z.enum(['none', 'fade', 'dissolve']),
  exitTransition: z.enum(['none', 'fade', 'dissolve']),
  animations: z.array(AnimationSchema),
  loop: z.boolean().optional(),
  muted: z.boolean(),
  zIndex: z.number().int().min(0),
}).refine(data => data.endMs > data.startMs, {
  message: 'endMs must be > startMs',
});

export const TextElementSchema = z.object({
  id: z.string(),
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  text: z.string().min(1),
  type: z.enum(['character', 'word']),
  position: z.enum(['bottom', 'center', 'top']),
  style: z.object({
    fontSize: z.number().int().min(8).max(200),
    fontFamily: z.string(),
    color: z.string(),
    backgroundColor: z.string().optional(),
    padding: z.number().int().min(0).optional(),
    borderRadius: z.number().int().min(0).optional(),
  }),
  animations: z.array(z.string()),
  zIndex: z.number().int().min(0),
}).refine(data => data.endMs > data.startMs, {
  message: 'endMs must be > startMs',
});

export const AudioElementSchema = z.object({
  id: z.string(),
  segmentId: z.string(),
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  audioUrl: z.string().url(),
  volume: z.number().min(0).max(1).default(1.0),
  fadeIn: z.number().int().min(0).optional(),
  fadeOut: z.number().int().min(0).optional(),
}).refine(data => data.endMs > data.startMs, {
  message: 'endMs must be > startMs',
});

export const DuckingPointSchema = z.object({
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  duckVolume: z.number().min(0).max(1),
}).refine(data => data.endMs > data.startMs, {
  message: 'endMs must be > startMs',
});

export const MusicElementSchema = z.object({
  id: z.string(),
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  musicUrl: z.string().url(),
  volume: z.number().min(0).max(1).default(0.15),
  fadeIn: z.number().int().min(0).default(2000),
  fadeOut: z.number().int().min(0).default(3000),
  fadeOutStart: z.number().int().min(0).optional(),
  loop: z.boolean(),
  duckingPoints: z.array(DuckingPointSchema),
}).refine(data => data.endMs > data.startMs, {
  message: 'endMs must be > startMs',
});

export type BackgroundElement = z.infer<typeof BackgroundElementSchema>;
export type TextElement = z.infer<typeof TextElementSchema>;
export type AudioElement = z.infer<typeof AudioElementSchema>;
export type MusicElement = z.infer<typeof MusicElementSchema>;
```

### 4.2 Complete Timeline Schema

```typescript
export const TimelineSchema = z.object({
  version: z.string().default('1.0'),
  projectId: z.string(),
  scriptId: z.string(),
  shortTitle: z.string(),
  duration: z.number().int().min(0),
  fps: z.number().int().min(24).max(60),
  aspectRatio: z.enum(['16:9', '9:16']),
  elements: z.array(BackgroundElementSchema),
  text: z.array(TextElementSchema),
  audio: z.array(AudioElementSchema),
  music: MusicElementSchema.optional(),
  metadata: z.object({
    createdAt: z.string().datetime(),
    generatedBy: z.string(),
    totalSegments: z.number().int().min(0),
    totalImages: z.number().int().min(0),
    totalVideos: z.number().int().min(0),
    hasMusicTrack: z.boolean(),
  }),
}).refine(
  (data) => {
    // Validate timeline duration matches elements
    const maxElementEnd = Math.max(
      ...data.elements.map(e => e.endMs),
      ...data.audio.map(a => a.endMs),
      0
    );
    return maxElementEnd <= data.duration + 100; // Allow 100ms tolerance
  },
  { message: 'Element extends beyond timeline duration' }
);

export type Timeline = z.infer<typeof TimelineSchema>;
```

---

## 5. Input Validation

### 5.1 CLI Arguments Schema

```typescript
export const DiscoverArgsSchema = z.object({
  ageMin: z.number().int().min(13).max(100).default(20),
  ageMax: z.number().int().min(13).max(100).default(40),
  count: z.number().int().min(1).max(100).default(20),
  sources: z.array(z.string()).default(['google-trends']),
  ai: z.enum(['gemini', 'openai', 'anthropic']).optional(),
}).refine(data => data.ageMax >= data.ageMin, {
  message: 'ageMax must be >= ageMin',
});

export const ScriptArgsSchema = z.object({
  projectId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  duration: z.number().int().min(600).max(900).default(720),
  tone: z.enum(['educational', 'entertaining', 'inspirational']).default('educational'),
  ai: z.enum(['gemini', 'openai', 'anthropic']).optional(),
});

export const GatherArgsSchema = z.object({
  projectId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  scriptId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  includeVideos: z.boolean().default(true),
  includeMusic: z.boolean().default(true),
  tts: z.enum(['elevenlabs', 'google']).optional(),
  stockServices: z.array(z.enum(['pexels', 'unsplash', 'pixabay'])).default(['pexels', 'unsplash', 'pixabay']),
});

export const RenderArgsSchema = z.object({
  projectId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  scriptId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  outputPath: z.string().min(1),
  quality: z.enum(['draft', 'preview', 'final']).default('draft'),
  aspectRatio: z.enum(['16:9', '9:16']).default('16:9'),
  vertical: z.boolean().optional(), // Shorthand for aspectRatio=9:16
}).transform((data) => {
  // If --vertical flag is set, override aspectRatio
  if (data.vertical) {
    data.aspectRatio = '9:16';
  }
  return data;
});

export type DiscoverArgs = z.infer<typeof DiscoverArgsSchema>;
export type ScriptArgs = z.infer<typeof ScriptArgsSchema>;
export type GatherArgs = z.infer<typeof GatherArgsSchema>;
export type RenderArgs = z.infer<typeof RenderArgsSchema>;
```

### 5.2 Web UI Input Schema

```typescript
export const TopicSelectionSchema = z.object({
  projectId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  selectedIds: z.array(z.string()).min(1).max(50),
}).refine(
  (data) => {
    // Ensure all IDs are unique
    const uniqueIds = new Set(data.selectedIds);
    return uniqueIds.size === data.selectedIds.length;
  },
  { message: 'Duplicate topic IDs in selection' }
);

export type TopicSelection = z.infer<typeof TopicSelectionSchema>;
```

---

## 6. Custom Validators

### 6.1 URL Validators

```typescript
export function validateMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Allow http and https only
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    // Disallow localhost URLs (except in development)
    if (process.env.NODE_ENV === 'production' && parsed.hostname === 'localhost') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const MediaUrlSchema = z.string().url().refine(validateMediaUrl, {
  message: 'Invalid media URL',
});
```

### 6.2 File Path Validators

```typescript
export function validateFilePath(filepath: string): boolean {
  // Prevent directory traversal
  const normalized = path.normalize(filepath);
  if (normalized.includes('..')) {
    return false;
  }

  // Ensure path is within project directory
  const projectDir = path.resolve('public/projects');
  const fullPath = path.resolve(normalized);

  if (!fullPath.startsWith(projectDir)) {
    return false;
  }

  return true;
}

export const FilePathSchema = z.string().min(1).refine(validateFilePath, {
  message: 'Invalid or unsafe file path',
});
```

### 6.3 Project ID Validators

```typescript
export function validateProjectId(id: string): boolean {
  // Only allow alphanumeric, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

export const ProjectIdSchema = z.string().min(1).max(100).refine(validateProjectId, {
  message: 'Project ID can only contain alphanumeric characters, hyphens, and underscores',
});
```

### 6.4 Duration Validators

```typescript
export function validateVideoDuration(durationMs: number, minMs: number, maxMs: number): boolean {
  return durationMs >= minMs && durationMs <= maxMs;
}

export const VideoDurationSchema = z.number().int().min(600000).max(900000).refine(
  (duration) => validateVideoDuration(duration, 600000, 900000),
  { message: 'Video duration must be between 10 and 15 minutes' }
);
```

### 6.5 Aspect Ratio Validators

```typescript
export function calculateAspectRatio(width: number, height: number): string {
  const ratio = width / height;

  // Check common aspect ratios with tolerance
  if (Math.abs(ratio - 16/9) < 0.1) return '16:9';
  if (Math.abs(ratio - 9/16) < 0.1) return '9:16';
  if (Math.abs(ratio - 4/3) < 0.1) return '4:3';
  if (Math.abs(ratio - 1) < 0.1) return '1:1';

  return `${width}:${height}`;
}

export function validateAspectRatio(width: number, height: number, expected: '16:9' | '9:16'): boolean {
  const actual = calculateAspectRatio(width, height);
  return actual === expected;
}
```

---

## Summary

This validation specification provides:

1. **Complete Zod schemas** for all configurations (AI, TTS, stock assets, music, video)
2. **Content validation** for topics, scripts, and assets
3. **Timeline validation** with nested element schemas
4. **CLI argument validation** with transformation and refinement
5. **Web UI input validation** for user selections
6. **Custom validators** for URLs, file paths, project IDs, durations, and aspect ratios
7. **Environment variable substitution** in configuration files
8. **Referential integrity checks** (e.g., pacing references segment IDs)
9. **Business logic validation** (e.g., segment order, duration constraints)
10. **Security validation** (path traversal prevention, URL sanitization)

All schemas provide:
- Type safety (automatic TypeScript type inference)
- Runtime validation (Zod parse/validation)
- User-friendly error messages
- Transformation (e.g., env var substitution)
- Refinement (cross-field validation)
- Default values
- Optional fields with clear semantics

Usage example:
```typescript
// Load and validate config
const rawConfig = await fs.readJSON('config/ai.config.json');
const config = AIConfigSchema.parse(rawConfig); // Throws if invalid

// Validate CLI args
const args = ScriptArgsSchema.parse(process.argv);

// Validate script before saving
const script = ScriptSchema.parse(generatedScript);
await fileManager.atomicWrite('scripts/script-1.json', script);
```
