# Remotion P2V Pipeline Guide

## Overview

The Remotion P2V (Post-to-Video) system follows a **7-stage pipeline** to transform trending topics into production-ready YouTube videos. Each stage is a separate CLI command that reads input from the previous stage and produces structured output for the next.

**Pipeline Duration:** 10-15 minutes per video (600-900 seconds)
**Default Format:** 16:9 landscape (1920x1080) for YouTube
**Alternative Format:** 9:16 portrait (1080x1920) for Shorts/TikTok/Reels
**AI Provider:** Gemini 1.5 Flash (default), with OpenAI and Anthropic fallbacks
**TTS Provider:** Google Cloud TTS (default), with ElevenLabs as optional fallback
**Media Sources:** Pexels, Unsplash, Pixabay (free stock images and videos)

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                7-Stage Video Generation Pipeline             │
└─────────────────────────────────────────────────────────────┘

Stage 1: DISCOVER
  Input:  None (or --geo for targeting)
  Output: discovered.json (10 trending topics)
  Tools:  Google Trends API, Gemini AI filtering

        ↓

Stage 2: CURATE
  Input:  discovered.json
  Output: selected.json (1 topic + notes)
  Tools:  Fastify web UI at http://localhost:3000

        ↓

Stage 3: REFINE
  Input:  selected.json
  Output: refined.json (optimized topic)
  Tools:  Gemini AI refinement for ages 20-40

        ↓

Stage 4: SCRIPT
  Input:  refined.json
  Output: scripts/script-v1.json (12-minute script)
  Tools:  Gemini AI script generation, public speaking techniques

        ↓

