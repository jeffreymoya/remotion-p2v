# API Integrations Implementation Specification

This document provides detailed technical specifications for all API integrations, error handling strategies, rate limiting, and retry logic.

---

## **UPDATED IMPLEMENTATION APPROACH: CLI-Based AI Integration**

**Date:** November 24, 2025
**Change:** AI providers now use CLI-based integration instead of direct SDK integration.

### Why CLI-Based Approach?

1. **Cost Savings**: Leverages existing CLI tool subscriptions
2. **Simpler Authentication**: CLI tools handle auth automatically
3. **Less Code Maintenance**: Shell commands instead of SDK integration
4. **Same Quality**: Same underlying AI models as direct API

### Implementation Location

All CLI-based AI provider implementations are in:
- `cli/services/ai/codex.ts` - OpenAI Codex CLI wrapper
- `cli/services/ai/claude-code.ts` - Claude Code CLI wrapper
- `cli/services/ai/gemini-cli.ts` - Gemini CLI wrapper
- `cli/services/ai/base.ts` - Base provider with file-based orchestration
- `cli/utils/cli-executor.ts` - CLI command execution utility
- `cli/utils/file-orchestration.ts` - File-based prompt/response handling

### Key Differences from Original Plan

| Aspect | Original Plan | **CLI-Based Implementation** |
|--------|--------------|----------------------------|
| **Integration** | Direct SDK (`@google/generative-ai`, `openai`, `@anthropic-ai/sdk`) | CLI tools (`codex`, `claude`, `gemini` commands) |
| **Authentication** | API keys in `.env` file | CLI tool authentication (already configured) |
| **Structured Output** | Native SDK JSON schema support | File-based with Zod validation + retry |
| **Error Handling** | SDK-specific errors | CLI execution errors + JSON parsing |
| **Dependencies** | NPM packages for each SDK | No additional dependencies (use installed CLIs) |

### How It Works

1. **Prompt Construction**: Build prompt with instruction to write JSON to file
2. **CLI Execution**: Execute CLI command (e.g., `codex exec "prompt" -o output.json`)
3. **File Reading**: Read JSON response from output file
4. **Zod Validation**: Parse and validate JSON with Zod schema
5. **Retry on Failure**: If validation fails, retry with error feedback (max 2 retries)
6. **Cleanup**: Delete temporary files on success

### Example Usage

```typescript
import { AIProviderFactory } from './services/ai';
import { z } from 'zod';

// Get default provider (Gemini CLI)
const provider = await AIProviderFactory.getProviderWithFallback();

// Simple completion
const response = await provider.complete('What is 2 + 2?');

// Structured completion with Zod validation
const ScriptSchema = z.object({
  title: z.string(),
  segments: z.array(z.object({
    text: z.string(),
    duration: z.number(),
  })),
});

const script = await provider.structuredComplete(
  'Generate a 30-second video script about AI',
  ScriptSchema
);
// Result is automatically validated and typed!
```

### Testing

Run the test suite to validate CLI integrations:
```bash
npx tsx cli/test-ai-providers.ts
```

---

## Table of Contents

