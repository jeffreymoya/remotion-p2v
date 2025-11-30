# Implementation Design: Word-Synced Emphasis & 16:9 Media

**Last Verified**: 2025-11-27
**Status Legend**: ✅ Implemented | 📋 Planned | ⚠️ Partial | 🐛 Bug | 🔧 Config Exists But Unused

**Cross-references**:
- Current state: [CURRENT_STATE.md](CURRENT_STATE.md)
- Requirements: [CHANGE_REQUEST_WORD_SYNC.md](CHANGE_REQUEST_WORD_SYNC.md)

## Overview
**Current**: Google TTS Chirp3 (`en-US-Chirp3-HD-Algieba`) with word-level subtitle timing and emphasis styling, 16:9 media alignment, stock video-first backgrounds.
**Migration Complete**: Neural2 voices deprecated, now using Chirp3 family with Neural2 fallback for availability issues.

Design preserves backward compatibility with existing timelines.

## Architecture Impact
- **Generation (CLI):** Update `cli/cli.ts` flow to use TTS provider factory (Google default) and to choose stock media before AI images. Extend timeline creation to include per-word timing/emphasis and media type.
- **Rendering (Remotion):** Enhance `Background` to support videos and aspect-fit based on actual asset dimensions. Rewrite `Subtitle`/`Word` to iterate words, apply pop animation, and map emphasis styles.
- **Config:** Expand `config/tts.config.json`, `config/stock-assets.config.json`, and `config/video.config.json` with 16:9 defaults, retries, and fallback voices/providers.

## Data Model Updates (TypeScript)

### TextElement Extension
**Status**: ✅ IMPLEMENTED

`TextElement` (in `src/lib/types.ts`): Add optional `words: { text: string; startMs: number; endMs: number; emphasis?: { level: 'none'|'med'|'high'; tone?: 'warm'|'intense' } }[]`. Keep legacy `text: string` for backward compatibility. When `words` array is present, renderer iterates word-by-word; when absent, falls back to phrase rendering.

**Current Implementation**: TextElement schema includes optional words[] field (types.ts:54-62) with text, startMs, endMs, and optional emphasis object. Legacy text field maintained for backward compatibility.

### Background vs Video Elements
Current schema uses separate elements:
- `BackgroundElement`: For static images only (`imageUrl: string`)
- `VideoClipElement`: For video clips (`videoUrl: string`), optional in `Timeline.videoClips` array

**Implementation Note**: Media pipeline should populate `VideoClipElement` when stock video is selected, `BackgroundElement` when photo/AI image is used. Renderer checks `Timeline.videoClips` first, then `elements` array.

### Timeline Root
Ensure `aspectRatio: '16:9'` is set explicitly (defaults to `'9:16'` for backward compatibility). Add optional `mediaSourceMetadata: { segmentId: string, mediaType: 'video'|'image'|'ai', source: string, qualityScore: number }[]` for debugging fallback paths.

## TTS Pipeline (Google Neural2)

### Voice Selection
**Status**: ✅ IMPLEMENTED WITH CHIRP3

Current implementation uses `en-US-Chirp3-HD-Algieba` (male, Chirp3) as default in both config and `cli/services/tts/google-tts.ts:30`.

**Migration Complete**: Now using Chirp3 voices (Algieba, Bellatrix, Canopus, Deneb) with Neural2 fallback voices available in config for backward compatibility.

Audio config: `speakingRate: 1.0`, `pitch: 0.0` (configurable in `config/tts.config.json`).

### Timestamp Generation
Already implemented in `cli/services/tts/google-tts.ts` (lines 84-133). Adds SSML marks before each word (`<mark name="word0"/>word`), parses response timepoints. Returns `WordTimestamp[]` with `{ word: string, startMs: number, endMs: number }`.

### Edge Case Handling
- **Words with no timestamp**: Estimate duration using average word duration from segment (total duration / word count)
- **Punctuation**: Include in word token (e.g., "Hello," is one word, not split)
- **Intro offset**: Timeline assembly adds 1000ms (`INTRO_DURATION` from constants) to all word timestamps
- **Text wrapping**: Split text into display chunks of max 40 chars, but maintain original word boundaries and timings

**Current Implementation**: 🐛 BUG - Timeline uses 14-char max (MaxSentenseSizeChars in timeline.ts:54 - note typo), NOT 40 chars as specified in requirements and config.

### Output Path
Audio saved to `public/projects/{projectId}/assets/audio/{segmentId}.mp3` (current implementation in `cli/commands/gather.ts` line 171).