Stage 5: GATHER
  Input:  scripts/script-v1.json
  Output: tags.json + assets/* (images, videos, audio, music)
  Tools:  Pexels/Unsplash/Pixabay, Google TTS, Pixabay Music

        ↓

Stage 6: BUILD
  Input:  scripts/script-v1.json + assets/*
  Output: timeline.json (complete video specification)
  Tools:  Timeline assembly, frame alignment, music ducking

        ↓

Stage 7: RENDER
  Input:  timeline.json
  Output: output.mp4 (final video)
  Tools:  Remotion video renderer
```

---

## Stage Details

### Stage 1: Topic Discovery (DISCOVER)

**Purpose:** Fetch trending topics from Google Trends and filter for video suitability.

**Command:**
```bash
npm run discover
npm run discover -- --geo US --limit 10
```

**Options:**
- `--geo <code>` - Country code (US, GB, IN, etc.) - Default: US
- `--limit <n>` - Number of topics to fetch - Default: 10

**Process:**
1. Fetches daily trending topics from Google Trends API
2. Falls back to real-time trends if daily trends fail
3. Sends raw trends to Gemini AI for filtering
4. AI filters out: news, celebrities, sports scores, local events, hashtags
5. AI prioritizes: educational, tech, science, psychology, history, culture, how-to
6. AI generates compelling YouTube-optimized titles
7. AI scores each topic (0-100) for video potential
8. Writes top 10 topics to `discovered.json`

**Output Format (`discovered.json`):**
```json
{
  "topics": [
    {
      "id": "topic-1",
      "title": "AI-Generated YouTube Title",
      "description": "Compelling 2-3 sentence description...",
      "source": "google-trends",
      "trendScore": 95,
      "category": "technology",
      "discoveredAt": "2025-11-24T12:00:00.000Z"
    }
  ],
  "discoveredAt": "2025-11-24T12:00:00.000Z",
  "totalCount": 10
}
```

---

### Stage 2: Topic Curation (CURATE)

**Purpose:** Allow user to select one topic via web interface.

**Command:**
```bash
npm run curate -- --project project-1732432800000
```

**Options:**
- `--project <id>` - Project ID (required)

**Process:**
1. Launches Fastify web server on `http://localhost:3000`
2. Displays all topics from `discovered.json` in beautiful web UI
3. User clicks on a topic card to select
4. User can optionally add notes/ideas
5. User clicks "Confirm" to finalize
6. Server writes selection to `selected.json`
7. Server shuts down gracefully
8. Browser window shows success message

**Web UI Features:**
- Grid layout with responsive cards (3 columns → 1 on mobile)
- Category badges (color-coded)
- Trend score indicators (0-100)
- Title, description, metadata display
- Hover effects and selection highlighting
- Optional notes section (free-text input)
- Cancel/Confirm buttons
- Smooth animations and transitions

**Output Format (`selected.json`):**
```json
{
  "topic": {
    "id": "topic-3",
    "title": "Selected Topic Title",
    "description": "...",
    "category": "technology",
    "selectedAt": "2025-11-24T12:05:00.000Z",
    "userNotes": "Optional notes from user"
  },
  "selectedAt": "2025-11-24T12:05:00.000Z"
}
```

---

### Stage 3: Topic Refinement (REFINE)

**Purpose:** Transform raw topic into production-ready video concept.

**Command:**
```bash
npm run refine -- --project project-1732432800000
```

**Options:**
- `--project <id>` - Project ID (required)

**Process:**
1. Reads `selected.json`
2. Sends topic + user notes to Gemini AI
3. AI refines title for YouTube (compelling but authentic)
4. AI writes detailed description (3-4 sentences, evergreen content)
5. AI defines target audience (demographics, interests, pain points)
6. AI identifies 3-5 key angles (subtopics to cover)
7. AI suggests 2-3 hooks (attention-grabbing opening ideas)
8. AI recommends duration (600-900s / 10-15 minutes)
9. AI provides reasoning for all choices
10. Validates output with Zod schema
11. Writes to `refined.json`

**Output Format (`refined.json`):**
```json
{
  "refinedTitle": "Optimized YouTube Title",
  "refinedDescription": "Detailed 3-4 sentence description...",
  "targetAudience": "Demographics and interests...",
  "keyAngles": [
    "First major subtopic to cover",
    "Second major subtopic to cover",
    "Third major subtopic to cover"
  ],
  "hooks": [
    "Opening hook idea 1",
    "Opening hook idea 2"
  ],
  "suggestedDuration": 720,
  "reasoning": "Strategic explanation...",
  "refinedAt": "2025-11-24T12:10:00.000Z"
}
```

---

### Stage 4: Script Generation (SCRIPT)

**Purpose:** Generate 12-minute script with public speaking techniques.

**Command:**
```bash
npm run script -- --project project-1732432800000
```

**Options:**
- `--project <id>` - Project ID (required)

**Process:**
1. Reads `refined.json`
2. Sends refined topic to Gemini AI with detailed prompt
3. AI generates 8-12 segments (60-90 seconds each)
4. AI applies public speaking techniques:
   - Strong hook in first 10 seconds
   - Clear transitions between segments
   - Rhetorical questions for engagement
   - Repetition for emphasis
   - Call-to-action at end
5. AI includes speaking notes (pacing, tone, emphasis)
6. Validates duration is within 600-900s range
7. Writes to `scripts/script-v1.json`

**Output Format (`scripts/script-v1.json`):**
```json
{
  "title": "Final Video Title",
  "segments": [
    {
      "id": "seg-1",
      "text": "Segment script text...",
      "speakingNotes": "Pacing and tone guidance...",
      "estimatedDurationMs": 8000,
      "imageDescription": "Visual description for this segment"
    }
  ],
  "totalDurationSeconds": 720,
  "generatedAt": "2025-11-24T12:15:00.000Z"
}
```

---

### Stage 5: Asset Gathering (GATHER)

**Purpose:** Download all media assets (images, videos, audio, music).

**Command:**
```bash
npm run gather -- --project project-1732432800000
```

**Options:**
- `--project <id>` - Project ID (required)

**Process:**
1. Reads `scripts/script-v1.json`
2. Extracts visual descriptions from segments
3. Sends descriptions to AI for tag generation
4. Searches stock sources (Pexels, Unsplash, Pixabay) for:
   - Images (landscape for 16:9, portrait for 9:16)
   - Video clips (optional, for B-roll)
5. Downloads top-quality assets to `assets/images/` and `assets/videos/`
6. Generates TTS audio for each segment using Google TTS
7. Saves audio files to `assets/audio/`
8. Optionally downloads background music from Pixabay Music
9. Saves music to `assets/music/`
10. Writes metadata to `tags.json`

**Output:**
- `tags.json` - Asset metadata and tags
- `assets/images/*.png` - Stock images
- `assets/videos/*.mp4` - Stock video clips (optional)
- `assets/audio/*.mp3` - TTS audio files
- `assets/music/*.mp3` - Background music (optional)

---

### Stage 6: Timeline Assembly (BUILD)

**Purpose:** Assemble all assets into a complete timeline specification.

**Command:**
```bash
npm run build:timeline -- --project project-1732432800000
```

**Options:**
- `--project <id>` - Project ID (required)

**Process:**
1. Reads `scripts/script-v1.json` and `tags.json`
2. Calculates timing for each segment based on TTS audio duration
3. Assigns images/videos to segments
4. Creates background elements with fade transitions
5. Creates text elements with bottom positioning
6. Creates audio elements synchronized with visuals
7. Optionally adds background music with volume ducking
8. Validates frame alignment (no gaps or overlaps)
9. Writes complete timeline to `timeline.json`

**Output Format (`timeline.json`):**
```json
{
  "shortTitle": "Video Title",
  "aspectRatio": "16:9",
  "durationSeconds": 720,
  "elements": [
    {
      "type": "background",
      "startMs": 0,
      "endMs": 5000,
      "imageUrl": "asset-id",
      "enterTransition": "fade",
      "exitTransition": "fade"
    }
  ],
  "text": [
    {
      "type": "text",
      "startMs": 1000,
      "endMs": 4000,
      "text": "Segment text...",
      "position": "bottom"
    }
  ],
  "audio": [
    {
      "type": "audio",
      "startMs": 0,
      "endMs": 5000,
      "audioUrl": "audio-id"
    }
  ],
  "videoClips": [],
  "backgroundMusic": [
    {
      "type": "backgroundMusic",
      "startMs": 0,
      "endMs": 720000,
      "musicUrl": "music-id",
      "volume": 0.2
    }
  ]
}
```

---

### Stage 7: Video Rendering (RENDER)

**Purpose:** Render final MP4 video using Remotion.

**Command:**
```bash
npm run render:project -- --project project-1732432800000 --quality draft
npm run render:project -- --project project-1732432800000 --quality production --output my-video.mp4
```

**Options:**
- `--project <id>` - Project ID (required)
- `--quality <level>` - Render quality: draft | medium | high | production - Default: draft
- `--output <path>` - Output file path - Default: `{projectRoot}/output.mp4`

**Quality Presets:**
- **draft** - Fast preview (h264, CRF 28, ultrafast preset)
- **medium** - Balanced quality (h264, CRF 23, medium preset)
- **high** - High quality (h264, CRF 18, slow preset)
- **production** - Maximum quality (h264, CRF 15, veryslow preset)

**Process:**
1. Reads `timeline.json`
2. Loads configuration from `video.config.json`
3. Sets composition dimensions based on aspect ratio
4. Calls Remotion render engine
5. Outputs final video to specified path

**Output:**
- `output.mp4` - Final rendered video

---

## Quick Start Guide

### First-Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API keys (see SETUP.md):**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Verify installation:**
   ```bash
   npm run test
   ```

### Creating Your First Video

**Option A: Full Pipeline (Automated)**

```bash
# 1. Discover trending topics
npm run discover

# 2. Select a topic via web UI
npm run curate -- --project project-$(date +%s)000

# 3. Refine the selected topic
npm run refine -- --project project-1732432800000

# 4. Generate 12-minute script
npm run script -- --project project-1732432800000

# 5. Gather all assets
npm run gather -- --project project-1732432800000

# 6. Build timeline
npm run build:timeline -- --project project-1732432800000

# 7. Render video
npm run render:project -- --project project-1732432800000
```

**Option B: Skip Discovery (Manual Topic)**

If you already have a topic in mind:

```bash
# Create project manually and start from Stage 3
# (TBD: Add manual topic creation command)
```

---

## File Structure

After running the full pipeline, your project directory will look like this:

```
public/projects/project-1732432800000/
├── discovered.json          # Stage 1 output
├── selected.json            # Stage 2 output
├── refined.json             # Stage 3 output
├── scripts/
│   └── script-v1.json       # Stage 4 output
├── tags.json                # Stage 5 metadata
├── assets/
│   ├── images/              # Stock images
│   │   ├── image-1.png
│   │   └── image-2.png
│   ├── videos/              # Stock video clips (optional)
│   ├── audio/               # TTS audio files
│   │   ├── seg-1.mp3
│   │   └── seg-2.mp3
│   └── music/               # Background music (optional)
│       └── track-1.mp3
├── timeline.json            # Stage 6 output
└── output.mp4               # Stage 7 output
```

---

## Common Workflows

### Preview in Remotion Studio

```bash
npm run dev
```

This opens the Remotion Studio where you can:
- Preview all project compositions
- Scrub through the timeline
- Edit parameters in real-time
- Export individual frames

### Re-generate Script with Different Approach

```bash
# Edit refined.json to adjust angles/hooks
nano public/projects/project-1732432800000/refined.json

# Re-run script generation
npm run script -- --project project-1732432800000
```

### Re-gather Assets (Different Images)

```bash
# Delete existing assets
rm -rf public/projects/project-1732432800000/assets/images/*

# Re-run asset gathering
npm run gather -- --project project-1732432800000
```

### Export for Different Platform

```bash
# Render 16:9 for YouTube
npm run render:project -- --project project-1732432800000

# Render 9:16 for TikTok/Shorts (requires 9:16 timeline)
# Edit timeline.json: "aspectRatio": "9:16"
npm run render:project -- --project project-1732432800000
```

---

## Error Handling

Each stage validates its input and provides clear error messages:

- **Missing dependencies:** "Please run: npm run <previous-stage>"
- **Invalid data:** Zod validation errors with specific field details
- **API failures:** Automatic retries with exponential backoff
- **Rate limits:** Graceful degradation with fallback providers

To debug issues:
1. Check the console output for error details
2. Verify the previous stage's output file exists
3. Run `npm run test` to validate schemas
4. Check API keys in `.env` file

---

## Advanced Topics

### Custom AI Providers

The system supports multiple AI providers with automatic fallback:

1. **Gemini 1.5 Flash** (default, cost-optimized)
2. **OpenAI GPT-4** (fallback 1)
3. **Anthropic Claude** (fallback 2)

To change the default provider, edit `config/ai.config.json`.

### Custom TTS Voices

To use ElevenLabs instead of Google TTS:

1. Set `ELEVENLABS_API_KEY` in `.env`
2. Edit `config/tts.config.json` to set ElevenLabs as default
3. Specify voice ID in the config

### Background Music Options

Background music can be sourced from:
1. **Pixabay Music API** (free, royalty-free)
2. **Local music library** (path configured in `config/music.config.json`)

To disable background music, remove the `backgroundMusic` array from `timeline.json`.

---

## Performance Tips

1. **Draft renders first:** Use `--quality draft` for quick previews
2. **Parallel processing:** Run asset gathering for multiple projects concurrently
3. **Cache assets:** Reuse images/audio across projects when appropriate
4. **Batch discoveries:** Run discovery once per day, create multiple videos from cached topics

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

---

## Next Steps

- [CONFIGURATION.md](./CONFIGURATION.md) - Detailed configuration guide
- [SETUP.md](./SETUP.md) - Local environment setup
- [API Reference](./implementation/) - Implementation details for each component