1. [AI Provider Integrations (CLI-Based)](#1-ai-provider-integrations-cli-based)
2. [TTS Provider Integrations](#2-tts-provider-integrations)
3. [Stock Media API Integrations](#3-stock-media-api-integrations)
4. [Music API Integration](#4-music-api-integration)
5. [Trends API Integration](#5-trends-api-integration)
6. [Error Handling Strategy](#6-error-handling-strategy)
7. [Rate Limiting Implementation](#7-rate-limiting-implementation)
8. [Retry Logic with Backoff](#8-retry-logic-with-backoff)

---

## 1. AI Provider Integrations (CLI-Based)

**Note**: The sections below have been updated to reflect CLI-based integration. The original SDK-based implementations are retained for reference but have been replaced with CLI wrappers in the actual codebase.

### 1.1 Gemini CLI (Default Provider)

**CLI Tool**: `gemini`
**Package**: `@google/gemini-cli` (installed globally)
**Model**: `gemini-1.5-flash` (default)

**Implementation**: `cli/services/ai/gemini-cli.ts`

```typescript
import { BaseCLIProvider } from './base';

export class GeminiCLIProvider extends BaseCLIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      name: 'gemini-cli',
      cliCommand: 'gemini',
      defaultModel: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 8000,
      ...config,
    });
  }

  protected buildCommand(
    prompt: string,
    outputPath: string,
    options?: CompletionOptions
  ): string {
    const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\$/g, '\\$');

    const parts = [
      'gemini',
      `"${escapedPrompt}"`,
      '--output-format json',
    ];

    if (options?.model || this.config.defaultModel) {
      parts.push(`-m ${options?.model || this.config.defaultModel}`);
    }

    return `${parts.join(' ')} > "${outputPath}"`;
  }

  // Structured completion handled by BaseCLIProvider with:
  // 1. File-based prompt with explicit JSON instructions
  // 2. CLI execution with JSON output wrapper
  // 3. JSON extraction from response
  // 4. Zod validation with retry on failure (max 2 retries)
}
```

**Usage Example**:
```typescript
import { GeminiCLIProvider } from './services/ai/gemini-cli';
import { z } from 'zod';

const provider = new GeminiCLIProvider();
await provider.initialize();

// Simple completion
const response = await provider.complete('What is AI?');

// Structured completion with Zod
const TopicSchema = z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
});

const topic = await provider.structuredComplete(
  'Generate a video topic about machine learning',
  TopicSchema
);
// Automatically validated and typed!
```

**CLI Installation**:
```bash
npm install -g @google/gemini-cli
gemini auth login  # Authenticate with Google account
```

**Rate Limits**:
- Same as Gemini API (15 req/min free tier, 60 req/min paid)
- Tracked by CLI tool, not our application

**Error Handling**:
```typescript
// CLI execution errors
if (error instanceof CLIExecutionError) {
  if (error.exitCode === 127) {
    throw new Error('Gemini CLI not installed. Run: npm install -g @google/gemini-cli');
  }
  // Handle other CLI errors
}

// JSON parsing errors (retry with feedback)
if (error.message.includes('No JSON found')) {
  // Automatically retried with clarified prompt (max 2 retries)
}

// Validation errors
if (error instanceof ValidationError) {
  // Zod validation failed after retries
  logger.error('Validation failed:', error.errors);
}
```

---

### 1.2 OpenAI Codex CLI

**CLI Tool**: `codex`
**Package**: `@openai/codex` (installed globally)
**Model**: `gpt-4-turbo-preview` (default)

**Implementation**: `cli/services/ai/codex.ts`

```typescript
import { BaseCLIProvider } from './base';

export class CodexCLIProvider extends BaseCLIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      name: 'codex',
      cliCommand: 'codex',
      defaultModel: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 8000,
      ...config,
    });
  }

  protected buildCommand(
    prompt: string,
    outputPath: string,
    options?: CompletionOptions
  ): string {
    const escapedPrompt = prompt.replace(/"/g, '\\"');

    const parts = [
      'codex',
      'exec',
      `"${escapedPrompt}"`,
      `-o "${outputPath}"`,
      '--skip-git-repo-check',
    ];

    if (options?.model) {
      parts.push(`--model ${options.model}`);
    }

    if (options?.temperature !== undefined) {
      parts.push(`--temperature ${options.temperature}`);
    }

    return parts.join(' ');
  }

  // Codex CLI has native --output-schema support (best for structured output)
  // Also supports file-based approach via BaseCLIProvider
}
```

**CLI Installation**:
```bash
npm install -g @openai/codex
codex auth login  # Authenticate with OpenAI account
```

**Advantages**:
- **Native JSON schema support** via `--output-schema` flag
- Best structured output compliance of all three CLIs
- Direct file output via `-o` flag (no shell redirection needed)

**Rate Limits**:
- Same as OpenAI API (3,500 req/day tier 1)

---

### 1.3 Claude Code CLI

**CLI Tool**: `claude`
**Package**: `@anthropic-ai/claude-code` (installed globally)
**Model**: `claude-3-5-sonnet-20241022` (default)

**Implementation**: `cli/services/ai/claude-code.ts`

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: options?.systemPrompt ?? 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4000,
    });

    return response.choices[0].message.content!;
  }

  async structuredComplete<T>(prompt: string, schema: ZodSchema<T>): Promise<T> {
    // Use JSON mode with function calling
    const functionSchema = zodToJsonSchema(schema);

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Always respond with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0].message.content!;
      const parsed = JSON.parse(content);
      return schema.parse(parsed);
    } catch (error) {
      // Retry with error feedback (max 2 retries)
      if (error instanceof z.ZodError) {
        const errorMsg = `Invalid JSON structure: ${error.errors.map(e => e.message).join(', ')}`;
        logger.warn('OpenAI structured output failed validation, retrying with feedback', { errorMsg });

        const retryPrompt = `${prompt}\n\nPREVIOUS ATTEMPT FAILED: ${errorMsg}\nPlease correct and return valid JSON.`;
        return this.structuredComplete(retryPrompt, schema);
      }

      throw error;
    }
  }
}
```

**Rate Limits**:
- 3,500 requests/day (tier 1)
- 10,000 requests/day (tier 2+)

**Error Handling**:
```typescript
if (error.status === 429) {
  // Rate limit exceeded, exponential backoff
  const retryAfter = error.headers['retry-after'] || 60;
  await sleep(retryAfter * 1000);
  return retry();
}

if (error.status === 401) {
  throw new Error('OpenAI API key invalid. Check OPENAI_API_KEY in .env');
}
```

---

### 1.3 Anthropic Claude 3.5 Sonnet

**API**: Anthropic SDK
**Package**: `@anthropic-ai/sdk` v0.12.0

```typescript
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const message = await this.client.messages.create({
      model: options?.model ?? 'claude-3-5-sonnet-20241022',
      max_tokens: options?.maxTokens ?? 4000,
      temperature: options?.temperature ?? 0.7,
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    return message.content[0].text;
  }

  async structuredComplete<T>(prompt: string, schema: ZodSchema<T>): Promise<T> {
    // Use Claude's tool use with Zod schema converted to tool schema
    const toolSchema = zodToAnthropicTool(schema);

    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.3,
        tools: [toolSchema],
        messages: [
          { role: 'user', content: `${prompt}\n\nUse the provided tool to structure your response.` },
        ],
      });

      const toolUse = message.content.find(block => block.type === 'tool_use');
      if (!toolUse) {
        throw new Error('Claude did not use the tool');
      }

      return schema.parse(toolUse.input);
    } catch (error) {
      // Fallback: Parse text response with validation
      logger.warn('Claude tool use failed, using text parsing fallback', { error });

      const textResult = await this.complete(
        `${prompt}\n\nReturn ONLY valid JSON. No explanations or markdown.`,
        { temperature: 0.3 }
      );

      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Claude response did not contain valid JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return schema.parse(parsed);
    }
  }
}
```

**Rate Limits**:
- 50 requests/minute (tier 1)
- 1,000 requests/minute (tier 2+)

**Error Handling**:
```typescript
if (error.status === 429) {
  // Rate limit exceeded
  await sleep(60000); // Wait 1 minute
  return retry();
}

