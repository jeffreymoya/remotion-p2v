# Change Request: YouTube 16:9 Word-Synced Emphasis Videos

**Last Verified**: 2025-11-27
**Status Legend**: ✅ Implemented | 📋 Planned | ⚠️ Partial | 🐛 Bug/Discrepancy

## Background
- Current Remotion pipeline outputs 16:9 by default but still generates 1024x1792 images; backgrounds are scaled from a 9:16 ratio, causing letterboxing/cropping artifacts.
- Subtitles are chunked phrases rendered with a single animation; there is no per-word timing or emphasis, although ⚠️ TTS word timestamps are already generated but unused in timeline assembly.
- Media pipeline favors AI images; stock video search exists but is not integrated into the gather pipeline, and no aspect-ratio fit logic exists.
- Voiceover defaults to Google TTS with `en-US-Neural2-F` (female, hardcoded - config ignored); word-level timestamp capability is present but not exposed in the timeline.

## Goals
- Deliver YouTube-ready 16:9 videos where visuals match the canvas without distortion.
- Animate each word in sync with TTS timestamps using a short-form "pop" feel.
- Automatically emphasize key words via font/size/color changes driven by AI tagging.
- Prefer stock video assets; fall back to photos, then AI images when video is unavailable.
- **Current**: Google TTS with `en-US-Neural2-F` (female, hardcoded - config ignored)
- **Deprecation Notice**: All Neural2 voices will be deprecated
- **Migration Target**: `en-US-Chirp3-HD-Algieba` with retries and fallbacks

## In Scope
- CLI generation changes: TTS selection, media search/download, aspect-ratio enforcement, timeline structure for per-word data and emphasis metadata.
- Rendering updates: background fit logic for images/videos, word-by-word subtitle component, emphasis styling presets.
- Config additions for TTS and stock media (aspect ratios, fallbacks, retries).

## Out of Scope
- Full UI redesign of intro/title card.
- New deployment targets or CI/CD changes.
- Premium/paid stock providers beyond Pexels/Unsplash/Pixabay already present.

## Functional Requirements

### Media Aspect Handling
**Status**: ✅ IMPLEMENTED

Request/download media in 16:9 (1920x1080 preferred). If asset ratio differs, apply center-crop-to-fill with 10% safe padding from edges. Use geometric center as focal point. Letterbox if aspect delta > 0.3 to avoid excessive cropping.

**Current Implementation**:
- Aspect processor service exists at cli/services/media/aspect-processor.ts with full crop/letterbox logic
- Background.tsx (lines 20-236) supports both videos and images with crop/letterbox modes
- Uses mediaMetadata with mode, scale, crop coordinates from aspect processor
- cropConfig in stock-assets.config.json (lines 105-110) defines safePaddingPercent: 10, maxAspectDelta: 0.3

### Background Selection Order
**Status**: ✅ IMPLEMENTED

Per scene, strict sequence with stop conditions:
1. Stock video (Pexels → Pixabay): Stop if quality ≥ 0.7 OR timeout 30s OR retry ≥ 3 OR zero results
2. Stock photo (Pexels → Unsplash → Pixabay): Stop if quality ≥ 0.6 OR timeout 30s OR retry ≥ 3 OR zero results
3. AI image (DALL·E): Final fallback

Log chosen source and quality score to timeline metadata.

**Current Implementation**:
- Video search implemented in gather.ts (lines 226-299) with quality scoring
- Falls back to image search (lines 302-342) if no video acquired
- Uses deduplication and quality ranking for both videos and images
- Quality thresholds: minVideoQualityScore: 0.7, minQualityScore: 0.6 from stock-assets.config.json

### Stock Video Duration
Prefer clips with duration ≥ narration + 0.5s. Max duration: narration + 2s (trim excess).

### Per-Word Timing
**Status**: ✅ IMPLEMENTED

Every word has start/end (ms) from TTS timestamps. Renderer aligns subtitle pop animation with these timings, accounting for intro offset (1000ms). Handle edge cases:
- Text wrapping: Split display into lines when combined word length > 40 chars, but preserve individual word timings
- Punctuation: Include in word token (e.g., "world!" is one word)
- Missing timestamps: Fall back to phrase-level rendering (backward compatibility)
- Intro offset: Add 1000ms to all word startMs/endMs during timeline assembly

**Current Implementation**:
- TextElement schema includes optional words[] field (types.ts:54-62) with text, startMs, endMs, emphasis
- Timeline assembly in build.ts (lines 248-314) generates word-level timing from TTS timestamps
- Intro offset (1000ms) added during timeline assembly (build.ts:277)
- Subtitle.tsx (lines 20-54) renders word-by-word when words array present
- Word.tsx implements pop animation with proper timing (lines 34-99)
- Backward compatibility: falls back to phrase chunks when wordTimestamps missing (build.ts:296-310)

### Emphasis Metadata
**Status**: ✅ IMPLEMENTED