**NOT** `public/content/<slug>/audio/<uid>.mp3` as originally proposed.

### Retry Strategy
**Status**: ❌ NOT IMPLEMENTED

Max 3 attempts with exponential backoff (1s, 2s, 4s). Fallback voice chain:
1. `en-US-Neural2-J` (default)
2. `en-US-Neural2-F` (female fallback)
3. `en-US-Standard-H` (standard male)
4. ElevenLabs provider (if `ELEVENLABS_API_KEY` set)

All providers must preserve word timestamp format `{ word, startMs, endMs }[]`.

**Current Implementation**: ✅ IMPLEMENTED - Retry logic with exponential backoff in cli/services/tts/index.ts:113-159 via generateWithFallback function. Uses withRetry wrapper with config from tts.config.json:76-80. Supports provider fallback chain.

## Emphasis Detection
**Status**: ✅ IMPLEMENTED

### LLM Integration
Add emphasis tagging step in `cli/commands/gather.ts` after TTS generation, before timeline assembly. Use `AIProvider` with structured output (same pattern as tag extraction).

**Current Implementation**: ✅ IMPLEMENTED - Emphasis detection in gather.ts:351-384 using aiProvider.structuredComplete() with EmphasisResponseSchema. Constraint validation at lines 98-144.

### Prompt Template
Create new file `config/prompts/emphasis.prompt.ts`:

```typescript
export function emphasisTaggingPrompt(segmentText: string) {
  return `Analyze the following narration text and tag 10-20% of words with emphasis levels based on rhetorical importance.

Rules:
1. HIGH emphasis (max 5% of words): Numbers, surprising claims, calls-to-action, strong emotions
2. MED emphasis (max 15% of words): Named entities, key concepts, transitions
3. Minimum 2-word gap between high-emphasis words
4. Never emphasize articles (a, an, the), conjunctions (and, but, or), or prepositions (in, on, at)

Text: "${segmentText}"

Return JSON array: [{ wordIndex: number, level: "med"|"high", tone?: "warm"|"intense" }]`;
}
```

### Schema Validation
```typescript
const EmphasisSchema = z.object({
  emphases: z.array(z.object({
    wordIndex: z.number().int().nonnegative(),
    level: z.enum(['med', 'high']),
    tone: z.enum(['warm', 'intense']).optional(),
  }))
});
```

### Constraints Enforcement
After LLM response, validate and enforce:
- Total emphasis count ≤ 20% of word count
- High emphasis count ≤ 5% of word count
- No consecutive high-emphasis words (enforce 2+ word gap)
- If constraints violated: trim lowest-confidence emphases until valid

### Integration with Timeline
In timeline assembly (`cli/timeline.ts`), merge emphasis data into `TextElement.words[i].emphasis` using `wordIndex` mapping.

## Media Pipeline Changes
**Status**: ✅ IMPLEMENTED

### Search Order & Stop Conditions
Implement in `cli/commands/gather.ts` (currently only searches images at lines 133-166, no video support yet).

**Current Implementation**: ✅ IMPLEMENTED - Video search (step 1) implemented in gather.ts:226-299, falls back to image search (step 2) at lines 302-342. Uses quality scoring with thresholds from config. AI image generation (step 3) available as final fallback.

**Per Scene Sequence:**

**1. Stock Video Search**
- Providers: Pexels Video API → Pixabay Video API
- Query params: `orientation: 'landscape'`, `minWidth: 1920`, `minHeight: 1080`, `minDuration: segment.durationMs/1000`
- Quality scoring: Use existing `rankByQuality` with weights:
  - `aspectRatioMatch: 0.4`
  - `resolution: 0.3`
  - `relevance: 0.2`
  - `motionLength: 0.1` (video-specific)
- **Stop conditions**: `qualityScore >= 0.7` OR `timeout 30s` OR `retries >= 3` OR `results.length === 0`

**2. Stock Photo Search** (current implementation)
- Providers: Pexels → Unsplash → Pixabay
- Query params: `orientation: 'landscape'`, `minWidth: 1920`, `minHeight: 1080`
- Quality scoring weights:
  - `aspectRatioMatch: 0.4`
  - `resolution: 0.3`
  - `relevance: 0.25`
  - `popularity: 0.05`
- **Stop conditions**: `qualityScore >= 0.6` OR `timeout 30s` OR `retries >= 3` OR `results.length === 0`

**3. AI Image Generation** (fallback)
- Provider: DALL·E (current implementation)
- No stop conditions (final fallback)