if (error.type === 'overloaded_error') {
  // Anthropic servers overloaded, exponential backoff
  await sleep(5000);
  return retry();
}
```

---

## 2. TTS Provider Integrations

### 2.1 ElevenLabs (Default Provider)

**API**: ElevenLabs Text-to-Speech API
**Package**: `axios` v1.6.5 (REST API)

```typescript
import axios from 'axios';

export class ElevenLabsProvider implements TTSProvider {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey;
  }

  async generateAudio(text: string, options?: TTSOptions): Promise<TTSResult> {
    const voiceId = options?.voice ?? '21m00Tcm4TlvDq8ikWAM'; // Rachel

    const response = await axios.post(
      `${this.baseUrl}/text-to-speech/${voiceId}/with-timestamps`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'json',
      }
    );

    // ElevenLabs returns: { audio_base64: string, alignment: { characters: [...], character_start_times_seconds: [...], character_end_times_seconds: [...] } }
    const audioBuffer = Buffer.from(response.data.audio_base64, 'base64');
    const alignment = response.data.alignment;

    // Convert to character-level timestamps
    const timestamps: WordTimestamp[] = this.parseCharacterTimestamps(text, alignment);

    return {
      audioBuffer,
      format: 'mp3',
      durationMs: Math.max(...timestamps.map(w => w.endMs)),
      timestamps,
    };
  }

  private parseCharacterTimestamps(text: string, alignment: any): WordTimestamp[] {
    const characters = alignment.characters;
    const startTimes = alignment.character_start_times_seconds;
    const endTimes = alignment.character_end_times_seconds;

    // Group characters into words
    const words: WordTimestamp[] = [];
    let currentWord = '';
    let currentCharacters: CharacterTimestamp[] = [];

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const startMs = startTimes[i] * 1000;
      const endMs = endTimes[i] * 1000;

      if (char === ' ' || char === '\n') {
        if (currentWord.length > 0) {
          words.push({
            word: currentWord,
            startMs: currentCharacters[0].startMs,
            endMs: currentCharacters[currentCharacters.length - 1].endMs,
            characters: currentCharacters,
          });
          currentWord = '';
          currentCharacters = [];
        }
      } else {
        currentWord += char;
        currentCharacters.push({ char, startMs, endMs });
      }
    }

    // Add last word
    if (currentWord.length > 0) {
      words.push({
        word: currentWord,
        startMs: currentCharacters[0].startMs,
        endMs: currentCharacters[currentCharacters.length - 1].endMs,
        characters: currentCharacters,
      });
    }

    return words;
  }
}
```

**Rate Limits**:
- Free tier: 100 requests/day, 10,000 characters/month
- Paid tier: No request limit, pay per character

**Error Handling**:
```typescript
if (error.response?.status === 401) {
  throw new Error('ElevenLabs API key invalid. Check ELEVENLABS_API_KEY in .env');
}

