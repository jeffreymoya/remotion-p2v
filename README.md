# Remotion AI Video Template

> NOTE: The legacy CLI has been removed. Use the Web UI for all workflows. A backup of the removed CLI implementation is available in the `backup/cli-removed` branch for reference.

Create short-form AI videos with Remotion, AI for script generation, and Google TTS (word-level timestamps). The project uses the **boards** pipeline for viewport generation (grid-based detective boards with word-level camera triggers).

## Setup
- Install dependencies: `npm install`
- Copy env template: `cp .env.example .env` (or `.env.local`) and fill at least:
  - `GOOGLE_TTS_API_KEY`
  - One stock media key (`PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`, or `PIXABAY_API_KEY`)
  - `DATABASE_URL` or `STORYFLOW_DATABASE_URL` for SQLite database
  - (Optional) `ENABLE_SCRIPT_BUILDER=true` to enable the multi-phase Script Builder workflow
- Install and authenticate the Gemini CLI (required for AI steps like topic refinement, script generation, and boards prompts/regions). Verify with `gemini --version`.
- Set up the database: `npm run db:push:storyflow`
- Start the web UI: `npm run web:dev`
- (Optional) Start Remotion Studio for previews: `npm run dev`

## End-to-End Web UI Workflow (No CLI)
1) Start the app: `npm run web:dev` and open `http://localhost:3000`
2) Create a project (`/projects/new`)
   - Enter a project name
   - Choose an aspect ratio (1:1, 4:5, 9:16, 16:9)
3) Refine the topic (`/projects/[id]`)
   - Enter a topic title + description
   - Run refinement to get optimized title, angles, hooks, and suggested duration
   - Accept or click "Start Over" to refine again (saved in project metadata)
4) Generate the script (`/projects/[id]/script`)
   - Use Script Builder (if `ENABLE_SCRIPT_BUILDER=true`) or the single-prompt generator
   - Review segments; regenerate if needed
5) Generate TTS audio (`/projects/[id]/tts`)
   - Run emphasis analysis (high/medium emphasis words)
   - Batch-generate audio with live progress
   - Preview per-segment audio with word highlighting; regenerate a segment if needed
6) Manage assets (`/projects/[id]/assets`)
   - Music tab: search Pixabay (requires `PIXABAY_API_KEY`), preview tracks, select one, and set volume
   - Upload tab: upload custom images, video clips, or audio
7) Build the boards pipeline (`/projects/[id]/boards`)
   - Step 1 (Config): set board duration + style guide
   - Step 2 (Plan): AI groups script segments into boards
   - Step 3 (Prompts): AI generates image prompts for each board
   - Step 4 (Upload): generate images externally and upload per board
   - Step 5 (Regions): AI detects regions; refine via the canvas editor
   - Step 6 (Triggers): generate word-level camera triggers
   - Step 7 (Viewport): build + preview the camera path (viewport.json)
8) Preview the timeline (`/projects/[id]/preview`)
   - Remotion preview with audio, subtitles, and viewport motion
   - If anything looks off, jump back to Script/TTS/Boards and regenerate
9) Render the final video (`/projects/[id]/render`)
   - Choose a quality preset and render
   - Outputs save to `public/projects/<project-id>/renders/<render-id>.mp4`

### Web UI Workflow Flowchart (ASCII)
```text
[Start Web UI]
      |
[Create Project]
      |
[Project Overview + Topic Refinement]
      |
[Script Generation]
      |
[TTS + Emphasis]
      |
[Assets (Music + Uploads)]
      |
[Boards Wizard]
      |
[Preview Timeline] -----> [Render Video]
      |
      +--> iterate back to Script Generation / TTS / Boards Wizard
```

## Project Artifact Structure
Most generated files live in `public/projects/<project-id>/` (project metadata like scripts and settings are stored in SQLite):

```
public/projects/<project-id>/
├── assets/
│   ├── audio/segment-*.mp3           # TTS audio with word timestamps
│   ├── images/                       # Stock or board images
│   ├── music/                        # Optional background music
│   └── videos/                       # Optional video clips
├── boards/                           # Board pipeline artifacts
│   ├── board-plan.json
│   ├── board-prompts.json
│   ├── board-regions.json
│   └── board-triggers.json
├── viewport.json                     # Camera path built from boards
├── timeline.json                     # Final Remotion timeline
└── renders/<render-id>.mp4           # Rendered videos
```

## Pipeline Stages

The video generation pipeline consists of:

1. **Topic Refinement (Optional)** - AI optimizes title, angles, and hooks
2. **Script Generation** - AI-powered script builder or single-prompt generator
3. **TTS + Emphasis** - Audio with word-level timestamps and emphasis data
4. **Assets** - Stock media/music and manual uploads
5. **Boards Planning** - Create grid-based boards and image prompts
6. **Region Detection** - Identify areas of interest in board images
7. **Trigger Generation** - Create word-level camera movements
8. **Viewport Build** - Generate camera path across boards
9. **Timeline Assembly** - Combine all elements into Remotion timeline
10. **Render** - Produce final video via Remotion

## Development Scripts

### Core Commands
- `npm run web:dev` - Start Next.js web UI (port 3000)
- `npm run dev` - Start Remotion Studio for video preview

### Database
- `npm run db:generate:storyflow` - Generate Prisma client
- `npm run db:push:storyflow` - Push schema changes to database

### Testing
- `npm run test` - Run all unit tests
- `npm run test:boards-triggers` - Boards trigger tests
- `npm run test:boards-build` - Boards build tests
- `npm run test:e2e:fast` - Fast E2E tests (preview only)
- `npm run test:all` - All tests including edge cases

### Linting
- `npm run lint` - Run ESLint + TypeScript check

## Key Technologies

- **Next.js** - Web UI framework
- **Remotion** - Programmatic video creation
- **Prisma** - Database ORM (SQLite)
- **Google TTS** - Text-to-speech with word timestamps
- **AI Providers** - Gemini CLI (default) with optional provider configuration
- **Stock Media** - Pexels, Unsplash, Pixabay integration

## Credits
Template by [@webmonch](https://github.com/webmonch). Contributions mirrored from the Remotion monorepo.