### Aspect Ratio Handling
**Status**: ✅ IMPLEMENTED

**Crop-to-Fill Algorithm**

Add new file `cli/services/media/aspect-processor.ts`:

**Current Implementation**: ✅ IMPLEMENTED - aspect-processor.ts exists at cli/services/media/aspect-processor.ts with full crop/letterbox implementation. Background.tsx (lines 20-236) supports both crop and letterbox modes using mediaMetadata. cropConfig exists in stock-assets.config.json (lines 105-110).

```typescript
interface CropConfig {
  targetWidth: 1920;
  targetHeight: 1080;
  safePaddingPercent: 10; // Don't crop within 10% of edges
  maxAspectDelta: 0.3;     // Letterbox if delta > 30%
}

function shouldCrop(sourceAspect: number, targetAspect: number): boolean {
  const delta = Math.abs(sourceAspect - targetAspect) / targetAspect;
  return delta <= 0.3; // Crop if within 30% aspect difference
}

function calculateCrop(sourceW: number, sourceH: number, config: CropConfig) {
  const targetAspect = config.targetWidth / config.targetHeight;
  const sourceAspect = sourceW / sourceH;

  if (!shouldCrop(sourceAspect, targetAspect)) {
    return {
      mode: 'letterbox',
      scale: Math.min(config.targetWidth/sourceW, config.targetHeight/sourceH)
    };
  }

  // Center crop with safe padding
  const paddingPx = Math.min(sourceW, sourceH) * (config.safePaddingPercent / 100);
  const safeW = sourceW - 2 * paddingPx;
  const safeH = sourceH - 2 * paddingPx;

  let cropW, cropH;
  if (sourceAspect > targetAspect) {
    // Source is wider, crop width
    cropH = sourceH;
    cropW = cropH * targetAspect;
  } else {
    // Source is taller, crop height
    cropW = sourceW;
    cropH = cropW / targetAspect;
  }

  // Ensure crop doesn't exceed safe area
  if (cropW > safeW || cropH > safeH) {
    return {
      mode: 'letterbox',
      scale: Math.min(config.targetWidth/sourceW, config.targetHeight/sourceH)
    };
  }

  return {
    mode: 'crop',
    x: (sourceW - cropW) / 2,
    y: (sourceH - cropH) / 2,
    width: cropW,
    height: cropH,
    scale: config.targetWidth / cropW,
  };
}
```

**Integration**: Apply crop calculation during image/video download in `cli/commands/gather.ts`. Store crop metadata in timeline for renderer use.

### Duration Matching for Videos
- Prefer clips where `clip.durationMs >= segment.durationMs + 500` (0.5s buffer)
- If clip is longer: set `VideoClipElement.endMs = startMs + segment.durationMs + 2000` (max +2s buffer, trim excess)
- If clip is shorter: fall back to photo search

### Logging
Store in timeline metadata for debugging:
```typescript
{
  segmentId: string,
  mediaType: 'video' | 'image' | 'ai',
  source: 'pexels' | 'pixabay' | 'unsplash' | 'dalle',
  qualityScore: number,
  cropMode: 'crop' | 'letterbox'
}
```

## Timeline Assembly (`cli/commands/build.ts`)
**Status**: ✅ IMPLEMENTED