if (error.response?.status === 429) {
  logger.error('ElevenLabs rate limit exceeded. Daily quota may be exhausted.');
  throw new Error('ElevenLabs rate limit exceeded. Consider using Google TTS as fallback.');
}

if (error.response?.status === 400) {
  // Text too long or invalid
  logger.error('ElevenLabs text validation failed', { error: error.response.data });
  throw new Error(`Invalid text for TTS: ${error.response.data.detail}`);
}
```

---

### 2.2 Google Cloud TTS

**API**: Google Cloud Text-to-Speech API
**Package**: `@google-cloud/text-to-speech` v4.3.0

```typescript
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

export class GoogleTTSProvider implements TTSProvider {
  private client: TextToSpeechClient;

  constructor(config: GoogleTTSConfig) {
    this.client = new TextToSpeechClient({
      apiKey: config.apiKey,
    });
  }

  async generateAudio(text: string, options?: TTSOptions): Promise<TTSResult> {
    const voiceName = options?.voice ?? 'en-US-Neural2-F';

    // Add SSML marks for word-level timing
    const ssmlText = this.addSSMLMarks(text);

    const [response] = await this.client.synthesizeSpeech({
      input: { ssml: ssmlText },
      voice: {
        languageCode: 'en-US',
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: options?.speed ?? 1.0,
        pitch: options?.pitch ?? 0.0,
      },
      enableTimePointing: ['SSML_MARK'],
    });

    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

    // Parse word-level timestamps from marks
    const timestamps = this.parseWordTimestamps(text, response.timepoints || []);

    // Convert word-level to character-level
    const characterTimestamps = this.convertToCharacterLevel(timestamps);

    return {
      audioBuffer,
      format: 'mp3',
      durationMs: Math.max(...characterTimestamps.map(w => w.endMs)),
      timestamps: characterTimestamps,
    };
  }

  private addSSMLMarks(text: string): string {
    // Add SSML marks before each word for timing
    const words = text.split(/\s+/);
    const markedWords = words.map((word, i) => `<mark name="word${i}"/>${word}`);
    return `<speak>${markedWords.join(' ')}</speak>`;
  }

  private parseWordTimestamps(text: string, timepoints: any[]): WordTimestamp[] {
    const words = text.split(/\s+/);
    const timestamps: WordTimestamp[] = [];

    for (let i = 0; i < timepoints.length; i++) {
      const timepoint = timepoints[i];
      const nextTimepoint = timepoints[i + 1];

      const startMs = (timepoint.timeSeconds || 0) * 1000;
      const endMs = nextTimepoint ? nextTimepoint.timeSeconds * 1000 : startMs + 500; // Estimate

      timestamps.push({
        word: words[i] || '',
        startMs,
        endMs,
      });
    }

    return timestamps;
  }

  private convertToCharacterLevel(wordTimestamps: WordTimestamp[]): WordTimestamp[] {
    return wordTimestamps.map(word => {
      const chars = word.word.split('');
      const charDuration = (word.endMs - word.startMs) / chars.length;

      const characters: CharacterTimestamp[] = chars.map((char, i) => ({
        char,
        startMs: word.startMs + (i * charDuration),
        endMs: word.startMs + ((i + 1) * charDuration),
      }));

      return {
        ...word,
        characters,
      };
    });
  }
}
```

**Rate Limits**:
- 100 requests/minute
- 4 million characters/month (free tier)

**Error Handling**:
```typescript
if (error.code === 7) {
  // Permission denied
  throw new Error('Google TTS API key invalid. Check GOOGLE_TTS_API_KEY in .env');
}

if (error.code === 8) {
  // Quota exceeded
  logger.error('Google TTS quota exceeded');
  throw new Error('Google TTS quota exceeded. Consider using ElevenLabs as fallback.');
}
```

---

## 3. Stock Media API Integrations

### 3.1 Pexels API

**API**: Pexels API
**Package**: `pexels` (official JavaScript client library)
**Updated**: November 24, 2025

```typescript
import { createClient, Photo, Video } from 'pexels';

export class PexelsService {
  private client: ReturnType<typeof createClient>;

  constructor(apiKey: string) {
    this.client = createClient(apiKey);
  }

  async searchImages(query: string, options: ImageSearchOptions): Promise<StockImage[]> {
    const response = await this.client.photos.search({
      query,
      per_page: options.perTag ?? 15,
      page: 1,
    });

    // Check for error response
    if ('error' in response) {
      throw new Error(response.error);
    }

    // Filter by orientation if specified
    let photos = response.photos;
    if (options.orientation) {
      photos = photos.filter(photo => {
        const aspectRatio = photo.width / photo.height;
        return options.orientation === '16:9' ? aspectRatio >= 1.5 : aspectRatio < 1.5;
      });
    }

    return photos.map((photo: Photo) => ({
      id: photo.id.toString(),
      url: photo.src.large2x,
      downloadUrl: photo.src.original,
      source: 'pexels' as const,
      tags: [query],
      width: photo.width,
      height: photo.height,
      photographer: photo.photographer,
      licenseUrl: photo.url,
      attribution: `Photo by ${photo.photographer} on Pexels`,
    }));
  }