Per word: `emphasis: { level: 'none'|'med'|'high', tone?: 'warm'|'intense' }`. Renderer maps:
- `none`: Base font (Bree Serif), white (#FFFFFF), 48px
- `med`: Same font, amber accent (#FFBF00), 52px (+8% size)
- `high`: Display font (Bebas Neue), yellow (#FFD700), 58px (+20% size)

Cap emphasis at ≤20% of words per sentence; avoid consecutive high-emphasis words.

**Current Implementation**:
- LLM emphasis detection in gather.ts (lines 351-384) using structured AI completion
- Emphasis prompt at config/prompts/emphasis.prompt.ts with rules for med/high tagging
- Constraint validation enforces 20% total cap, 5% high cap, 2-word gap (gather.ts:98-144)
- Emphasis field in TextElement.words schema (types.ts:58-61)
- Word.tsx applies emphasis styling (lines 29-32, 56, 86-90) using config from video.config.json
- Emphasis config in video.config.json (lines 80-84) defines fonts, sizes, colors

### Voice Configuration
**Status**: ✅ IMPLEMENTED (with Chirp3)

Default: Google TTS Chirp3 (`en-US-Chirp3-HD-Algieba`). Fallback chain on failure:
1. Google TTS Chirp3 voices (Algieba, Bellatrix, Canopus, Deneb)
2. Neural2 fallback voices (if Chirp3 unavailable)
3. ElevenLabs provider (disabled in config, will be skipped)

Retry strategy: max 3 attempts, exponential backoff (1s, 2s, 4s). All providers return word-level timestamps in format `{ word: string, startMs: number, endMs: number }[]`.

**Current Implementation**:
- TTS provider factory in cli/services/tts/index.ts supports multiple providers
- generateWithFallback function (lines 113-159) implements retry with exponential backoff
- Uses withRetry wrapper with retryConfig from tts.config.json (lines 76-80)
- Config defines defaultVoice as Chirp3-HD-Algieba (tts.config.json), google-tts.ts defaults to same (line 30)
- Fallback order: ["google", "elevenlabs"] from tts.config.json (line 75)
- Neural2 voices available as fallback in config for Chirp3 availability issues
- Word-level timestamps generated via SSML marks (google-tts.ts:104-149)

## Non-Functional Requirements
- Maintain backward compatibility with existing timelines (if word data missing, fall back to current phrase rendering).
- Keep render performance within current bounds; avoid loading >1 video per scene concurrently.
- Robust retries for TTS and stock downloads; surface actionable errors.

## Deliverables
- Updated docs (this CR + technical design).
- Code changes to CLI generation, media pipeline, TTS integration, timeline schema, and Remotion components supporting the new behavior.
- Config templates for TTS and stock assets reflecting new defaults/fallbacks.
- Tests (unit/integration) proving word sync, aspect fit, and fallback selection.

## Acceptance Criteria
- A generated sample project renders 1920x1080 with no pillar/letterboxing when assets are native 16:9 or croppable within safe margin (10% padding). When aspect delta > 0.3, letterbox is applied.
- Subtitles reveal word-by-word with pop animation (scale 0.8→1.0 over 200ms); emphasized words visibly differ in font/size/color and stay in sync with audio timestamps (±50ms tolerance).
- When stock video exists for a scene with quality ≥ 0.7, it is used; if not, stock image is attempted (quality ≥ 0.6); only if both fail or timeout is AI image generated.
- Voiceover uses `en-US-Neural2-J` by default; failure paths fall back automatically per chain (Neural2-F → Standard-H → ElevenLabs) and are logged with provider name + retry count.

## Risks & Mitigations
- TTS voice availability or quota limits → fallback list (Neural2-F, Standard-H, ElevenLabs), exponential backoff, clear error messaging.
- Aggressive cropping could cut faces → use 10% safe padding and aspect delta threshold 0.3; revert to letterbox when crop risk is high.
- LLM over-highlights words → cap emphasis density at 20% total (5% high, 15% med) and enforce 2-word gap between high-emphasis words.

## Design Decisions (Resolved)
- **Emphasis Styling**: Font + color approach. Base: Bree Serif + white (#FFFFFF). Med: Bree Serif + amber (#FFBF00) + 10% larger. High: Bebas Neue + yellow (#FFD700) + 20% larger.
- **Max Stock Video Duration**: Narration segment duration + 2s maximum. Trim excess during timeline assembly.
- **Music Ducking**: **FINAL STATE** - Enabled (config/music.config.json:48, `volumeDucking.enabled: true`). No change planned. Background music volume reduces during narration.

---

## Implementation Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| 16:9 Aspect Ratio | ✅ Implemented | Config default with optimized media pipeline |
| Music Ducking | ✅ Implemented | Final state (enabled) |
| TTS (Chirp3) | ✅ Implemented | Using Chirp3-HD-Algieba with Neural2 fallback |
| Word-Level Subtitles | ✅ Implemented | 40 chars per line from config, word-by-word rendering |
| Image Search | ✅ Implemented | Working with quality scoring and deduplication |
| Video Search | ✅ Implemented | Video-first with fallback to images |
| Word-Level Timing | ✅ Implemented | Full implementation with intro offset |
| Emphasis Tagging | ✅ Implemented | LLM-based with constraint validation |
| TTS Retry/Fallback | ✅ Implemented | Exponential backoff with provider fallback |
| Crop-to-Fill | ✅ Implemented | Aspect processor with letterbox fallback |

---

For current implementation details, see [CURRENT_STATE.md](CURRENT_STATE.md)
For technical implementation guide, see [IMPL_WORD_SYNC_AND_MEDIA.md](IMPL_WORD_SYNC_AND_MEDIA.md)
