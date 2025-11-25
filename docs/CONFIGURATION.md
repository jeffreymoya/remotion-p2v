# Configuration Reference

This document provides a comprehensive reference for all configuration options in the Remotion P2V (Prompt-to-Video) project.

## Table of Contents

- [Environment Variables](#environment-variables)
- [AI Configuration](#ai-configuration)
- [Text-to-Speech Configuration](#text-to-speech-configuration)
- [Stock Assets Configuration](#stock-assets-configuration)
- [Music Configuration](#music-configuration)
- [Video Configuration](#video-configuration)
- [Configuration Management](#configuration-management)

---

## Environment Variables

All environment variables should be defined in a `.env` file in the root directory. Use `.env.example` as a template.

### AI Providers

#### OpenAI (Optional)
```bash
OPENAI_API_KEY=your_openai_api_key_here
```
- **Purpose**: Legacy support for OpenAI-based AI generation
- **Required**: No (optional fallback)
- **Get API Key**: https://platform.openai.com/api-keys

#### Gemini (Default AI Provider)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```
- **Purpose**: Primary AI provider for content generation (cost-optimized)
- **Required**: Yes (recommended)
- **Get API Key**: https://makersuite.google.com/app/apikey
- **Cost**: Free tier available with generous limits

#### Anthropic Claude (Alternative)
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```
- **Purpose**: Alternative AI provider with high-quality outputs
- **Required**: No (optional alternative)
- **Get API Key**: https://console.anthropic.com/

### Text-to-Speech Providers

#### Google Cloud TTS (Default)
```bash
GOOGLE_TTS_API_KEY=your_google_tts_api_key_here
```
- **Purpose**: Primary text-to-speech provider (cost-optimized)
- **Required**: Yes (recommended)
- **Get API Key**: https://cloud.google.com/text-to-speech
- **Cost**: $4 per 1 million characters (Neural2 voices)

#### ElevenLabs (Optional Fallback)
```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```
- **Purpose**: Alternative TTS provider with high-quality voices
- **Required**: No (optional fallback)
- **Get API Key**: https://elevenlabs.io/
- **Cost**: Free tier: 10,000 characters/month

### Stock Media Providers

All stock media providers listed below are free to use with API keys.

#### Pexels (Images & Videos)
```bash
PEXELS_API_KEY=your_pexels_api_key_here
```
- **Purpose**: Free stock photos and videos
- **Required**: Yes (primary stock source)
- **Get API Key**: https://www.pexels.com/api/
- **Limits**: 200 requests/minute, 20,000/month

#### Unsplash (Images Only)
```bash
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
UNSPLASH_APP_ID=your_unsplash_app_id_here
UNSPLASH_SECRET_KEY=your_unsplash_secret_key_here  # Optional for OAuth
```
- **Purpose**: Free high-quality stock photos
- **Required**: No (alternative source)
- **Get API Key**: https://unsplash.com/developers
- **Limits**: 50 requests/hour

#### Pixabay (Images, Videos & Music)
```bash
PIXABAY_API_KEY=your_pixabay_api_key_here
```
- **Purpose**: Free stock photos, videos, and music
- **Required**: No (alternative source)
- **Get API Key**: https://pixabay.com/api/docs/
- **Limits**: 100 requests/minute

### Application Settings

#### Server Configuration
```bash
FASTIFY_PORT=3000
```
- **Purpose**: Port for the curation UI server
- **Default**: 3000
- **Valid Range**: 1024-65535

#### Music Library
```bash
MUSIC_LIBRARY_PATH=./assets/music-library
```
- **Purpose**: Path to local music library (optional)
- **Default**: `./assets/music-library`
- **Format**: Relative or absolute path

### Remotion Rendering (Optional)

```bash
REMOTION_LICENSE_KEY=your_remotion_license_key_here
```
- **Purpose**: Required for Remotion pro features (not needed for basic usage)
- **Required**: No (only for pro features)
- **Get License**: https://www.remotion.dev/

---

## AI Configuration

**Location**: `config/ai.config.json`

This configuration controls AI providers used for content generation (script writing, scene descriptions, etc.).

### Schema Overview

```json
{
  "defaultProvider": "gemini-cli",
  "language": "en",
  "providers": { ... },
  "fallbackOrder": [ ... ]
}
```

### Top-Level Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `defaultProvider` | string | `"gemini-cli"` | Primary AI provider to use |
| `language` | string | `"en"` | Language code for content generation |
| `fallbackOrder` | string[] | `["gemini-cli", "codex", "claude-code"]` | Order of providers to try if primary fails |

### Provider Configuration

Each provider under `providers` has the following structure:

```json
{
  "name": "provider-name",
  "cliCommand": "command-name",
  "defaultModel": "model-name",
  "temperature": 0.7,
  "maxTokens": 8000,
  "enabled": true
}
```

#### Provider Fields

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `name` | string | - | Provider identifier |
| `cliCommand` | string | - | CLI command to invoke (e.g., `gemini`, `codex`, `claude`) |
| `defaultModel` | string | - | Model name to use |
| `temperature` | number | 0.0-2.0 | Creativity/randomness (0=deterministic, 2=very creative) |
| `maxTokens` | number | 1-32000 | Maximum tokens per response |
| `enabled` | boolean | - | Whether provider is enabled |

### Available Providers

#### 1. Gemini CLI (Recommended)
```json
{
  "name": "gemini-cli",
  "cliCommand": "gemini",
  "defaultModel": "gemini-1.5-flash",
  "temperature": 0.7,
  "maxTokens": 8000,
  "enabled": true
}
```
- **Cost**: Most cost-effective option
- **Speed**: Very fast
- **Quality**: Good for most use cases
- **Requires**: `gemini-cli` installed globally

#### 2. Codex (OpenAI)
```json
{
  "name": "codex",
  "cliCommand": "codex",
  "defaultModel": "gpt-4-turbo-preview",
  "temperature": 0.7,
  "maxTokens": 8000,
  "enabled": true
}
```
- **Cost**: Higher cost per token
- **Speed**: Moderate
- **Quality**: Excellent for creative content
- **Requires**: `codex-cli` installed globally

#### 3. Claude Code (Anthropic)
```json
{
  "name": "claude-code",
  "cliCommand": "claude",
  "defaultModel": "claude-3-5-sonnet-20241022",
  "temperature": 0.7,
  "maxTokens": 4000,
  "enabled": true
}
```
- **Cost**: Moderate
- **Speed**: Fast
- **Quality**: Excellent for structured content
- **Requires**: `claude-cli` installed globally

### Temperature Guidelines

- **0.0-0.3**: Deterministic, factual content (documentaries, educational)
- **0.4-0.7**: Balanced creativity (general storytelling)
- **0.8-1.2**: High creativity (entertainment, fiction)
- **1.3-2.0**: Maximum creativity (experimental, artistic)

---

## Text-to-Speech Configuration

**Location**: `config/tts.config.json`

Controls voice generation for video narration.

### Schema Overview

```json
{
  "defaultProvider": "google",
  "providers": { ... },
  "fallbackOrder": ["google", "elevenlabs"],
  "retryConfig": { ... },
  "caching": { ... }
}
```

### Top-Level Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `defaultProvider` | string | `"google"` | Primary TTS provider |
| `fallbackOrder` | string[] | `["google", "elevenlabs"]` | Fallback order if primary fails |

### Google Cloud TTS Provider

```json
{
  "name": "google",
  "enabled": true,
  "apiKey": "${GOOGLE_TTS_API_KEY}",
  "defaultVoice": { ... },
  "voices": { ... },
  "audioConfig": { ... }
}
```

#### Voice Configuration

Predefined voices available:

| Voice Name | Gender | Language | Voice ID | Use Case |
|------------|--------|----------|----------|----------|
| `male-casual` | Male | en-US | `en-US-Neural2-J` | Casual content, vlogs |
| `female-casual` | Female | en-US | `en-US-Neural2-F` | Casual content, vlogs |
| `male-professional` | Male | en-US | `en-US-Neural2-D` | Professional content, documentaries |
| `female-professional` | Female | en-US | `en-US-Neural2-C` | Professional content, documentaries |

#### Audio Configuration

```json
{
  "audioEncoding": "MP3",
  "speakingRate": 1.0,
  "pitch": 0.0,
  "volumeGainDb": 0.0
}
```

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `audioEncoding` | string | `MP3`, `LINEAR16`, `OGG_OPUS` | Output audio format |
| `speakingRate` | number | 0.25-4.0 | Speech speed (1.0 = normal) |
| `pitch` | number | -20.0 to 20.0 | Voice pitch adjustment (0 = normal) |
| `volumeGainDb` | number | -96.0 to 16.0 | Volume adjustment in decibels |

### ElevenLabs Provider

```json
{
  "name": "elevenlabs",
  "enabled": false,
  "apiKey": "${ELEVENLABS_API_KEY}",
  "defaultVoice": { ... },
  "voices": { ... },
  "modelId": "eleven_multilingual_v2",
  "outputFormat": "mp3_44100_128"
}
```

#### Voice Configuration

| Voice Name | Voice ID | Characteristics |
|------------|----------|-----------------|
| `rachel` | `21m00Tcm4TlvDq8ikWAM` | Clear, professional female voice |
| `domi` | `AZnzlk1XvdvUeBnXmlld` | Warm, confident female voice |
| `bella` | `EXAVITQu4vr4xnSDxMaL` | Soft, friendly female voice |

#### Voice Settings

```json
{
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "stability": 0.5,
  "similarityBoost": 0.75,
  "style": 0.0,
  "useSpeakerBoost": true
}
```

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `stability` | number | 0.0-1.0 | Voice consistency (higher = more stable) |
| `similarityBoost` | number | 0.0-1.0 | Voice similarity to original (higher = closer match) |
| `style` | number | 0.0-1.0 | Style exaggeration |
| `useSpeakerBoost` | boolean | - | Enhance speaker characteristics |

### Retry Configuration

```json
{
  "maxRetries": 3,
  "retryDelayMs": 1000,
  "backoffMultiplier": 2
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxRetries` | number | 3 | Maximum retry attempts on failure |
| `retryDelayMs` | number | 1000 | Initial delay between retries (ms) |
| `backoffMultiplier` | number | 2 | Exponential backoff multiplier |

### Caching Configuration

```json
{
  "enabled": true,
  "ttlSeconds": 2592000
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | true | Enable TTS result caching |
| `ttlSeconds` | number | 2592000 | Cache time-to-live (30 days) |

---

## Stock Assets Configuration

**Location**: `config/stock-assets.config.json`

Controls stock photos and videos sourcing for scenes.

### Schema Overview

```json
{
  "defaultProvider": "pexels",
  "providers": { ... },
  "fallbackOrder": ["pexels", "pixabay", "unsplash"],
  "qualityScoring": { ... },
  "deduplication": { ... },
  "download": { ... },
  "aspectRatios": { ... },
  "caching": { ... }
}
```

### Provider Configuration

#### Pexels (Primary Provider)

```json
{
  "name": "pexels",
  "enabled": true,
  "apiKey": "${PEXELS_API_KEY}",
  "baseUrl": "https://api.pexels.com/v1",
  "videoBaseUrl": "https://api.pexels.com/videos",
  "rateLimit": {
    "requestsPerMinute": 200,
    "requestsPerMonth": 20000
  },
  "searchDefaults": {
    "orientation": "landscape",
    "size": "large",
    "perPage": 20,
    "minWidth": 1920,
    "minHeight": 1080
  },
  "videoDefaults": {
    "orientation": "landscape",
    "size": "large",
    "perPage": 15,
    "minWidth": 1920,
    "minHeight": 1080,
    "minDuration": 5
  }
}
```

#### Search Configuration Options

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `orientation` | string | `landscape`, `portrait`, `square` | Image/video orientation |
| `size` | string | `large`, `medium`, `small` | Preferred size |
| `perPage` | number | 1-80 | Results per API request |
| `minWidth` | number | 1-∞ | Minimum width in pixels |
| `minHeight` | number | 1-∞ | Minimum height in pixels |
| `minDuration` | number | 1-∞ | Minimum video duration (seconds) |

#### Unsplash Configuration

```json
{
  "name": "unsplash",
  "enabled": true,
  "apiKey": "${UNSPLASH_ACCESS_KEY}",
  "baseUrl": "https://api.unsplash.com",
  "rateLimit": {
    "requestsPerHour": 50
  },
  "searchDefaults": {
    "orientation": "landscape",
    "perPage": 20,
    "orderBy": "relevant"
  }
}
```

**Order By Options**: `relevant`, `latest`

#### Pixabay Configuration

```json
{
  "name": "pixabay",
  "enabled": true,
  "apiKey": "${PIXABAY_API_KEY}",
  "searchDefaults": {
    "imageType": "photo",
    "orientation": "horizontal",
    "minWidth": 1920,
    "minHeight": 1080,
    "perPage": 20,
    "safeSearch": true
  }
}
```

**Image Types**: `all`, `photo`, `illustration`, `vector`

### Quality Scoring

```json
{
  "enabled": true,
  "weights": {
    "resolution": 0.3,
    "aspectRatioMatch": 0.25,
    "relevance": 0.25,
    "popularity": 0.2
  },
  "minQualityScore": 0.5
}
```

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `enabled` | boolean | - | Enable quality-based filtering |
| `weights.resolution` | number | 0.0-1.0 | Weight for resolution quality |
| `weights.aspectRatioMatch` | number | 0.0-1.0 | Weight for aspect ratio matching |
| `weights.relevance` | number | 0.0-1.0 | Weight for search relevance |
| `weights.popularity` | number | 0.0-1.0 | Weight for asset popularity |
| `minQualityScore` | number | 0.0-1.0 | Minimum acceptable quality score |

**Note**: Weights should sum to 1.0 for balanced scoring.

### Deduplication

```json
{
  "enabled": true,
  "similarityThreshold": 0.85,
  "checkPreviousProjects": false
}
```

| Field | Type | Range | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | - | Enable duplicate detection |
| `similarityThreshold` | number | 0.0-1.0 | Similarity threshold (higher = stricter) |
| `checkPreviousProjects` | boolean | - | Check against previous project assets |

### Download Configuration

```json
{
  "maxConcurrent": 5,
  "timeoutMs": 30000,
  "retryAttempts": 3,
  "retryDelayMs": 1000
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxConcurrent` | number | 5 | Max simultaneous downloads |
| `timeoutMs` | number | 30000 | Download timeout (ms) |
| `retryAttempts` | number | 3 | Max retry attempts on failure |
| `retryDelayMs` | number | 1000 | Delay between retries (ms) |

### Aspect Ratios

```json
{
  "16:9": {
    "width": 1920,
    "height": 1080,
    "orientation": "landscape"
  },
  "9:16": {
    "width": 1080,
    "height": 1920,
    "orientation": "portrait"
  }
}
```

**Supported Ratios**: `16:9` (YouTube landscape), `9:16` (YouTube Shorts/TikTok)

---

## Music Configuration

**Location**: `config/music.config.json`

Controls background music selection and audio mixing.

**Note**: Background music is disabled by default (`enabled: false`).

### Schema Overview

```json
{
  "enabled": false,
  "defaultSource": "pixabay",
  "sources": { ... },
  "selection": { ... },
  "audio": { ... },
  "download": { ... },
  "caching": { ... }
}
```

### Music Sources

#### Pixabay Music API

```json
{
  "name": "pixabay",
  "enabled": true,
  "apiKey": "${PIXABAY_API_KEY}",
  "baseUrl": "https://pixabay.com/api",
  "searchDefaults": {
    "perPage": 20,
    "minDuration": 120,
    "maxDuration": 900
  },
  "genres": [
    "ambient",
    "cinematic",
    "corporate",
    "documentary",
    "upbeat",
    "calm",
    "inspiring"
  ]
}
```

#### Local Music Library

```json
{
  "name": "local",
  "enabled": true,
  "libraryPath": "${MUSIC_LIBRARY_PATH}",
  "allowedExtensions": [".mp3", ".wav", ".m4a"],
  "scanOnStartup": true
}
```

### Music Selection

```json
{
  "defaultGenre": "ambient",
  "moodMatching": {
    "enabled": true,
    "aiProvider": "gemini-cli"
  },
  "durationMatching": {
    "enabled": true,
    "allowLooping": true,
    "fadeInMs": 2000,
    "fadeOutMs": 3000
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `defaultGenre` | string | Default music genre if mood matching fails |
| `moodMatching.enabled` | boolean | Use AI to match music to content mood |
| `moodMatching.aiProvider` | string | AI provider for mood analysis |
| `durationMatching.enabled` | boolean | Match music duration to video length |
| `durationMatching.allowLooping` | boolean | Loop music if shorter than video |
| `fadeInMs` | number | Music fade-in duration (ms) |
| `fadeOutMs` | number | Music fade-out duration (ms) |

### Audio Processing

```json
{
  "volumeDucking": {
    "enabled": true,
    "duckVolumePercent": 20,
    "fadeMs": 500
  },
  "normalization": {
    "enabled": true,
    "targetLufs": -16
  },
  "defaultVolume": 0.3
}
```

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `volumeDucking.enabled` | boolean | - | Lower music volume during narration |
| `duckVolumePercent` | number | 0-100 | Music volume during narration (% of normal) |
| `fadeMs` | number | 0-∞ | Ducking transition duration (ms) |
| `normalization.enabled` | boolean | - | Normalize audio levels |
| `targetLufs` | number | -23 to -13 | Target loudness (LUFS) |
| `defaultVolume` | number | 0.0-1.0 | Default music volume level |

---

## Video Configuration

**Location**: `config/video.config.json`

Controls video composition, rendering, and visual effects.

### Schema Overview

```json
{
  "defaultAspectRatio": "16:9",
  "aspectRatios": { ... },
  "duration": { ... },
  "rendering": { ... },
  "intro": { ... },
  "transitions": { ... },
  "text": { ... },
  "animations": { ... },
  "validation": { ... }
}
```

### Aspect Ratios

```json
{
  "defaultAspectRatio": "16:9",
  "aspectRatios": {
    "16:9": {
      "width": 1920,
      "height": 1080,
      "name": "landscape",
      "description": "YouTube horizontal (default)",
      "fps": 30
    },
    "9:16": {
      "width": 1080,
      "height": 1920,
      "name": "portrait",
      "description": "YouTube Shorts, TikTok, Instagram Reels",
      "fps": 30
    }
  }
}
```

**Supported FPS**: 24, 30, 60

### Duration Settings

```json
{
  "targetSeconds": 720,
  "minSeconds": 600,
  "maxSeconds": 900
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `targetSeconds` | number | 720 | Target video duration (12 minutes) |
| `minSeconds` | number | 600 | Minimum duration (10 minutes) |
| `maxSeconds` | number | 900 | Maximum duration (15 minutes) |

### Rendering Configuration

```json
{
  "defaultQuality": "draft",
  "qualities": {
    "draft": {
      "codec": "h264",
      "crf": 28,
      "preset": "ultrafast",
      "audioBitrate": "128k"
    },
    "medium": {
      "codec": "h264",
      "crf": 23,
      "preset": "medium",
      "audioBitrate": "192k"
    },
    "high": {
      "codec": "h264",
      "crf": 18,
      "preset": "slow",
      "audioBitrate": "320k"
    },
    "production": {
      "codec": "h264",
      "crf": 15,
      "preset": "veryslow",
      "audioBitrate": "320k"
    }
  },
  "concurrency": 4,
  "timeoutMinutes": 60
}
```

#### Quality Presets

| Preset | CRF | Preset | Audio | Use Case | Render Time |
|--------|-----|--------|-------|----------|-------------|
| `draft` | 28 | ultrafast | 128k | Quick previews | Fastest |
| `medium` | 23 | medium | 192k | Testing, reviews | Fast |
| `high` | 18 | slow | 320k | Final videos | Moderate |
| `production` | 15 | veryslow | 320k | Professional delivery | Slowest |

**CRF Range**: 0 (lossless) to 51 (worst quality). Lower = better quality, larger file size.

**FFmpeg Presets**: `ultrafast`, `superfast`, `veryfast`, `faster`, `fast`, `medium`, `slow`, `slower`, `veryslow`

### Intro Configuration

```json
{
  "enabled": true,
  "durationMs": 1000,
  "titleAnimation": "fade",
  "backgroundColor": "#FFD700"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Show intro slide with title |
| `durationMs` | number | Intro duration (ms) |
| `titleAnimation` | string | Animation type: `fade`, `slide`, `scale` |
| `backgroundColor` | string | Hex color code |

### Transitions

```json
{
  "defaultEnter": "fade",
  "defaultExit": "fade",
  "durationMs": 500,
  "available": ["fade", "blur", "none"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `defaultEnter` | string | Default enter transition |
| `defaultExit` | string | Default exit transition |
| `durationMs` | number | Transition duration (ms) |
| `available` | string[] | Available transition types |

**Available Transitions**: `fade`, `blur`, `slide`, `scale`, `none`

### Text Configuration

```json
{
  "position": "bottom",
  "maxCharactersPerLine": 40,
  "maxLines": 2,
  "fontSize": 48,
  "fontFamily": "Inter",
  "fontWeight": 700,
  "color": "#FFFFFF",
  "strokeColor": "#000000",
  "strokeWidth": 2,
  "backgroundColor": "rgba(0, 0, 0, 0.7)",
  "padding": 20
}
```

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `position` | string | `top`, `center`, `bottom` | Text vertical position |
| `maxCharactersPerLine` | number | 1-∞ | Max characters before line break |
| `maxLines` | number | 1-∞ | Max lines of text |
| `fontSize` | number | 1-∞ | Font size in pixels |
| `fontFamily` | string | Any | Font name (from Google Fonts) |
| `fontWeight` | number | 100-900 | Font weight |
| `color` | string | Hex/RGBA | Text color |
| `strokeColor` | string | Hex/RGBA | Text outline color |
| `strokeWidth` | number | 0-∞ | Text outline width (px) |
| `backgroundColor` | string | Hex/RGBA | Text background color |
| `padding` | number | 0-∞ | Text background padding (px) |

### Animations

```json
{
  "background": {
    "defaultType": "zoom",
    "alternateDirection": true,
    "types": {
      "zoom": {
        "scaleFrom": 1.0,
        "scaleTo": 1.2,
        "easingFunction": "easeInOut"
      },
      "pan": {
        "enabled": false
      }
    }
  },
  "text": {
    "wordAnimation": "scale",
    "scaleFrom": 0.8,
    "scaleTo": 1.0,
    "durationMs": 200
  }
}
```

#### Background Animation Options

| Animation Type | Parameters | Description |
|----------------|------------|-------------|
| `zoom` | `scaleFrom`, `scaleTo` | Gradual zoom in/out |
| `pan` | `direction`, `distance` | Pan across image |
| `rotate` | `degrees` | Rotate around center |
| `none` | - | No animation |

#### Easing Functions

- `linear`: Constant speed
- `easeIn`: Slow start, fast end
- `easeOut`: Fast start, slow end
- `easeInOut`: Slow start/end, fast middle

### Validation

```json
{
  "checkAssetExists": true,
  "checkAudioSync": true,
  "checkTimelineGaps": true,
  "maxGapMs": 100
}
```

| Field | Type | Description |
|-------|------|-------------|
| `checkAssetExists` | boolean | Verify all assets exist before rendering |
| `checkAudioSync` | boolean | Verify audio/video synchronization |
| `checkTimelineGaps` | boolean | Check for gaps in timeline |
| `maxGapMs` | number | Maximum acceptable gap (ms) |

---

## Configuration Management

### Loading Configurations

The configuration system automatically:

1. Loads JSON files from the `config/` directory
2. Validates against Zod schemas
3. Replaces environment variable placeholders (`${VAR_NAME}`)
4. Caches results for performance

### Environment Variable Interpolation

Config files can reference environment variables using `${VAR_NAME}` syntax:

```json
{
  "apiKey": "${PEXELS_API_KEY}"
}
```

This will be automatically replaced with the value from your `.env` file.

### Configuration Priority

1. **Environment Variables**: Highest priority (`.env` file)
2. **Config Files**: JSON configuration in `config/` directory
3. **Defaults**: Built-in defaults in code

### Configuration Validation

All configurations are validated using Zod schemas. Invalid configurations will produce descriptive error messages:

```
Configuration validation failed for ai.config:
  - providers.gemini-cli.temperature: Number must be less than or equal to 2
  - providers.codex.maxTokens: Expected number, received string
```

### Cache Management

Configurations are cached in memory for performance. To reload configurations:

```typescript
import { ConfigManager } from './cli/lib/config';

// Clear cache to force reload
ConfigManager.clearCache();
```

### Custom Configurations

To add custom configuration options:

1. Update the JSON file in `config/`
2. Update the corresponding Zod schema in `cli/lib/config.ts`
3. Clear the configuration cache

### Best Practices

1. **Never commit API keys**: Use `.env` file for sensitive data
2. **Use fallback providers**: Configure multiple providers for reliability
3. **Test configurations**: Run `npm run test` to verify setup
4. **Start with defaults**: Modify only what you need
5. **Document changes**: Comment complex configuration choices
6. **Version control**: Commit config files (without secrets) to track changes
7. **Environment-specific configs**: Use different `.env` files for dev/prod

---

## Quick Reference

### Default Provider Hierarchy

1. **AI**: Gemini CLI → Codex → Claude Code
2. **TTS**: Google Cloud TTS → ElevenLabs
3. **Stock Assets**: Pexels → Pixabay → Unsplash
4. **Music**: Pixabay → Local Library

### Recommended Settings for Different Use Cases

#### Cost-Optimized (Default)
- AI: Gemini CLI
- TTS: Google Cloud TTS
- Stock: Pexels
- Music: Disabled or Pixabay

#### Quality-Focused
- AI: Claude Code or GPT-4
- TTS: ElevenLabs
- Stock: Unsplash + Pexels
- Music: Local library with high-quality tracks

#### Speed-Optimized
- AI: Gemini CLI (gemini-1.5-flash)
- TTS: Google Cloud TTS
- Stock: Pexels only (disable fallbacks)
- Music: Disabled
- Rendering: Draft quality

#### Production-Ready
- AI: Claude Code with temperature 0.5
- TTS: ElevenLabs with stability 0.7
- Stock: All providers enabled with quality scoring
- Music: Curated local library
- Rendering: High or production quality

---

For setup instructions and API key acquisition, see [SETUP.md](./SETUP.md).