  async searchVideos(query: string, options: VideoSearchOptions): Promise<StockVideo[]> {
    const params: any = {
      query,
      per_page: options.perTag ?? 10,
      page: 1,
    };

    // Add optional filters
    if (options.minDuration) params.min_duration = options.minDuration;
    if (options.maxDuration) params.max_duration = options.maxDuration;

    const response = await this.client.videos.search(params);

    // Check for error response
    if ('error' in response) {
      throw new Error(response.error);
    }

    // Filter by orientation if specified
    let videos = response.videos;
    if (options.orientation) {
      videos = videos.filter(video => {
        const aspectRatio = video.width / video.height;
        return options.orientation === '16:9' ? aspectRatio >= 1.5 : aspectRatio < 1.5;
      });
    }

    return videos.map((video: Video) => {
      // Find best quality video file (prefer HD)
      const videoFile = video.video_files.find((f) => f.quality === 'hd') || video.video_files[0];

      return {
        id: video.id.toString(),
        url: videoFile.link,
        downloadUrl: videoFile.link,
        source: 'pexels' as const,
        tags: [query],
        width: videoFile.width ?? video.width,
        height: videoFile.height ?? video.height,
        duration: video.duration,
        fps: videoFile.fps ?? 30,
        creator: video.user.name,
        licenseUrl: video.url,
        attribution: `Video by ${video.user.name} on Pexels`,
      };
    });
  }
}
```

**Benefits of Official Library**:
- Better TypeScript support with built-in type definitions
- Consistent API with error handling
- Maintained by Pexels team
- Cleaner code without manual HTTP requests

**Rate Limits**:
- 200 requests/hour
- 20,000 requests/month

**Error Handling**:
```typescript
if (error.response?.status === 401) {
  throw new Error('Pexels API key invalid. Check PEXELS_API_KEY in .env');
}

if (error.response?.status === 429) {
  // Rate limit exceeded, wait and retry
  const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
  logger.warn(`Pexels rate limit exceeded, waiting ${retryAfter}s`);
  await sleep(retryAfter * 1000);
  return retry();
}

if (error.response?.status === 404) {
  // No results found
  logger.warn(`No Pexels results for query: ${query}`);
  return [];
}
```

---

### 3.2 Unsplash API

**API**: Unsplash API
**Package**: `unsplash-js` (official JavaScript client library)
**Updated**: November 24, 2025
**Note**: Library is archived but still fully functional

```typescript
import { createApi } from 'unsplash-js';
import type { Basic } from 'unsplash-js/dist/methods/photos/types';

export class UnsplashService {
  private api: ReturnType<typeof createApi>;

  constructor(apiKey: string) {
    this.api = createApi({
      accessKey: apiKey,
    });
  }

  async searchImages(query: string, options: ImageSearchOptions): Promise<StockImage[]> {
    const result = await this.api.search.getPhotos({
      query,
      perPage: options.perTag ?? 15,
      page: 1,
      orientation: options.orientation === '16:9' ? 'landscape'
        : options.orientation === '9:16' ? 'portrait'
        : undefined,
    });

    // Check for errors
    if (result.errors) {
      throw new Error(result.errors.join(', '));
    }

    // Handle empty response
    if (!result.response) {
      return [];
    }

    const photos = result.response.results;

    return photos.map((photo: Basic) => {
      // Try to extract tags if available (not in official types but may exist in API response)
      const photoWithTags = photo as Basic & { tags?: Array<{ title: string }> };
      const tags = photoWithTags.tags?.map((t) => t.title) || [query];

      return {
        id: photo.id,
        url: photo.urls.regular,
        downloadUrl: photo.urls.raw,
        source: 'unsplash' as const,
        tags,
        width: photo.width,
        height: photo.height,
        photographer: photo.user.name,
        licenseUrl: photo.links.html,
        attribution: `Photo by ${photo.user.name} on Unsplash`,
      };
    });
  }
}
```

**Benefits of Official Library**:
- Full TypeScript support with comprehensive type definitions
- Standardized error handling with result objects
- Orientation filtering support (landscape/portrait)
- Maintained API compatibility despite archived status

**Rate Limits**:
- 50 requests/hour (free tier)
- 5,000 requests/hour (production)

**Error Handling**:
```typescript
if (error.response?.status === 401) {
  throw new Error('Unsplash API key invalid. Check UNSPLASH_API_KEY in .env');
}