### Word-Level Timing Integration
Timeline assembly is in `cli/commands/build.ts` (not cli/timeline.ts which doesn't exist). Processes word timestamps from TTS results.

**Current Implementation**: ✅ IMPLEMENTED - generateTextElements function (build.ts:248-314) creates word-level timing from audioData.wordTimestamps. Adds intro offset (1000ms) to all timestamps. Falls back to phrase chunks when wordTimestamps missing.

```typescript
const INTRO_OFFSET_MS = 1000;
const FPS = 30;

interface TimelineWordData {
  text: string;
  startMs: number; // Absolute time including intro offset
  endMs: number;
  emphasis?: { level: 'none'|'med'|'high', tone?: 'warm'|'intense' };
}

function buildTextElementWithWords(
  segment: Segment,
  ttsTimestamps: WordTimestamp[],
  emphases: EmphasisData[],
  introOffsetMs: number
): TextElement {
  const words: TimelineWordData[] = ttsTimestamps.map((ts, idx) => ({
    text: ts.word,
    startMs: ts.startMs + introOffsetMs, // Add 1000ms intro offset
    endMs: ts.endMs + introOffsetMs,
    emphasis: emphases.find(e => e.wordIndex === idx) || { level: 'none' },
  }));

  // Legacy compatibility: preserve full text
  const textElement: TextElement = {
    startMs: words[0].startMs,
    endMs: words[words.length - 1].endMs,
    text: words.map(w => w.text).join(' '),
    position: 'center',
    words, // NEW FIELD
  };

  return textElement;
}
```

### Frame Conversion
FPS constant is defined in `src/lib/constants.ts` as `export const FPS = 30`. Also available in `config/video.config.json` per aspect ratio.

**Formula**:
```typescript
function msToFrame(ms: number, fps: number = 30): number {
  return Math.floor((ms / 1000) * fps);
}

function frameToMs(frame: number, fps: number = 30): number {
  return (frame / fps) * 1000;
}
```

**Usage in Renderer**: `src/components/Subtitle.tsx` should convert word `startMs`/`endMs` to frames:
```typescript
const wordStartFrame = msToFrame(word.startMs, fps);
const wordEndFrame = msToFrame(word.endMs, fps);
const isWordActive = frame >= wordStartFrame && frame < wordEndFrame;
```

### Media Type Selection
Update timeline assembly to populate `VideoClipElement` when video selected, `BackgroundElement` when photo/AI used:

```typescript
if (videoClip && videoClip.qualityScore >= 0.7) {
  timeline.videoClips.push({
    startMs: segmentStartMs + introOffsetMs,
    endMs: segmentStartMs + introOffsetMs + segment.durationMs,
    videoUrl: videoClip.id, // References assets/videos/{id}.mp4
    enterTransition: 'blur',
    exitTransition: 'blur',
  });
} else if (image && image.qualityScore >= 0.6) {
  timeline.elements.push({
    startMs: segmentStartMs + introOffsetMs,
    endMs: segmentStartMs + introOffsetMs + segment.durationMs,
    imageUrl: image.id, // References assets/images/{id}.jpg
    enterTransition: 'blur',
    exitTransition: 'blur',
  });
}
```

Maintain `aspectRatio: '16:9'` on timeline root.

## Rendering Changes
**Status**: ✅ IMPLEMENTED

### Background Component (`src/components/Background.tsx`)
**Status**: ✅ IMPLEMENTED

Current implementation (lines 1-236) handles both images and videos with crop/letterbox support.

**Current Implementation**: ✅ IMPLEMENTED - Renders videos (lines 129-184) and images (lines 188-232) with mediaMetadata-driven crop/letterbox modes. Uses calculateMediaStyle helper (lines 21-87) for fallback styling.

```typescript
// Check for video first
const videoClip = timeline.videoClips?.find(v =>
  currentFrame >= msToFrame(v.startMs) && currentFrame < msToFrame(v.endMs)
);

if (videoClip) {
  return <Video src={videoClip.videoUrl} style={cropStyle} />;
} else {
  // Fallback to image (current implementation)
  return <Img src={backgroundElement.imageUrl} style={cropStyle} />;
}
```

Apply crop/letterbox based on timeline metadata:
```typescript
const cropMode = metadata.cropMode; // From timeline
const style = cropMode === 'crop'
  ? { objectFit: 'cover', transform: `scale(${metadata.scale})` }
  : { objectFit: 'contain' }; // Letterbox
```

### Subtitle Component (`src/components/Subtitle.tsx`)
**Status**: ✅ IMPLEMENTED

Current implementation (lines 1-115) supports both word-level and legacy phrase rendering.

**Current Implementation**: ✅ IMPLEMENTED - Checks for textElement.words array (line 21), renders word-by-word when present (lines 23-54). Falls back to legacy phrase rendering (lines 57-112) for backward compatibility.

```typescript
interface SubtitleProps {
  textElement: TextElement;
}

const Subtitle: React.FC<SubtitleProps> = ({ textElement }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Backward compatibility: if no words array, render legacy way
  if (!textElement.words || textElement.words.length === 0) {
    return <LegacySubtitle text={textElement.text} />;
  }

  // Word-by-word rendering
  return (
    <AbsoluteFill>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        {textElement.words.map((word, idx) => {
          const wordStartFrame = msToFrame(word.startMs, fps);
          const wordEndFrame = msToFrame(word.endMs, fps);

          return (
            <Word
              key={idx}
              text={word.text}
              startFrame={wordStartFrame}
              endFrame={wordEndFrame}
              currentFrame={frame}
              emphasis={word.emphasis}
              fps={fps}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

### Word Component (`src/components/Word.tsx`)
**Status**: ✅ IMPLEMENTED

Word component fully implemented with emphasis styling and pop animation.

**Current Implementation**: ✅ IMPLEMENTED - Accepts emphasis prop, applies styling via getEmphasisStyle (lines 29-32), implements pop animation with spring (lines 64-81), uses config from video.config.json for fonts/colors/sizes.

```typescript
interface WordProps {
  text: string;
  startFrame: number;
  endFrame: number;
  currentFrame: number;
  emphasis: { level: 'none'|'med'|'high', tone?: string };
  fps: number;
}

const Word: React.FC<WordProps> = ({
  text,
  startFrame,
  endFrame,
  currentFrame,
  emphasis,
  fps
}) => {
  const isActive = currentFrame >= startFrame && currentFrame < endFrame;

  // Pop animation when word becomes active
  const popProgress = spring({
    frame: currentFrame - startFrame,
    fps,
    config: { damping: 200 },
    durationInFrames: Math.floor(fps * 0.2), // 200ms pop
  });

  const scale = isActive ? interpolate(popProgress, [0, 1], [0.8, 1.0]) : 0;
  const yOffset = isActive ? interpolate(popProgress, [0, 1], [10, 0]) : 0;

  // Emphasis styling
  const style = getEmphasisStyle(emphasis.level);

  return (
    <span style={{
      ...style,
      transform: `scale(${scale}) translateY(${yOffset}px)`,
      opacity: isActive ? 1 : 0,
      display: 'inline-block',
      transition: 'opacity 0.1s',
    }}>
      {text}
    </span>
  );
};

function getEmphasisStyle(level: string) {
  switch (level) {
    case 'high':
      return {
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: '58px',
        color: '#FFD700', // Yellow
        fontWeight: 700,
      };
    case 'med':
      return {
        fontFamily: 'Bree Serif, serif',
        fontSize: '52px',
        color: '#FFBF00', // Amber
        fontWeight: 600,
      };
    default: // 'none'
      return {
        fontFamily: 'Bree Serif, serif',
        fontSize: '48px',
        color: '#FFFFFF', // White
        fontWeight: 400,
      };
  }
}
```

### Text Wrapping Logic
- Maximum 40 characters per line (configurable in `config/video.config.json`: `text.maxCharactersPerLine`)
- Word boundaries preserved: never split mid-word
- Each line is a flex row; lines wrap to multiple rows via `flexWrap: 'wrap'`
- Individual word timings unchanged; only visual grouping affected

## Config Additions

### `config/tts.config.json`
**Current structure** (updated to use Chirp3):
```json
{
  "defaultProvider": "google",
  "providers": {
    "google": {
      "defaultVoice": {
        "languageCode": "en-US",
        "name": "en-US-Chirp3-HD-Algieba",
        "ssmlGender": "MALE"
      },
      "voices": {
        "male-casual": { "name": "en-US-Chirp3-HD-Algieba" },
        "female-casual": { "name": "en-US-Chirp3-HD-Bellatrix" },
        "male-professional": { "name": "en-US-Chirp3-HD-Canopus" },
        "female-professional": { "name": "en-US-Chirp3-HD-Deneb" },
        "neural2-fallback-male": { "name": "en-US-Neural2-J", "_comment": "Fallback" },
        "neural2-fallback-female": { "name": "en-US-Neural2-F", "_comment": "Fallback" }
      },
      "audioConfig": {
        "speakingRate": 1.0,
        "pitch": 0.0
      }
    }
  },
  "fallbackOrder": ["google", "elevenlabs"],
  "retryConfig": {
    "maxRetries": 3,
    "retryDelayMs": 1000,
    "backoffMultiplier": 2
  }
}
```
**Migration complete**: Now using Chirp3 voices with Neural2 as fallback.

### `config/stock-assets.config.json`
✅ **IMPLEMENTED** - Video configuration exists in stock-assets.config.json:
```json
{
  "providers": {
    "pexels": {
      "videoDefaults": {
        "orientation": "landscape",
        "minWidth": 1920,
        "minHeight": 1080,
        "minDuration": 5
      }
    }
  },
  "qualityScoring": {
    "weights": {
      "resolution": 0.3,
      "aspectRatioMatch": 0.25,
      "relevance": 0.25,
      "popularity": 0.2
    },
    "minQualityScore": 0.5,
    "minVideoQualityScore": 0.7
  },
  "cropConfig": {
    "safePaddingPercent": 10,
    "maxAspectDelta": 0.3,
    "targetWidth": 1920,
    "targetHeight": 1080
  }
}
```

### `config/video.config.json`
✅ **IMPLEMENTED** - Emphasis styles exist in video.config.json:
```json
{
  "defaultAspectRatio": "16:9",
  "text": {
    "maxCharactersPerLine": 40
  },
  "emphasis": {
    "none": { "fontFamily": "Bree Serif", "fontSize": 48, "color": "#FFFFFF", "fontWeight": 400 },
    "med": { "fontFamily": "Bree Serif", "fontSize": 52, "color": "#FFBF00", "fontWeight": 600 },
    "high": { "fontFamily": "Bebas Neue", "fontSize": 58, "color": "#FFD700", "fontWeight": 700 }
  }
}
```

### `config/music.config.json`
**Current state is final** (line 48):
```json
{
  "audio": {
    "volumeDucking": {
      "enabled": true,  // FINAL STATE - no change planned
      "duckVolumePercent": 20,
      "fadeMs": 500
    },
    "defaultVolume": 0.3
  }
}
```

## Config Implementation Status

| Config File | Setting | Status | Notes |
|-------------|---------|--------|-------|
| tts.config.json | defaultVoice (Chirp3-HD-Algieba) | ✅ Used | Config and provider both use Chirp3-HD-Algieba |
| tts.config.json | fallbackOrder | ✅ Used | Implemented in generateWithFallback |
| tts.config.json | retryConfig | ✅ Used | Retry logic with exponential backoff |
| video.config.json | maxCharactersPerLine (40) | ✅ Used | Used in generateTextElements |
| video.config.json | emphasis | ✅ Used | Emphasis styling implemented |
| stock-assets.config.json | videoDefaults | ✅ Used | Video search fully implemented |
| stock-assets.config.json | cropConfig | ✅ Used | Aspect processor uses config |
| music.config.json | volumeDucking.enabled (true) | ✅ Used | Final state |

## Error Handling & Telemetry
- Wrap TTS and media downloads with structured errors; include provider, request id, and retry count in logs.
- If media missing at render time, show gradient placeholder and log warning; do not crash render.
- Track chosen fallback path per scene for debugging.

## Testing Plan
- Unit: word-to-frame mapping with intro offset; emphasis mapper capping density; aspect-fit calculator for various source sizes.
- Integration: generate short sample, assert timeline contains `mediaType`, per-word timings length equals TTS words, aspectRatio `16:9`.
- Visual: render 20–30s sample verifying pop animation and emphasis colors; check no letterboxing when using 16:9 assets.
- Resilience: simulate TTS failure to trigger fallback; simulate missing stock video to confirm image/AI fallback order.

## Implementation Status

### ✅ ALL PHASES COMPLETED

All planned features have been implemented:

**Phase 1: Foundation** - ✅ COMPLETE
- Config files support all required settings
- TTS provider generates word timestamps
- Schema includes VideoClipElement and aspectRatio fields

**Phase 2: Media Pipeline Enhancement** - ✅ COMPLETE
- Video search implemented in gather.ts with quality scoring and fallback
- Aspect processor service created with crop/letterbox logic
- cropConfig added to stock-assets.config.json

**Phase 3: Timeline Assembly Updates** - ✅ COMPLETE
- Word-level timing in build.ts with intro offset handling
- Emphasis tagging with LLM integration in gather.ts
- Emphasis prompt created at config/prompts/emphasis.prompt.ts
- Constraint validation for emphasis (20% total, 5% high, 2-word gap)

**Phase 4: Rendering Updates** - ✅ COMPLETE
- Subtitle component refactored for word-by-word rendering with backward compatibility
- Word component with emphasis styling and pop animation
- Background component supports both videos and images with crop/letterbox modes
- Emphasis config added to video.config.json

**Phase 5: Testing & Validation** - ✅ COMPLETE
- Test files exist: emphasis-validator.test.ts, aspect-processor.test.ts, media-fallback.test.ts, word-timing.test.ts
- E2E and integration tests in tests/e2e/ and tests/integration/
- Existing tests updated for backward compatibility

### Risk Mitigation
1. **TTS timestamp quality**: Validate with real-world samples before full integration; ensure word boundaries are accurate
2. **Stock video availability**: Monitor API quota usage for Pexels/Pixabay; implement result caching to reduce API calls
3. **Rendering performance**: Profile word-by-word rendering with 50+ word scenes; optimize spring calculations if needed
4. **Backward compatibility**: Test with existing projects that lack `words` arrays; ensure graceful fallback to phrase rendering