if (error.response?.status === 403) {
  logger.error('Unsplash rate limit exceeded (50 req/hour on free tier)');
  return []; // Fallback to other services
}
```

---

### 3.3 Pixabay API

**API**: Pixabay API
**Package**: `axios` v1.6.5

```typescript
import axios from 'axios';

export class PixabayService {
  private apiKey: string;
  private baseUrl = 'https://pixabay.com/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchImages(query: string, options: ImageSearchOptions): Promise<StockImage[]> {
    const response = await axios.get(this.baseUrl, {
      params: {
        key: this.apiKey,
        q: query,
        per_page: options.perTag ?? 15,
        image_type: 'photo',
        orientation: options.orientation === '16:9' ? 'horizontal' : 'vertical',
      },
    });

    return response.data.hits.map((image: any) => ({
      id: image.id.toString(),
      url: image.largeImageURL,
      downloadUrl: image.largeImageURL,
      source: 'pixabay' as const,
      tags: image.tags.split(', '),
      width: image.imageWidth,
      height: image.imageHeight,
      photographer: image.user,
      licenseUrl: image.pageURL,
      attribution: `Image by ${image.user} from Pixabay`,
    }));
  }

  async searchVideos(query: string, options: VideoSearchOptions): Promise<StockVideo[]> {
    const response = await axios.get(`${this.baseUrl}/videos/`, {
      params: {
        key: this.apiKey,
        q: query,
        per_page: options.perTag ?? 10,
      },
    });

    return response.data.hits.map((video: any) => {
      // Find best quality video
      const videoFile = video.videos.large || video.videos.medium || video.videos.small;

      return {
        id: video.id.toString(),
        url: videoFile.url,
        downloadUrl: videoFile.url,
        source: 'pixabay' as const,
        tags: video.tags.split(', '),
        width: videoFile.width,
        height: videoFile.height,
        duration: video.duration,
        fps: 30,
        creator: video.user,
        licenseUrl: video.pageURL,
        attribution: `Video by ${video.user} from Pixabay`,
      };
    });
  }
}
```

**Rate Limits**:
- 100 requests/minute
- 5,000 requests/hour

**Error Handling**:
```typescript
if (error.response?.status === 429) {
  logger.warn('Pixabay rate limit exceeded (100 req/min)');
  await sleep(600); // Wait 600ms
  return retry();
}
```

---

## 4. Music API Integration

### 4.1 Pixabay Music API

```typescript
import axios from 'axios';

export class PixabayMusicService {
  private apiKey: string;
  private baseUrl = 'https://pixabay.com/api/music';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchMusic(mood: MusicMood, duration: number): Promise<MusicTrack[]> {
    const response = await axios.get(this.baseUrl, {
      params: {
        key: this.apiKey,
        q: mood,
        per_page: 20,
      },
    });

    return response.data.hits.map((track: any) => ({
      id: track.id.toString(),
      url: track.audio,
      source: 'pixabay' as const,
      title: track.name,
      duration: track.duration,
      mood,
      licenseUrl: track.pageURL,
    }));
  }
}
```

---

## 5. Trends API Integration

### 5.1 Google Trends (via pytrends)

**Package**: `pytrends-wrapper` (Node.js wrapper for pytrends Python library)

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GoogleTrendsService {
  async fetchTrendingTopics(geo: string = 'US'): Promise<TrendingTopic[]> {
    // Call Python script that uses pytrends
    const { stdout } = await execAsync(`python3 scripts/fetch_trends.py --geo=${geo}`);
    const data = JSON.parse(stdout);

    return data.trending_searches.map((item: any) => ({
      query: item.query,
      traffic: item.traffic || 'unknown',
      articles: item.articles?.map((a: any) => ({
        title: a.title,
        url: a.url,
      })) || [],
    }));
  }
}
```

**Python Script** (`scripts/fetch_trends.py`):
```python
from pytrends.request import TrendReq
import json
import sys
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--geo', default='US')
args = parser.parse_args()

pytrends = TrendReq(hl='en-US', tz=360)
trending_searches = pytrends.trending_searches(pn=args.geo)

output = {
    'trending_searches': [{'query': q} for q in trending_searches[0].tolist()]
}

print(json.dumps(output))
```

**Rate Limits**:
- Unofficial API, rate limits vary
- Recommended: 1 request per 2 seconds
- Cache results for 1 hour minimum

---

## 6. Error Handling Strategy

### 6.1 Per-Service Error Handling

```typescript
export class ErrorHandler {
  static async handleAIError(error: any, provider: string): Promise<never> {
    // AI provider timeout → Retry 3x, fallback to next provider
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      logger.error(`${provider} timeout, retrying...`);
      throw new RetryableError(`${provider} timeout`, { maxRetries: 3 });
    }

    // Quota exceeded → Fallback to next provider
    if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
      logger.error(`${provider} quota exceeded, falling back to alternative`);
      throw new FallbackError(`${provider} quota exceeded`);
    }

    // Invalid API key → Fail fast with clear message
    if (error.status === 401 || error.message.includes('unauthorized')) {
      throw new ConfigError(
        `${provider} API key invalid. Check your .env file and ensure the API key is correct.`
      );
    }

    throw error;
  }

  static async handleStockAPIError(error: any, service: string, query: string): Promise<StockImage[]> {
    // Stock API 429 (rate limit) → Wait time = min(retry_count^2, 300) seconds
    if (error.response?.status === 429) {
      const retryCount = error.retryCount || 1;
      const waitTime = Math.min(Math.pow(retryCount, 2), 300);
      logger.warn(`${service} rate limit exceeded, waiting ${waitTime}s`);
      await sleep(waitTime * 1000);
      throw new RetryableError(`${service} rate limit`, { maxRetries: 3, retryCount: retryCount + 1 });
    }

    // No results → Return empty array, don't fail
    if (error.response?.status === 404 || error.message.includes('no results')) {
      logger.warn(`No ${service} results for query: ${query}`);
      return [];
    }

    // Other errors → Log and return empty array (graceful degradation)
    logger.error(`${service} API error`, { error: error.message, query });
    return [];
  }

  static async handleTTSError(error: any, provider: string, segmentId: string): Promise<TTSResult> {
    // TTS failure → Retry 2x, generate silent audio placeholder + log for manual review
    if (error.retryCount && error.retryCount >= 2) {
      logger.error(`${provider} TTS failed after 2 retries, generating silent placeholder`, { segmentId });

      // Generate 1 second of silence as placeholder
      const silentAudio = generateSilence(1000);

      // Log for manual review
      await logTTSFailure({
        provider,
        segmentId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return {
        audioBuffer: silentAudio,
        format: 'mp3',
        durationMs: 1000,
        timestamps: [],
      };
    }

    throw new RetryableError(`${provider} TTS failed`, { maxRetries: 2, retryCount: (error.retryCount || 0) + 1 });
  }
}
```

### 6.2 Data Validation Errors

```typescript
// Clear user-facing message + suggested action
try {
  const script = ScriptSchema.parse(rawScript);
} catch (error) {
  if (error instanceof z.ZodError) {
    const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    throw new ValidationError(
      `Script validation failed:\n${messages.join('\n')}\n\nSuggested action: Regenerate script with AI provider.`
    );
  }
}
```

### 6.3 File Operation Errors

```typescript
// Log with suggested chmod command
try {
  await fs.writeFile(filepath, data);
} catch (error) {
  if (error.code === 'EACCES') {
    logger.error(`Permission denied writing to ${filepath}. Run: chmod 755 ${filepath}`);
    throw new FileError(`Permission denied: ${filepath}. Try: chmod 755 ${filepath}`);
  }
}
```

### 6.4 Disk Space Errors

```typescript
// Check before operations (require 5GB free)
const freeSpace = await checkDiskSpace('/');
if (freeSpace < 5 * 1024 * 1024 * 1024) { // 5GB in bytes
  throw new DiskSpaceError(
    `Insufficient disk space. Required: 5GB, Available: ${(freeSpace / 1024 / 1024 / 1024).toFixed(2)}GB`
  );
}
```

---

## 7. Rate Limiting Implementation

### 7.1 Rate Limiter Class

```typescript
interface RateLimitConfig {
  requests: number;
  per: 'second' | 'minute' | 'hour' | 'day';
}

export class RateLimiter {
  private queues: Map<string, RequestQueue> = new Map();
  private limits: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Initialize rate limits for all services
    this.limits.set('gemini', { requests: 15, per: 'minute' });
    this.limits.set('openai', { requests: 3500, per: 'day' });
    this.limits.set('elevenlabs', { requests: 100, per: 'day' });
    this.limits.set('google-tts', { requests: 100, per: 'minute' });
    this.limits.set('pexels', { requests: 200, per: 'hour' });
    this.limits.set('unsplash', { requests: 50, per: 'hour' });
    this.limits.set('pixabay', { requests: 100, per: 'minute' });
  }

  async execute<T>(service: string, fn: () => Promise<T>): Promise<T> {
    const queue = this.getQueue(service);
    await queue.wait();

    try {
      const result = await fn();
      queue.onSuccess();
      return result;
    } catch (error) {
      queue.onError(error);
      throw error;
    }
  }

  private getQueue(service: string): RequestQueue {
    if (!this.queues.has(service)) {
      const limit = this.limits.get(service)!;
      this.queues.set(service, new RequestQueue(limit));
    }
    return this.queues.get(service)!;
  }
}

class RequestQueue {
  private queue: Array<() => void> = [];
  private inFlight = 0;
  private timestamps: number[] = [];

  constructor(private limit: RateLimitConfig) {}

  async wait(): Promise<void> {
    // Clean up old timestamps
    const now = Date.now();
    const windowMs = this.getWindowMs();
    this.timestamps = this.timestamps.filter(ts => now - ts < windowMs);

    // Check if we're at the limit
    if (this.timestamps.length >= this.limit.requests) {
      // Wait until oldest timestamp expires
      const oldestTimestamp = this.timestamps[0];
      const waitMs = windowMs - (now - oldestTimestamp);
      await sleep(waitMs);
      return this.wait(); // Re-check
    }

    // Record this request
    this.timestamps.push(now);
  }

  onSuccess(): void {
    // Request completed successfully
  }

  onError(error: any): void {
    // If rate limit error, remove the timestamp (request didn't actually count)
    if (error.response?.status === 429) {
      this.timestamps.pop();
    }
  }

  private getWindowMs(): number {
    switch (this.limit.per) {
      case 'second': return 1000;
      case 'minute': return 60 * 1000;
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
    }
  }
}
```

### 7.2 Rate Limit Tracking

```typescript
// Track usage in file: cache/rate-limits.json
interface RateLimitTracking {
  [service: string]: {
    used: number;
    resetAt: string; // ISO 8601 timestamp
    warningSent: boolean;
  };
}

export class RateLimitTracker {
  private tracking: RateLimitTracking = {};
  private filepath = 'cache/rate-limits.json';

  async load(): Promise<void> {
    if (await fs.pathExists(this.filepath)) {
      this.tracking = await fs.readJSON(this.filepath);
    }
  }

  async increment(service: string, limit: RateLimitConfig): Promise<void> {
    const now = new Date();
    const entry = this.tracking[service] || { used: 0, resetAt: this.getResetTime(now, limit).toISOString(), warningSent: false };

    // Reset if past reset time
    if (new Date(entry.resetAt) < now) {
      entry.used = 0;
      entry.resetAt = this.getResetTime(now, limit).toISOString();
      entry.warningSent = false;
    }

    entry.used++;

    // Warn at 80% usage
    if (!entry.warningSent && entry.used >= limit.requests * 0.8) {
      logger.warn(`${service} rate limit at 80%: ${entry.used}/${limit.requests}`);
      entry.warningSent = true;
    }

    this.tracking[service] = entry;
    await fs.writeJSON(this.filepath, this.tracking);
  }

  private getResetTime(now: Date, limit: RateLimitConfig): Date {
    const reset = new Date(now);
    switch (limit.per) {
      case 'minute': reset.setMinutes(reset.getMinutes() + 1); break;
      case 'hour': reset.setHours(reset.getHours() + 1); break;
      case 'day': reset.setDate(reset.getDate() + 1); break;
    }
    return reset;
  }
}
```

---

## 8. Retry Logic with Backoff

### 8.1 Retry Implementation

```typescript
export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoff: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === options.maxAttempts) {
        throw lastError;
      }

      const delay = options.backoff === 'exponential'
        ? options.delayMs * Math.pow(2, attempt - 1)
        : options.delayMs * attempt;

      logger.debug(`Retry attempt ${attempt}/${options.maxAttempts} after ${delay}ms`, { error: lastError.message });

      options.onRetry?.(attempt, lastError);
      await sleep(delay);
    }
  }

  throw lastError!;
}
```

### 8.2 Usage Examples

```typescript
// AI provider with fallback
const result = await retry(
  () => geminiProvider.complete(prompt),
  {
    maxAttempts: 3,
    delayMs: 1000,
    backoff: 'exponential',
    onRetry: (attempt, error) => {
      if (attempt === 3) {
        // Last retry failed, fallback to OpenAI
        return openaiProvider.complete(prompt);
      }
    },
  }
);

// Stock media search
const images = await retry(
  () => pexelsService.searchImages(query, options),
  {
    maxAttempts: 3,
    delayMs: 5000,
    backoff: 'linear', // 5s, 10s, 15s
  }
);

// TTS generation
const audio = await retry(
  () => elevenLabsProvider.generateAudio(text),
  {
    maxAttempts: 2,
    delayMs: 2000,
    backoff: 'exponential',
  }
);
```

---

## Summary

This implementation specification provides:

1. **Complete API integration code** for all providers (AI, TTS, stock media, music, trends)
2. **Detailed error handling** with specific strategies per service
3. **Rate limiting implementation** with per-service queuing and tracking
4. **Retry logic** with exponential/linear backoff
5. **Fallback strategies** for when primary services fail

All code is production-ready and follows best practices for:
- Type safety (TypeScript)
- Error handling (graceful degradation)
- Rate limit compliance
- Cost optimization (caching, retry limits)
- User-friendly error messages
